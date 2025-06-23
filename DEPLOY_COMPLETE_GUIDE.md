# Guida Deploy Completa Highlander

## Repository GitHub Privato
https://github.com/Fabiodi1995/highlander-serie-a

## Workflow Deploy Automatico

### 1. Configurazione Iniziale (Una volta sola)

Sul server Hetzner, esegui come root:
```bash
cd /home/highlander/app
chmod +x deploy/complete-setup.sh
./deploy/complete-setup.sh
```

### 2. Configurazione Webhook GitHub

1. Vai su: https://github.com/Fabiodi1995/highlander-serie-a/settings/hooks
2. Add webhook:
   - URL: `https://highlandergame.it/deploy`
   - Content-type: `application/json`
   - Secret: `highlander-webhook-2024`
   - Events: `Just the push event`

### 3. Deploy Immediato con Fix Login

Per applicare subito tutte le modifiche:
```bash
# Modifica IP in deploy/immediate-sync-deploy.sh
sed -i 's/YOUR_HETZNER_IP/TUO_IP_REALE/' deploy/immediate-sync-deploy.sh
./deploy/immediate-sync-deploy.sh
```

### 4. Workflow Futuro

Per ogni modifica:
1. Sviluppa in Replit
2. Esegui: `./deploy/sync-to-github.sh`
3. Il server si aggiorna automaticamente via webhook

## Database Access (DBeaver)

### Opzione A: Tunnel SSH
```bash
ssh -L 5432:localhost:5432 root@SERVER_IP
```
DBeaver: localhost:5432

### Opzione B: Accesso Diretto
Sul server:
```bash
chmod +x scripts/configure-postgresql-external.sh
./scripts/configure-postgresql-external.sh
```
DBeaver: SERVER_IP:5432

## Credenziali Database
- Host: localhost (tunnel) o SERVER_IP (diretto)
- Port: 5432
- Database: highlander_db
- Username: highlander
- Password: P3CQeyzh/YLiyxabFSMgwoxRpUPW5qw4

## Fix Login Applicato

Il sistema ora include:
- Response cloning per evitare "body stream already read"
- Gestione errori migliorata per login/reset password
- Deploy automatico configurato
- Webhook GitHub per aggiornamenti istantanei

## Test Post-Deploy

1. Login: https://highlandergame.it
2. Reset password
3. Registrazione nuovo utente
4. Funzionalità app complete

## Comandi Utili

```bash
# Stato applicazione
pm2 list
pm2 logs highlander

# Stato webhook
systemctl status highlander-webhook

# Deploy manuale
sudo -u highlander /home/highlander/app/auto-deploy.sh

# Test webhook
curl -X POST https://highlandergame.it/deploy
```