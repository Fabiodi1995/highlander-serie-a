#!/bin/bash

# Sistema di deploy Git semplificato per Highlander
# Eseguire sul server Hetzner come root

APP_DIR="/home/highlander/app"
DEPLOY_USER="highlander"

echo "Configurazione deploy Git automatico..."

# 1. Configura Git nel progetto esistente
cd $APP_DIR

# Inizializza Git se non presente
if [ ! -d ".git" ]; then
    sudo -u $DEPLOY_USER git init
    sudo -u $DEPLOY_USER git config user.name "Highlander Deploy"
    sudo -u $DEPLOY_USER git config user.email "deploy@highlandergame.it"
fi

# 2. Crea script di deploy principale
sudo tee $APP_DIR/auto-deploy.sh > /dev/null << 'EOF'
#!/bin/bash
set -e

echo "Deploy automatico in corso..."

cd /home/highlander/app

# Backup configurazione
cp .env .env.backup 2>/dev/null || true

# Ferma applicazione
echo "Stop applicazione..."
pm2 stop highlander 2>/dev/null || true

# Pull modifiche (se repository configurato)
if [ -d ".git" ] && git remote get-url origin &>/dev/null; then
    echo "Pull da Git..."
    git fetch origin
    git reset --hard origin/main
    
    # Ripristina .env
    if [ -f .env.backup ]; then
        cp .env.backup .env
        rm .env.backup
    fi
    
    # Installa dipendenze se necessario
    if git diff --name-only HEAD~1 HEAD | grep -q package.json; then
        echo "Aggiornamento dipendenze..."
        npm install
    fi
fi

# Build
echo "Build applicazione..."
npm run build

# Riavvia
echo "Riavvio applicazione..."
pm2 start ecosystem.config.js --name highlander 2>/dev/null || pm2 restart highlander

# Verifica
sleep 3
if pm2 list | grep -q "highlander.*online"; then
    echo "Deploy completato - https://highlandergame.it"
else
    echo "Errore deploy - controllare log"
    pm2 logs highlander --lines 10
    exit 1
fi
EOF

chmod +x $APP_DIR/auto-deploy.sh
chown $DEPLOY_USER:$DEPLOY_USER $APP_DIR/auto-deploy.sh

# 3. Crea webhook semplice
sudo tee $APP_DIR/webhook.js > /dev/null << 'EOF'
const http = require('http');
const { execSync } = require('child_process');

const server = http.createServer((req, res) => {
    if (req.method === 'POST' && req.url === '/deploy') {
        let body = '';
        req.on('data', chunk => body += chunk);
        req.on('end', () => {
            try {
                console.log('Deploy richiesto via webhook');
                execSync('/home/highlander/app/auto-deploy.sh', { 
                    stdio: 'inherit',
                    cwd: '/home/highlander/app'
                });
                res.writeHead(200);
                res.end('Deploy completato');
            } catch (error) {
                console.error('Errore deploy:', error);
                res.writeHead(500);
                res.end('Deploy fallito');
            }
        });
    } else {
        res.writeHead(200);
        res.end('Webhook attivo');
    }
});

server.listen(9000, () => {
    console.log('Webhook server attivo su porta 9000');
});
EOF

# 4. Servizio systemd per webhook
sudo tee /etc/systemd/system/highlander-webhook.service > /dev/null << EOF
[Unit]
Description=Highlander Deploy Webhook
After=network.target

[Service]
Type=simple
User=$DEPLOY_USER
WorkingDirectory=$APP_DIR
ExecStart=/usr/bin/node $APP_DIR/webhook.js
Restart=always
Environment=NODE_ENV=production

[Install]
WantedBy=multi-user.target
EOF

# 5. Configura Nginx per webhook
NGINX_CONFIG="/etc/nginx/sites-available/highlandergame.it"
if ! grep -q "location /deploy" $NGINX_CONFIG; then
    sed -i '/location \/ {/i\
    location /deploy {\
        proxy_pass http://127.0.0.1:9000;\
        proxy_set_header Host $host;\
    }\
' $NGINX_CONFIG
fi

# 6. Avvia servizi
systemctl daemon-reload
systemctl enable highlander-webhook
systemctl start highlander-webhook
systemctl reload nginx

echo ""
echo "Configurazione completata!"
echo ""
echo "Per utilizzare:"
echo "1. Configura repository Git remoto"
echo "2. Deploy manuale: sudo -u highlander $APP_DIR/auto-deploy.sh"
echo "3. Deploy via webhook: POST https://highlandergame.it/deploy"
echo ""
echo "Status webhook: systemctl status highlander-webhook"
EOF