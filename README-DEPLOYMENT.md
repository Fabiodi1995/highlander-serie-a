# CONFIGURAZIONE GITHUB TOKEN

## STEP 1 - CREA PERSONAL ACCESS TOKEN

1. Vai su GitHub.com → Settings → Developer settings → Personal access tokens → Tokens (classic)
2. Click "Generate new token (classic)"
3. Nome: "Replit Highlander Deploy"
4. Scadenza: No expiration (o 1 anno)
5. Seleziona scope: `repo` (full control of private repositories)
6. Click "Generate token"
7. **COPIA IL TOKEN** (apparirà solo una volta)

## STEP 2 - CONFIGURA REPLIT

Nella shell di Replit:

```bash
# Sostituisci TOKEN con il tuo token generato
git remote set-url origin https://TOKEN@github.com/Fabiodi1995/highlander-serie-a.git

# Verifica configurazione
git remote -v

# Push al repository
git push -f origin main
```

## STEP 3 - VERIFICA SU GITHUB

Vai su https://github.com/Fabiodi1995/highlander-serie-a e verifica che i file siano presenti.

## STEP 4 - SETUP SERVER (dopo push riuscito)

```bash
ssh root@78.47.123.128
cd /home/highlander
pm2 stop highlander
mv app app-backup-$(date +%Y%m%d-%H%M%S)
git clone https://github.com/Fabiodi1995/highlander-serie-a.git app
cd app
cp ../app-backup-*/.env .
npm install
npm run build
pm2 start ecosystem.config.js
pm2 list
```

Il token permetterà push automatici futuri senza inserire credenziali.