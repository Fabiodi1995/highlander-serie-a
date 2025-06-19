# Configurazione Email con SendGrid

## 1. Setup Account SendGrid

### Registrazione
1. Vai su https://sendgrid.com/
2. Crea account gratuito (25.000 email/mese)
3. Verifica email di registrazione

### Generazione API Key
1. Accedi a SendGrid Dashboard
2. Vai su Settings > API Keys
3. Clicca "Create API Key"
4. Scegli "Restricted Access"
5. Seleziona permessi:
   - Mail Send: FULL ACCESS
   - Template Engine: FULL ACCESS
   - Stats: READ ACCESS
6. Copia la chiave generata (sarà mostrata solo una volta)

## 2. Configurazione DNS

### Verifica Dominio
1. Settings > Sender Authentication
2. Domain Authentication > Authenticate Your Domain
3. Seleziona il tuo DNS provider
4. Aggiungi i record DNS forniti:

```dns
CNAME: s1._domainkey.tuodominio.com -> s1.domainkey.u1234567.wl123.sendgrid.net
CNAME: s2._domainkey.tuodominio.com -> s2.domainkey.u1234567.wl123.sendgrid.net
```

### Verifica SPF/DKIM
Aggiungi al record TXT del tuo dominio:
```dns
TXT: v=spf1 include:sendgrid.net ~all
```

## 3. Configurazione App

### Variabili Ambiente
Aggiungi al file .env:
```bash
SENDGRID_API_KEY=SG.xxxxxxxxxxxxxxxxxx
FROM_EMAIL=noreply@tuodominio.com
REPLY_TO_EMAIL=support@tuodominio.com
```

### Test Configurazione
```bash
# Test connessione SendGrid
docker exec highlander-app npm run test:email
```

## 4. Template Email

L'app include già template per:
- ✅ Verifica registrazione
- ✅ Reset password
- ✅ Notifiche gioco
- ✅ Report settimanali

## 5. Funzionalità Implementate

### Verifica Email Registrazione
- Invio automatico alla registrazione
- Token sicuro con scadenza 24h
- Link di attivazione personalizzato
- Reinvio token su richiesta

### Reset Password
- Link sicuro per reset
- Token con scadenza 1h
- Validazione email esistente
- Blocco tentativi multipli

### Notifiche Gioco
- Avvisi deadline imminenti
- Conferme selezioni squadre
- Risultati eliminazioni
- Report fine gioco

## 6. Personalizzazioni Disponibili

### Logo nei Template
```javascript
// In server/email-service.ts
const logoUrl = 'https://tuodominio.com/assets/logo.png';
```

### Domini Multipli
```bash
# Per gestire più domini
ALLOWED_DOMAINS=tuodominio.com,altrodominio.com
```

### Rate Limiting Email
```javascript
// Configurazione in server/email-service.ts
const rateLimits = {
  verification: 3, // max 3 invii per ora
  password: 2,     // max 2 reset per ora
  notifications: 10 // max 10 notifiche per ora
};
```

## 7. Monitoraggio Email

### Dashboard SendGrid
- Statistiche invii/consegne
- Bounce e spam reports
- Engagement tracking
- Webhook per eventi

### Log Applicazione
```bash
# Visualizza log email
docker exec highlander-app tail -f logs/email.log
```

### Metriche Principali
- Delivery Rate: >95%
- Open Rate: 20-30% (media)
- Bounce Rate: <5%
- Spam Rate: <0.1%

## 8. Troubleshooting

### Email non arrivano
1. Verifica API key valida
2. Controlla configurazione DNS
3. Verifica sender reputation
4. Controlla spam folder

### Errori comuni
```bash
# API key non valida
Error: 401 Unauthorized
# Soluzione: rigenera API key

# Dominio non verificato
Error: 403 Forbidden
# Soluzione: completa verifica DNS

# Rate limit superato
Error: 429 Too Many Requests
# Soluzione: implementa queue system
```

## 9. Best Practices

### Contenuto Email
- Testo semplice e chiaro
- CTA visibili e funzionanti
- Responsive design
- Alt text per immagini

### Deliverability
- Warm-up graduale del dominio
- Mantenere liste pulite
- Gestire unsubscribe
- Monitorare feedback loops

### Sicurezza
- Token firmati e scadenza breve
- Rate limiting rigoroso
- Validazione input
- Log security events

## 10. Scaling

### Volume Alto
- Upgrade piano SendGrid
- Implementare queue Redis
- Load balancing email service
- Monitoring avanzato

### Domini Multipli
- Configurazione multi-tenant
- Pool IP dedicati
- Segmentazione reputation
- A/B testing template