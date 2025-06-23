#!/bin/bash
# Setup repository Git per deployment Highlander

echo "Setup Repository Git per Highlander"

# Inizializza repository se non esiste
if [ ! -d ".git" ]; then
    git init
    echo "Repository Git inizializzato"
fi

# Configura remote origin se non esiste
if ! git remote get-url origin &>/dev/null; then
    echo "Inserisci URL repository GitHub (es: https://github.com/username/highlander-serie-a.git):"
    read REPO_URL
    git remote add origin "$REPO_URL"
    echo "Remote origin configurato: $REPO_URL"
fi

# Configura utente Git se non configurato
if [ -z "$(git config user.name)" ]; then
    echo "Inserisci nome utente Git:"
    read GIT_NAME
    git config user.name "$GIT_NAME"
fi

if [ -z "$(git config user.email)" ]; then
    echo "Inserisci email Git:"
    read GIT_EMAIL
    git config user.email "$GIT_EMAIL"
fi

# Stage tutti i file
git add .

# Commit iniziale
git commit -m "Setup iniziale Highlander Serie A con deployment sicuro" || echo "Nessuna modifica da committare"

# Push su main branch
git branch -M main
git push -u origin main

echo "Repository aggiornato su GitHub"