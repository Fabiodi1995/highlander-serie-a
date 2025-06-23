#!/bin/bash

# Deploy completo con fix login
# Configura variabili
SERVER_IP="YOUR_SERVER_IP"  # Sostituisci con IP Hetzner
SERVER_USER="root"
APP_DIR="/home/highlander/app"

echo "Preparazione deploy con fix login..."

# Verifica connessione server
if ! ping -c 1 $SERVER_IP &> /dev/null; then
    echo "Errore: Server non raggiungibile. Verifica SERVER_IP in questo script."
    exit 1
fi

# Crea pacchetto deployment escludendo file non necessari
tar --exclude='node_modules' \
    --exclude='.git' \
    --exclude='dist' \
    --exclude='build' \
    --exclude='*.log' \
    --exclude='.env*' \
    --exclude='backup*' \
    --exclude='uploads' \
    --exclude='*.tar.gz' \
    --exclude='.cache' \
    --exclude='tmp' \
    -czf deploy-package.tar.gz .

echo "Pacchetto creato: $(ls -lh deploy-package.tar.gz | awk '{print $5}')"

# Trasferisce pacchetto
echo "Trasferimento al server..."
scp deploy-package.tar.gz $SERVER_USER@$SERVER_IP:/tmp/

# Esegue deploy sul server
echo "Esecuzione deploy sul server..."
ssh $SERVER_USER@$SERVER_IP << 'DEPLOY_SCRIPT'
set -e

echo "=== DEPLOY HIGHLANDER CON FIX LOGIN ==="

# Variabili
APP_DIR="/home/highlander/app"
BACKUP_DIR="/home/highlander/app_backup_$(date +%Y%m%d_%H%M%S)"
DEPLOY_DIR="/home/highlander/app_deploy"

# Backup app esistente
if [ -d "$APP_DIR" ]; then
    echo "Creazione backup in $BACKUP_DIR"
    cp -r $APP_DIR $BACKUP_DIR
    
    # Salva configurazione
    if [ -f "$APP_DIR/.env" ]; then
        cp "$APP_DIR/.env" /tmp/app_env_backup
    fi
fi

# Ferma applicazione
echo "Stop applicazione..."
pm2 stop highlander 2>/dev/null || true

# Prepara directory deploy
rm -rf $DEPLOY_DIR
mkdir -p $DEPLOY_DIR
cd $DEPLOY_DIR

# Estrae nuovo codice
echo "Estrazione codice..."
tar -xzf /tmp/deploy-package.tar.gz

# Ripristina .env se esiste
if [ -f "/tmp/app_env_backup" ]; then
    cp /tmp/app_env_backup .env
    rm /tmp/app_env_backup
fi

# Installa dipendenze
echo "Installazione dipendenze..."
npm ci --production=false

# Build applicazione
echo "Build applicazione..."
npm run build

# Sostituisce app
echo "Sostituzione app..."
if [ -d "$APP_DIR" ]; then
    rm -rf $APP_DIR
fi
mv $DEPLOY_DIR $APP_DIR

# Corregge permessi
chown -R highlander:highlander $APP_DIR

# Riavvia applicazione
echo "Riavvio applicazione..."
cd $APP_DIR
pm2 start ecosystem.config.js --name highlander 2>/dev/null || pm2 restart highlander

# Attende avvio
sleep 5

# Verifica stato
if pm2 list | grep -q "highlander.*online"; then
    echo "=== DEPLOY COMPLETATO CON SUCCESSO ==="
    echo "App disponibile: https://highlandergame.it"
    echo "Backup salvato: $BACKUP_DIR"
    
    # Test rapido endpoint
    if curl -f -s https://highlandergame.it > /dev/null; then
        echo "Test endpoint: OK"
    else
        echo "Warning: Endpoint non risponde"
    fi
    
    # Cleanup vecchi backup (mantiene ultimi 5)
    cd /home/highlander
    ls -t app_backup_* 2>/dev/null | tail -n +6 | xargs rm -rf 2>/dev/null || true
    
else
    echo "=== ERRORE DEPLOY - RIPRISTINO BACKUP ==="
    pm2 stop highlander 2>/dev/null || true
    
    if [ -d "$BACKUP_DIR" ]; then
        rm -rf $APP_DIR
        mv $BACKUP_DIR $APP_DIR
        cd $APP_DIR
        pm2 start highlander
        echo "Backup ripristinato"
    fi
    
    echo "Log errori:"
    pm2 logs highlander --lines 10
    exit 1
fi

# Cleanup
rm -f /tmp/deploy-package.tar.gz

echo "=== DEPLOY TERMINATO ==="
DEPLOY_SCRIPT

# Cleanup locale
rm deploy-package.tar.gz

echo ""
echo "Deploy completato!"
echo ""
echo "Prossimi passi:"
echo "1. Testa login su https://highlandergame.it"
echo "2. Verifica reset password"
echo "3. Controlla funzionalità app"
echo ""
echo "Per verificare stato server:"
echo "ssh $SERVER_USER@$SERVER_IP 'pm2 list && pm2 logs highlander --lines 5'"