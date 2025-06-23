#!/bin/bash
# Setup completo server Hetzner per Highlander
set -e

echo "INSTALLAZIONE HIGHLANDER SU HETZNER"

# Update sistema
apt update && apt upgrade -y

# Installa Node.js 20
curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
apt-get install -y nodejs

# Installa servizi
apt install -y nginx postgresql postgresql-contrib certbot python3-certbot-nginx ufw git

# PM2
npm install -g pm2@latest

# Utente app
useradd -m -s /bin/bash highlander 2>/dev/null || true
mkdir -p /home/highlander/{app,logs}

# Database
DB_PASS=$(openssl rand -base64 20)
echo "$DB_PASS" > /root/.db_password
chmod 600 /root/.db_password

sudo -u postgres psql << EOF
CREATE DATABASE highlander_prod;
CREATE USER highlander_db WITH PASSWORD '$DB_PASS';
GRANT ALL PRIVILEGES ON DATABASE highlander_prod TO highlander_db;
EOF

echo "Database configurato con password: $DB_PASS"

# Clone repository
cd /home/highlander
git clone https://github.com/tuousername/highlander-serie-a.git app || {
    # Se non hai git, crea struttura manuale
    mkdir -p app
    echo "Copia manuale necessaria"
}

cd app

# File .env
cat > .env << EOF
DATABASE_URL=postgresql://highlander_db:$DB_PASS@localhost:5432/highlander_prod
SMTP_USER=support@highlandergame.it
SMTP_PASSWORD=Calibro9!
SESSION_SECRET=$(openssl rand -base64 32)
NODE_ENV=production
PORT=3000
BASE_URL=https://highlandergame.it
EOF

chmod 600 .env
chown -R highlander:highlander /home/highlander

# Se hai i file del progetto qui, installa
if [ -f "package.json" ]; then
    sudo -u highlander npm ci --production
    sudo -u highlander npm run build
    sudo -u highlander npm run db:push
fi

# Nginx config
cat > /etc/nginx/sites-available/highlandergame.it << 'NGINXEOF'
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
    
    add_header Strict-Transport-Security "max-age=31536000" always;
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
NGINXEOF

# Abilita sito
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

# SSL con Let's Encrypt
certbot --nginx -d highlandergame.it -d www.highlandergame.it \
    --non-interactive --agree-tos --email admin@highlandergame.it || echo "SSL setup manuale necessario"

# Autostart SSL renewal
echo "0 12 * * * /usr/bin/certbot renew --quiet" | crontab -

echo ""
echo "SETUP COMPLETATO"
echo "Password database salvata in: /root/.db_password"
echo ""
echo "PROSSIMI PASSI:"
echo "1. Copia file applicazione in /home/highlander/app"
echo "2. Installa dipendenze: cd /home/highlander/app && npm ci --production"
echo "3. Build app: npm run build"
echo "4. Init DB: npm run db:push"
echo "5. Start app: sudo -u highlander pm2 start ecosystem.config.js --env production"
echo "6. Save PM2: sudo -u highlander pm2 save"
echo "7. Setup autostart: pm2 startup systemd -u highlander --hp /home/highlander"
echo ""