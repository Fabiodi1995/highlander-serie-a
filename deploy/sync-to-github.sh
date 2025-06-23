#!/bin/bash

# Script per sincronizzare codice Replit con GitHub privato
# Repository: https://github.com/Fabiodi1995/highlander-serie-a

set -e

REPO_URL="https://github.com/Fabiodi1995/highlander-serie-a.git"
TEMP_DIR="/tmp/highlander-sync"

echo "Sincronizzazione con repository GitHub privato..."

# Pulisci directory temporanea
rm -rf $TEMP_DIR
mkdir -p $TEMP_DIR

# Crea archivio del codice corrente (escludendo file non necessari)
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
    -czf $TEMP_DIR/highlander-code.tar.gz .

cd $TEMP_DIR

# Clona repository esistente
echo "Clonazione repository GitHub..."
git clone $REPO_URL repo
cd repo

# Backup del README se esiste
if [ -f "README.md" ]; then
    cp README.md README.backup
fi

# Rimuovi tutto tranne .git
find . -mindepth 1 -maxdepth 1 ! -name '.git' -exec rm -rf {} +

# Estrai nuovo codice
tar -xzf ../highlander-code.tar.gz

# Ripristina README se esisteva
if [ -f "README.backup" ]; then
    if [ ! -f "README.md" ]; then
        mv README.backup README.md
    else
        rm README.backup
    fi
fi

# Configura Git
git config user.name "Fabio Di Costa"
git config user.email "dicostafabio1995@gmail.com"

# Commit e push
git add .
git commit -m "Deploy automatico con fix login - $(date '+%Y-%m-%d %H:%M:%S')"

echo "Push al repository GitHub..."
git push origin main

echo "Sincronizzazione completata!"
echo "Repository aggiornato: $REPO_URL"

# Cleanup
cd /
rm -rf $TEMP_DIR