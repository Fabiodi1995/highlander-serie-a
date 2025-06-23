# Setup Deploy Git Automatico

## 1. Configurazione Repository

### Sul tuo computer locale:
```bash
# Clona il progetto da Replit
git clone https://github.com/replit/YOUR_REPL_NAME.git highlander-app
cd highlander-app

# Crea repository GitHub
# Vai su GitHub e crea nuovo repo "highlander-app"

# Collega al nuovo repository
git remote remove origin
git remote add origin https://github.com/TUO_USERNAME/highlander-app.git
git push -u origin main
```

## 2. Configurazione Server Hetzner

### Esegui sul server come root:
```bash
# Installa Git
apt update && apt install -y git

# Configura deploy automatico
cd /home/highlander
git clone https://github.com/TUO_USERNAME/highlander-app.git app-git

# Configura webhook
chmod +x /home/highlander/app-git/deploy/simple-git-deploy.sh
/home/highlander/app-git/deploy/simple-git-deploy.sh
```

## 3. Workflow Sviluppo

Ora per ogni modifica:
```bash
# Sviluppa in Replit
# Quando pronto, fai download del progetto
# Sul tuo computer:
git add .
git commit -m "Fix login response handling"
git push origin main
# Il server si aggiorna automaticamente in 30 secondi
```

## 4. Deploy Manuale

Se serve deploy immediato:
```bash
# Sul server Hetzner
sudo -u highlander /home/highlander/app/auto-deploy.sh
```

## 5. Monitoraggio

```bash
# Verifica stato
systemctl status highlander-webhook
pm2 list
pm2 logs highlander

# Endpoint webhook
curl https://highlandergame.it/deploy
```