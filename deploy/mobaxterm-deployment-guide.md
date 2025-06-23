# Deployment Highlander con MobaXterm

## Step 1: Preparazione File

1. **Scarica il progetto da Replit:**
   - Vai su Replit → Progetto Highlander
   - Clicca sui tre puntini → "Download as zip"
   - Estrai il ZIP in una cartella (es: `C:\highlander-project`)

## Step 2: Connessione SSH con MobaXterm

1. **Apri MobaXterm**
2. **Clicca "Session" → "SSH"**
3. **Inserisci i dati:**
   - Remote host: `78.47.123.128`
   - Username: `root`
   - Port: `22`
4. **Clicca "OK"**
5. **Inserisci password:** `Hetzner123!`

## Step 3: Upload del Progetto

1. **Nel pannello sinistro di MobaXterm:**
   - Naviga alla cartella dove hai estratto il progetto
   - Seleziona tutti i file (Ctrl+A)
   - Escludi manualmente: `node_modules`, `.git`, `attached_assets`, `backup`

2. **Drag & Drop:**
   - Trascina i file selezionati nella finestra SSH di MobaXterm
   - I file verranno caricati in `/root/`

## Step 4: Setup Server

Copia e incolla questi comandi uno per volta nel terminale MobaXterm:

```bash
# 1. Update sistema
apt update && apt upgrade -y
```

```bash
# 2. Installa Node.js 20
curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
apt-get install -y nodejs
```

```bash
# 3. Installa servizi necessari
apt install -y nginx postgresql postgresql-contrib certbot python3-certbot-nginx ufw
```

```bash
# 4. Installa PM2
npm install -g pm2@latest
```

```bash
# 5. Crea utente applicazione
useradd -m -s /bin/bash highlander
mkdir -p /home/highlander/{app,logs}
```

## Step 5: Setup Database

```bash
# 6. Genera password database
DB_PASS=$(openssl rand -base64 24)
echo "$DB_PASS" > /root/.db_password
chmod 600 /root/.db_password
echo "Password DB: $DB_PASS"
```

```bash
# 7. Configura PostgreSQL
sudo -u postgres psql << 'EOF'
DROP DATABASE IF EXISTS highlander_prod;
DROP USER IF EXISTS highlander_db;
CREATE DATABASE highlander_prod;
CREATE USER highlander_db WITH PASSWORD 'SOSTITUISCI_CON_PASSWORD_GENERATA';
GRANT ALL PRIVILEGES ON DATABASE highlander_prod TO highlander_db;
\q
EOF
```

**IMPORTANTE:** Sostituisci `SOSTITUISCI_CON_PASSWORD_GENERATA` con la password mostrata dal comando precedente.

## Step 6: Preparazione Applicazione

```bash
# 8. Sposta file applicazione
cd /home/highlander
rm -rf app
mkdir app
cd app
cp -r /root/* . 2>/dev/null || true
rm -rf node_modules .git attached_assets backup *.tar.gz
```

```bash
# 9. Crea file .env
cat > .env << 'EOF'
DATABASE_URL=postgresql://highlander_db:SOSTITUISCI_PASSWORD@localhost:5432/highlander_prod
SMTP_USER=support@highlandergame.it
SMTP_PASSWORD=Calibro9!
SESSION_SECRET=$(openssl rand -base64 32)
NODE_ENV=production
PORT=3000
BASE_URL=https://highlandergame.it
EOF
```

**IMPORTANTE:** Modifica la riga DATABASE_URL sostituendo `SOSTITUISCI_PASSWORD` con la password del database.

```bash
# 10. Imposta permessi
chmod 600 .env
chown -R highlander:highlander /home/highlander
```

## Step 7: Configurazione Nginx

```bash
# 11. Configura Nginx
cat > /etc/nginx/sites-available/highlandergame.it << 'EOF'
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
EOF
```

```bash
# 12. Configura proxy params
cat > /etc/nginx/proxy_params << 'EOF'
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
EOF
```

```bash
# 13. Abilita sito Nginx
ln -sf /etc/nginx/sites-available/highlandergame.it /etc/nginx/sites-enabled/
rm -f /etc/nginx/sites-enabled/default
nginx -t
systemctl restart nginx
systemctl enable nginx
```

## Step 8: Firewall

```bash
# 14. Configura firewall
ufw --force reset
ufw default deny incoming
ufw default allow outgoing
ufw allow 22/tcp
ufw allow 80/tcp
ufw allow 443/tcp
ufw allow from 127.0.0.1 to any port 5432
ufw --force enable
```

## Step 9: Installazione Applicazione

```bash
# 15. Installa dipendenze
cd /home/highlander/app
sudo -u highlander npm ci --production
```

```bash
# 16. Build applicazione
sudo -u highlander npm run build
```

```bash
# 17. Inizializza database
sudo -u highlander npm run db:push
```

## Step 10: SSL e Avvio

```bash
# 18. Configura SSL automatico
certbot --nginx -d highlandergame.it -d www.highlandergame.it \
    --non-interactive --agree-tos --email admin@highlandergame.it
```

```bash
# 19. Setup auto-renewal SSL
echo "0 12 * * * /usr/bin/certbot renew --quiet" | crontab -
```

```bash
# 20. Avvia applicazione
cd /home/highlander/app
sudo -u highlander pm2 start ecosystem.config.js --env production
sudo -u highlander pm2 save
```

```bash
# 21. Setup autostart
pm2 startup systemd -u highlander --hp /home/highlander
systemctl enable pm2-highlander
```

## Step 11: Verifica

```bash
# 22. Controlla status
sudo -u highlander pm2 status
```

```bash
# 23. Test applicazione
curl -I https://highlandergame.it
```

## Comandi Utili per Monitoraggio

```bash
# Log in tempo reale
sudo -u highlander pm2 logs highlander

# Restart applicazione
sudo -u highlander pm2 restart highlander

# Status servizi
systemctl status nginx
systemctl status postgresql

# Password database
cat /root/.db_password
```

## DNS da Configurare

Nel pannello del tuo provider DNS:
```
A    highlandergame.it       78.47.123.128
A    www.highlandergame.it   78.47.123.128
```

## Aggiornamenti Futuri

Per aggiornare l'applicazione:

1. Scarica nuovo ZIP da Replit
2. Upload con MobaXterm in `/tmp/`
3. Esegui:
```bash
sudo -u highlander pm2 stop highlander
cd /home/highlander/app
sudo -u highlander cp .env .env.backup
rm -rf * .[^.]*
cp -r /tmp/nuovo_progetto/* .
sudo -u highlander cp .env.backup .env
sudo -u highlander npm ci --production
sudo -u highlander npm run build
sudo -u highlander npm run db:push
sudo -u highlander pm2 start highlander
```