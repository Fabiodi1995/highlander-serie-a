# Highlander - Serie A Elimination Game

Una sofisticata applicazione multiplayer di eliminazione basata sui risultati della Serie A 2025/26.

## Caratteristiche

- **Gioco di Eliminazione**: Sistema di gioco basato sui risultati reali della Serie A
- **Autenticazione Completa**: Sistema di login/registrazione con verifica email
- **Email Service**: Integrazione SendGrid per verifica account e reset password
- **Dashboard Analytics**: Statistiche avanzate delle performance utente
- **Sistema Tickets**: Gestione biglietti e partecipazioni ai giochi
- **Mobile Responsive**: Design ottimizzato per desktop e mobile
- **PWA Ready**: Installabile come app mobile

## Tecnologie

- **Frontend**: React 18, TypeScript, Tailwind CSS, Vite
- **Backend**: Node.js, Express, TypeScript
- **Database**: PostgreSQL con Drizzle ORM
- **Email**: SendGrid API
- **Autenticazione**: Passport.js con sessioni
- **Deployment**: Nginx, PM2, Let's Encrypt SSL

## Installazione e Deployment

### Prerequisiti
- Node.js 18+
- PostgreSQL 14+
- Dominio con SSL
- Account SendGrid

### 1. Clone Repository
```bash
git clone https://github.com/tuousername/highlander-serie-a.git
cd highlander-serie-a
```

### 2. Installazione Dipendenze
```bash
npm install
```

### 3. Configurazione Database
```sql
CREATE DATABASE highlander;
CREATE USER highlander_user WITH PASSWORD 'password_sicura';
GRANT ALL PRIVILEGES ON DATABASE highlander TO highlander_user;
```

### 4. Environment Variables
Crea file `.env`:
```env
DATABASE_URL=postgresql://highlander_user:password@localhost:5432/highlander
SENDGRID_API_KEY=tua_sendgrid_api_key
FROM_EMAIL=tuo_email_verificato@dominio.com
SESSION_SECRET=stringa_casuale_molto_lunga
BASE_URL=https://tuodominio.com
NODE_ENV=production
PORT=3000
```

### 5. Build e Deploy
```bash
npm run build
npm run db:push
pm2 start ecosystem.config.js --env production
```

### 6. Configurazione Nginx
```nginx
server {
    listen 443 ssl;
    server_name tuodominio.com;
    
    ssl_certificate /etc/letsencrypt/live/tuodominio.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/tuodominio.com/privkey.pem;
    
    location / {
        proxy_pass http://localhost:3000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

## Struttura del Progetto

```
├── client/               # Frontend React
│   ├── src/
│   │   ├── components/   # Componenti UI
│   │   ├── pages/        # Pagine applicazione
│   │   ├── hooks/        # Custom hooks
│   │   └── lib/          # Utilities
├── server/               # Backend Express
│   ├── auth.ts           # Sistema autenticazione
│   ├── routes.ts         # API endpoints
│   ├── email-service.ts  # Servizio email
│   └── db.ts             # Database connection
├── shared/               # Codice condiviso
│   └── schema.ts         # Schema database
└── uploads/              # File caricati
```

## API Endpoints

### Autenticazione
- `POST /api/register` - Registrazione utente
- `POST /api/login` - Login utente
- `POST /api/logout` - Logout utente
- `GET /api/user` - Info utente corrente

### Email
- `POST /api/forgot-password` - Richiesta reset password
- `POST /api/reset-password` - Reset password con token
- `GET /api/verify-email` - Verifica email con token
- `POST /api/resend-verification` - Reinvia email verifica

### Gioco
- `GET /api/games` - Lista giochi
- `POST /api/games` - Crea nuovo gioco
- `GET /api/games/:id` - Dettagli gioco
- `POST /api/team-selections` - Selezione squadre

### Validazione
- `GET /api/validate/email/:email` - Verifica disponibilità email
- `GET /api/validate/username/:username` - Verifica disponibilità username

## Sviluppo

### Avvio Ambiente di Sviluppo
```bash
npm run dev
```

### Comandi Utili
```bash
npm run build          # Build produzione
npm run check          # Check TypeScript
npm run db:push        # Aggiorna schema database
```

## Licenza

MIT License