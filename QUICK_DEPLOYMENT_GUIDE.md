# SETUP REPOSITORY NUOVO E PULITO

## 1. ELIMINA REPOSITORY ATTUALE
```bash
# Su GitHub, vai su Settings del repository e Delete Repository
# https://github.com/Fabiodi1995/highlander-serie-a/settings
```

## 2. CREA NUOVO REPOSITORY
```bash
# Su GitHub, crea nuovo repository:
# Nome: highlander-serie-a
# Pubblico/Privato: a tua scelta
# NON inizializzare con README
```

## 3. SETUP LOCALE PULITO

### Rimuovi connessione Git attuale:
```bash
rm -rf .git
git init
```

### Configura Git:
```bash
git config --global user.name "Fabio"
git config --global user.email "tua-email@example.com"
```

### Aggiungi solo file essenziali:
```bash
# Aggiungi file progetto
git add client/
git add server/
git add shared/
git add package.json
git add package-lock.json
git add ecosystem.config.cjs
git add .gitignore
git add tsconfig.json
git add vite.config.ts
git add tailwind.config.ts
git add drizzle.config.ts
git add components.json
git add postcss.config.js
```

### Primo commit:
```bash
git commit -m "Initial commit: Highlander football app with PM2 setup"
```

### Connetti al nuovo repository:
```bash
git remote add origin https://github.com/Fabiodi1995/highlander-serie-a.git
git branch -M main
git push -u origin main
```

## 4. SETUP SERVER PER NUOVO REPOSITORY

### Sul server Hetzner:
```bash
ssh root@78.47.123.128

# Backup app attuale
cd /home/highlander
mv app app-old-backup

# Clona nuovo repository
git clone https://github.com/Fabiodi1995/highlander-serie-a.git app

# Entra nella directory
cd app

# Copia file .env dal backup
cp ../app-old-backup/.env .

# Installa dipendenze
npm install

# Build applicazione
npm run build

# Avvia con PM2
pm2 start ecosystem.config.cjs

# Verifica
pm2 list
```

## 5. FLUSSO FUTURO

### Da Replit a GitHub:
```bash
git add .
git commit -m "Descrizione modifiche"
git push origin main
```

### Da GitHub al server:
```bash
ssh root@78.47.123.128
cd /home/highlander/app
pm2 stop highlander
git pull origin main
npm install
npm run build
pm2 start ecosystem.config.cjs
pm2 list
```

## 6. SCRIPT DEPLOY AUTOMATICO

### Crea sul server:
```bash
cat > /home/highlander/deploy.sh << 'EOF'
#!/bin/bash
cd /home/highlander/app
echo "🔄 Fermando app..."
pm2 stop highlander
echo "📥 Aggiornando codice..."
git pull origin main
echo "📦 Installando dipendenze..."
npm install
echo "🔨 Building..."
npm run build
echo "🚀 Avviando app..."
pm2 start ecosystem.config.cjs
echo "✅ Deploy completato!"
pm2 list
curl -I https://highlandergame.it
EOF

chmod +x /home/highlander/deploy.sh
```

### Uso script:
```bash
./deploy.sh
```

Questo setup sarà pulito, scalabile e facile da gestire!