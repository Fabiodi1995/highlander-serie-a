# Deploy Highlander App in Produzione

## Prerequisiti Server

### Sistema Operativo
- Ubuntu 20.04+ / Debian 11+ / CentOS 8+
- Almeno 2GB RAM, 20GB spazio disco
- Accesso root o sudo

### Software Richiesto
```bash
# Docker & Docker Compose
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh
sudo usermod -aG docker $USER

# Docker Compose
sudo curl -L "https://github.com/docker/compose/releases/download/v2.21.0/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose
```

## Procedura di Deploy

### 1. Preparazione Server
```bash
# Crea directory applicazione
sudo mkdir -p /opt/highlander
cd /opt/highlander

# Scarica codice (sostituisci con il tuo repository)
git clone https://github.com/tuousername/highlander-app.git .
```

### 2. Configurazione
```bash
# Copia template configurazione
cp deploy/.env.production .env

# Modifica variabili d'ambiente
nano .env
```

**Variabili da configurare in .env:**
```bash
DATABASE_URL=postgresql://highlander:password@postgres:5432/highlander_prod
SESSION_SECRET=tua-chiave-segreta-almeno-32-caratteri
SENDGRID_API_KEY=tua-chiave-sendgrid
FROM_EMAIL=noreply@tuodominio.com
ALLOWED_ORIGINS=https://tuodominio.com,https://www.tuodominio.com
POSTGRES_PASSWORD=password-sicuro-database
```

### 3. Configurazione SSL
```bash
# Installa certificati SSL
chmod +x deploy/setup-ssl.sh
sudo ./deploy/setup-ssl.sh tuodominio.com admin@tuodominio.com
```

### 4. Aggiorna Nginx Config
```bash
# Modifica dominio in nginx.conf
sed -i 's/yourdomain.com/tuodominio.com/g' deploy/nginx.conf
```

### 5. Deploy Applicazione
```bash
# Rendi eseguibile script deploy
chmod +x deploy/deploy.sh

# Avvia deploy
sudo ./deploy/deploy.sh
```

## Comandi Utili

### Gestione Container
```bash
# Visualizza stato
docker-compose ps

# Logs applicazione
docker-compose logs -f highlander-app

# Logs database
docker-compose logs -f postgres

# Restart servizio
docker-compose restart highlander-app

# Backup database
docker exec highlander-postgres pg_dump -U highlander highlander_prod > backup.sql
```

### Monitoraggio
```bash
# Uso risorse
docker stats

# Spazio disco
df -h

# Log sistema
journalctl -u docker -f
```

## Configurazione Database Esterno

Se usi un database esterno (consigliato per produzione):

```bash
# Modifica docker-compose.yml - rimuovi sezione postgres
# Aggiorna DATABASE_URL con connessione esterna
DATABASE_URL=postgresql://user:pass@host:5432/dbname
```

## Backup e Restore

### Backup Automatico
```bash
# Aggiungi a crontab
0 2 * * * docker exec highlander-postgres pg_dump -U highlander highlander_prod > /backup/highlander_$(date +\%Y\%m\%d).sql
```

### Restore
```bash
# Da file backup
docker exec -i highlander-postgres psql -U highlander -d highlander_prod < backup.sql
```

## Aggiornamenti

```bash
# Pull nuova versione
git pull origin main

# Rebuild e restart
docker-compose build --no-cache
docker-compose up -d
```

## Troubleshooting

### App non raggiungibile
```bash
# Verifica container
docker-compose ps

# Verifica logs
docker-compose logs highlander-app

# Verifica porta
netstat -tlnp | grep :80
```

### Database connection error
```bash
# Verifica database
docker-compose logs postgres

# Test connessione
docker exec highlander-postgres psql -U highlander -d highlander_prod -c "SELECT 1;"
```

### SSL issues
```bash
# Rinnova certificato
sudo certbot renew

# Copia in container
sudo cp /etc/letsencrypt/live/tuodominio.com/*.pem /opt/highlander/ssl/
docker-compose restart nginx
```

## Performance Tuning

### Database
- Aumenta `shared_buffers` per database grandi
- Configura `max_connections` in base al carico
- Abilita query logging per debug

### Nginx
- Aumenta `worker_connections` per traffico alto
- Configura cache static files
- Abilita gzip compression

### Docker
- Limita memoria container se necessario
- Usa volume persistenti per dati importanti
- Monitora uso disco container