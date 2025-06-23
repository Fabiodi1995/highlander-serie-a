#!/bin/bash

# Script di deployment per Hetzner Server
# Highlander Serie A Game

set -e

echo "🚀 Inizio deployment su Hetzner per highlandergame.it"

# Variabili di configurazione
SERVER_USER="root"
SERVER_IP="your-hetzner-server-ip"
DOMAIN="highlandergame.it"
APP_NAME="highlander"
NODE_VERSION="20"

# Colori per output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

print_status() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Verifica prerequisiti locali
check_prerequisites() {
    print_status "Controllo prerequisiti..."
    
    if ! command -v ssh &> /dev/null; then
        print_error "SSH non trovato. Installa OpenSSH client."
        exit 1
    fi
    
    if ! command -v rsync &> /dev/null; then
        print_error "rsync non trovato. Installa rsync."
        exit 1
    fi
    
    if [ ! -f ".env" ]; then
        print_warning "File .env non trovato. Assicurati di configurarlo sul server."
    fi
    
    print_status "Prerequisiti verificati ✅"
}

# Prepara i file per il deployment
prepare_deployment() {
    print_status "Preparazione files per deployment..."
    
    # Build dell'applicazione
    print_status "Building applicazione..."
    npm run build
    
    # Crea archivio per il deployment
    print_status "Creazione archivio deployment..."
    tar -czf highlander-deploy.tar.gz \
        --exclude=node_modules \
        --exclude=.git \
        --exclude=*.log \
        --exclude=.env \
        --exclude=uploads/* \
        --exclude=attached_assets \
        .
    
    print_status "Archivio creato: highlander-deploy.tar.gz ✅"
}

# Setup iniziale del server
setup_server() {
    print_status "Setup server Hetzner..."
    
    ssh $SERVER_USER@$SERVER_IP << 'EOF'
        # Aggiorna sistema
        apt update && apt upgrade -y
        
        # Installa Node.js 20
        curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
        apt-get install -y nodejs
        
        # Installa utilità essenziali
        apt install -y nginx postgresql postgresql-contrib pm2 certbot python3-certbot-nginx git htop curl
        
        # Configura firewall
        ufw allow OpenSSH
        ufw allow 'Nginx Full'
        ufw allow 5432  # PostgreSQL
        ufw --force enable
        
        # Crea utente per l'app
        useradd -m -s /bin/bash highlander || true
        mkdir -p /home/highlander/app
        chown -R highlander:highlander /home/highlander
        
        echo "✅ Server setup completato"
EOF
}

# Configura database PostgreSQL
setup_database() {
    print_status "Configurazione database PostgreSQL..."
    
    ssh $SERVER_USER@$SERVER_IP << 'EOF'
        # Configura PostgreSQL
        sudo -u postgres psql << 'PSQL'
            CREATE DATABASE highlander;
            CREATE USER highlander_user WITH PASSWORD 'change_this_password_123!';
            GRANT ALL PRIVILEGES ON DATABASE highlander TO highlander_user;
            ALTER USER highlander_user CREATEDB;
PSQL
        
        # Configura accesso database
        echo "local all highlander_user md5" >> /etc/postgresql/*/main/pg_hba.conf
        systemctl restart postgresql
        
        echo "✅ Database configurato"
EOF
}

# Deploy dell'applicazione
deploy_application() {
    print_status "Deploy applicazione..."
    
    # Copia files sul server
    print_status "Copia files sul server..."
    scp highlander-deploy.tar.gz $SERVER_USER@$SERVER_IP:/home/highlander/
    
    # Estrazione e setup
    ssh $SERVER_USER@$SERVER_IP << 'EOF'
        cd /home/highlander
        
        # Backup precedente se esiste
        if [ -d "app" ]; then
            mv app app_backup_$(date +%Y%m%d_%H%M%S)
        fi
        
        # Estrai nuova versione
        mkdir -p app
        cd app
        tar -xzf ../highlander-deploy.tar.gz
        
        # Installa dipendenze
        npm ci --production
        
        # Setup permessi
        chown -R highlander:highlander /home/highlander/app
        
        echo "✅ Applicazione estratta e configurata"
EOF
    
    # Cleanup locale
    rm highlander-deploy.tar.gz
}

