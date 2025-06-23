# 🗄️ Guida Connessione Database con DBeaver

## Informazioni di Connessione Produzione

### Credenziali Database PostgreSQL
- **Host**: `localhost` (tramite tunnel SSH)
- **Port**: `5432`
- **Database**: `highlander_db`
- **Username**: `highlander`
- **Password**: `P3CQeyzh/YLiyxabFSMgwoxRpUPW5qw4`

### Server Hetzner
- **IP Server**: [il tuo IP server Hetzner]
- **User SSH**: `root`
- **Porta SSH**: `22`

## Procedura Connessione Passo-Passo

### 1. Connessione da IP Esterno

#### Opzione A: Tunnel SSH da qualsiasi IP
```bash
# Da qualsiasi computer con accesso SSH
ssh -L 5432:localhost:5432 root@[YOUR-HETZNER-SERVER-IP]
```

#### Opzione B: Accesso diretto PostgreSQL (meno sicuro)
Se necessario configurare accesso diretto, modifica su Hetzner:

```bash
# Sul server Hetzner
sudo nano /etc/postgresql/14/main/postgresql.conf
# Modifica: listen_addresses = '*'

sudo nano /etc/postgresql/14/main/pg_hba.conf
# Aggiungi: host highlander_db highlander YOUR_IP/32 md5

sudo systemctl restart postgresql
sudo ufw allow from YOUR_IP to any port 5432
```

#### Opzione C: Tunnel SSH con chiave privata
```bash
# Se usi chiave SSH invece di password
ssh -i /path/to/private_key -L 5432:localhost:5432 root@[YOUR-HETZNER-SERVER-IP]
```

### 2. Configurazione DBeaver

#### Con Tunnel SSH (Raccomandato)
1. **Apri DBeaver**
2. **New Database Connection** → **PostgreSQL**
3. **Main Tab**:
   - Host: `localhost`
   - Port: `5432`
   - Database: `highlander_db`
   - Username: `highlander`
   - Password: `P3CQeyzh/YLiyxabFSMgwoxRpUPW5qw4`

4. **SSH Tab** (se non usi tunnel manuale):
   - Use SSH Tunnel: ✓
   - Host/IP: `[YOUR-HETZNER-SERVER-IP]`
   - Port: `22`
   - User: `root`
   - Authentication: Password/Key
   - Local Port: `5432`

#### Connessione Diretta (dopo configurazione server)
1. **Main Tab**:
   - Host: `[YOUR-HETZNER-SERVER-IP]`
   - Port: `5432`
   - Database: `highlander_db`
   - Username: `highlander`
   - Password: `P3CQeyzh/YLiyxabFSMgwoxRpUPW5qw4`

5. **Test Connection** → **OK**

### 3. Verifica Connessione

Query di test:
```sql
-- Verifica versione PostgreSQL
SELECT version();

-- Lista tabelle
SELECT table_name FROM information_schema.tables 
WHERE table_schema = 'public';

-- Conteggio utenti
SELECT COUNT(*) FROM users;

-- Verifica struttura tabella users
\d users;
```

## Struttura Database Highlander

### Tabelle Principali
- `users` - Utenti registrati
- `games` - Partite create
- `tickets` - Biglietti giocatori
- `team_selections` - Selezioni squadre
- `teams` - Squadre Serie A
- `matches` - Partite Serie A
- `game_participants` - Partecipanti ai giochi

### Query Utili per Debug

```sql
-- Ultimi utenti registrati
SELECT id, username, email, "isAdmin", "emailVerified", "createdAt"
FROM users 
ORDER BY "createdAt" DESC 
LIMIT 10;

-- Giochi attivi
SELECT id, name, status, "currentRound", deadline, "createdAt"
FROM games 
WHERE status = 'active';

-- Tokens password reset attivi
SELECT email, token, "expiresAt", "usedAt", "createdAt"
FROM password_reset_tokens 
WHERE "expiresAt" > NOW() 
AND "usedAt" IS NULL;

-- Tokens verifica email
SELECT "userId", email, token, "expiresAt", "createdAt"
FROM email_verification_tokens 
WHERE "expiresAt" > NOW();
```

## Risoluzione Problemi Comuni

### Connessione Rifiutata
```bash
# Verifica che PostgreSQL sia in esecuzione
sudo systemctl status postgresql

# Riavvia se necessario
sudo systemctl restart postgresql
```

### Tunnel SSH Disconnesso
```bash
# Verifica connessione SSH
ssh root@[YOUR-SERVER-IP] "echo 'SSH OK'"

# Ricrea tunnel
ssh -L 5432:localhost:5432 root@[YOUR-SERVER-IP]
```

### Password Database Errata
```bash
# Accesso diretto al server per reset password
sudo -u postgres psql
ALTER USER highlander WITH PASSWORD 'NuovaPassword';
```

## Sicurezza

⚠️ **Importante**:
- Non condividere mai le credenziali database
- Usa sempre tunnel SSH per connessioni remote
- Evita query DELETE/DROP in produzione
- Fai backup prima di modifiche importanti

### Backup Database
```bash
# Backup completo
pg_dump -h localhost -U highlander highlander_db > backup_$(date +%Y%m%d).sql

# Backup solo struttura
pg_dump -h localhost -U highlander --schema-only highlander_db > schema_backup.sql
```

### Restore Database
```bash
# Restore completo
psql -h localhost -U highlander highlander_db < backup_20241223.sql
```

La connessione è ora configurata correttamente per accedere al database di produzione in sicurezza.