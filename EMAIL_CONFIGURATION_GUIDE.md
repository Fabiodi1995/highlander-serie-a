# Guida Configurazione Email - Highlander Serie A

Il sistema supporta diverse opzioni per l'invio di email di verifica e reset password.

## Opzione 1: SMTP con One.com (GRATUITO) ✅ RACCOMANDATO

Se hai acquistato il dominio su One.com, puoi utilizzare gratuitamente le email personalizzate.

### Configurazione One.com

1. **Accedi al pannello One.com** e vai su "Email"
2. **Crea l'email**: `support@highlander.it` 
3. **Imposta una password sicura** per questa email
4. **Nel file .env del server**, aggiungi:

```bash
# SMTP Configuration (One.com)
SMTP_USER=support@highlander.it
SMTP_PASSWORD=la_password_che_hai_impostato

# NON impostare SENDGRID_API_KEY se usi SMTP
# BASE_URL viene rilevato automaticamente in base all'ambiente
```

### Vantaggi One.com SMTP:
- ✅ **Completamente gratuito** (incluso nel costo del dominio)
- ✅ **Nessun limite mensile** (uso ragionevole)
- ✅ **Email professionale** da support@highlander.it
- ✅ **Alta deliverability** (dominio verificato)

## Opzione 2: SendGrid (Limitato nel tempo)

SendGrid offre 100 email gratuite al giorno per il primo mese, poi diventa a pagamento.

```bash
# SendGrid Configuration
SENDGRID_API_KEY=your_sendgrid_api_key
FROM_EMAIL=support@highlander.it

# NON impostare SMTP_USER se usi SendGrid
```

## Alternative Gratuite Permanenti

### 1. **Brevo (ex-Sendinblue)** - MIGLIORE ALTERNATIVA
- ✅ **300 email/giorno GRATIS per sempre**
- ✅ API simile a SendGrid
- ✅ Eccellente per progetti piccoli/medi

### 2. **Mailgun**
- ✅ **5.000 email/mese gratis per 3 mesi**
- ✅ Poi 1.000 email/mese gratis
- ✅ Molto affidabile

### 3. **Postmark**
- ✅ **100 email/mese gratis per sempre**
- ✅ Ottima deliverability
- ✅ Perfetto per notifiche

### 4. **Gmail SMTP** (sconsigliato per produzione)
- ⚠️ **500 email/giorno** con account Gmail gratuito
- ⚠️ Rischio di essere marcato come spam
- ⚠️ Non professionale

## Come Funziona la Selezione Automatica

Il sistema rileva automaticamente quale servizio utilizzare:

```typescript
// Priorità:
1. Se SMTP_USER e SMTP_PASSWORD sono impostati → USA SMTP
2. Se SENDGRID_API_KEY è impostato → USA SendGrid  
3. Altrimenti → Modalità sviluppo (stampa in console)
```

## Configurazione per One.com - Passo per Passo

### 1. Accedi al pannello One.com
- Vai su [one.com](https://www.one.com) e accedi

### 2. Configura l'email
- Clicca su "Email" nel menu
- Crea una nuova casella email: `support@highlander.it`
- Imposta una password sicura

### 3. Trova le impostazioni SMTP
Le impostazioni One.com sono già configurate nel codice:
```
Host: send.one.com
Porta: 587
Sicurezza: STARTTLS
```

### 4. Testa la configurazione
Nel terminale del server, puoi testare:

```bash
# Avvia il server con le nuove variabili
npm run dev

# Il sistema mostrerà:
# "Email provider configured: smtp"
# "✅ Connessione SMTP verificata"
```

## Migrazione da SendGrid a SMTP

Se hai già configurato SendGrid e vuoi passare a SMTP:

1. **Nel file .env**:
   - Commenta `SENDGRID_API_KEY`
   - Aggiungi `SMTP_USER` e `SMTP_PASSWORD`

2. **Riavvia il server**:
   ```bash
   npm run dev
   ```

3. **Verifica nei log**:
   ```
   Email provider configured: smtp
   ```

## Risoluzione Problemi

### Errore "Authentication failed"
- Verifica username e password
- Controlla che l'email sia attiva su One.com

### Email non arrivano
- Controlla la cartella spam del destinatario
- Verifica che il dominio sia configurato correttamente

### Errore "Connection timeout"
- Verifica la connessione internet
- Controlla che le porte SMTP non siano bloccate

## Costi Comparati (mensili)

| Servizio | Email/mese | Costo |
|----------|------------|-------|
| **One.com SMTP** | Illimitate* | **€0** (incluso nel dominio) |
| **Brevo** | 9.000 | **€0** |
| **Mailgun** | 1.000 | **€0** (dopo promo) |
| **Postmark** | 100 | **€0** |
| **SendGrid** | 40.000 | **€18** |

*uso ragionevole

## Conclusione

**Per Highlander Serie A, raccomando vivamente One.com SMTP**:
- Zero costi aggiuntivi
- Email professionale
- Configurazione semplice
- Perfetto per un'app di gaming

Il sistema è già pronto per funzionare con entrambe le opzioni!