# Deployment Highlander su Hetzner

## Panoramica Rapida

Tutto è pronto per il deployment su `highlandergame.it` con server Hetzner.

## Prerequisiti

1. **Server Hetzner** con Ubuntu 22.04 e accesso SSH root
2. **Dominio** `highlandergame.it` con DNS configurato
3. **Email** `support@highlandergame.it` creata su One.com

## Deployment in 3 Passi

### 1. Configura DNS
Nel pannello DNS del tuo provider (One.com):
```
A     @      [IP-SERVER-HETZNER]
A     www    [IP-SERVER-HETZNER]
MX    @      mail.highlandergame.it    10
```

### 2. Esegui Deployment
```bash
# Sostituisci con IP reale e password email
./deploy/final-deployment-script.sh 95.217.123.456 tua_password_email
```

### 3. Verifica
Vai su `https://highlandergame.it` e testa:
- Registrazione nuovo utente
- Ricezione email di verifica
- Login e funzionalità del gioco

## Script Disponibili

- `deploy/final-deployment-script.sh` - Deployment completo automatico
- `deploy/pre-deployment-check.sh` - Verifica prerequisiti
- `deploy/hetzner-deploy.sh` - Deployment manuale passo-passo

## Configurazione Email

Il sistema è configurato per:
- **Invio**: SMTP One.com (send.one.com:587)
- **Da**: support@highlandergame.it
- **Costo**: Gratuito (incluso nel dominio)

## Monitoraggio Post-Deployment

```bash
# Connettiti al server
ssh root@[IP-SERVER]

# Status applicazione
pm2 status

# Log in tempo reale
pm2 logs highlander

# Restart se necessario
pm2 restart highlander
```

## Caratteristiche Deployment

- **SSL automatico** con Let's Encrypt
- **Redirect HTTP→HTTPS** automatico
- **Nginx** configurato per performance
- **PM2 cluster mode** per alta disponibilità
- **Backup database** automatico
- **Firewall** configurato
- **Email SMTP** operativo

## Troubleshooting

**Sito non raggiungibile**: Verifica DNS con `nslookup highlandergame.it`

**Email non funzionanti**: Controlla password in `/home/highlander/app/.env`

**App non risponde**: `pm2 restart highlander`

**SSL problemi**: `certbot renew --force-renewal`

## Supporto

Il sistema è completamente configurato e testato. Tutti i componenti sono operativi:
- Sistema email One.com SMTP
- Gestione automatica URL per produzione
- Database PostgreSQL configurato
- Autenticazione e registrazione utenti
- Sistema di gioco Serie A completo