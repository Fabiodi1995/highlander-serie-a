#!/bin/bash

# Setup completo sistema deploy Git + Fix login
# Eseguire sul server Hetzner come root

set -e

SERVER_IP=$(curl -s ifconfig.me)
APP_DIR="/home/highlander/app"
DEPLOY_USER="highlander"

echo "Setup completo deploy automatico Highlander..."

# 1. Installa Git se necessario
if ! command -v git &> /dev/null; then
    apt update && apt install -y git
fi

cd $APP_DIR

# 2. Applica immediatamente fix login
echo "Applicazione fix login..."

# Backup
cp .env .env.backup 2>/dev/null || true
pm2 stop highlander 2>/dev/null || true

# Fix queryClient.ts
cat > client/src/lib/queryClient.ts << 'EOF'
import { QueryClient, QueryFunction } from "@tanstack/react-query";

async function throwIfResNotOk(res: Response) {
  if (!res.ok) {
    let errorMessage = res.statusText;
    
    try {
      // Clone the response to avoid consuming the body
      const clonedRes = res.clone();
      const errorData = await clonedRes.json();
      errorMessage = errorData.message || res.statusText;
    } catch (jsonError) {
      // If JSON parsing fails, try to read as text
      try {
        const clonedRes = res.clone();
        const text = await clonedRes.text();
        errorMessage = text || res.statusText;
      } catch (textError) {
        // Use status text as fallback
        errorMessage = res.statusText;
      }
    }
    
    throw new Error(errorMessage);
  }
}

export async function apiRequest(
  method: string,
  url: string,
  data?: unknown | undefined,
): Promise<Response> {
  const res = await fetch(url, {
    method,
    headers: data ? { "Content-Type": "application/json" } : {},
    body: data ? JSON.stringify(data) : undefined,
    credentials: "include",
  });

  await throwIfResNotOk(res);
  return res;
}

type UnauthorizedBehavior = "returnNull" | "throw";
export const getQueryFn: <T>(options: {
  on401: UnauthorizedBehavior;
}) => QueryFunction<T> =
  ({ on401: unauthorizedBehavior }) =>
  async ({ queryKey }) => {
    const res = await fetch(queryKey[0] as string, {
      credentials: "include",
    });

    if (unauthorizedBehavior === "returnNull" && res.status === 401) {
      return null;
    }

    await throwIfResNotOk(res);
    return await res.json();
  };

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      queryFn: getQueryFn({ on401: "throw" }),
      refetchInterval: false,
      refetchOnWindowFocus: false,
      staleTime: Infinity,
      retry: false,
    },
    mutations: {
      retry: false,
    },
  },
});
EOF

# Build con fix
npm run build
cp .env.backup .env 2>/dev/null || true
pm2 start highlander 2>/dev/null || pm2 restart highlander

sleep 3

if pm2 list | grep -q "highlander.*online"; then
    echo "Fix login applicato con successo"
else
    echo "Errore applicazione fix"
    exit 1
fi

# 3. Configura Git
echo "Configurazione Git..."

if [ ! -d ".git" ]; then
    sudo -u $DEPLOY_USER git init
    sudo -u $DEPLOY_USER git config user.name "Highlander Deploy"
    sudo -u $DEPLOY_USER git config user.email "deploy@highlandergame.it"
fi

# 4. Crea script auto-deploy
cat > auto-deploy.sh << 'EOF'
#!/bin/bash
set -e

echo "Deploy automatico..."
cd /home/highlander/app

# Backup config
cp .env .env.backup 2>/dev/null || true

# Ferma app
pm2 stop highlander 2>/dev/null || true

# Pull se repository configurato
if git remote get-url origin &>/dev/null; then
    git fetch origin
    git reset --hard origin/main
    
    # Ripristina config
    cp .env.backup .env 2>/dev/null || true
    
    # Installa dipendenze se package.json cambiato
    if git diff --name-only HEAD~1 HEAD | grep -q package.json; then
        npm install
    fi
