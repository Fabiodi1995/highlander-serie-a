# DEPLOY COMPLETATO SU GITHUB - SETUP SERVER

## ✅ GITHUB REPOSITORY CREATO
Repository: https://github.com/Fabiodi1995/highlander-serie-a.git
Commit: 143e5f4 - "Initial: App Highlander completa con PM2"
Files: 395 file caricati correttamente

## PROSSIMO STEP: SETUP SUL SERVER HETZNER

Esegui questi comandi sul server:

```bash
ssh root@78.47.123.128

# Backup app attuale e setup nuovo repository
cd /home/highlander
pm2 stop highlander
mv app app-backup-$(date +%Y%m%d-%H%M%S)

# Clona dal nuovo repository
git clone https://github.com/Fabiodi1995/highlander-serie-a.git app
cd app

# Copia configurazione ambiente dal backup
cp ../app-backup-*/.env .

# Installa dipendenze
npm install

# Build applicazione  
npm run build

# Avvia con PM2
pm2 start ecosystem.config.js

# Verifica stato
pm2 list
curl -I https://highlandergame.it
```

## CREA SCRIPT DEPLOY AUTOMATICO

```bash
cat > /home/highlander/deploy.sh << 'EOF'
#!/bin/bash
cd /home/highlander/app
echo "🔄 Fermando applicazione..."
pm2 stop highlander
echo "📥 Aggiornando da GitHub..."
git pull origin main
echo "📦 Installando dipendenze..."
npm install
echo "🔨 Building applicazione..."
npm run build
echo "🚀 Riavviando applicazione..."
pm2 start ecosystem.config.js
echo "✅ Deploy completato!"
pm2 list
curl -I https://highlandergame.it
EOF

chmod +x /home/highlander/deploy.sh
```

## FLUSSO FUTURO

### Aggiornamenti da Replit:
```bash
git add .
git commit -m "Descrizione modifiche"
git push origin main
```

### Deploy sul server:
```bash
ssh root@78.47.123.128
cd /home/highlander
./deploy.sh
```

Il setup è ora completo e scalabile per tutti gli aggiornamenti futuri!