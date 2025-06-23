#!/bin/bash

# Script per configurare PostgreSQL per accesso esterno sicuro
# Eseguire sul server Hetzner come root

echo "🔧 Configurazione PostgreSQL per accesso esterno..."

# Backup delle configurazioni originali
sudo cp /etc/postgresql/14/main/postgresql.conf /etc/postgresql/14/main/postgresql.conf.backup
sudo cp /etc/postgresql/14/main/pg_hba.conf /etc/postgresql/14/main/pg_hba.conf.backup

echo "✅ Backup configurazioni create"

# Configura postgresql.conf per permettere connessioni esterne
sudo sed -i "s/#listen_addresses = 'localhost'/listen_addresses = '*'/" /etc/postgresql/14/main/postgresql.conf

# Verifica se la modifica è stata applicata
if grep -q "listen_addresses = '\*'" /etc/postgresql/14/main/postgresql.conf; then
    echo "✅ listen_addresses configurato correttamente"
else
    echo "❌ Errore nella configurazione di listen_addresses"
    exit 1
fi

# Richiedi IP del client
echo ""
echo "📝 Per configurare l'accesso sicuro, inserisci il tuo IP pubblico:"
echo "   Puoi trovarlo visitando: https://whatismyipaddress.com/"
read -p "Inserisci il tuo IP pubblico: " CLIENT_IP

if [[ -z "$CLIENT_IP" ]]; then
    echo "❌ IP non fornito. Uscita."
    exit 1
fi

# Valida formato IP
if [[ ! $CLIENT_IP =~ ^[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}$ ]]; then
    echo "❌ Formato IP non valido. Uscita."
    exit 1
fi

echo "✅ IP validato: $CLIENT_IP"

# Aggiungi regola di accesso specifica per l'IP client
echo "" >> /etc/postgresql/14/main/pg_hba.conf
echo "# Accesso specifico per DBeaver" >> /etc/postgresql/14/main/pg_hba.conf
echo "host    highlander_db    highlander    $CLIENT_IP/32    md5" >> /etc/postgresql/14/main/pg_hba.conf

echo "✅ Regola di accesso aggiunta per IP: $CLIENT_IP"

# Configura firewall UFW
sudo ufw allow from $CLIENT_IP to any port 5432
echo "✅ Firewall configurato per IP: $CLIENT_IP"

# Riavvia PostgreSQL
sudo systemctl restart postgresql

if sudo systemctl is-active --quiet postgresql; then
    echo "✅ PostgreSQL riavviato con successo"
else
    echo "❌ Errore nel riavvio di PostgreSQL"
    exit 1
fi

# Test connessione locale
if sudo -u postgres psql -c "SELECT version();" > /dev/null 2>&1; then
    echo "✅ Test connessione locale: OK"
else
    echo "❌ Test connessione locale: FALLITO"
    exit 1
fi

echo ""
echo "🎉 Configurazione completata!"
echo ""
echo "📋 Dettagli per DBeaver:"
echo "   Host: $(curl -s ifconfig.me)"
echo "   Port: 5432"
echo "   Database: highlander_db"
echo "   Username: highlander"
echo "   Password: P3CQeyzh/YLiyxabFSMgwoxRpUPW5qw4"
echo ""
echo "⚠️  IMPORTANTE:"
echo "   - Solo l'IP $CLIENT_IP può accedere al database"
echo "   - Per aggiungere altri IP, modifica /etc/postgresql/14/main/pg_hba.conf"
echo "   - Per maggiore sicurezza, usa sempre tunnel SSH quando possibile"
echo ""
echo "🔄 Per disabilitare l'accesso esterno:"
echo "   sudo systemctl stop postgresql"
echo "   sudo cp /etc/postgresql/14/main/postgresql.conf.backup /etc/postgresql/14/main/postgresql.conf"
echo "   sudo cp /etc/postgresql/14/main/pg_hba.conf.backup /etc/postgresql/14/main/pg_hba.conf"
echo "   sudo systemctl start postgresql"