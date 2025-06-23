#!/bin/bash

# Deployment interattivo Highlander su Hetzner
# Gestisce autenticazione con password SSH

set -e

SERVER_IP="78.47.123.128"
EMAIL_PASSWORD="Calibro9!"
DOMAIN="highlandergame.it"
APP_USER="highlander"
SSH_PORT="2222"

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

print_step() {
    echo -e "${GREEN}[STEP]${NC} $1"
}

print_security() {
    echo -e "${BLUE}[SECURITY]${NC} $1"
}

print_info() {
    echo -e "${YELLOW}[INFO]${NC} $1"
}

# Test connessione con password
test_connection() {
    print_step "Test connessione server $SERVER_IP"
    print_info "Verrà richiesta la password root del server"
    
    if ! sshpass -p "$ROOT_PASSWORD" ssh -o StrictHostKeyChecking=no root@$SERVER_IP "echo 'Connessione OK'"; then
        echo "Errore: Impossibile connettersi al server"
        echo "Verifica IP server e password root"
        exit 1
    fi
    
    echo "Connessione verificata"
}

# Funzione per eseguire comandi remoti con password
ssh_exec() {
    sshpass -p "$ROOT_PASSWORD" ssh -o StrictHostKeyChecking=no root@$SERVER_IP "$1"
}

# Copia file con password
scp_copy() {
    sshpass -p "$ROOT_PASSWORD" scp -o StrictHostKeyChecking=no "$1" root@$SERVER_IP:"$2"
}

