# Guida Configurazione One.com per Highlander Game

## Passo 1: Configura Email su One.com

1. **Accedi al pannello One.com**
   - Vai su [one.com](https://www.one.com)
   - Fai login con le tue credenziali

2. **Crea l'indirizzo email**
   - Nel menu, clicca su "Email"
   - Clicca "Crea nuova casella email"
   - Inserisci: `support@highlandergame.it`
   - Imposta una password sicura
   - Salva

3. **Verifica configurazione SMTP**
   - Le impostazioni sono già pre-configurate nel sistema:
     - Host: `send.one.com`
     - Porta: `587`
     - Sicurezza: `STARTTLS`

## Passo 2: Configura Variabili Ambiente

Nel file `.env` del server (o nelle variabili ambiente di Replit), aggiungi:

```bash
SMTP_USER=support@highlandergame.it
SMTP_PASSWORD=la_password_che_hai_impostato_su_onecom
BASE_URL=https://highlandergame.it
```

## Passo 3: Test su Replit

Per testare su Replit prima del deployment:

1. **Nelle Secrets di Replit**, aggiungi:
   - `SMTP_USER`: `support@highlandergame.it`
   - `SMTP_PASSWORD`: la tua password One.com

2. **Riavvia l'applicazione**
   - Il sistema mostrerà: "Email provider configured: smtp"
   - Verrà eseguito automaticamente un test di connessione

## Passo 4: Test Funzionamento

1. **Registra un nuovo utente** nell'app
2. **Controlla i log del server** per vedere se l'email viene inviata
3. **Se configurato correttamente**, riceverai l'email di verifica su One.com

## Risoluzione Problemi

### Errore "Authentication failed"
- Verifica che la password sia corretta
- Assicurati che l'email sia attiva su One.com

### Errore "Connection timeout"
- Verifica che non ci siano firewall che bloccano la porta 587
- Riprova dopo qualche minuto

### Email non arriva
- Controlla la cartella spam
- Verifica che il dominio sia configurato correttamente su One.com

## Stato Attuale Sistema

- ✅ Sistema email configurato per One.com
- ✅ Funziona in modalità sviluppo (stampa in console)
- ✅ Pronto per produzione con credenziali One.com
- ✅ Template email ottimizzati per highlandergame.it
- ✅ Test automatici di configurazione

## Prossimi Passi

1. Aggiungi le credenziali One.com nelle Secrets di Replit
2. Testa la registrazione utente
3. Verifica che le email arrivino correttamente
4. Deploy in produzione con le stesse credenziali