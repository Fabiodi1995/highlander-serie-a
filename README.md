# Highlander - Serie A Elimination Game

Un gioco di eliminazione multiplayer basato sui risultati della Serie A 2025/26.

## Sviluppo e Deploy

### Setup Locale
```bash
npm install
npm run dev
```

### Deploy Automatico su Hetzner

Il progetto usa deploy automatico tramite Git. Ogni push su `main` aggiorna automaticamente il server.

#### Prima configurazione:
1. Sul server Hetzner:
```bash
chmod +x deploy/simple-git-deploy.sh
./deploy/simple-git-deploy.sh
```

2. Configura repository remoto:
```bash
git remote add origin https://github.com/USERNAME/highlander-app.git
```

#### Workflow di sviluppo:
```bash
# Modifica codice
git add .
git commit -m "Descrizione modifiche"
git push origin main
# Il server si aggiorna automaticamente
```

#### Deploy manuale:
```bash
# Sul server
sudo -u highlander /home/highlander/app/auto-deploy.sh
```

## Tecnologie

- **Frontend**: React + TypeScript + PWA
- **Backend**: Node.js + Express
- **Database**: PostgreSQL con dati Serie A autentici
- **Deploy**: Hetzner Cloud con Nginx
- **Email**: One.com SMTP

## Struttura

- `client/` - Frontend React
- `server/` - Backend Express
- `shared/` - Schema database condiviso
- `deploy/` - Script di deployment
- `scripts/` - Utility varie

## Database

Connessione via DBeaver:
- Tunnel SSH: `ssh -L 5432:localhost:5432 root@SERVER_IP`
- Host: `localhost`, Port: `5432`
- Database: `highlander_db`
- Username: `highlander`