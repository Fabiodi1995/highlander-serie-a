# Guida Deployment Manuale Highlander

## Prerequisiti

Devi avere sul tuo computer:
- SSH client (presente su Windows 10+, Mac, Linux)
- Git configurato

## Passo 1: Download del Progetto

Scarica il progetto da Replit:

1. Vai su Replit
2. Clicca sui tre puntini del progetto
3. Seleziona "Download as zip"
4. Estrai il file zip sul tuo computer

## Passo 2: Script di Deployment

Crea un file `deploy-highlander.sh` sul tuo computer:

```bash
#!/bin/bash
# Deployment Highlander su Hetzner

SERVER_IP="78.47.123.128"
DOMAIN="highlandergame.it"

echo "DEPLOYMENT HIGHLANDER"

# 1. Crea archivio
tar -czf highlander.tar.gz \
    --exclude=node_modules \
    --exclude=.git \
    --exclude=*.log \
    --exclude=dist \
    --exclude=uploads \
    --exclude=attached_assets \
    --exclude=backup \
    .

# 2. Upload archivio
scp highlander.tar.gz root@$SERVER_IP:/tmp/

# 3. Setup server
ssh root@$SERVER_IP << 'EOF'
# Update sistema
apt update && apt upgrade -y

# Node.js 20
curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
apt-get install -y nodejs

# Servizi
apt install -y nginx postgresql postgresql-contrib certbot python3-certbot-nginx ufw

# PM2
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

# Preparazione app
cd /home/highlander
rm -rf app
mkdir app && cd app
tar -xzf /tmp/highlander.tar.gz

# File .env
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

# Nginx
cat > /etc/nginx/sites-available/highlandergame.it << 'NGINXEOF'
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
    
    ssl_certificate /etc/ssl/certs/ssl-cert-snakeoil.pem;
    ssl_certificate_key /etc/ssl/private/ssl-cert-snakeoil.key;
    
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains; preload" always;
    add_header X-Frame-Options DENY always;
    add_header X-Content-Type-Options nosniff always;
    add_header X-XSS-Protection "1; mode=block" always;
    
    gzip on;
    gzip_vary on;
    gzip_min_length 1024;
    gzip_types text/plain text/css application/json application/javascript text/xml application/xml text/javascript;
    
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
    
    location / {
        proxy_pass http://localhost:3000;
        include /etc/nginx/proxy_params;
        client_max_body_size 10M;
    }
    
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

# Installa app
sudo -u highlander npm ci --production
sudo -u highlander npm run build
sudo -u highlander npm run db:push

# SSL
certbot --nginx -d highlandergame.it -d www.highlandergame.it \
    --non-interactive --agree-tos --email admin@highlandergame.it

# Auto-renewal
echo "0 12 * * * /usr/bin/certbot renew --quiet" | crontab -

# Avvia app
sudo -u highlander pm2 start ecosystem.config.js --env production
sudo -u highlander pm2 save
pm2 startup systemd -u highlander --hp /home/highlander
systemctl enable pm2-highlander

echo "DEPLOYMENT COMPLETATO"
echo "Password DB: $(cat /root/.db_password)"
EOF

# Cleanup
rm -f highlander.tar.gz

echo "Deployment completato!"
echo "Sito: https://$DOMAIN"
```

## Passo 3: Esecuzione

Sul tuo computer:

1. Apri terminale nella directory del progetto
2. Rendi eseguibile lo script:
   ```bash
   chmod +x deploy-highlander.sh
   ```
3. Esegui il deployment:
   ```bash
   ./deploy-highlander.sh
   ```

## Passo 4: DNS

Configura questi record DNS:
```
A    highlandergame.it       78.47.123.128
A    www.highlandergame.it   78.47.123.128
```

## Monitoraggio

Dopo il deployment, controlla:

```bash
# Connettiti al server
ssh root@78.47.123.128

# Status applicazione
sudo -u highlander pm2 status

# Log in tempo reale
sudo -u highlander pm2 logs highlander

# Restart se necessario
sudo -u highlander pm2 restart highlander
```

## Aggiornamenti Futuri

Per aggiornare l'app:

```bash
# Crea nuovo archivio
tar -czf highlander-update.tar.gz --exclude=node_modules .

# Upload
scp highlander-update.tar.gz root@78.47.123.128:/tmp/

# Aggiorna
ssh root@78.47.123.128 << 'EOF'
sudo -u highlander pm2 stop highlander
cd /home/highlander/app
sudo -u highlander cp .env .env.backup
rm -rf * .[^.]*
sudo -u highlander tar -xzf /tmp/highlander-update.tar.gz
sudo -u highlander cp .env.backup .env
sudo -u highlander npm ci --production
sudo -u highlander npm run build
sudo -u highlander npm run db:push
sudo -u highlander pm2 start highlander
EOF
```