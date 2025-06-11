# Highlander - Gioco di Eliminazione Serie A

Un gioco multiplayer di eliminazione basato sui risultati del campionato di Serie A italiana. I giocatori selezionano squadre per ogni giornata e vengono eliminati se la loro squadra perde.

## Caratteristiche

- 🏆 Sistema di eliminazione progressiva basato sui risultati reali di Serie A
- 👥 Gestione multiplayer con dashboard amministratore
- 📊 Analytics e statistiche dettagliate
- 🎯 Sistema di achievements e classifiche
- 📱 Interfaccia mobile-first responsive
- 🔐 Autenticazione sicura con sessioni
- 📧 Sistema di notifiche (email opzionale)
- 🌐 Localizzazione italiana completa

## Tecnologie Utilizzate

### Frontend
- React 18 con TypeScript
- Vite per il bundling
- Tailwind CSS per lo styling
- shadcn/ui per i componenti
- React Query per la gestione dello stato
- Wouter per il routing
- Framer Motion per le animazioni

### Backend
- Node.js con Express
- TypeScript
- PostgreSQL con Drizzle ORM
- Passport.js per l'autenticazione
- SendGrid per le email (opzionale)

## Installazione

### Prerequisiti
- Node.js 18+ 
- PostgreSQL 13+
- npm o yarn

### Setup Database
1. Crea un database PostgreSQL
2. Copia il file `.env.example` in `.env`
3. Configura le variabili di ambiente:

```env
DATABASE_URL=postgresql://username:password@localhost:5432/highlander
SESSION_SECRET=your-super-secret-session-key
SENDGRID_API_KEY=your-sendgrid-key (opzionale)
```

### Installazione Dipendenze
```bash
npm install
```

### Migrazione Database
```bash
npm run db:migrate
```

### Avvio Sviluppo
```bash
npm run dev
```

L'applicazione sarà disponibile su `http://localhost:5000`

## Struttura del Progetto

```
├── client/          # Frontend React
│   ├── src/
│   │   ├── components/  # Componenti riutilizzabili
│   │   ├── pages/       # Pagine dell'applicazione
│   │   ├── hooks/       # Custom hooks
│   │   └── lib/         # Utilities e configurazioni
├── server/          # Backend Express
│   ├── auth.ts      # Sistema di autenticazione
│   ├── routes.ts    # API routes
│   ├── storage.ts   # Layer di accesso ai dati
│   └── db.ts        # Configurazione database
├── shared/          # Tipi condivisi
│   └── schema.ts    # Schema database e validazioni
└── uploads/         # File caricati (Excel calendari)
```

## Configurazione Amministratore

1. Registra un account utente
2. Nel database, imposta `isAdmin = true` per l'utente:
```sql
UPDATE users SET "isAdmin" = true WHERE username = 'admin-username';
```

## Funzionalità Principali

### Per gli Amministratori
- Creazione e gestione giochi
- Assegnazione ticket ai giocatori
- Controllo stati giornate (apertura/chiusura selezioni)
- Inserimento risultati partite
- Dashboard con tabelle avanzate e filtri

### Per i Giocatori
- Partecipazione ai giochi
- Selezione squadre per ogni giornata
- Visualizzazione storico e statistiche
- Sistema di achievements
- Dashboard personalizzata

## API Endpoints

### Autenticazione
- `POST /api/register` - Registrazione utente
- `POST /api/login` - Login
- `POST /api/logout` - Logout
- `GET /api/user` - Dati utente corrente

### Giochi
- `GET /api/games` - Lista giochi
- `POST /api/games` - Creazione gioco (admin)
- `GET /api/games/:id` - Dettagli gioco
- `POST /api/games/:id/tickets` - Assegnazione ticket (admin)

### Selezioni
- `POST /api/team-selections` - Invio selezioni squadre
- `GET /api/user/team-selections` - Selezioni utente

### Amministrazione
- `GET /api/admin/all-tickets` - Tutti i ticket
- `GET /api/admin/all-team-selections` - Tutte le selezioni
- `POST /api/admin/matches/:id/result` - Inserimento risultati

## Deploy

### Produzione
1. Build del progetto:
```bash
npm run build
```

2. Avvia il server:
```bash
npm start
```

### Docker (opzionale)
```bash
docker build -t highlander .
docker run -p 5000:5000 highlander
```

## Contribuire

1. Fork del repository
2. Crea un branch per la feature: `git checkout -b feature/nome-feature`
3. Commit delle modifiche: `git commit -m 'Aggiunge nuova feature'`
4. Push al branch: `git push origin feature/nome-feature`
5. Apri una Pull Request

## Licenza

Questo progetto è sotto licenza MIT. Vedi il file `LICENSE` per maggiori dettagli.

## Support

Per supporto o domande, apri una issue nel repository GitLab.