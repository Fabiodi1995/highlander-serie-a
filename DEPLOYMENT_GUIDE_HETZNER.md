# Guida Deployment Hetzner - Highlander Serie A

## Panoramica
Questa guida ti accompagna nel deployment dell'applicazione Highlander su un server Hetzner con il dominio `highlandergame.it`.

## Prerequisiti

### 1. Server Hetzner
- Server Ubuntu 22.04 LTS
- Minimo 2GB RAM, 1 vCPU
- Accesso root SSH configurato
- IP pubblico statico

### 2. Dominio
- `highlandergame.it` registrato e gestito
- Accesso al pannello DNS del provider
- Email `support@highlandergame.it` creata

### 3. Locale
- Git installato
- SSH client
- Node.js 20+ (per build locale)

## Passaggi di Deployment

### Passo 1: Preparazione DNS
Prima del deployment, configura i record DNS:

```bash
# Verifica DNS attuale
nslookup highlandergame.it

# Configura record A nel pannello DNS
# A    @      [IP_SERVER_HETZNER]
# A    www    [IP_SERVER_HETZNER]
```

### Passo 2: Verifica Pre-deployment
```bash
# Esegui controlli preliminari
./deploy/pre-deployment-check.sh
```

### Passo 3: Deployment Automatico
```bash
# Sostituisci con il tuo IP server
./deploy/hetzner-deploy.sh 95.217.123.456 highlandergame.it
```

### Passo 4: Configurazione Post-deployment

#### Configura Password Email
```bash
# Connettiti al server
ssh root@95.217.123.456

# Modifica configurazione email
nano /home/highlander/app/.env

# Aggiorna queste righe:
SMTP_PASSWORD=la_tua_password_email_reale
SESSION_SECRET=genera_una_chiave_sicura_qui
```

#### Configura Password Database
```bash
# Cambia password database
sudo -u postgres psql
ALTER USER highlander_user PASSWORD 'nuova_password_sicura';
\q

# Aggiorna .env
nano /home/highlander/app/.env
# DATABASE_URL=postgresql://highlander_user:nuova_password_sicura@localhost:5432/highlander
```

#### Riavvia Applicazione
```bash
cd /home/highlander/app
sudo -u highlander pm2 restart highlander
```

### Passo 5: Verifica Deployment

#### Test Connettività
```bash
# Test HTTP/HTTPS
curl -I https://highlandergame.it
curl -I http://highlandergame.it

# Verifica redirect HTTP → HTTPS
curl -L http://highlandergame.it
```

#### Test Email
1. Accedi al sito
2. Registra nuovo account
3. Verifica ricezione email di conferma

#### Test Performance
```bash
# Monitor risorse server
htop
pm2 monit

# Log applicazione
pm2 logs highlander
```

## Struttura File Server

```
/home/highlander/
├── app/                    # Applicazione
│   ├── server/            # Backend
│   ├── client/            # Frontend (build)
│   ├── .env              # Configurazione produzione
│   └── ecosystem.config.js
├── logs/                  # Log applicazione
│   ├── out.log
│   ├── err.log
│   └── combined.log
└── app_backup_*/          # Backup automatici
```

## Monitoraggio e Manutenzione

### Comandi Utili
```bash
# Status applicazione
pm2 status

# Restart applicazione
pm2 restart highlander

# View logs in tempo reale
pm2 logs highlander --lines 50

# Monitor risorse
pm2 monit

# Backup database
pg_dump -U highlander_user highlander > backup_$(date +%Y%m%d).sql
```

### SSL e Certificati
```bash
# Verifica certificato SSL
certbot certificates

# Rinnovo manuale
certbot renew

# Test auto-renewal
certbot renew --dry-run
```

### Backup Automatico
Configura crontab per backup periodici:

```bash
# Edita crontab
crontab -e

# Aggiungi queste righe:
# Backup database ogni notte alle 2:00
0 2 * * * pg_dump -U highlander_user highlander > /home/highlander/backup_db_$(date +\%Y\%m\%d).sql

# Cleanup backup vecchi (mantieni 7 giorni)
0 3 * * * find /home/highlander/backup_db_* -mtime +7 -delete
```

## Troubleshooting

### Applicazione Non Risponde
```bash
# Verifica status PM2
pm2 status

# Restart completo
pm2 delete highlander
pm2 start ecosystem.config.js

# Verifica log errori
pm2 logs highlander --err
```

### Errori Database
```bash
# Verifica connessione PostgreSQL
sudo -u postgres psql -c "\l"

# Test connessione app
sudo -u highlander psql -U highlander_user -d highlander -c "SELECT version();"

# Restart PostgreSQL
systemctl restart postgresql
```

### Problemi SSL
```bash
# Verifica certificato
openssl x509 -in /etc/letsencrypt/live/highlandergame.it/fullchain.pem -text

# Rinnovo forzato
certbot --force-renewal -d highlandergame.it -d www.highlandergame.it
```

### Email Non Funzionanti
```bash
# Test SMTP
telnet send.one.com 587

# Verifica configurazione
cat /home/highlander/app/.env | grep SMTP

# Test invio email dall'app
curl -X POST https://highlandergame.it/api/resend-verification \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com"}'
```

## Sicurezza

### Firewall
```bash
# Verifica regole UFW
ufw status

# Aggiorna se necessario
ufw allow 22
ufw allow 80
ufw allow 443
ufw enable
```

### Aggiornamenti Sistema
```bash
# Aggiorna pacchetti
apt update && apt upgrade -y

# Aggiorna Node.js se necessario
npm install -g n
n latest
```

### Monitoraggio Accessi
```bash
# Log accessi SSH
tail -f /var/log/auth.log

# Log accessi web
tail -f /var/log/nginx/access.log
```

## Performance Optimization

### Nginx Cache
Aggiungi cache per static assets:

```nginx
location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg)$ {
    expires 1y;
    add_header Cache-Control "public, immutable";
    proxy_pass http://localhost:3000;
}
```

### Database Tuning
```sql
-- Ottimizza PostgreSQL per piccole applicazioni
ALTER SYSTEM SET shared_buffers = '256MB';
ALTER SYSTEM SET effective_cache_size = '1GB';
SELECT pg_reload_conf();
```

## Aggiornamenti Applicazione

### Deploy Nuova Versione
```bash
# Sul tuo computer locale
git push origin main

# Sul server
cd /home/highlander/app
git pull origin main
npm ci --production
pm2 restart highlander
```

### Rollback
```bash
# Ripristina backup precedente
cd /home/highlander
pm2 stop highlander
mv app app_broken
mv app_backup_YYYYMMDD_HHMMSS app
cd app
pm2 start ecosystem.config.js
```

## Contatti e Supporto

- **Server**: Hetzner Cloud
- **Dominio**: highlandergame.it  
- **Email**: support@highlandergame.it
- **Repository**: GitHub (configurato durante setup)

Per supporto tecnico, consulta i log dell'applicazione e del sistema per identificare la causa dei problemi.