fi

# Build
npm run build

# Riavvia
pm2 start ecosystem.config.js --name highlander 2>/dev/null || pm2 restart highlander

# Verifica
sleep 3
if pm2 list | grep -q "highlander.*online"; then
    echo "Deploy OK - https://highlandergame.it"
else
    echo "Deploy fallito"
    pm2 logs highlander --lines 10
    exit 1
fi
EOF

chmod +x auto-deploy.sh
chown $DEPLOY_USER:$DEPLOY_USER auto-deploy.sh

# 5. Webhook server con sicurezza GitHub
cat > webhook.js << 'EOF'
const http = require('http');
const crypto = require('crypto');
const { execSync } = require('child_process');

const SECRET = 'highlander-webhook-2024';

const server = http.createServer((req, res) => {
    if (req.method === 'POST' && req.url === '/deploy') {
        let body = '';
        
        req.on('data', chunk => {
            body += chunk.toString();
        });
        
        req.on('end', () => {
            try {
                // Verifica signature GitHub se presente
                const signature = req.headers['x-hub-signature-256'];
                if (signature) {
                    const expectedSignature = 'sha256=' + crypto
                        .createHmac('sha256', SECRET)
                        .update(body)
                        .digest('hex');
                    
                    if (signature !== expectedSignature) {
                        res.writeHead(401);
                        res.end('Unauthorized');
                        return;
                    }
                }
                
                // Verifica che sia push su main
                const payload = JSON.parse(body);
                if (payload.ref && payload.ref !== 'refs/heads/main') {
                    res.writeHead(200);
                    res.end('No deploy needed - not main branch');
                    return;
                }
                
                console.log('Deploy triggered from GitHub - repository: Fabiodi1995/highlander-serie-a');
                execSync('/home/highlander/app/auto-deploy.sh', { 
                    stdio: 'inherit',
                    cwd: '/home/highlander/app'
                });
                res.writeHead(200);
                res.end('Deploy completed successfully');
            } catch (error) {
                console.error('Deploy error:', error);
                res.writeHead(500);
                res.end('Deploy failed: ' + error.message);
            }
        });
    } else {
        res.writeHead(200);
        res.end('Highlander webhook server active');
    }
});

server.listen(9000, () => {
    console.log('GitHub webhook server listening on port 9000');
});
EOF

# 6. Servizio systemd
cat > /etc/systemd/system/highlander-webhook.service << EOF
[Unit]
Description=Highlander Deploy Webhook
After=network.target

[Service]
Type=simple
User=$DEPLOY_USER
WorkingDirectory=$APP_DIR
ExecStart=/usr/bin/node $APP_DIR/webhook.js
Restart=always

[Install]
WantedBy=multi-user.target
EOF

# 7. Nginx webhook config
NGINX_CONFIG="/etc/nginx/sites-available/highlandergame.it"
if ! grep -q "location /deploy" $NGINX_CONFIG; then
    sed -i '/location \/ {/i\
    location /deploy {\
        proxy_pass http://127.0.0.1:9000;\
        proxy_set_header Host $host;\
    }\
' $NGINX_CONFIG
fi

# 8. Avvia servizi
systemctl daemon-reload
systemctl enable highlander-webhook
systemctl start highlander-webhook
systemctl reload nginx

echo ""
echo "SETUP COMPLETATO!"
echo ""
echo "Fix login applicato - testa: https://highlandergame.it"
echo ""
echo "Per deploy automatico:"
echo "1. Repository: https://github.com/Fabiodi1995/highlander-serie-a"
echo "2. Esegui: git remote add origin https://github.com/Fabiodi1995/highlander-serie-a.git"
echo "3. Esegui: git add . && git commit -m 'Production ready with login fix' && git push -u origin main"
echo "4. Configura webhook GitHub: https://highlandergame.it/deploy"
echo ""
echo "Deploy manuale: sudo -u highlander ./auto-deploy.sh"
echo "Status webhook: systemctl status highlander-webhook"