#!/bin/bash
# Script per aggiornare la produzione con nuove modifiche

SERVER_IP="78.47.123.128"
DOMAIN="highlandergame.it"

echo "AGGIORNAMENTO PRODUZIONE HIGHLANDER"
echo "Server: $SERVER_IP"

# Verifica se siamo nel repository corretto
if [ ! -f "package.json" ] || ! grep -q "highlander" package.json; then
    echo "Errore: Esegui questo script dalla directory del progetto Highlander"
    exit 1
fi

# Commit e push locale
echo "1. Commit e push modifiche locali..."
git add .
echo "Inserisci messaggio commit (o premi invio per default):"
read COMMIT_MSG
if [ -z "$COMMIT_MSG" ]; then
    COMMIT_MSG="Aggiornamento $(date '+%Y-%m-%d %H:%M')"
fi
git commit -m "$COMMIT_MSG" || echo "Nessuna modifica da committare"
git push origin main

# Script per il server
cat > /tmp/server-update.sh << 'SERVEREOF'
#!/bin/bash
set -e

echo "2. Aggiornamento sul server..."

# Vai nella directory app
cd /home/highlander/app

# Backup rapido
sudo -u highlander cp .env .env.backup
sudo -u highlander pm2 save

# Ferma applicazione
sudo -u highlander pm2 stop highlander || true

# Pull nuove modifiche
git pull origin main

# Aggiorna dipendenze se package.json è cambiato
if git diff HEAD~1 --name-only | grep -q package.json; then
    echo "Aggiornamento dipendenze..."
    sudo -u highlander npm ci --production
fi

# Rebuild se necessario
sudo -u highlander npm run build

# Aggiorna database se schema è cambiato
if git diff HEAD~1 --name-only | grep -q "shared/schema.ts\|drizzle"; then
    echo "Aggiornamento schema database..."
    sudo -u highlander npm run db:push
fi

# Ripristina .env originale
sudo -u highlander mv .env.backup .env

# Riavvia applicazione
sudo -u highlander pm2 restart highlander

echo "✅ Aggiornamento completato"
echo "Status: $(sudo -u highlander pm2 list | grep highlander)"
SERVEREOF

# Copia ed esegui script sul server
echo "3. Esecuzione aggiornamento sul server..."
scp /tmp/server-update.sh root@$SERVER_IP:/tmp/
ssh root@$SERVER_IP "chmod +x /tmp/server-update.sh && /tmp/server-update.sh"

# Test rapido
echo "4. Test connettività..."
sleep 5
if curl -s -o /dev/null -w "%{http_code}" https://$DOMAIN | grep -q "200"; then
    echo "✅ Sito online: https://$DOMAIN"
else
    echo "⚠ Verificare manualmente il sito"
fi

# Cleanup
rm -f /tmp/server-update.sh

echo ""
echo "AGGIORNAMENTO COMPLETATO"
echo "Controlla: https://$DOMAIN"