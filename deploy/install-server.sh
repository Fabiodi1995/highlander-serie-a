#!/bin/bash

# Script di installazione completa per server Ubuntu/Debian
set -e

echo "🚀 Installazione Highlander App Server..."

# Verifica privilegi
if [[ $EUID -eq 0 ]]; then
   echo "❌ Non eseguire come root. Usa un utente con privilegi sudo."
   exit 1
fi

# Aggiorna sistema
echo "📦 Aggiornamento sistema..."
sudo apt update && sudo apt upgrade -y

# Installa dipendenze base
echo "🔧 Installazione dipendenze..."
sudo apt install -y curl wget git unzip software-properties-common apt-transport-https ca-certificates gnupg lsb-release

# Installa Docker
echo "🐳 Installazione Docker..."
curl -fsSL https://download.docker.com/linux/ubuntu/gpg | sudo gpg --dearmor -o /usr/share/keyrings/docker-archive-keyring.gpg
echo "deb [arch=$(dpkg --print-architecture) signed-by=/usr/share/keyrings/docker-archive-keyring.gpg] https://download.docker.com/linux/ubuntu $(lsb_release -cs) stable" | sudo tee /etc/apt/sources.list.d/docker.list > /dev/null
sudo apt update
sudo apt install -y docker-ce docker-ce-cli containerd.io

# Installa Docker Compose
echo "🔨 Installazione Docker Compose..."
sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose

# Aggiungi utente al gruppo docker
sudo usermod -aG docker $USER

# Installa Nginx (per SSL setup)
echo "🌐 Installazione Nginx..."
sudo apt install -y nginx

# Stop nginx (verrà gestito da Docker)
sudo systemctl stop nginx
sudo systemctl disable nginx

# Configura firewall
echo "🔥 Configurazione firewall..."
sudo ufw allow ssh
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw --force enable

# Crea directory applicazione
echo "📁 Creazione directory..."
sudo mkdir -p /opt/highlander
sudo chown $USER:$USER /opt/highlander

# Configura logrotate per Docker
echo "📝 Configurazione log rotation..."
sudo tee /etc/logrotate.d/docker-highlander > /dev/null <<EOF
/var/lib/docker/containers/*/*-json.log {
  rotate 5
  daily
  compress
  size=10M
  missingok
  delaycompress
  copytruncate
}
EOF

# Installa strumenti monitoraggio
echo "📊 Installazione strumenti monitoraggio..."
sudo apt install -y htop iotop nethogs

# Configura backup automatico
echo "💾 Configurazione backup automatico..."
mkdir -p /opt/highlander/backups

# Aggiungi cron job per monitoraggio
(crontab -l 2>/dev/null; echo "*/15 * * * * /opt/highlander/deploy/monitoring.sh status >> /var/log/highlander-monitor.log 2>&1") | crontab -
(crontab -l 2>/dev/null; echo "0 2 * * * /opt/highlander/deploy/monitoring.sh backup >> /var/log/highlander-backup.log 2>&1") | crontab -
(crontab -l 2>/dev/null; echo "0 4 * * 0 /opt/highlander/deploy/monitoring.sh cleanup >> /var/log/highlander-cleanup.log 2>&1") | crontab -

echo "✅ Installazione server completata!"
echo ""
echo "📋 Prossimi passi:"
echo "1. Riavvia il server per applicare le modifiche ai gruppi: sudo reboot"
echo "2. Clona il repository dell'app in /opt/highlander"
echo "3. Configura il file .env"
echo "4. Esegui deploy/deploy.sh"
echo ""
echo "🔍 File di log:"
echo "   Monitor: /var/log/highlander-monitor.log"
echo "   Backup: /var/log/highlander-backup.log"
echo "   Cleanup: /var/log/highlander-cleanup.log"