# Configura Nginx
setup_nginx() {
    print_status "Configurazione Nginx..."
    
    ssh $SERVER_USER@$SERVER_IP << EOF
        # Crea configurazione Nginx
        cat > /etc/nginx/sites-available/$DOMAIN << 'NGINX_CONF'
server {
    listen 80;
    server_name $DOMAIN www.$DOMAIN;
    
    # Redirect HTTP to HTTPS
    return 301 https://\$server_name\$request_uri;
}

server {
    listen 443 ssl http2;
    server_name $DOMAIN www.$DOMAIN;
    
    # SSL certificates (will be configured by Certbot)
    ssl_certificate /etc/letsencrypt/live/$DOMAIN/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/$DOMAIN/privkey.pem;
    
    # SSL configuration
    ssl_session_timeout 1d;
    ssl_session_cache shared:SSL:50m;
    ssl_session_tickets off;
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers ECDHE-RSA-AES256-GCM-SHA384:ECDHE-RSA-CHACHA20-POLY1305:ECDHE-RSA-AES128-GCM-SHA256;
    ssl_prefer_server_ciphers off;
    
    # Security headers
    add_header Strict-Transport-Security "max-age=63072000" always;
    add_header X-Frame-Options DENY;
    add_header X-Content-Type-Options nosniff;
    add_header X-XSS-Protection "1; mode=block";
    
    # Gzip compression
    gzip on;
    gzip_vary on;
    gzip_min_length 1024;
    gzip_types text/plain text/css text/xml text/javascript application/javascript application/xml+rss application/json;
    
    # Rate limiting
    limit_req_zone \$binary_remote_addr zone=api:10m rate=10r/s;
    
    location / {
        # Rate limiting for API
        location /api/ {
            limit_req zone=api burst=20 nodelay;
            proxy_pass http://localhost:3000;
            proxy_http_version 1.1;
            proxy_set_header Upgrade \$http_upgrade;
            proxy_set_header Connection 'upgrade';
            proxy_set_header Host \$host;
            proxy_set_header X-Real-IP \$remote_addr;
            proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto \$scheme;
            proxy_cache_bypass \$http_upgrade;
            proxy_read_timeout 300s;
            proxy_connect_timeout 300s;
        }
        
        # Static files and app
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_cache_bypass \$http_upgrade;
        
        # Client max body size for uploads
        client_max_body_size 10M;
    }
    
    # Static assets caching
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg)$ {
        proxy_pass http://localhost:3000;
        proxy_set_header Host \$host;
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
}
NGINX_CONF
        
        # Abilita sito
        ln -sf /etc/nginx/sites-available/$DOMAIN /etc/nginx/sites-enabled/
        rm -f /etc/nginx/sites-enabled/default
        
        # Test configurazione
        nginx -t
        
        echo "✅ Nginx configurato"
EOF
}

# Configura SSL con Let's Encrypt
setup_ssl() {
    print_status "Configurazione SSL Let's Encrypt..."
    
    ssh $SERVER_USER@$SERVER_IP << EOF
        # Ottieni certificato SSL
        certbot --nginx -d $DOMAIN -d www.$DOMAIN --non-interactive --agree-tos --email admin@$DOMAIN
        
        # Setup auto-renewal
        echo "0 12 * * * /usr/bin/certbot renew --quiet" | crontab -
        
        systemctl reload nginx
        
        echo "✅ SSL configurato"
EOF
}

