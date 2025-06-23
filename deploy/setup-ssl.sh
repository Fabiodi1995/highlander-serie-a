#!/bin/bash

# Script per configurare SSL con Let's Encrypt
set -e

DOMAIN=${1:-yourdomain.com}
EMAIL=${2:-admin@yourdomain.com}

echo "🔐 Configurazione SSL per $DOMAIN..."

# Installa Certbot se non presente
if ! command -v certbot &> /dev/null; then
    echo "📦 Installazione Certbot..."
    sudo apt update
    sudo apt install -y certbot python3-certbot-nginx
fi

# Stop nginx temporaneamente
echo "🛑 Arresto Nginx..."
sudo systemctl stop nginx

# Genera certificati
echo "🔑 Generazione certificati SSL..."
sudo certbot certonly --standalone \
    --email $EMAIL \
    --agree-tos \
    --no-eff-email \
    -d $DOMAIN \
    -d www.$DOMAIN

# Crea directory SSL per Docker
sudo mkdir -p /opt/highlander/ssl

# Copia certificati nella directory Docker
sudo cp /etc/letsencrypt/live/$DOMAIN/fullchain.pem /opt/highlander/ssl/
sudo cp /etc/letsencrypt/live/$DOMAIN/privkey.pem /opt/highlander/ssl/

# Imposta permessi
sudo chmod 644 /opt/highlander/ssl/fullchain.pem
sudo chmod 600 /opt/highlander/ssl/privkey.pem

# Configura auto-renewal
echo "🔄 Configurazione auto-renewal..."
sudo crontab -l | grep -v certbot || true > /tmp/crontab
echo "0 12 * * * /usr/bin/certbot renew --quiet --deploy-hook 'cp /etc/letsencrypt/live/$DOMAIN/*.pem /opt/highlander/ssl/ && docker-compose -f /opt/highlander/docker-compose.yml restart nginx'" >> /tmp/crontab
sudo crontab /tmp/crontab

echo "✅ SSL configurato per $DOMAIN"
echo "📁 Certificati disponibili in /opt/highlander/ssl/"