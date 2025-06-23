#!/bin/bash

# Workflow completo: Replit → GitHub → Hetzner
# Repository: https://github.com/Fabiodi1995/highlander-serie-a

set -e

REPO_URL="https://github.com/Fabiodi1995/highlander-serie-a.git"
SERVER_IP="78.47.123.128"
SERVER_USER="root"

echo "=== WORKFLOW DEPLOY COMPLETO ==="

# FASE 1: Sincronizza con GitHub
echo "FASE 1: Sincronizzazione GitHub..."

./deploy/sync-to-github.sh

if [ $? -eq 0 ]; then
    echo "✓ Codice sincronizzato su GitHub"
else
    echo "✗ Errore sincronizzazione GitHub"
    exit 1
fi

# FASE 2: Deploy su server Hetzner
echo "FASE 2: Deploy su server Hetzner..."

ssh $SERVER_USER@$SERVER_IP << 'EOF'
set -e

cd /home/highlander/app

echo "Pull da GitHub..."

# Configura repository se non fatto
if ! git remote get-url origin &>/dev/null; then
    git remote add origin https://github.com/Fabiodi1995/highlander-serie-a.git
fi

# Backup configurazione
cp .env .env.backup 2>/dev/null || true

# Ferma applicazione
pm2 stop highlander 2>/dev/null || true

# Pull modifiche
git fetch origin
git reset --hard origin/main

# Ripristina configurazione
cp .env.backup .env 2>/dev/null || true

# Installa dipendenze se necessario
if git diff --name-only HEAD~1 HEAD | grep -q package.json; then
    echo "Aggiornamento dipendenze..."
    npm install
fi

# Build
echo "Build applicazione..."
npm run build

# Riavvia
echo "Riavvio applicazione..."
pm2 start ecosystem.config.js --name highlander 2>/dev/null || pm2 restart highlander

# Verifica
sleep 5
if pm2 list | grep -q "highlander.*online"; then
    echo "✓ Deploy completato con successo"
    echo "✓ App disponibile: https://highlandergame.it"
else
    echo "✗ Errore deploy"
    pm2 logs highlander --lines 10
    exit 1
fi
EOF

if [ $? -eq 0 ]; then
    echo "✓ Deploy su server completato"
else
    echo "✗ Errore deploy su server"
    exit 1
fi

echo ""
echo "=== DEPLOY COMPLETATO ==="
echo "Repository: https://github.com/Fabiodi1995/highlander-serie-a"
echo "Produzione: https://highlandergame.it"
echo ""
echo "Test login e funzionalità ora disponibili"