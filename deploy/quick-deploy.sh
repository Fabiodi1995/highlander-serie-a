#!/bin/bash

# Quick deployment per Highlander
# Server: 78.47.123.128
# Email: Calibro9!

echo "🚀 DEPLOYMENT HIGHLANDER"
echo "Server: 78.47.123.128"
echo "Dominio: highlandergame.it"

# Crea archivio senza build (sarà fatto sul server)
tar -czf highlander.tar.gz \
    --exclude=node_modules \
    --exclude=.git \
    --exclude=*.log \
    --exclude=.env \
    --exclude=uploads/* \
    --exclude=attached_assets \
    --exclude=backup \
    --exclude=dist \
    .

# Script per il server
cat > server-setup.sh << 'SERVEREOF'
#!/bin/bash
set -e
echo "SETUP SERVER HETZNER"

# Sistema base
apt update && apt upgrade -y
curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
apt-get install -y nodejs nginx postgresql postgresql-contrib certbot python3-certbot-nginx ufw

# PM2 globale  
npm install -g pm2@latest

# Utente app
useradd -m -s /bin/bash highlander 2>/dev/null || true
mkdir -p /home/highlander/{app,logs}
chown -R highlander:highlander /home/highlander

# Database
DB_PASS=$(openssl rand -base64 20)
echo "$DB_PASS" > /root/.db_password
sudo -u postgres psql << PSQL
CREATE DATABASE highlander_prod;
CREATE USER highlander_db WITH PASSWORD '$DB_PASS';
GRANT ALL PRIVILEGES ON DATABASE highlander_prod TO highlander_db;
PSQL

# App setup
cd /home/highlander/app
tar -xzf /tmp/highlander.tar.gz

# Env file
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
chown -R highlander:highlander /home/highlander/app

# Build e db
sudo -u highlander npm ci --production
sudo -u highlander npm run build
sudo -u highlander npm run db:push

# Nginx
cat > /etc/nginx/sites-available/highlandergame.it << NGINXEOF
server {
    listen 80;
    server_name highlandergame.it www.highlandergame.it;
    return 301 https://\$server_name\$request_uri;
}
server {
    listen 443 ssl http2;
    server_name highlandergame.it www.highlandergame.it;
    ssl_certificate /etc/ssl/certs/ssl-cert-snakeoil.pem;
    ssl_certificate_key /etc/ssl/private/ssl-cert-snakeoil.key;
    location / {
        proxy_pass http://localhost:3000;
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
    }
}
NGINXEOF

ln -sf /etc/nginx/sites-available/highlandergame.it /etc/nginx/sites-enabled/
rm -f /etc/nginx/sites-enabled/default
nginx -t && systemctl restart nginx

# Firewall
ufw --force reset
ufw default deny incoming
ufw default allow outgoing
ufw allow 22,80,443/tcp
ufw --force enable

# SSL
certbot --nginx -d highlandergame.it -d www.highlandergame.it --non-interactive --agree-tos --email admin@highlandergame.it || true

# Start app
cd /home/highlander/app
sudo -u highlander pm2 start ecosystem.config.js --env production
sudo -u highlander pm2 save
pm2 startup systemd -u highlander --hp /home/highlander

echo "SETUP COMPLETATO"
echo "Password DB: $DB_PASS"
SERVEREOF

chmod +x server-setup.sh

echo ""
echo "File preparati per deployment:"
echo "- highlander.tar.gz (applicazione)"  
echo "- server-setup.sh (script setup)"
echo ""
echo "PROSSIMI PASSI:"
echo "1. Copia i file sul server:"
echo "   scp highlander.tar.gz server-setup.sh root@78.47.123.128:/tmp/"
echo ""
echo "2. Connettiti al server ed esegui:"
echo "   ssh root@78.47.123.128"
echo "   cd /tmp && ./server-setup.sh"
echo ""
echo "3. Configura DNS:"
echo "   A    highlandergame.it       78.47.123.128"
echo "   A    www.highlandergame.it   78.47.123.128"
echo ""

# Cleanup
# rm -f highlander.tar.gz server-setup.sh