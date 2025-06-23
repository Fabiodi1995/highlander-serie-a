#!/bin/bash

# Script finale per deployment Highlander su Hetzner
# Uso: ./deploy/final-deployment-script.sh <ip-server> <password-email>

set -e

# Parametri
SERVER_IP=${1:-""}
EMAIL_PASSWORD=${2:-""}
DOMAIN="highlandergame.it"

# Colori
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

print_header() {
    echo -e "${BLUE}================================${NC}"
    echo -e "${BLUE}$1${NC}"
    echo -e "${BLUE}================================${NC}"
}

print_step() {
    echo -e "${GREEN}[STEP]${NC} $1"
}

print_info() {
    echo -e "${YELLOW}[INFO]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Verifica parametri
check_parameters() {
    if [ -z "$SERVER_IP" ]; then
        print_error "IP server mancante"
        echo "Uso: $0 <ip-server> <password-email>"
        exit 1
    fi
    
    if [ -z "$EMAIL_PASSWORD" ]; then
        print_error "Password email mancante"
        echo "Uso: $0 <ip-server> <password-email>"
        exit 1
    fi
}

# Verifica connessione server
test_server_connection() {
    print_step "Test connessione server $SERVER_IP"
    
    if ! timeout 10 ssh -o ConnectTimeout=5 root@$SERVER_IP "echo 'Connessione OK'" > /dev/null 2>&1; then
        print_error "Impossibile connettersi al server $SERVER_IP"
        echo "Verifica:"
        echo "- IP server corretto"
        echo "- Chiave SSH configurata"
        echo "- Server accessibile"
        exit 1
    fi
    
    print_info "Connessione server verificata"
}

# Build applicazione
build_application() {
    print_step "Build applicazione"
    
    npm run build > build.log 2>&1
    if [ $? -ne 0 ]; then
        print_error "Errore durante il build"
        tail -20 build.log
        exit 1
    fi
    
    print_info "Build completata"
}

# Deploy completo
deploy_to_server() {
    print_step "Deploy sul server"
    
    # Crea archivio
    tar -czf highlander-production.tar.gz \
        --exclude=node_modules \
        --exclude=.git \
        --exclude=*.log \
        --exclude=.env \
        --exclude=uploads/* \
        --exclude=attached_assets \
        --exclude=backup \
        .
    
    # Upload al server
    scp highlander-production.tar.gz root@$SERVER_IP:/tmp/
    
    # Setup sul server
    ssh root@$SERVER_IP << EOF
        set -e
        
        # Update sistema
        apt update && apt upgrade -y
        
        # Installa Node.js 20
        curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
        apt-get install -y nodejs
        
        # Installa altre dipendenze
        apt install -y nginx postgresql postgresql-contrib certbot python3-certbot-nginx ufw htop
        
        # Installa PM2 globalmente
        npm install -g pm2
        
        # Setup firewall
        ufw allow OpenSSH
        ufw allow 'Nginx Full'
        ufw --force enable
        
        # Crea utente app
        useradd -m -s /bin/bash highlander || true
        mkdir -p /home/highlander/{app,logs}
        
        # Setup database
        sudo -u postgres psql << 'PSQL'
            CREATE DATABASE highlander;
            CREATE USER highlander_user WITH PASSWORD 'highlander_secure_2024!';
            GRANT ALL PRIVILEGES ON DATABASE highlander TO highlander_user;
            ALTER USER highlander_user CREATEDB;
PSQL
        
        # Deploy app
        cd /home/highlander
        rm -rf app
        mkdir app
        cd app
        tar -xzf /tmp/highlander-production.tar.gz
        
        # Installa dipendenze
        npm ci --production
        
        # Crea .env
        cat > .env << 'ENV_CONFIG'
DATABASE_URL=postgresql://highlander_user:highlander_secure_2024!@localhost:5432/highlander
SMTP_USER=support@highlandergame.it
SMTP_PASSWORD=$EMAIL_PASSWORD
SESSION_SECRET=\$(openssl rand -base64 32)
NODE_ENV=production
PORT=3000
BASE_URL=https://highlandergame.it
ENV_CONFIG
        
        # Setup permessi
        chown -R highlander:highlander /home/highlander
        chmod 600 .env
        
        # Inizializza database
        sudo -u highlander npm run db:push
        
        echo "✅ Applicazione deployata"
EOF
    
    print_info "Deploy completato"
}

# Configura Nginx
setup_nginx() {
    print_step "Configurazione Nginx"
    
    ssh root@$SERVER_IP << EOF
        # Crea configurazione Nginx
        cat > /etc/nginx/sites-available/$DOMAIN << 'NGINX_CONF'
server {
    listen 80;
    server_name $DOMAIN www.$DOMAIN;
    return 301 https://\$server_name\$request_uri;
}

server {
    listen 443 ssl http2;
    server_name $DOMAIN www.$DOMAIN;
    
    ssl_certificate /etc/letsencrypt/live/$DOMAIN/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/$DOMAIN/privkey.pem;
    
    ssl_session_timeout 1d;
    ssl_session_cache shared:SSL:50m;
    ssl_session_tickets off;
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers ECDHE-RSA-AES256-GCM-SHA384:ECDHE-RSA-CHACHA20-POLY1305:ECDHE-RSA-AES128-GCM-SHA256;
    ssl_prefer_server_ciphers off;
    
    add_header Strict-Transport-Security "max-age=63072000" always;
    add_header X-Frame-Options DENY;
    add_header X-Content-Type-Options nosniff;
    
    gzip on;
    gzip_vary on;
    gzip_min_length 1024;
    gzip_types text/plain text/css text/xml text/javascript application/javascript application/xml+rss application/json;
    
    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_cache_bypass \$http_upgrade;
        client_max_body_size 10M;
    }
    
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
    
    print_info "Nginx configurato"
}

# Setup SSL
setup_ssl() {
    print_step "Configurazione SSL"
    
    ssh root@$SERVER_IP << EOF
        # Ottieni certificato SSL
        certbot --nginx -d $DOMAIN -d www.$DOMAIN --non-interactive --agree-tos --email admin@$DOMAIN
        
        # Setup auto-renewal
        echo "0 12 * * * /usr/bin/certbot renew --quiet" | crontab -
        
        systemctl reload nginx
        
        echo "✅ SSL configurato"
EOF
    
    print_info "SSL configurato"
}

# Avvia applicazione
start_application() {
    print_step "Avvio applicazione"
    
    ssh root@$SERVER_IP << 'EOF'
        cd /home/highlander/app
        
        # Avvia con PM2
        sudo -u highlander pm2 start ecosystem.config.js --env production
        sudo -u highlander pm2 save
        
        # Setup autostart
        pm2 startup systemd -u highlander --hp /home/highlander
        systemctl enable pm2-highlander
        
        echo "✅ Applicazione avviata"
EOF
    
    print_info "Applicazione avviata"
}

# Test finale
final_tests() {
    print_step "Test finale"
    
    print_info "Test connettività..."
    if curl -s -o /dev/null -w "%{http_code}" https://$DOMAIN | grep -q "200\|301\|302"; then
        print_info "✅ Sito raggiungibile"
    else
        print_error "❌ Sito non raggiungibile"
    fi
    
    print_info "Test redirect HTTP → HTTPS..."
    if curl -s -o /dev/null -w "%{http_code}" http://$DOMAIN | grep -q "301"; then
        print_info "✅ Redirect HTTPS funzionante"
    else
        print_error "❌ Redirect HTTPS non funzionante"
    fi
    
    # Cleanup
    rm -f highlander-production.tar.gz build.log
}

# Report finale
generate_final_report() {
    print_header "DEPLOYMENT COMPLETATO"
    
    echo "🎉 Highlander Serie A è ora online!"
    echo ""
    echo "📍 URL: https://$DOMAIN"
    echo "🖥️  Server: $SERVER_IP"
    echo "📧 Email: support@$DOMAIN"
    echo ""
    echo "📋 PROSSIMI PASSI:"
    echo "1. Verifica il sito su https://$DOMAIN"
    echo "2. Testa registrazione e email di verifica"
    echo "3. Monitora log: ssh root@$SERVER_IP 'pm2 logs highlander'"
    echo ""
    echo "🔧 COMANDI UTILI:"
    echo "- Status app: ssh root@$SERVER_IP 'pm2 status'"
    echo "- Restart app: ssh root@$SERVER_IP 'pm2 restart highlander'"
    echo "- Log app: ssh root@$SERVER_IP 'pm2 logs highlander'"
    echo ""
    echo "🔒 CREDENZIALI SALVATE:"
    echo "- Database: highlander_user / highlander_secure_2024!"
    echo "- Email: support@$DOMAIN / [password fornita]"
    echo ""
}

# Funzione principale
main() {
    print_header "DEPLOYMENT HIGHLANDER SU HETZNER"
    
    check_parameters
    test_server_connection
    build_application
    deploy_to_server
    setup_nginx
    setup_ssl
    start_application
    final_tests
    generate_final_report
}

main