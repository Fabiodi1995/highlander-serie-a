#!/bin/bash
# Deployment diretto senza Git per Highlander

SERVER_IP="78.47.123.128"
DOMAIN="highlandergame.it"
EMAIL_PASS="Calibro9!"

echo "DEPLOYMENT DIRETTO HIGHLANDER"
echo "Server: $SERVER_IP"

# Verifica se siamo nel progetto corretto
if [ ! -f "package.json" ] || [ ! -d "server" ] || [ ! -d "client" ]; then
    echo "Errore: Esegui questo script dalla directory del progetto"
    exit 1
fi

# 1. Aggiorna repository Git
update_git_repository() {
    echo "1. Aggiornamento repository Git..."
    
    # Configura Git se necessario
    if [ -z "$(git config user.name)" ]; then
        git config user.name "Highlander Deploy"
        git config user.email "deploy@highlandergame.it"
    fi
    
    # Add e commit modifiche
    git add .
    git commit -m "Production deployment $(date '+%Y-%m-%d %H:%M')" || echo "Nessuna modifica da committare"
    
    # Push su repository privato
    if git remote get-url origin &>/dev/null; then
        git push origin main || git push origin master || echo "Push completato o non necessario"
    else
        echo "Repository remoto non configurato - continuo con deployment locale"
    fi
    
    echo "Repository Git aggiornato"
}

# 2. Crea archivio applicazione
create_app_archive() {
    echo "2. Creazione archivio applicazione..."
    
    # Crea archivio pulito
    tar -czf highlander-app.tar.gz \
        --exclude=node_modules \
        --exclude=.git \
        --exclude=*.log \
        --exclude=.env \
        --exclude=dist \
        --exclude=uploads \
        --exclude=attached_assets \
        --exclude=backup \
        --exclude=*.tar.gz \
        .
    
    echo "Archivio creato: highlander-app.tar.gz"
}

# 3. Setup server completo
setup_server() {
    echo "3. Setup server Hetzner..."
    
    # Script per il server
    cat > server-setup.sh << 'SERVEREOF'
#!/bin/bash
set -e

echo "CONFIGURAZIONE SERVER HETZNER"

# Update sistema
apt update && apt upgrade -y

# Node.js 20
curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
apt-get install -y nodejs

# Servizi necessari
apt install -y nginx postgresql postgresql-contrib certbot python3-certbot-nginx ufw

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

# Preparazione directory app
cd /home/highlander
rm -rf app
mkdir app && cd app

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

# Nginx configurazione
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
    
    # SSL temporaneo
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
    
    # Static assets
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2)$ {
        proxy_pass http://localhost:3000;
        include /etc/nginx/proxy_params;
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
}
NGINXEOF

# Proxy params
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

# Firewall
ufw --force reset
ufw default deny incoming
ufw default allow outgoing
ufw allow 22/tcp
ufw allow 80/tcp
ufw allow 443/tcp
ufw allow from 127.0.0.1 to any port 5432
ufw --force enable

echo "SERVER CONFIGURATO"
echo "Password DB salvata in: /root/.db_password"
SERVEREOF

    # Esegui setup sul server
    scp server-setup.sh root@$SERVER_IP:/tmp/
    ssh root@$SERVER_IP "chmod +x /tmp/server-setup.sh && /tmp/server-setup.sh"
}

# 4. Deploy applicazione
deploy_application() {
    echo "4. Deploy applicazione..."
    
    # Upload archivio
    scp highlander-app.tar.gz root@$SERVER_IP:/tmp/
    
    # Installazione sul server
    ssh root@$SERVER_IP << 'SSHEOF'
cd /home/highlander/app
tar -xzf /tmp/highlander-app.tar.gz
chown -R highlander:highlander .

# Installa dipendenze
sudo -u highlander npm ci --production

# Build applicazione
sudo -u highlander npm run build

# Inizializza database
sudo -u highlander npm run db:push

echo "APPLICAZIONE DEPLOYATA"
SSHEOF
}

# 5. Configurazione SSL e avvio
configure_ssl_and_start() {
    echo "5. Configurazione SSL e avvio..."
    
    ssh root@$SERVER_IP << 'SSHEOF'
# SSL automatico
certbot --nginx -d highlandergame.it -d www.highlandergame.it \
    --non-interactive --agree-tos --email admin@highlandergame.it

# Auto-renewal
echo "0 12 * * * /usr/bin/certbot renew --quiet" | crontab -

# Avvio applicazione
cd /home/highlander/app
sudo -u highlander pm2 start ecosystem.config.js --env production
sudo -u highlander pm2 save

# Autostart
pm2 startup systemd -u highlander --hp /home/highlander
systemctl enable pm2-highlander

echo "APPLICAZIONE AVVIATA"
SSHEOF
}

# 6. Test finale
test_deployment() {
    echo "6. Test finale..."
    
    sleep 10
    
    # Test HTTPS
    if curl -s -L -o /dev/null -w "%{http_code}" https://$DOMAIN | grep -q "200"; then
        echo "✅ HTTPS: https://$DOMAIN"
    else
        echo "⚠ HTTPS verificare manualmente"
    fi
    
    # Test API
    if curl -s https://$DOMAIN/api/user | grep -q "401\|302"; then
        echo "✅ API funzionante"
    else
        echo "⚠ API verificare manualmente"
    fi
}

# 7. Report finale
final_report() {
    DB_PASS=$(ssh root@$SERVER_IP "cat /root/.db_password 2>/dev/null || echo 'N/A'")
    
    cat << REPORT

========================================
DEPLOYMENT HIGHLANDER COMPLETATO
========================================

🌐 SITO: https://$DOMAIN
🖥️  SERVER: $SERVER_IP
📧 EMAIL: support@$DOMAIN

CREDENZIALI DATABASE:
Username: highlander_db
Password: $DB_PASS

AGGIORNAMENTI FUTURI:
./deploy/direct-update.sh

MONITORAGGIO:
ssh root@$SERVER_IP
sudo -u highlander pm2 status
sudo -u highlander pm2 logs highlander

DNS NECESSARIO:
A    highlandergame.it       $SERVER_IP
A    www.highlandergame.it   $SERVER_IP

========================================
REPORT
    
    # Cleanup
    rm -f highlander-app.tar.gz server-setup.sh
}

# Esecuzione principale
main() {
    echo "Inizio deployment completo..."
    update_git_repository
    create_app_archive
    setup_server
    deploy_application
    configure_ssl_and_start
    test_deployment
    final_report
}

main "$@"