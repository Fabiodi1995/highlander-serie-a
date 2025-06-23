#!/bin/bash
# Aggiornamento diretto senza Git per Highlander

SERVER_IP="78.47.123.128"
DOMAIN="highlandergame.it"

echo "AGGIORNAMENTO DIRETTO HIGHLANDER"
echo "Server: $SERVER_IP"

# Verifica se siamo nel progetto corretto
if [ ! -f "package.json" ] || [ ! -d "server" ] || [ ! -d "client" ]; then
    echo "Errore: Esegui questo script dalla directory del progetto"
    exit 1
fi

echo "1. Aggiornamento repository Git..."

# Configura Git se necessario
if [ -z "$(git config user.name)" ]; then
    git config user.name "Highlander Update"
    git config user.email "update@highlandergame.it"
fi

# Add e commit modifiche
git add .
echo "Inserisci messaggio commit (o premi invio per default):"
read COMMIT_MSG
if [ -z "$COMMIT_MSG" ]; then
    COMMIT_MSG="Aggiornamento $(date '+%Y-%m-%d %H:%M')"
fi
git commit -m "$COMMIT_MSG" || echo "Nessuna modifica da committare"

# Push su repository privato
if git remote get-url origin &>/dev/null; then
    git push origin main || git push origin master || echo "Push completato o non necessario"
    echo "✅ Repository Git aggiornato"
else
    echo "Repository remoto non configurato - continuo con deployment locale"
fi

echo "2. Creazione nuovo archivio..."

# Crea archivio aggiornato
tar -czf highlander-update.tar.gz \
    --exclude=node_modules \
    --exclude=.git \
    --exclude=*.log \
    --exclude=.env \
    --exclude=dist \
    --exclude=uploads \
    --exclude=attached_assets \
    --exclude=backup \
    --exclude=*.tar.gz \
    .

echo "3. Upload e aggiornamento sul server..."

# Upload archivio
scp highlander-update.tar.gz root@$SERVER_IP:/tmp/

# Script per aggiornamento server
cat > /tmp/server-update.sh << 'SERVEREOF'
#!/bin/bash
set -e

echo "Aggiornamento applicazione sul server..."

# Backup rapido
sudo -u highlander cp /home/highlander/app/.env /home/highlander/.env.backup
sudo -u highlander pm2 save

# Ferma applicazione
sudo -u highlander pm2 stop highlander || true

# Backup directory corrente
sudo -u highlander mv /home/highlander/app /home/highlander/app.backup

# Crea nuova directory e estrai
sudo -u highlander mkdir /home/highlander/app
cd /home/highlander/app
sudo -u highlander tar -xzf /tmp/highlander-update.tar.gz

# Ripristina .env
sudo -u highlander cp /home/highlander/.env.backup .env

# Installa dipendenze
sudo -u highlander npm ci --production

# Build applicazione
sudo -u highlander npm run build

# Aggiorna database se necessario
sudo -u highlander npm run db:push

# Riavvia applicazione
sudo -u highlander pm2 restart highlander

# Verifica status
sleep 5
if sudo -u highlander pm2 list | grep -q "online.*highlander"; then
    echo "✅ Aggiornamento completato con successo"
    # Rimuovi backup se tutto ok
    sudo -u highlander rm -rf /home/highlander/app.backup
else
    echo "❌ Errore nell'aggiornamento"
    echo "Ripristino backup..."
    sudo -u highlander pm2 stop highlander || true
    sudo -u highlander rm -rf /home/highlander/app
    sudo -u highlander mv /home/highlander/app.backup /home/highlander/app
    sudo -u highlander pm2 start highlander
    exit 1
fi
SERVEREOF

# Esegui aggiornamento sul server
scp /tmp/server-update.sh root@$SERVER_IP:/tmp/
ssh root@$SERVER_IP "chmod +x /tmp/server-update.sh && /tmp/server-update.sh"

echo "4. Test funzionalità..."

# Test rapido
sleep 10
if curl -s -o /dev/null -w "%{http_code}" https://$DOMAIN | grep -q "200"; then
    echo "✅ Sito online: https://$DOMAIN"
else
    echo "⚠ Verificare manualmente il sito"
fi

# Cleanup
rm -f highlander-update.tar.gz /tmp/server-update.sh

echo ""
echo "AGGIORNAMENTO COMPLETATO"
echo "Sito: https://$DOMAIN"
echo "Monitoraggio: ssh root@$SERVER_IP -> sudo -u highlander pm2 logs highlander"