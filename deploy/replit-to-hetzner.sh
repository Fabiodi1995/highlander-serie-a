#!/bin/bash

# Deploy diretto da Replit a Hetzner
# Sostituisci YOUR_SERVER_IP con l'IP del tuo server

SERVER_IP="YOUR_SERVER_IP"
SERVER_USER="root"
APP_DIR="/home/highlander/app"

echo "Deploy da Replit a Hetzner..."

# Crea archivio del codice (escludendo file non necessari)
tar --exclude='node_modules' \
    --exclude='.git' \
    --exclude='dist' \
    --exclude='*.log' \
    --exclude='.env' \
    --exclude='backup' \
    --exclude='uploads' \
    -czf highlander-deploy.tar.gz .

echo "Archivio creato: $(du -h highlander-deploy.tar.gz)"

# Trasferisce archivio al server
scp highlander-deploy.tar.gz $SERVER_USER@$SERVER_IP:/tmp/

# Esegue deploy sul server
ssh $SERVER_USER@$SERVER_IP << 'EOF'
set -e

echo "Inizio deploy sul server..."

# Backup dell'app esistente
if [ -d "/home/highlander/app" ]; then
    cp -r /home/highlander/app /home/highlander/app_backup_$(date +%Y%m%d_%H%M%S)
    echo "Backup creato"
fi

# Backup del file .env
if [ -f "/home/highlander/app/.env" ]; then
    cp /home/highlander/app/.env /tmp/env_backup
fi

# Ferma applicazione
pm2 stop highlander 2>/dev/null || true

# Estrae nuovo codice
cd /home/highlander
rm -rf app_new
mkdir app_new
cd app_new
tar -xzf /tmp/highlander-deploy.tar.gz

# Ripristina .env se esiste
if [ -f "/tmp/env_backup" ]; then
    cp /tmp/env_backup .env
    rm /tmp/env_backup
fi

# Installa dipendenze
npm install

# Build
npm run build

# Sostituisce app esistente
cd /home/highlander
rm -rf app_old
if [ -d "app" ]; then
    mv app app_old
fi
mv app_new app

# Cambia proprietario
chown -R highlander:highlander app

# Riavvia applicazione
cd app
pm2 start ecosystem.config.js --name highlander 2>/dev/null || pm2 restart highlander

# Verifica
sleep 3
if pm2 list | grep -q "highlander.*online"; then
    echo "Deploy completato con successo"
    echo "App disponibile su: https://highlandergame.it"
    
    # Rimuove backup temporaneo se deploy ok
    rm -rf app_old 2>/dev/null || true
else
    echo "Errore nel deploy - ripristino backup"
    pm2 stop highlander 2>/dev/null || true
    if [ -d "app_old" ]; then
        rm -rf app
        mv app_old app
        pm2 start highlander
    fi
    exit 1
fi

# Cleanup
rm /tmp/highlander-deploy.tar.gz
EOF

# Cleanup locale
rm highlander-deploy.tar.gz

echo "Deploy completato!"
EOF