# Configura PM2 per l'applicazione
setup_pm2() {
    print_status "Configurazione PM2..."
    
    ssh $SERVER_USER@$SERVER_IP << 'EOF'
        # Crea file di configurazione PM2
        cat > /home/highlander/app/ecosystem.config.js << 'PM2_CONF'
module.exports = {
  apps: [{
    name: 'highlander',
    script: './server/index.ts',
    interpreter: 'node',
    interpreter_args: '--loader tsx',
    cwd: '/home/highlander/app',
    instances: 'max',
    exec_mode: 'cluster',
    env: {
      NODE_ENV: 'production',
      PORT: 3000
    },
    error_file: '/home/highlander/logs/err.log',
    out_file: '/home/highlander/logs/out.log',
    log_file: '/home/highlander/logs/combined.log',
    time: true,
    max_memory_restart: '1G',
    node_args: '--max_old_space_size=1024'
  }]
}
PM2_CONF
        
        # Crea directory logs
        mkdir -p /home/highlander/logs
        chown -R highlander:highlander /home/highlander/logs
        
        # Setup PM2 startup
        pm2 startup systemd -u highlander --hp /home/highlander
        
        echo "✅ PM2 configurato"
EOF
}

# Configura file .env di produzione
setup_env() {
    print_status "Creazione file .env di produzione..."
    
    ssh $SERVER_USER@$SERVER_IP << EOF
        cat > /home/highlander/app/.env << 'ENV_CONF'
# Database Configuration
DATABASE_URL=postgresql://highlander_user:change_this_password_123!@localhost:5432/highlander

# Email Configuration (One.com SMTP)
SMTP_USER=support@highlandergame.it
SMTP_PASSWORD=YOUR_EMAIL_PASSWORD_HERE

# Security
SESSION_SECRET=\$(openssl rand -base64 32)

# Application Configuration
NODE_ENV=production
PORT=3000

# URL viene rilevato automaticamente come https://highlandergame.it
ENV_CONF
        
        chown highlander:highlander /home/highlander/app/.env
        chmod 600 /home/highlander/app/.env
        
        echo "✅ File .env creato - RICORDA DI CONFIGURARE LA PASSWORD EMAIL!"
EOF
}

# Inizializza database
init_database() {
    print_status "Inizializzazione database..."
    
    ssh $SERVER_USER@$SERVER_IP << 'EOF'
        cd /home/highlander/app
        
        # Run as highlander user
        sudo -u highlander bash << 'USER_COMMANDS'
            export NODE_ENV=production
            npm run db:push
USER_COMMANDS
        
        echo "✅ Database inizializzato"
EOF
}

# Avvia applicazione
start_application() {
    print_status "Avvio applicazione..."
    
    ssh $SERVER_USER@$SERVER_IP << 'EOF'
        cd /home/highlander/app
        
        # Avvia con PM2 come utente highlander
        sudo -u highlander pm2 start ecosystem.config.js
        sudo -u highlander pm2 save
        
        # Abilita autostart
        systemctl enable pm2-highlander
        
        echo "✅ Applicazione avviata"
EOF
}

# Funzione principale
main() {
    print_status "🚀 Inizio deployment Highlander su Hetzner"
    print_warning "IMPORTANTE: Assicurati che il DNS di $DOMAIN punti al server $SERVER_IP"
    
    read -p "Vuoi continuare? (y/n): " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        exit 1
    fi
    
    check_prerequisites
    prepare_deployment
    setup_server
    setup_database
    deploy_application
    setup_nginx
    setup_ssl
    setup_pm2
    setup_env
    init_database
    start_application
    
    print_status "🎉 Deployment completato!"
    print_status "🌐 La tua app è disponibile su: https://$DOMAIN"
    print_warning "📧 RICORDA: Configura la password email in /home/highlander/app/.env"
    print_warning "🔐 RICORDA: Cambia la password del database in /home/highlander/app/.env"
}

# Verifica parametri
if [ $# -eq 2 ]; then
    SERVER_IP=$1
    DOMAIN=$2
fi

if [ "$SERVER_IP" = "your-hetzner-server-ip" ]; then
    echo "❌ Configura l'IP del server Hetzner nello script o passalo come parametro:"
    echo "   $0 <server-ip> <domain>"
    echo "   Esempio: $0 95.217.123.456 highlandergame.it"
    exit 1
fi

main