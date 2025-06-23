#!/bin/bash

# Deploy diretto del fix login su server Hetzner
SERVER_IP="78.47.123.128"

echo "Applicazione diretta fix login su server..."

# Crea pacchetto con codice aggiornato
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
    --exclude='.replit' \
    --exclude='replit.nix' \
    -czf fix-package.tar.gz .

# Deploy sul server
ssh root@$SERVER_IP << 'EOF'
set -e

cd /home/highlander/app

# Backup
cp .env .env.backup 2>/dev/null || true
pm2 stop highlander 2>/dev/null || true

# Ricevi e applica aggiornamento
if [ -f /tmp/fix-package.tar.gz ]; then
    tar -xzf /tmp/fix-package.tar.gz
    rm /tmp/fix-package.tar.gz
fi

# Ripristina configurazione
cp .env.backup .env 2>/dev/null || true

# Build
npm run build

# Riavvia
pm2 start highlander 2>/dev/null || pm2 restart highlander

sleep 3
if pm2 list | grep -q "highlander.*online"; then
    echo "Fix applicato con successo"
    echo "Test: https://highlandergame.it"
else
    echo "Errore applicazione fix"
    pm2 logs highlander --lines 10
fi
EOF

# Cleanup
rm fix-package.tar.gz

echo "Deploy completato"