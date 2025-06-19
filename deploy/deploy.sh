#!/bin/bash

# Script di deploy per server di produzione
set -e

echo "🚀 Avvio deploy Highlander App..."

# Verifica prerequisiti
command -v docker >/dev/null 2>&1 || { echo "❌ Docker non installato. Installalo prima di continuare."; exit 1; }
command -v docker-compose >/dev/null 2>&1 || { echo "❌ Docker Compose non installato. Installalo prima di continuare."; exit 1; }

# Verifica file .env
if [ ! -f .env ]; then
    echo "❌ File .env non trovato. Copia .env.production in .env e compila i valori."
    exit 1
fi

# Backup database se esiste
echo "📦 Backup database esistente..."
if docker ps | grep -q highlander-postgres; then
    docker exec highlander-postgres pg_dump -U $POSTGRES_USER $POSTGRES_DB > backup_$(date +%Y%m%d_%H%M%S).sql
    echo "✅ Backup completato"
fi

# Stop containers esistenti
echo "🛑 Arresto container esistenti..."
docker-compose down

# Pull delle immagini più recenti
echo "📥 Download immagini aggiornate..."
docker-compose pull

# Build dell'applicazione
echo "🔨 Build dell'applicazione..."
docker-compose build --no-cache

# Avvio servizi
echo "🚀 Avvio servizi..."
docker-compose up -d

# Attesa per l'avvio del database
echo "⏳ Attesa avvio database..."
sleep 10

# Migrazione database
echo "🗄️ Migrazione database..."
docker-compose exec highlander-app npm run db:push

# Verifica stato servizi
echo "🔍 Verifica stato servizi..."
docker-compose ps

# Health check
echo "🏥 Health check..."
sleep 5
if curl -f http://localhost:3000/api/health > /dev/null 2>&1; then
    echo "✅ App avviata correttamente!"
else
    echo "❌ App non risponde. Controlla i log:"
    docker-compose logs highlander-app
    exit 1
fi

# Mostra logs utili
echo "📋 Deploy completato! Log disponibili con:"
echo "   docker-compose logs -f highlander-app"
echo "   docker-compose logs -f nginx"

echo "🌐 App disponibile su:"
echo "   HTTP: http://yourdomain.com"
echo "   HTTPS: https://yourdomain.com"