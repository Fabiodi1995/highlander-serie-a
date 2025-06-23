# Configurazione Webhook GitHub per Deploy Automatico

## Setup Repository GitHub

1. **Vai al tuo repository**: https://github.com/Fabiodi1995/highlander-serie-a

2. **Settings → Webhooks → Add webhook**

3. **Configurazione webhook**:
   - **Payload URL**: `https://highlandergame.it/deploy`
   - **Content type**: `application/json`
   - **Secret**: `highlander-webhook-2024`
   - **SSL verification**: Enable SSL verification
   - **Which events**: Just the push event
   - **Active**: ✓

## Setup Server Hetzner

Esegui sul server come root:

```bash
cd /home/highlander/app

# Configura repository
git remote add origin https://github.com/Fabiodi1995/highlander-serie-a.git

# Configura webhook automatico
chmod +x deploy/complete-setup.sh
./deploy/complete-setup.sh
```

## Workflow Futuro

1. **Sviluppo in Replit**
2. **Sincronizza con GitHub**: `./deploy/sync-to-github.sh`
3. **Deploy automatico**: Il webhook GitHub aggiornerà automaticamente il server

## Test Webhook

Dopo la configurazione:
```bash
# Test manuale
curl -X POST https://highlandergame.it/deploy

# Verifica stato
systemctl status highlander-webhook
pm2 logs highlander
```

## Vantaggi

- Deploy automatico ad ogni push su GitHub
- Backup completo versioni precedenti
- Tracciabilità modifiche via Git
- Zero downtime durante aggiornamenti
- Rollback immediato con `git checkout`