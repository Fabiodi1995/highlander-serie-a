# Istruzioni Deployment Highlander

## Informazioni Server
- **IP**: 78.47.123.128
- **Accesso**: root con password
- **Dominio**: highlandergame.it
- **Email**: support@highlandergame.it (password: Calibro9!)

## Deployment Rapido

### 1. Connetti al Server
```bash
ssh root@78.47.123.128
```

### 2. Scarica e Esegui Setup
```bash
curl -o setup.sh https://raw.githubusercontent.com/your-repo/deploy/server-install.sh
chmod +x setup.sh
./setup.sh
```

Oppure copia manualmente il contenuto di `deploy/server-install.sh` e eseguilo.

### 3. Upload Applicazione
Carica i file del progetto in `/home/highlander/app/` usando SCP o SFTP.

### 4. Finalizza Setup
```bash
cd /home/highlander/app
sudo -u highlander npm ci --production
sudo -u highlander npm run build
sudo -u highlander npm run db:push
sudo -u highlander pm2 start ecosystem.config.js --env production
sudo -u highlander pm2 save
pm2 startup systemd -u highlander --hp /home/highlander
systemctl enable pm2-highlander
```

### 5. Configura DNS
Nel pannello del provider DNS:
```
A    highlandergame.it       78.47.123.128
A    www.highlandergame.it   78.47.123.128
```

## Verifica
- Sito: https://highlandergame.it
- Status: `pm2 status`
- Log: `pm2 logs highlander`

## Sicurezza Implementata
- Utente `highlander` non privilegiato
- Firewall UFW attivo
- SSL Let's Encrypt
- Database con credenziali sicure
- Nginx con security headers

## Credenziali
- Database: highlander_db (password salvata in `/root/.db_password`)
- Email SMTP: support@highlandergame.it / Calibro9!