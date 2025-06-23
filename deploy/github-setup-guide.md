# Guida Setup Repository GitHub e Auto-Deploy

## 1. Creazione Repository GitHub

1. Vai su GitHub e crea nuovo repository:
   - Nome: `highlander-app`
   - Visibilità: Private (raccomandato)
   - Non inizializzare con README

2. Nel terminale locale (dove hai il codice Replit):
```bash
git init
git add .
git commit -m "Initial commit - Highlander app"
git branch -M main
git remote add origin https://github.com/TUO_USERNAME/highlander-app.git
git push -u origin main
```

## 2. Configurazione Server Hetzner

Esegui sul server come root:
```bash
chmod +x /home/highlander/app/deploy/git-auto-deploy.sh
/home/highlander/app/deploy/git-auto-deploy.sh
```

## 3. Configurazione Webhook GitHub

1. Nel repository GitHub:
   - Settings → Webhooks → Add webhook
   - Payload URL: `https://highlandergame.it/webhook`
   - Content type: `application/json`
   - Secret: `highlander-webhook-secret-2024`
   - Events: `Just the push event`
   - Active: ✓

## 4. Test Deploy

```bash
# Sul server Hetzner
sudo -u highlander /home/highlander/app/deploy.sh
```

## 5. Workflow Future

Ora per ogni modifica:
1. Modifica codice localmente
2. `git add .`
3. `git commit -m "Descrizione modifica"`
4. `git push origin main`
5. Il server si aggiorna automaticamente!

## Vantaggi

- Deploy automatico ad ogni push
- Backup automatico delle versioni precedenti via Git
- Rollback semplice con `git checkout`
- Tracciabilità completa delle modifiche
- Collaborazione semplificata