#!/bin/bash

# Deploy immediato: Replit → GitHub → Hetzner con fix login
# Repository: https://github.com/Fabiodi1995/highlander-serie-a

set -e

REPO_URL="https://github.com/Fabiodi1995/highlander-serie-a.git"
TEMP_DIR="/tmp/highlander-deploy-$(date +%s)"
SERVER_IP="78.47.123.128"

echo "Deploy immediato con fix login..."

# Verifica che sia fornito l'IP del server
if [[ "$SERVER_IP" == "YOUR_HETZNER_IP" ]]; then
    echo "ERRORE: Modifica SERVER_IP in questo script con l'IP del server Hetzner"
    exit 1
fi

# FASE 1: Prepara codice
echo "Preparazione codice..."
mkdir -p $TEMP_DIR
cd $TEMP_DIR

# Crea archivio del codice corrente
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
    -czf code.tar.gz -C /home/runner/workspace .

# FASE 2: Push su GitHub
echo "Push su GitHub..."
git clone $REPO_URL repo
cd repo

# Backup files importanti
if [ -f "README.md" ]; then cp README.md README.backup; fi
if [ -f ".gitignore" ]; then cp .gitignore gitignore.backup; fi

# Sostituisci tutto il contenuto
find . -mindepth 1 -maxdepth 1 ! -name '.git' -exec rm -rf {} +
tar -xzf ../code.tar.gz

# Ripristina files se necessario
if [ -f "README.backup" ] && [ ! -f "README.md" ]; then
    mv README.backup README.md
fi
if [ -f "gitignore.backup" ] && [ ! -f ".gitignore" ]; then
    mv gitignore.backup .gitignore
fi

# Commit e push
git config user.name "Fabio Di Costa"
git config user.email "dicostafabio1995@gmail.com"
git add .
git commit -m "Deploy automatico con fix login - $(date '+%Y-%m-%d %H:%M:%S')"
git push origin main

echo "Codice pushato su GitHub"

# FASE 3: Deploy su server
echo "Deploy su server Hetzner..."

ssh root@$SERVER_IP << 'DEPLOY'
set -e

cd /home/highlander/app

# Backup configurazione
cp .env .env.backup 2>/dev/null || true

# Ferma applicazione
pm2 stop highlander 2>/dev/null || true

# Configura repository se necessario
if ! git remote get-url origin &>/dev/null; then
    git init
    git config user.name "Highlander Deploy"
    git config user.email "deploy@highlandergame.it"
    git remote add origin https://github.com/Fabiodi1995/highlander-serie-a.git
fi

# Pull modifiche
git fetch origin
git reset --hard origin/main

# Ripristina configurazione
cp .env.backup .env 2>/dev/null || true

# Installa dipendenze
npm install

# Build con fix login
npm run build

# Riavvia applicazione
pm2 start ecosystem.config.js --name highlander 2>/dev/null || pm2 restart highlander

# Verifica
sleep 5
if pm2 list | grep -q "highlander.*online"; then
    echo "Deploy completato con successo"
    echo "App disponibile: https://highlandergame.it"
    echo "Fix login applicato"
else
    echo "Errore deploy"
    pm2 logs highlander --lines 10
    exit 1
fi
DEPLOY

# FASE 4: Configura webhook (se non fatto)
echo "Configurazione webhook automatico..."

ssh root@$SERVER_IP << 'WEBHOOK'
# Controlla se webhook già configurato
if ! systemctl is-active --quiet highlander-webhook; then
    echo "Configurazione webhook GitHub..."
    cd /home/highlander/app
    chmod +x deploy/complete-setup.sh
    ./deploy/complete-setup.sh
else
    echo "Webhook già configurato"
fi
WEBHOOK

# Cleanup
cd /
rm -rf $TEMP_DIR

echo ""
echo "=== DEPLOY COMPLETATO ==="
echo "Repository GitHub: https://github.com/Fabiodi1995/highlander-serie-a"
echo "Produzione: https://highlandergame.it"
echo "Fix login applicato e testabile"
echo ""
echo "Prossimi deploy: automatici via webhook GitHub"
echo "Deploy manuale: ssh root@$SERVER_IP 'cd /home/highlander/app && ./auto-deploy.sh'"