#!/bin/bash

# Script per configurare auto-deployment Git su server Hetzner
# Eseguire sul server come root

echo "🚀 Configurazione Git Auto-Deploy..."

# Variabili
APP_DIR="/home/highlander/app"
REPO_URL="https://github.com/YOUR_USERNAME/highlander-app.git"  # Sostituisci con il tuo repo
DEPLOY_USER="highlander"
NGINX_CONFIG="/etc/nginx/sites-available/highlandergame.it"

# 1. Installa Git se non presente
if ! command -v git &> /dev/null; then
    echo "📦 Installazione Git..."
    apt update && apt install -y git
fi

# 2. Configura SSH keys per GitHub (se usi SSH)
echo "🔑 Configurazione SSH per GitHub..."
sudo -u $DEPLOY_USER bash << 'EOFUSER'
    if [ ! -f ~/.ssh/id_rsa ]; then
        ssh-keygen -t rsa -b 4096 -C "highlander@highlandergame.it" -f ~/.ssh/id_rsa -N ""
        echo "📋 Aggiungi questa chiave pubblica a GitHub:"
        cat ~/.ssh/id_rsa.pub
        echo ""
        echo "Vai su GitHub → Settings → SSH and GPG keys → New SSH key"
        read -p "Premi ENTER dopo aver aggiunto la chiave..."
    fi
EOFUSER

# 3. Clona repository se non esiste
if [ ! -d "$APP_DIR/.git" ]; then
    echo "📥 Clonazione repository..."
    sudo rm -rf $APP_DIR
    sudo -u $DEPLOY_USER git clone $REPO_URL $APP_DIR
    cd $APP_DIR
else
    echo "📂 Repository esistente trovato"
    cd $APP_DIR
fi

# 4. Crea script di deploy
echo "📝 Creazione script di deploy..."
sudo tee $APP_DIR/deploy.sh > /dev/null << 'EOF'
#!/bin/bash

# Script di deploy automatico
set -e

echo "🚀 Inizio deploy..."

# Naviga alla directory app
cd /home/highlander/app

# Backup del .env
cp .env .env.backup 2>/dev/null || true

# Pull delle modifiche
echo "📥 Pull modifiche da Git..."
git fetch origin
git reset --hard origin/main

# Ripristina .env se esiste
if [ -f .env.backup ]; then
    cp .env.backup .env
    rm .env.backup
fi

# Installa dipendenze se package.json è cambiato
if git diff --name-only HEAD~1 HEAD | grep -q package.json; then
    echo "📦 Aggiornamento dipendenze..."
    npm install
fi

# Ferma applicazione
echo "⏹️ Stop applicazione..."
pm2 stop highlander 2>/dev/null || true

# Build applicazione
echo "🔨 Build applicazione..."
npm run build

# Riavvia applicazione
echo "▶️ Riavvio applicazione..."
pm2 start ecosystem.config.js --name highlander

# Verifica stato
sleep 3
if pm2 list | grep -q "highlander.*online"; then
    echo "✅ Deploy completato con successo"
    echo "🌐 App disponibile su: https://highlandergame.it"
else
    echo "❌ Errore nel deploy"
    pm2 logs highlander --lines 20
    exit 1
fi
EOF

chmod +x $APP_DIR/deploy.sh
chown $DEPLOY_USER:$DEPLOY_USER $APP_DIR/deploy.sh

# 5. Crea webhook endpoint per GitHub
echo "🪝 Configurazione webhook..."
sudo tee $APP_DIR/webhook-server.js > /dev/null << 'EOF'
const http = require('http');
const crypto = require('crypto');
const { execSync } = require('child_process');

const PORT = 9000;
const SECRET = process.env.WEBHOOK_SECRET || 'your-webhook-secret';

const server = http.createServer((req, res) => {
    if (req.method === 'POST' && req.url === '/webhook') {
        let body = '';
        
        req.on('data', chunk => {
            body += chunk.toString();
        });
        
        req.on('end', () => {
            try {
                // Verifica signature GitHub
                const signature = req.headers['x-hub-signature-256'];
                const expectedSignature = 'sha256=' + crypto
                    .createHmac('sha256', SECRET)
                    .update(body)
                    .digest('hex');
                
                if (signature === expectedSignature) {
                    const payload = JSON.parse(body);
                    
                    // Deploy solo su push al branch main
                    if (payload.ref === 'refs/heads/main') {
                        console.log('🚀 Deploy triggered by push to main');
                        
                        execSync('/home/highlander/app/deploy.sh', {
                            cwd: '/home/highlander/app',
                            stdio: 'inherit'
                        });
                        
                        res.writeHead(200);
                        res.end('Deploy successful');
                    } else {
                        res.writeHead(200);
                        res.end('No deploy needed');
                    }
                } else {
                    res.writeHead(401);
                    res.end('Unauthorized');
                }
            } catch (error) {
                console.error('Deploy error:', error);
                res.writeHead(500);
                res.end('Deploy failed');
            }
        });
    } else {
        res.writeHead(404);
        res.end('Not found');
    }
});

server.listen(PORT, () => {
    console.log(`Webhook server listening on port ${PORT}`);
});
EOF

# 6. Crea servizio systemd per webhook
echo "⚙️ Configurazione servizio webhook..."
sudo tee /etc/systemd/system/highlander-webhook.service > /dev/null << EOF
[Unit]
Description=Highlander Webhook Server
After=network.target

[Service]
Type=simple
User=$DEPLOY_USER
WorkingDirectory=$APP_DIR
ExecStart=/usr/bin/node $APP_DIR/webhook-server.js
Restart=always
RestartSec=10
Environment=NODE_ENV=production
Environment=WEBHOOK_SECRET=highlander-webhook-secret-2024

[Install]
WantedBy=multi-user.target
EOF

# 7. Configura Nginx per webhook
echo "🌐 Configurazione Nginx per webhook..."
if ! grep -q "location /webhook" $NGINX_CONFIG; then
    sudo sed -i '/location \/ {/i\
    # Webhook endpoint\
    location /webhook {\
        proxy_pass http://127.0.0.1:9000;\
        proxy_set_header Host $host;\
        proxy_set_header X-Real-IP $remote_addr;\
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;\
        proxy_set_header X-Forwarded-Proto $scheme;\
    }\
' $NGINX_CONFIG
fi

# 8. Avvia servizi
echo "▶️ Avvio servizi..."
sudo systemctl daemon-reload
sudo systemctl enable highlander-webhook
sudo systemctl start highlander-webhook
sudo systemctl reload nginx

echo ""
echo "🎉 Configurazione completata!"
echo ""
echo "📋 Prossimi passi:"
echo "1. Crea repository GitHub per il progetto"
echo "2. Aggiungi la chiave SSH a GitHub se non fatto"
echo "3. Configura webhook su GitHub:"
echo "   - URL: https://highlandergame.it/webhook"
echo "   - Content type: application/json"
echo "   - Secret: highlander-webhook-secret-2024"
echo "   - Events: Just the push event"
echo ""
echo "🚀 Dopo la configurazione, ogni push su main attiverà il deploy automatico!"
echo ""
echo "🔧 Test manuale deploy:"
echo "   sudo -u $DEPLOY_USER $APP_DIR/deploy.sh"
echo ""
echo "📊 Stato webhook:"
echo "   systemctl status highlander-webhook"