# Guida Sicurezza Highlander - Server Hetzner

## Panoramica Sicurezza

Il deployment implementa multiple layer di sicurezza per proteggere l'applicazione e i dati degli utenti.

## Architettura Sicurezza

### 1. Separazione Privilegi

**Utente Applicazione**
- Nome: `highlander`
- Privilegi: Limitati, no sudo
- Directory: `/home/highlander/`
- Gruppo dedicato: `highlander-app`

**Utente Database**
- Nome: `highlander_db`
- Database: `highlander_prod`
- Privilegi: Solo necessari per l'applicazione
- Password: Generata automaticamente (32 caratteri)

### 2. Hardening SSH

**Configurazioni Applicate:**
- Porta personalizzata: `2222` (non standard)
- Root login: DISABILITATO
- Password authentication: DISABILITATA
- Solo autenticazione a chiave pubblica
- MaxAuthTries: 3
- LoginGraceTime: 30 secondi

**Connessione:**
```bash
ssh -p 2222 highlander@[IP-SERVER]
```

### 3. Firewall (UFW)

**Regole Implementate:**
- Default: DENY incoming, ALLOW outgoing
- SSH: Porta 2222 con rate limiting
- HTTP: Porta 80 (redirect HTTPS)
- HTTPS: Porta 443
- PostgreSQL: Solo connessioni locali (127.0.0.1)
- Blocco porte comuni di attacco (22, 3389, 1433, 3306)

### 4. Fail2Ban

**Protezioni Attive:**
- SSH brute force: 3 tentativi → ban 2 ore
- Nginx rate limiting: 10 tentativi → ban 1 ora
- HTTP auth failures: 5 tentativi → ban 1 ora
- Email notifiche: admin@highlandergame.it

### 5. Nginx Security

**Security Headers:**
```
Strict-Transport-Security: HSTS abilitato
X-Frame-Options: DENY (anti-clickjacking)
X-Content-Type-Options: nosniff
X-XSS-Protection: Protezione XSS
Content-Security-Policy: CSP restrittivo
Referrer-Policy: Controllo referrer
```

**Rate Limiting:**
- API generiche: 10 req/sec con burst 20
- Login endpoint: 3 req/min con burst 5

### 6. SSL/TLS

**Configurazione:**
- Certificati: Let's Encrypt automatici
- Protocolli: TLSv1.2, TLSv1.3
- Ciphers: Solo strong encryption
- HSTS: Preload abilitato
- Auto-renewal: Crontab daily check

### 7. Database Security

**PostgreSQL Hardening:**
- Utente dedicato con privilegi minimi
- Connessioni solo da localhost
- Password forte generata automaticamente
- Encoding UTF-8 con collate italiano
- Backup automatici con retention 7 giorni

### 8. Applicazione Security

**Node.js/PM2:**
- Esecuzione con utente non privilegiato
- Memory limit: 512MB per processo
- Cluster mode: 2 processi
- Auto-restart con rate limiting
- Log separati per errori e output

**Environment Variables:**
- File .env con permessi 600
- SESSION_SECRET generato automaticamente
- Database URL con credenziali sicure

### 9. Monitoraggio

**Sistema di Alert:**
- Disk usage > 80%: Warning
- Memory usage > 85%: Warning
- Applicazione offline: Error
- Check ogni 5 minuti
- Log in `/home/highlander/logs/monitor.log`

### 10. Backup Automatici

**Schedulazione:**
- Database: Ogni notte alle 02:00
- Applicazione: Ogni notte alle 02:00
- Retention: 7 giorni
- Compressione: gzip
- Log backup activity

## Configurazioni File

### `/etc/ssh/sshd_config`
```
Port 2222
PermitRootLogin no
PasswordAuthentication no
PubkeyAuthentication yes
MaxAuthTries 3
AllowUsers highlander
```

### `/etc/fail2ban/jail.local`
```
[sshd]
port = 2222
maxretry = 3
bantime = 7200

[nginx-limit-req]
maxretry = 10
bantime = 3600
```

### `/etc/nginx/sites-available/highlandergame.it`
- Rate limiting configurato
- Security headers completi
- SSL optimized
- Gzip compression

## Procedure Operative

### Connessione Sicura
```bash
# Connessione SSH
ssh -p 2222 highlander@[IP-SERVER]

# Monitoring applicazione
pm2 status
pm2 logs highlander

# Monitoring sistema
htop
df -h
fail2ban-client status
```

### Gestione Applicazione
```bash
# Restart applicazione
pm2 restart highlander

# Deploy nuova versione
cd /home/highlander/app
git pull origin main
npm ci --production
pm2 reload highlander
```

### Backup Manuale
```bash
# Database backup
sudo -u highlander /home/highlander/backup.sh

# Verifica backup
ls -la /home/highlander/backups/
```

### Verifica Sicurezza
```bash
# Check firewall
sudo ufw status verbose

# Check SSL
ssl-checker -s highlandergame.it:443

# Check fail2ban
sudo fail2ban-client status
sudo fail2ban-client status sshd

# Check processi
ps aux | grep highlander
```

## Incident Response

### Applicazione Offline
1. Verifica status PM2: `pm2 status`
2. Check log errori: `pm2 logs highlander --err`
3. Verifica risorse: `htop` e `df -h`
4. Restart se necessario: `pm2 restart highlander`

### Attacco Brute Force
1. Check Fail2Ban: `fail2ban-client status sshd`
2. Verifica log: `tail -f /var/log/auth.log`
3. Ban manuale se necessario: `fail2ban-client set sshd banip [IP]`

### Problemi SSL
1. Check certificato: `certbot certificates`
2. Rinnovo manuale: `certbot renew --force-renewal`
3. Restart Nginx: `systemctl restart nginx`

### Database Issues
1. Check connessione: `sudo -u postgres psql -l`
2. Verifica spazio: `du -sh /var/lib/postgresql/`
3. Backup di emergenza prima di interventi

## Compliance e Best Practices

### GDPR Compliance
- Dati utenti crittografati in database
- Session management sicuro
- Email verification con token temporanei
- Backup con retention limitata

### Security Standards
- OWASP Top 10 mitigations
- CIS Ubuntu 22.04 benchmark
- Let's Encrypt SSL best practices
- Node.js security best practices

### Performance Security
- Rate limiting per prevenire DoS
- Gzip compression per ridurre bandwidth
- Static file caching con headers sicuri
- Memory limits per prevenire memory leaks

## Aggiornamenti Sicurezza

### Sistema Operativo
```bash
# Update mensile raccomandato
apt update && apt upgrade -y
reboot
```

### Applicazione
```bash
# Verifica vulnerabilità NPM
npm audit
npm audit fix

# Update dipendenze
npm update
```

### Certificati SSL
- Auto-renewal configurato
- Monitoring scadenza certificati
- Backup certificati prima del rinnovo

## Contatti Emergenza

- **Sistema**: Monitoring automatico attivo
- **Email alert**: admin@highlandergame.it
- **Log path**: `/home/highlander/logs/`
- **Backup path**: `/home/highlander/backups/`

Questa configurazione garantisce un livello di sicurezza enterprise per l'applicazione Highlander.