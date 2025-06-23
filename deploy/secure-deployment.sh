#!/bin/bash

# Deployment sicuro Highlander su Hetzner
# Usa: ./deploy/secure-deployment.sh <ip-server> <password-email>

set -e

SERVER_IP=${1:-""}
EMAIL_PASSWORD=${2:-""}
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

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

check_parameters() {
    if [ -z "$SERVER_IP" ] || [ -z "$EMAIL_PASSWORD" ]; then
        print_error "Parametri mancanti"
        echo "Uso: $0 <ip-server> <password-email>"
        echo "Esempio: $0 95.217.123.456 tua_password_email"
        exit 1
    fi
}

# Test connessione iniziale
test_connection() {
    print_step "Test connessione server $SERVER_IP"
    
    if ! timeout 10 ssh -o ConnectTimeout=5 root@$SERVER_IP "echo 'OK'" > /dev/null 2>&1; then
        print_error "Impossibile connettersi come root. Verifica SSH keys."
        exit 1
    fi
}

# Prepara applicazione
prepare_app() {
    print_step "Preparazione applicazione"
    
    npm run build
    
    tar -czf highlander-secure.tar.gz \
        --exclude=node_modules \
        --exclude=.git \
        --exclude=*.log \
        --exclude=.env \
        --exclude=uploads/* \
        --exclude=attached_assets \
        --exclude=backup \
        .
}

# Setup sicurezza server
setup_security() {
    print_step "Configurazione sicurezza server"
    
    # Copia e esegui script sicurezza
    scp deploy/secure-server-setup.sh root@$SERVER_IP:/tmp/
    ssh root@$SERVER_IP "chmod +x /tmp/secure-server-setup.sh && /tmp/secure-server-setup.sh"
}

# Deploy applicazione
deploy_app() {
    print_step "Deploy applicazione con utente sicuro"
    
    # Upload applicazione
    scp highlander-secure.tar.gz root@$SERVER_IP:/tmp/
    
    # Deploy con utente dedicato
    ssh root@$SERVER_IP << EOF
        # Estrai applicazione
        cd /home/$APP_USER
        rm -rf app
        mkdir app
        cd app
        tar -xzf /tmp/highlander-secure.tar.gz
        
        # Ottieni password database
        DB_PASSWORD=\$(cat /root/.db_password)
        
        # Crea .env sicuro
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
        
        # Installa dipendenze come utente app
        sudo -u $APP_USER npm ci --production
        
        # Inizializza database
        sudo -u $APP_USER npm run db:push
        
        echo "Applicazione deployata con utente sicuro"
EOF
}

# Configura reverse proxy
setup_nginx() {
    print_step "Configurazione Nginx con security headers"
    
    ssh root@$SERVER_IP << EOF
        # Installa Nginx se non presente
        apt install -y nginx
        
        # Configurazione sicura
        cat > /etc/nginx/sites-available/$DOMAIN << 'NGINX_CONF'
# Rate limiting
limit_req_zone \$binary_remote_addr zone=api:10m rate=10r/s;
limit_req_zone \$binary_remote_addr zone=login:10m rate=3r/m;

server {
    listen 80;
    server_name $DOMAIN www.$DOMAIN;
    return 301 https://\$server_name\$request_uri;
}

server {
    listen 443 ssl http2;
    server_name $DOMAIN www.$DOMAIN;
    
    # SSL
    ssl_certificate /etc/letsencrypt/live/$DOMAIN/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/$DOMAIN/privkey.pem;
    
    # Security SSL
    ssl_session_timeout 1d;
    ssl_session_cache shared:SSL:50m;
    ssl_session_tickets off;
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers ECDHE-RSA-AES256-GCM-SHA384:ECDHE-RSA-CHACHA20-POLY1305;
    ssl_prefer_server_ciphers off;
    
    # Security headers
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains; preload" always;
    add_header X-Frame-Options DENY always;
    add_header X-Content-Type-Options nosniff always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header Referrer-Policy "strict-origin-when-cross-origin" always;
    add_header Content-Security-Policy "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; font-src 'self' data:; connect-src 'self';" always;
    
    # Hide Nginx version
    server_tokens off;
    
    # Gzip
    gzip on;
    gzip_vary on;
    gzip_min_length 1024;
    gzip_types text/plain text/css text/xml text/javascript application/javascript application/xml+rss application/json;
    
    # API rate limiting
    location /api/login {
        limit_req zone=login burst=5 nodelay;
        proxy_pass http://localhost:3000;
        include proxy_params;
    }
    
    location /api/ {
        limit_req zone=api burst=20 nodelay;
        proxy_pass http://localhost:3000;
        include proxy_params;
    }
    
    # Main app
    location / {
        proxy_pass http://localhost:3000;
        include proxy_params;
        client_max_body_size 10M;
    }
    
    # Static assets
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2)$ {
        proxy_pass http://localhost:3000;
        include proxy_params;
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
    
    # Security.txt
    location /.well-known/security.txt {
        return 200 "Contact: admin@$DOMAIN\nExpires: 2025-12-31T23:59:59.000Z\n";
        add_header Content-Type text/plain;
    }
}
NGINX_CONF
        
        # Crea proxy_params se non esiste
        cat > /etc/nginx/proxy_params << 'PROXY_PARAMS'
proxy_set_header Host \$http_host;
proxy_set_header X-Real-IP \$remote_addr;
proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
proxy_set_header X-Forwarded-Proto \$scheme;
proxy_http_version 1.1;
proxy_set_header Upgrade \$http_upgrade;
proxy_set_header Connection "upgrade";
proxy_cache_bypass \$http_upgrade;
proxy_read_timeout 300;
proxy_connect_timeout 300;
PROXY_PARAMS
        
        # Abilita sito
        ln -sf /etc/nginx/sites-available/$DOMAIN /etc/nginx/sites-enabled/
        rm -f /etc/nginx/sites-enabled/default
        
        # Test e reload
        nginx -t && systemctl reload nginx
        
        echo "Nginx configurato con security headers"
EOF
}

# Setup SSL
setup_ssl() {
    print_step "Configurazione SSL automatico"
    
    ssh root@$SERVER_IP << EOF
        # Installa Certbot
        apt install -y certbot python3-certbot-nginx
        
        # Ottieni certificato
        certbot --nginx -d $DOMAIN -d www.$DOMAIN \
            --non-interactive --agree-tos \
            --email admin@$DOMAIN \
            --redirect
        
        # Auto-renewal
        echo "0 12 * * * /usr/bin/certbot renew --quiet" | crontab -
        
        systemctl reload nginx
        
        echo "SSL configurato con auto-renewal"
EOF
}

# Avvia applicazione
start_app() {
    print_step "Avvio applicazione con PM2"
    
    ssh root@$SERVER_IP << EOF
        cd /home/$APP_USER/app
        
        # Crea ecosystem config personalizzato
        cat > ecosystem.production.js << 'PM2_CONFIG'
module.exports = {
  apps: [{
    name: 'highlander',
    script: './server/index.ts',
    interpreter: 'node',
    interpreter_args: '--loader tsx',
    cwd: '/home/$APP_USER/app',
    instances: 2,
    exec_mode: 'cluster',
    env_production: {
      NODE_ENV: 'production',
      PORT: 3000
    },
    error_file: '/home/$APP_USER/logs/err.log',
    out_file: '/home/$APP_USER/logs/out.log',
    log_file: '/home/$APP_USER/logs/combined.log',
    time: true,
    max_memory_restart: '512M',
    restart_delay: 1000,
    max_restarts: 10,
    min_uptime: '10s',
    watch: false,
    ignore_watch: ['node_modules', 'logs']
  }]
}
PM2_CONFIG
        
        # Avvia come utente dedicato
        sudo -u $APP_USER pm2 start ecosystem.production.js --env production
        sudo -u $APP_USER pm2 save
        
        # Setup startup
        env PATH=\$PATH:/usr/bin pm2 startup systemd -u $APP_USER --hp /home/$APP_USER
        systemctl enable pm2-$APP_USER
        
        echo "Applicazione avviata con PM2"
EOF
}

# Test deployment
test_deployment() {
    print_step "Test deployment"
    
    sleep 10  # Attendi avvio app
    
    # Test HTTP redirect
    if curl -s -o /dev/null -w "%{http_code}" http://$DOMAIN | grep -q "301"; then
        echo "✓ HTTP redirect funziona"
    else
        echo "✗ HTTP redirect non funziona"
    fi
    
    # Test HTTPS
    if curl -s -o /dev/null -w "%{http_code}" https://$DOMAIN | grep -q "200"; then
        echo "✓ HTTPS funziona"
    else
        echo "✗ HTTPS non funziona"
    fi
    
    # Test API
    if curl -s https://$DOMAIN/api/user | grep -q "401\|302"; then
        echo "✓ API risponde"
    else
        echo "✗ API non risponde"
    fi
}

# Report finale
final_report() {
    DB_PASSWORD=$(ssh root@$SERVER_IP "cat /root/.db_password")
    
    echo ""
    echo "=================================="
    echo "DEPLOYMENT SICURO COMPLETATO"
    echo "=================================="
    echo ""
    echo "🌐 URL: https://$DOMAIN"
    echo "🖥️  Server: $SERVER_IP"
    echo "👤 Utente app: $APP_USER (non privilegiato)"
    echo "🔒 SSH: Porta $SSH_PORT (solo chiavi)"
    echo "🛡️  Firewall: UFW attivo con Fail2Ban"
    echo "📧 Email: support@$DOMAIN"
    echo ""
    echo "CREDENZIALI SICURE:"
    echo "- Database: highlander_db / $DB_PASSWORD"
    echo "- SSH: Porta $SSH_PORT"
    echo ""
    echo "COMANDI UTILI:"
    echo "- Connessione: ssh -p $SSH_PORT $APP_USER@$SERVER_IP"
    echo "- Status app: pm2 status"
    echo "- Log app: pm2 logs highlander"
    echo "- Restart app: pm2 restart highlander"
    echo ""
    echo "SICUREZZA IMPLEMENTATA:"
    echo "- Utente non privilegiato per applicazione"
    echo "- SSH hardening con porta personalizzata"
    echo "- Firewall restrittivo"
    echo "- Rate limiting su API"
    echo "- Security headers HTTP"
    echo "- Fail2Ban per protezione brute force"
    echo "- Backup automatici"
    echo "- Monitoraggio risorse"
    echo ""
    
    # Cleanup
    rm -f highlander-secure.tar.gz
}

# Funzione principale
main() {
    echo "🔐 DEPLOYMENT SICURO HIGHLANDER"
    echo "Implementa best practices di sicurezza"
    echo ""
    
    check_parameters
    test_connection
    prepare_app
    setup_security
    deploy_app
    setup_nginx
    setup_ssl
    start_app
    test_deployment
    final_report
}

main "$@"