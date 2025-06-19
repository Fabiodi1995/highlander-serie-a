# Guida Completa Deploy Highlander App

## RIASSUNTO DEPLOY SUL TUO SERVER

### 🎯 Cosa Hai a Disposizione
- **Configurazione Docker completa** con Nginx, PostgreSQL e App
- **Script automatizzati** per installazione, deploy e monitoraggio
- **SSL automatico** con Let's Encrypt
- **Backup automatici** e monitoraggio sistema
- **PWA pronta** per installazione mobile

---

## 📋 CHECKLIST PRE-DEPLOY

### 1. Requisiti Server
- [ ] Ubuntu 20.04+ / Debian 11+ / CentOS 8+
- [ ] Minimo 2GB RAM, 20GB disco
- [ ] Dominio configurato (DNS A record verso IP server)
- [ ] Accesso SSH root/sudo

### 2. Servizi Esterni
- [ ] **SendGrid API Key** (gratuito: 25.000 email/mese)
- [ ] **Database PostgreSQL** (opzionale: puoi usare quello incluso)

---

## 🚀 PROCEDURA DEPLOY RAPIDA

### Step 1: Preparazione Server
```bash
# Connettiti al server
ssh user@tuoserver.com

# Installa tutto automaticamente
curl -O https://raw.githubusercontent.com/tuorepo/highlander/main/deploy/install-server.sh
chmod +x install-server.sh
./install-server.sh

# Riavvia server
sudo reboot
```

### Step 2: Download App
```bash
# Crea directory e scarica codice
sudo mkdir -p /opt/highlander
cd /opt/highlander
git clone https://github.com/tuorepo/highlander.git .
```

### Step 3: Configurazione
```bash
# Configura variabili
cp deploy/.env.production .env
nano .env

# Compila questi valori:
DATABASE_URL=postgresql://highlander:PASSWORD@postgres:5432/highlander_prod
SESSION_SECRET=CHIAVE-SEGRETA-ALMENO-32-CARATTERI
SENDGRID_API_KEY=SG.TUA-CHIAVE-SENDGRID
FROM_EMAIL=noreply@tuodominio.com
ALLOWED_ORIGINS=https://tuodominio.com
POSTGRES_PASSWORD=PASSWORD-SICURO
```

### Step 4: SSL e Deploy
```bash
# Configura SSL
sudo deploy/setup-ssl.sh tuodominio.com admin@tuodominio.com

# Aggiorna configurazione Nginx
sed -i 's/yourdomain.com/tuodominio.com/g' deploy/nginx.conf

# Deploy applicazione
sudo deploy/deploy.sh
```

### Step 5: Verifica
```bash
# Controlla stato
deploy/monitoring.sh status

# Test connessione
curl https://tuodominio.com/health
```

---

## 📧 SETUP EMAIL (SendGrid)

### 1. Account SendGrid
1. Registrati su sendgrid.com (gratuito)
2. Settings → API Keys → Create API Key
3. Selezioni "Restricted Access" con permessi Mail Send
4. Copia chiave in .env come SENDGRID_API_KEY

### 2. Verifica Dominio
1. Settings → Sender Authentication → Domain Authentication
2. Aggiungi record DNS forniti da SendGrid
3. Verifica configurazione

### 3. Test Email
```bash
# Test invio email
docker exec highlander-app npm run test:email
```

---

## 📱 INSTALLAZIONE MOBILE (PWA)

L'app è già configurata come PWA (Progressive Web App):

### Android
1. Apri https://tuodominio.com in Chrome
2. Menu → "Aggiungi alla schermata Home"
3. L'app apparirà come app nativa

### iPhone/iPad
1. Apri https://tuodominio.com in Safari
2. Tocca pulsante Condividi
3. "Aggiungi alla schermata Home"

### Vantaggi PWA
- Funziona offline
- Notifiche push
- Icona schermata home
- Esperienza app nativa
- Aggiornamenti automatici

---

## 🔧 COMANDI UTILI

### Gestione App
```bash
# Stato servizi
docker-compose ps

# Log app
docker-compose logs -f highlander-app

# Restart servizio
docker-compose restart highlander-app

# Aggiornamento
git pull && docker-compose build --no-cache && docker-compose up -d
```

### Monitoraggio
```bash
# Controllo completo
deploy/monitoring.sh full

# Solo risorse
deploy/monitoring.sh resources

# Backup manuale
deploy/monitoring.sh backup

# Pulizia sistema
deploy/monitoring.sh cleanup
```

### Database
```bash
# Backup
docker exec highlander-postgres pg_dump -U highlander highlander_prod > backup.sql

# Restore
docker exec -i highlander-postgres psql -U highlander -d highlander_prod < backup.sql

# Accesso diretto
docker exec -it highlander-postgres psql -U highlander -d highlander_prod
```

---

## 💰 COSTI STIMATI

### Hosting Base
- **VPS 2GB RAM**: €5-15/mese (Hetzner, DigitalOcean, Linode)
- **Dominio**: €10/anno
- **SSL**: Gratuito (Let's Encrypt)

### Servizi
- **SendGrid**: Gratuito (25k email/mese)
- **Database**: Incluso o Neon €0-20/mese
- **Backup**: €2-5/mese storage

**Totale: €7-25/mese** per fase beta

---

## 🚦 MONITORING AUTOMATICO

### Script Preconfigurati
- **Controllo stato**: ogni 15 minuti
- **Backup database**: ogni notte ore 2:00
- **Pulizia sistema**: ogni domenica ore 4:00
- **Renewal SSL**: automatico con Let's Encrypt

### Alert Disponibili
- App offline
- Database disconnesso
- Spazio disco basso
- SSL in scadenza
- Errori critici

---

## 🔒 SICUREZZA INCLUSA

### Protezioni Attive
- Rate limiting API e login
- HTTPS forzato
- Headers sicurezza
- Firewall configurato
- Container isolati
- Backup crittografati

### Best Practices
- Utenti non-root nei container
- Secrets in variabili ambiente
- Log rotation automatica
- Aggiornamenti automatici sistema

---

## 📈 PERFORMANCE

### Ottimizzazioni
- Gzip compression
- Cache static files
- Database connection pooling
- Container health checks
- Resource limits

### Metriche Target
- Response time: <200ms
- Uptime: >99.9%
- Database queries: <50ms
- Memory usage: <80%

---

## 🆘 SUPPORTO E TROUBLESHOOTING

### Log Principali
```bash
/var/log/highlander-monitor.log    # Monitoraggio
/var/log/highlander-backup.log     # Backup
/var/log/highlander-cleanup.log    # Pulizia
```

### Problemi Comuni

**App non raggiungibile**
```bash
docker-compose ps               # Verifica container
docker-compose logs highlander-app  # Log applicazione
netstat -tlnp | grep :80      # Verifica porte
```

**Database errori**
```bash
docker-compose logs postgres   # Log database
docker exec highlander-postgres pg_isready -U highlander
```

**SSL problemi**
```bash
sudo certbot certificates     # Stato certificati
sudo certbot renew --dry-run # Test renewal
```

Hai tutto pronto per il deploy! Quale parte vuoi implementare per prima?