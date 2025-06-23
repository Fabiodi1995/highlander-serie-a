# Configurazione Rapida Database

## Sul Server Hetzner (esegui come root):

```bash
# 1. Trova il tuo IP pubblico
curl ifconfig.me

# 2. Configura PostgreSQL
nano /etc/postgresql/14/main/postgresql.conf
# Cambia: listen_addresses = '*'

nano /etc/postgresql/14/main/pg_hba.conf
# Aggiungi alla fine: host highlander_db highlander TUO_IP/32 md5

# 3. Firewall
ufw allow from TUO_IP to any port 5432

# 4. Riavvia
systemctl restart postgresql
```

## In DBeaver:
- Host: IP_DEL_SERVER_HETZNER
- Port: 5432
- Database: highlander_db
- Username: highlander
- Password: P3CQeyzh/YLiyxabFSMgwoxRpUPW5qw4