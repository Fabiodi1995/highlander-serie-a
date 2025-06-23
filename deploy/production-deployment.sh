#!/bin/bash
# Deployment completo con repository Git per Highlander

SERVER_IP="78.47.123.128"
DOMAIN="highlandergame.it"
EMAIL_PASS="Calibro9!"

echo "DEPLOYMENT HIGHLANDER CON GIT"
echo "Server: $SERVER_IP"

# 1. Setup repository locale
setup_git_repo() {
    echo "1. Setup repository Git..."
    
    # Configura .gitignore se non presente
    if [ ! -f ".gitignore" ]; then
        cat > .gitignore << 'GITIGNORE'
node_modules/
.env
dist/
logs/
*.log
uploads/*
!uploads/.gitkeep
attached_assets/
backup/
*.tar.gz
.DS_Store
GITIGNORE
    fi
    
    # Inizializza Git se necessario
    if [ ! -d ".git" ]; then
        git init
        git branch -M main
    fi
    
    # Configura utente se non presente
    if [ -z "$(git config user.name)" ]; then
        git config user.name "Highlander Deploy"
        git config user.email "deploy@highlandergame.it"
    fi
    
    # Stage e commit
    git add .
    git commit -m "Deploy setup for production $(date)" || true
    
    echo "Repository Git configurato"
}

# 2. Deploy sul server
deploy_to_server() {
    echo "2. Deployment sul server..."
    
    # Script completo per il server
    cat > server-deploy.sh << 'SERVEREOF'
#!/bin/bash
set -e

echo "SETUP SERVER HETZNER"

# Update sistema
apt update && apt upgrade -y

# Node.js 20
curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
apt-get install -y nodejs

# Servizi necessari
apt install -y nginx postgresql postgresql-contrib certbot python3-certbot-nginx ufw git

# PM2 globale
npm install -g pm2@latest

# Utente app
useradd -m -s /bin/bash highlander 2>/dev/null || true
mkdir -p /home/highlander/{app,logs}

# Database
DB_PASS=$(openssl rand -base64 24)
echo "$DB_PASS" > /root/.db_password
chmod 600 /root/.db_password

sudo -u postgres psql << PSQL
DROP DATABASE IF EXISTS highlander_prod;
DROP USER IF EXISTS highlander_db;
CREATE DATABASE highlander_prod;
CREATE USER highlander_db WITH PASSWORD '$DB_PASS';
GRANT ALL PRIVILEGES ON DATABASE highlander_prod TO highlander_db;
PSQL

# Setup Git per deployment
cd /home/highlander
rm -rf app
mkdir app && cd app

# Crea repository temporaneo per ricevere il codice
git init
git config user.name "Production Server"
git config user.email "server@highlandergame.it"

# File .env produzione
cat > .env << ENVEOF
DATABASE_URL=postgresql://highlander_db:$DB_PASS@localhost:5432/highlander_prod
SMTP_USER=support@highlandergame.it
SMTP_PASSWORD=Calibro9!
SESSION_SECRET=$(openssl rand -base64 32)
NODE_ENV=production
PORT=3000
BASE_URL=https://highlandergame.it
ENVEOF

chmod 600 .env
chown -R highlander:highlander /home/highlander

# Nginx con configurazione ottimizzata
cat > /etc/nginx/sites-available/highlandergame.it << 'NGINXEOF'
# Rate limiting
limit_req_zone $binary_remote_addr zone=api:10m rate=10r/s;
limit_req_zone $binary_remote_addr zone=login:10m rate=3r/m;

server {
    listen 80;
    server_name highlandergame.it www.highlandergame.it;
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name highlandergame.it www.highlandergame.it;
    
    # SSL (aggiornato da Certbot)
    ssl_certificate /etc/ssl/certs/ssl-cert-snakeoil.pem;
    ssl_certificate_key /etc/ssl/private/ssl-cert-snakeoil.key;
    
    # Security headers
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains; preload" always;
    add_header X-Frame-Options DENY always;
    add_header X-Content-Type-Options nosniff always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header Referrer-Policy "strict-origin-when-cross-origin" always;
    
    # Performance
    gzip on;
    gzip_vary on;
    gzip_min_length 1024;
    gzip_types text/plain text/css application/json application/javascript text/xml application/xml text/javascript;
    
    # API rate limiting
    location /api/login {
        limit_req zone=login burst=5 nodelay;
        proxy_pass http://localhost:3000;
        include /etc/nginx/proxy_params;
    }
    
    location /api/ {
        limit_req zone=api burst=20 nodelay;
        proxy_pass http://localhost:3000;
        include /etc/nginx/proxy_params;
    }
    
    # Main application
    location / {
        proxy_pass http://localhost:3000;
        include /etc/nginx/proxy_params;
        client_max_body_size 10M;
    }
    
    # Static assets with long cache
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2)$ {
        proxy_pass http://localhost:3000;
        include /etc/nginx/proxy_params;
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
}
NGINXEOF

# Proxy params per Nginx
cat > /etc/nginx/proxy_params << 'PROXYEOF'
proxy_set_header Host $http_host;
proxy_set_header X-Real-IP $remote_addr;
proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
proxy_set_header X-Forwarded-Proto $scheme;
proxy_http_version 1.1;
proxy_set_header Upgrade $http_upgrade;
proxy_set_header Connection "upgrade";
proxy_cache_bypass $http_upgrade;
proxy_read_timeout 300;
proxy_connect_timeout 300;
PROXYEOF

# Abilita Nginx
ln -sf /etc/nginx/sites-available/highlandergame.it /etc/nginx/sites-enabled/
rm -f /etc/nginx/sites-enabled/default
nginx -t
systemctl restart nginx
systemctl enable nginx

# Firewall sicuro
ufw --force reset
ufw default deny incoming
ufw default allow outgoing
ufw allow 22/tcp comment 'SSH'
ufw allow 80/tcp comment 'HTTP'
ufw allow 443/tcp comment 'HTTPS'
ufw allow from 127.0.0.1 to any port 5432 comment 'PostgreSQL local'
ufw --force enable

echo "SERVER CONFIGURATO"
echo "Password DB: $DB_PASS"
SERVEREOF

    # Esegui sul server
    scp server-deploy.sh root@$SERVER_IP:/tmp/
    ssh root@$SERVER_IP "chmod +x /tmp/server-deploy.sh && /tmp/server-deploy.sh"
}

# 3. Upload codice applicazione
upload_application() {
    echo "3. Upload codice applicazione..."
    
    # Crea archivio pulito
    tar -czf app-deploy.tar.gz \
        --exclude=node_modules \
        --exclude=.git \
        --exclude=*.log \
        --exclude=.env \
        --exclude=dist \
        --exclude=uploads \
        --exclude=attached_assets \
        --exclude=backup \
        .
    
    # Upload e installazione
    scp app-deploy.tar.gz root@$SERVER_IP:/tmp/
    
    ssh root@$SERVER_IP << 'SSHEOF'
cd /home/highlander/app
tar -xzf /tmp/app-deploy.tar.gz
chown -R highlander:highlander .

# Installa dipendenze
sudo -u highlander npm ci --production

# Build applicazione
sudo -u highlander npm run build

# Inizializza database
sudo -u highlander npm run db:push

echo "APPLICAZIONE INSTALLATA"
SSHEOF

    rm -f app-deploy.tar.gz server-deploy.sh
}

# 4. Configurazione SSL e avvio
finalize_deployment() {
    echo "4. Configurazione SSL e avvio finale..."
    
    ssh root@$SERVER_IP << 'SSHEOF'
# SSL automatico
certbot --nginx -d highlandergame.it -d www.highlandergame.it \
    --non-interactive --agree-tos --email admin@highlandergame.it

# Auto-renewal SSL
echo "0 12 * * * /usr/bin/certbot renew --quiet" | crontab -

# Avvio applicazione
cd /home/highlander/app
sudo -u highlander pm2 start ecosystem.config.js --env production
sudo -u highlander pm2 save

# Setup autostart
pm2 startup systemd -u highlander --hp /home/highlander
systemctl enable pm2-highlander

# Test applicazione
sleep 10
if sudo -u highlander pm2 list | grep -q "online.*highlander"; then
    echo "✅ APPLICAZIONE ONLINE"
else
    echo "❌ ERRORE AVVIO APPLICAZIONE"
    sudo -u highlander pm2 logs highlander --lines 20
fi
SSHEOF
}

# 5. Test finale
test_deployment() {
    echo "5. Test finale..."
    
    sleep 15
    
    # Test HTTPS
    if curl -s -L -o /dev/null -w "%{http_code}" https://$DOMAIN | grep -q "200"; then
        echo "✅ HTTPS: https://$DOMAIN"
    else
        echo "⚠ HTTPS non ancora disponibile"
    fi
    
    # Test API
    if curl -s https://$DOMAIN/api/user | grep -q "401\|302"; then
        echo "✅ API risponde correttamente"
    else
        echo "⚠ Verificare API manualmente"
    fi
}

# Report finale
final_report() {
    DB_PASS=$(ssh root@$SERVER_IP "cat /root/.db_password 2>/dev/null || echo 'N/A'")
    
    cat << REPORT

========================================
DEPLOYMENT HIGHLANDER COMPLETATO
========================================

🌐 SITO: https://$DOMAIN
🖥️  SERVER: $SERVER_IP
📧 EMAIL: support@$DOMAIN

CREDENZIALI:
Database: highlander_db
Password: $DB_PASS

AGGIORNAMENTI FUTURI:
./deploy/update-production.sh

DNS NECESSARIO:
A    highlandergame.it       $SERVER_IP
A    www.highlandergame.it   $SERVER_IP

COMANDI UTILI:
ssh root@$SERVER_IP
sudo -u highlander pm2 status
sudo -u highlander pm2 logs highlander

========================================
REPORT
}

# Esecuzione principale
main() {
    setup_git_repo
    deploy_to_server
    upload_application
    finalize_deployment
    test_deployment
    final_report
}

main "$@"