# Prepara applicazione
prepare_app() {
    print_step "Preparazione applicazione"
    
    npm run build
    
    tar -czf highlander-production.tar.gz \
        --exclude=node_modules \
        --exclude=.git \
        --exclude=*.log \
        --exclude=.env \
        --exclude=uploads/* \
        --exclude=attached_assets \
        --exclude=backup \
        .
    
    echo "Applicazione preparata"
}

# Setup sistema completo
full_setup() {
    print_step "Setup completo server con sicurezza"
    
    ssh_exec "
        set -e
        
        # Aggiorna sistema
        apt update && apt upgrade -y
        
        # Installa dipendenze essenziali
        apt install -y curl wget gnupg2 software-properties-common
        
        # Installa Node.js 20
        curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
        apt-get install -y nodejs
        
        # Installa altre dipendenze
        apt install -y nginx postgresql postgresql-contrib certbot python3-certbot-nginx ufw htop fail2ban sshpass
        
        # Installa PM2 globalmente
        npm install -g pm2@latest
        
        echo 'Dipendenze installate'
    "
}

# Configura utente applicazione
setup_app_user() {
    print_step "Configurazione utente applicazione"
    
    ssh_exec "
        # Crea utente e gruppo
        useradd -m -s /bin/bash $APP_USER || true
        groupadd highlander-app || true
        usermod -a -G highlander-app $APP_USER
        
        # Directory con permessi sicuri
        mkdir -p /home/$APP_USER/{app,logs,backups}
        chown -R $APP_USER:highlander-app /home/$APP_USER
        chmod 750 /home/$APP_USER
        
        echo 'Utente $APP_USER configurato'
    "
}

# Setup database
setup_database() {
    print_step "Configurazione database PostgreSQL"
    
    # Genera password sicura
    DB_PASSWORD=$(openssl rand -base64 32)
    
    ssh_exec "
        # Configura PostgreSQL
        sudo -u postgres psql << 'PSQL'
            CREATE DATABASE highlander_prod WITH ENCODING 'UTF8';
            CREATE USER highlander_db WITH PASSWORD '$DB_PASSWORD';
            GRANT ALL PRIVILEGES ON DATABASE highlander_prod TO highlander_db;
            ALTER USER highlander_db CREATEDB;
PSQL
        
        # Salva password
        echo '$DB_PASSWORD' > /root/.db_password
        chmod 600 /root/.db_password
        
        echo 'Database configurato'
    "
    
    echo "Password database generata e salvata"
}

# Deploy applicazione
deploy_app() {
    print_step "Deploy applicazione"
    
    # Upload file
    scp_copy "highlander-production.tar.gz" "/tmp/"
    
    ssh_exec "
        cd /home/$APP_USER
        
        # Rimuovi installazione precedente
        rm -rf app
        mkdir app
        cd app
        
        # Estrai applicazione
        tar -xzf /tmp/highlander-production.tar.gz
        
        # Ottieni password database
        DB_PASSWORD=\$(cat /root/.db_password)
        
        # Crea file .env
        cat > .env << ENV_CONFIG
DATABASE_URL=postgresql://highlander_db:\$DB_PASSWORD@localhost:5432/highlander_prod
SMTP_USER=support@highlandergame.it
SMTP_PASSWORD=$EMAIL_PASSWORD
SESSION_SECRET=\$(openssl rand -base64 32)
NODE_ENV=production
PORT=3000
BASE_URL=https://highlandergame.it
ENV_CONFIG
        
        # Permessi sicuri
        chmod 600 .env
        chown -R $APP_USER:highlander-app /home/$APP_USER/app
        
        # Installa dipendenze
        sudo -u $APP_USER npm ci --production
        
        # Inizializza database
        sudo -u $APP_USER npm run db:push
        
        echo 'Applicazione deployata'
    "
}

# Configura firewall
setup_firewall() {
    print_step "Configurazione firewall"
    
    ssh_exec "
        # Reset e configurazione UFW
        ufw --force reset
        ufw default deny incoming
        ufw default allow outgoing
        
        # Porte necessarie
        ufw allow 22/tcp comment 'SSH temporaneo'
        ufw allow $SSH_PORT/tcp comment 'SSH sicuro'
        ufw allow 80/tcp comment 'HTTP'
        ufw allow 443/tcp comment 'HTTPS'
        
        # PostgreSQL solo locale
        ufw allow from 127.0.0.1 to any port 5432
        
        # Rate limiting SSH
        ufw limit $SSH_PORT/tcp
        
        ufw --force enable
        
        echo 'Firewall configurato'
    "
}

# Configura Nginx
setup_nginx() {
    print_step "Configurazione Nginx"
    
    ssh_exec "
        # Configurazione Nginx sicura
        cat > /etc/nginx/sites-available/$DOMAIN << 'NGINX_CONF'
server {
    listen 80;
    server_name $DOMAIN www.$DOMAIN;
    return 301 https://\$server_name\$request_uri;
}

server {
    listen 443 ssl http2;
    server_name $DOMAIN www.$DOMAIN;
    
    # SSL configuration (sarà aggiornata da Certbot)
    ssl_certificate /etc/ssl/certs/ssl-cert-snakeoil.pem;
    ssl_certificate_key /etc/ssl/private/ssl-cert-snakeoil.key;
    
    # Security headers
    add_header Strict-Transport-Security 'max-age=31536000; includeSubDomains; preload' always;
    add_header X-Frame-Options DENY always;
    add_header X-Content-Type-Options nosniff always;
    add_header X-XSS-Protection '1; mode=block' always;
    
    # Gzip
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
}
NGINX_CONF
        
        # Abilita sito
        ln -sf /etc/nginx/sites-available/$DOMAIN /etc/nginx/sites-enabled/
        rm -f /etc/nginx/sites-enabled/default
        
        # Test configurazione
        nginx -t
        systemctl restart nginx
        systemctl enable nginx
        
        echo 'Nginx configurato'
    "
}

# Setup SSL
setup_ssl() {
    print_step "Configurazione SSL Let's Encrypt"
    
    ssh_exec "
        # Ottieni certificato SSL
        certbot --nginx -d $DOMAIN -d www.$DOMAIN \
            --non-interactive --agree-tos \
            --email admin@$DOMAIN \
            --redirect
        
        # Auto-renewal
        echo '0 12 * * * /usr/bin/certbot renew --quiet' | crontab -
        
        systemctl reload nginx
        
        echo 'SSL configurato'
    "
}

# Configura Fail2Ban
setup_fail2ban() {
    print_step "Configurazione Fail2Ban"
    
    ssh_exec "
        # Configurazione Fail2Ban
        cat > /etc/fail2ban/jail.local << 'F2B_CONF'
[DEFAULT]
bantime = 3600
findtime = 600
maxretry = 3

[sshd]
enabled = true
port = 22,$SSH_PORT
filter = sshd
logpath = /var/log/auth.log
maxretry = 3
bantime = 7200

[nginx-http-auth]
enabled = true
filter = nginx-http-auth
logpath = /var/log/nginx/error.log
maxretry = 5
F2B_CONF
        
        systemctl enable fail2ban
        systemctl restart fail2ban
        
        echo 'Fail2Ban configurato'
    "
}

# Avvia applicazione
start_app() {
    print_step "Avvio applicazione con PM2"
    
    ssh_exec "
        cd /home/$APP_USER/app
        
        # Avvia con PM2
        sudo -u $APP_USER pm2 start ecosystem.config.js --env production
        sudo -u $APP_USER pm2 save
        
        # Setup autostart
        env PATH=\$PATH:/usr/bin pm2 startup systemd -u $APP_USER --hp /home/$APP_USER
        systemctl enable pm2-$APP_USER
        
        echo 'Applicazione avviata'
    "
}

# Test finale
test_deployment() {
    print_step "Test deployment"
    
    sleep 15  # Attendi avvio completo
    
    echo "Test connettività..."
    
    # Test HTTPS
    if curl -s -L -o /dev/null -w "%{http_code}" https://$DOMAIN | grep -q "200"; then
        echo "✓ HTTPS funziona correttamente"
    else
        echo "⚠ HTTPS non ancora disponibile (normale se DNS non propagato)"
    fi
    
    # Test redirect
    if curl -s -o /dev/null -w "%{http_code}" http://$DOMAIN | grep -q "301\|302"; then
        echo "✓ Redirect HTTP→HTTPS funziona"
    else
        echo "⚠ Redirect non configurato"
    fi
}

# Report finale
final_report() {
    DB_PASSWORD=$(ssh_exec "cat /root/.db_password")
    
    echo ""
    echo "=========================================="
    echo "DEPLOYMENT COMPLETATO CON SUCCESSO"
    echo "=========================================="
    echo ""
    echo "🌐 URL: https://$DOMAIN"
    echo "🖥️  Server: $SERVER_IP"
    echo "👤 Utente app: $APP_USER"
    echo "🔒 SSH: Porta 22 (temporaneo) e $SSH_PORT (sicuro)"
    echo "📧 Email: support@$DOMAIN configurata"
    echo ""
    echo "CREDENZIALI:"
    echo "- Database: highlander_db"
    echo "- Password DB: $DB_PASSWORD"
    echo ""
    echo "PROSSIMI PASSI:"
    echo "1. Configura DNS: A record $DOMAIN → $SERVER_IP"
    echo "2. Testa il sito: https://$DOMAIN"
    echo "3. Configura chiavi SSH per accesso sicuro"
    echo "4. Disabilita porta SSH 22 dopo configurazione chiavi"
    echo ""
    echo "COMANDI UTILI:"
    echo "- Connessione: ssh root@$SERVER_IP"
    echo "- Status app: ssh root@$SERVER_IP 'sudo -u $APP_USER pm2 status'"
    echo "- Log app: ssh root@$SERVER_IP 'sudo -u $APP_USER pm2 logs highlander'"
    echo ""
    
    # Cleanup
    rm -f highlander-production.tar.gz
}

# Verifica DNS
check_dns() {
    print_step "Verifica configurazione DNS"
    
    echo "Controllando DNS per $DOMAIN..."
    
    if nslookup $DOMAIN | grep -q "$SERVER_IP"; then
        echo "✓ DNS configurato correttamente"
    else
        echo "⚠ DNS non ancora configurato o non propagato"
        echo "Configura record A: $DOMAIN → $SERVER_IP"
        echo "La propagazione può richiedere fino a 48 ore"
    fi
}

# Funzione principale
main() {
    echo "🚀 DEPLOYMENT HIGHLANDER SU HETZNER"
    echo "Server: $SERVER_IP"
    echo "Dominio: $DOMAIN"
    echo ""
    
    # Richiesta password root
    echo -n "Inserisci password root del server: "
    read -s ROOT_PASSWORD
    echo ""
    
    if [ -z "$ROOT_PASSWORD" ]; then
        echo "Password richiesta"
        exit 1
    fi
    
    # Verifica sshpass
    if ! command -v sshpass &> /dev/null; then
        echo "Installando sshpass..."
        if command -v apt &> /dev/null; then
            sudo apt install -y sshpass
        elif command -v yum &> /dev/null; then
            sudo yum install -y sshpass
        else
            echo "Installa sshpass manualmente"
            exit 1
        fi
    fi
    
    check_dns
    test_connection
    prepare_app
    full_setup
    setup_app_user
    setup_database
    deploy_app
    setup_firewall
    setup_nginx
    setup_ssl
    setup_fail2ban
    start_app
    test_deployment
    final_report
    
    echo "🎉 Deployment completato!"
}

main "$@"