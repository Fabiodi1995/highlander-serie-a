#!/bin/bash

# Deployment diretto Highlander - Configurazione completa
SERVER_IP="78.47.123.128"
EMAIL_PASSWORD="Calibro9!"
DOMAIN="highlandergame.it"
ROOT_PASS=""

echo "DEPLOYMENT HIGHLANDER SU HETZNER"
echo "Server: $SERVER_IP"
echo "Dominio: $DOMAIN"
echo ""

# Richiedi password se non fornita
if [ -z "$ROOT_PASS" ]; then
    echo -n "Password root server: "
    read -s ROOT_PASS
    echo ""
fi

# Prepara applicazione
echo "Preparazione applicazione..."
npm run build

tar -czf highlander-deploy.tar.gz \
    --exclude=node_modules \
    --exclude=.git \
    --exclude=*.log \
    --exclude=.env \
    --exclude=uploads/* \
    --exclude=attached_assets \
    --exclude=backup \
    .

# Crea script di setup completo
cat > setup-server.sh << 'EOF'
#!/bin/bash
set -e

echo "=== SETUP SERVER HETZNER ==="

# Aggiorna sistema
apt update && apt upgrade -y

# Installa Node.js 20
curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
apt-get install -y nodejs

# Installa dipendenze
apt install -y nginx postgresql postgresql-contrib certbot python3-certbot-nginx ufw fail2ban htop

# Installa PM2
npm install -g pm2@latest

# Crea utente applicazione
useradd -m -s /bin/bash highlander || true
mkdir -p /home/highlander/{app,logs,backups}
chown -R highlander:highlander /home/highlander

# Setup database
DB_PASSWORD=$(openssl rand -base64 32)
echo "$DB_PASSWORD" > /root/.db_password
chmod 600 /root/.db_password

sudo -u postgres psql << PSQL
CREATE DATABASE highlander_prod WITH ENCODING 'UTF8';
CREATE USER highlander_db WITH PASSWORD '$DB_PASSWORD';
GRANT ALL PRIVILEGES ON DATABASE highlander_prod TO highlander_db;
PSQL

# Configura firewall
ufw --force reset
ufw default deny incoming
ufw default allow outgoing
ufw allow 22/tcp
ufw allow 80/tcp  
ufw allow 443/tcp
ufw allow from 127.0.0.1 to any port 5432
ufw --force enable

# Configura Nginx
cat > /etc/nginx/sites-available/highlandergame.it << 'NGINX'
server {
    listen 80;
    server_name highlandergame.it www.highlandergame.it;
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name highlandergame.it www.highlandergame.it;
    
    ssl_certificate /etc/ssl/certs/ssl-cert-snakeoil.pem;
    ssl_certificate_key /etc/ssl/private/ssl-cert-snakeoil.key;
    
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;
    add_header X-Frame-Options DENY always;
    add_header X-Content-Type-Options nosniff always;
    
    gzip on;
    gzip_types text/plain text/css application/json application/javascript text/xml application/xml application/xml+rss text/javascript;
    
    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
        client_max_body_size 10M;
    }
}
NGINX

ln -sf /etc/nginx/sites-available/highlandergame.it /etc/nginx/sites-enabled/
rm -f /etc/nginx/sites-enabled/default
nginx -t
systemctl restart nginx
systemctl enable nginx

echo "Setup server completato"
EOF

chmod +x setup-server.sh

# Deploy usando expect per gestire password
expect << EOF
set timeout 30
spawn scp setup-server.sh highlander-deploy.tar.gz root@$SERVER_IP:/tmp/
expect "password:"
send "$ROOT_PASS\r"
expect eof

spawn ssh root@$SERVER_IP
expect "password:"
send "$ROOT_PASS\r"
expect "# "

send "cd /tmp && chmod +x setup-server.sh && ./setup-server.sh\r"
expect "Setup server completato"

send "cd /home/highlander && rm -rf app && mkdir app && cd app\r"
expect "# "

send "tar -xzf /tmp/highlander-deploy.tar.gz\r"
expect "# "

send "DB_PASSWORD=\$(cat /root/.db_password)\r"
expect "# "

send "cat > .env << 'ENVEOF'\r"
send "DATABASE_URL=postgresql://highlander_db:\$DB_PASSWORD@localhost:5432/highlander_prod\r"
send "SMTP_USER=support@highlandergame.it\r"
send "SMTP_PASSWORD=Calibro9!\r"
send "SESSION_SECRET=\$(openssl rand -base64 32)\r"
send "NODE_ENV=production\r"
send "PORT=3000\r"
send "BASE_URL=https://highlandergame.it\r"
send "ENVEOF\r"
expect "# "

send "chmod 600 .env && chown -R highlander:highlander /home/highlander/app\r"
expect "# "

send "sudo -u highlander npm ci --production\r"
expect "# "

send "sudo -u highlander npm run db:push\r"
expect "# "

send "certbot --nginx -d highlandergame.it -d www.highlandergame.it --non-interactive --agree-tos --email admin@highlandergame.it\r"
expect "# "

send "cd /home/highlander/app && sudo -u highlander pm2 start ecosystem.config.js --env production\r"
expect "# "

send "sudo -u highlander pm2 save\r"
expect "# "

send "env PATH=\$PATH:/usr/bin pm2 startup systemd -u highlander --hp /home/highlander\r"
expect "# "

send "systemctl enable pm2-highlander\r"
expect "# "

send "exit\r"
expect eof
EOF

echo ""
echo "DEPLOYMENT COMPLETATO"
echo ""
echo "URL: https://highlandergame.it"
echo "Server: $SERVER_IP"
echo ""
echo "Configurazione DNS necessaria:"
echo "A    highlandergame.it    78.47.123.128"
echo "A    www.highlandergame.it    78.47.123.128"
echo ""

# Cleanup
rm -f setup-server.sh highlander-deploy.tar.gz