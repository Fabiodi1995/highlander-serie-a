#!/bin/bash

# Script per aggiornare ecosystem.config.js sul server Hetzner
# Da eseguire sul server dopo il clone

cat > ecosystem.config.cjs << 'EOF'
module.exports = {
  apps: [{
    name: 'highlander',
    script: './dist/index.js',
    cwd: '/home/highlander/app',
    env: {
      NODE_ENV: 'production',
      PORT: 5000,
      DATABASE_URL: 'postgresql://highlander:P3CQeyzh%2FYLiyxabFSMgwoxRpUPW5qw4@localhost:5432/highlander_db',
      SMTP_USER: 'support@highlandergame.it',
      SMTP_PASSWORD: 'Calibro9!',
      SESSION_SECRET: 'your-session-secret-here',
      BASE_URL: 'https://highlandergame.it'
    },
    instances: 1,
    autorestart: true,
    watch: false,
    max_memory_restart: '1G',
    error_file: './logs/error.log',
    out_file: './logs/out.log',
    log_file: './logs/combined.log',
    time: true
  }]
}
EOF

# Crea directory logs
mkdir -p logs

# Avvia PM2
pm2 start ecosystem.config.cjs

echo "✅ PM2 configurato e avviato correttamente"
pm2 list