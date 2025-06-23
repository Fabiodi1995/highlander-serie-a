#!/bin/bash

# Script per aggiornare solo i file modificati in produzione
echo "Aggiornamento produzione con fix login..."

# File da aggiornare
FILES_TO_UPDATE=(
    "client/src/lib/queryClient.ts"
    "client/src/pages/reset-password.tsx"
    "DBEAVER_CONNECTION_GUIDE.md"
    "quick-db-setup.md"
)

# Trasferisci i file aggiornati
for file in "${FILES_TO_UPDATE[@]}"; do
    echo "Trasferimento: $file"
    scp "$file" root@YOUR_SERVER_IP:/home/highlander/app/$file
done

# Esegui aggiornamento sul server
ssh root@YOUR_SERVER_IP << 'EOF'
cd /home/highlander/app

# Ferma applicazione
pm2 stop highlander

# Ricompila
npm run build

# Riavvia
pm2 start highlander

echo "Aggiornamento completato"
EOF