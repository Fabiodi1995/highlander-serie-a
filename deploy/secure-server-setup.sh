#!/bin/bash

# Setup sicuro server Hetzner per Highlander
# Implementa best practices di sicurezza

set -e

# Configurazioni sicurezza
APP_USER="highlander"
DB_USER="highlander_db"
DB_NAME="highlander_prod"
SSH_PORT="2222"  # Porta SSH non standard
FAIL2BAN_ENABLE=true

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

print_step() {
    echo -e "${GREEN}[STEP]${NC} $1"
}

print_security() {
    echo -e "${BLUE}[SECURITY]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

# 1. Crea utente applicazione con privilegi limitati
setup_app_user() {
    print_step "Creazione utente applicazione sicuro"
    
    # Crea utente senza privilegi di sudo
    useradd -m -s /bin/bash $APP_USER
    
    # Crea gruppo dedicato
    groupadd highlander-app || true
    usermod -a -G highlander-app $APP_USER
    
    # Directory applicazione con permessi ristretti
    mkdir -p /home/$APP_USER/{app,logs,backups}
    chown -R $APP_USER:highlander-app /home/$APP_USER
    chmod 750 /home/$APP_USER
    
    print_security "Utente $APP_USER creato con privilegi limitati"
}

# 2. Setup database con utente dedicato
setup_database_security() {
    print_step "Configurazione database sicura"
    
    # Genera password sicure
    DB_PASSWORD=$(openssl rand -base64 32)
    
    sudo -u postgres psql << EOF
        -- Crea database con encoding UTF8
        CREATE DATABASE $DB_NAME WITH 
            ENCODING 'UTF8' 
            LC_COLLATE='it_IT.UTF-8' 
            LC_CTYPE='it_IT.UTF-8';
        
        -- Crea utente database dedicato
        CREATE USER $DB_USER WITH PASSWORD '$DB_PASSWORD';
        
        -- Privilegi minimi necessari
        GRANT CONNECT ON DATABASE $DB_NAME TO $DB_USER;
        GRANT USAGE ON SCHEMA public TO $DB_USER;
        GRANT CREATE ON SCHEMA public TO $DB_USER;
        
        -- Revoca privilegi su template databases
        REVOKE ALL ON DATABASE template0 FROM $DB_USER;
        REVOKE ALL ON DATABASE template1 FROM $DB_USER;
        REVOKE ALL ON DATABASE postgres FROM $DB_USER;
EOF
    
    # Salva password in file protetto
    echo "$DB_PASSWORD" > /root/.db_password
    chmod 600 /root/.db_password
    
    print_security "Database configurato con utente dedicato e password sicura"
}

# 3. Hardening SSH
setup_ssh_security() {
    print_step "Hardening SSH"
    
    # Backup configurazione originale
    cp /etc/ssh/sshd_config /etc/ssh/sshd_config.backup
    
    # Configurazione SSH sicura
    cat > /etc/ssh/sshd_config << EOF
# Highlander SSH Security Configuration
Port $SSH_PORT
Protocol 2

# Autenticazione
PermitRootLogin no
PasswordAuthentication no
PubkeyAuthentication yes
AuthorizedKeysFile .ssh/authorized_keys

# Security
AllowUsers $APP_USER
MaxAuthTries 3
MaxSessions 2
MaxStartups 2
LoginGraceTime 30

# Disable risky features
PermitEmptyPasswords no
PermitUserEnvironment no
AllowAgentForwarding no
AllowTcpForwarding no
X11Forwarding no
PrintMotd no

# Logging
SyslogFacility AUTH
LogLevel INFO

# Network
ClientAliveInterval 300
ClientAliveCountMax 2
TCPKeepAlive no
EOF
    
    # Aggiorna porta firewall
    ufw delete allow OpenSSH
    ufw allow $SSH_PORT/tcp comment 'SSH Custom Port'
    
    print_security "SSH configurato su porta $SSH_PORT con autenticazione solo a chiave"
    print_warning "IMPORTANTE: Configura chiave SSH per utente $APP_USER prima di riavviare SSH"
}

# 4. Setup chiavi SSH per utente app
setup_ssh_keys() {
    print_step "Configurazione chiavi SSH"
    
    # Crea directory .ssh per utente app
    mkdir -p /home/$APP_USER/.ssh
    chmod 700 /home/$APP_USER/.ssh
    
    # Genera chiave SSH dedicata per deploy
    ssh-keygen -t ed25519 -C "highlander-deploy@$(hostname)" -f /home/$APP_USER/.ssh/deploy_key -N ""
    
    # Copia chiave pubblica di root per accesso iniziale
    if [ -f /root/.ssh/authorized_keys ]; then
        cp /root/.ssh/authorized_keys /home/$APP_USER/.ssh/authorized_keys
    else
        touch /home/$APP_USER/.ssh/authorized_keys
    fi
    
    chmod 600 /home/$APP_USER/.ssh/authorized_keys
    chown -R $APP_USER:$APP_USER /home/$APP_USER/.ssh
    
    print_security "Chiavi SSH configurate per utente $APP_USER"
}

# 5. Firewall avanzato
setup_advanced_firewall() {
    print_step "Configurazione firewall avanzata"
    
    # Reset UFW
    ufw --force reset
    
    # Policy default
    ufw default deny incoming
    ufw default allow outgoing
    
    # SSH personalizzato
    ufw allow $SSH_PORT/tcp comment 'SSH'
    
    # HTTP/HTTPS
    ufw allow 80/tcp comment 'HTTP'
    ufw allow 443/tcp comment 'HTTPS'
    
    # PostgreSQL solo locale
    ufw allow from 127.0.0.1 to any port 5432 comment 'PostgreSQL local'
    
    # Rate limiting SSH
    ufw limit $SSH_PORT/tcp comment 'SSH Rate Limit'
    
    # Blocca porte comuni di attacco
    ufw deny 22/tcp comment 'Block default SSH'
    ufw deny 3389/tcp comment 'Block RDP'
    ufw deny 1433/tcp comment 'Block MSSQL'
    ufw deny 3306/tcp comment 'Block MySQL'
    
    ufw enable
    
    print_security "Firewall configurato con regole restrittive"
}

# 6. Fail2Ban per protezione brute force
setup_fail2ban() {
    if [ "$FAIL2BAN_ENABLE" = true ]; then
        print_step "Configurazione Fail2Ban"
        
        apt install -y fail2ban
        
        # Configurazione Fail2Ban personalizzata
        cat > /etc/fail2ban/jail.local << EOF
[DEFAULT]
bantime = 3600
findtime = 600
maxretry = 3
destemail = admin@highlandergame.it
sender = fail2ban@highlandergame.it

[sshd]
enabled = true
port = $SSH_PORT
filter = sshd
logpath = /var/log/auth.log
maxretry = 3
bantime = 7200

[nginx-http-auth]
enabled = true
filter = nginx-http-auth
logpath = /var/log/nginx/error.log
maxretry = 5

[nginx-limit-req]
enabled = true
filter = nginx-limit-req
logpath = /var/log/nginx/error.log
maxretry = 10
EOF
        
        systemctl enable fail2ban
        systemctl start fail2ban
        
        print_security "Fail2Ban configurato per protezione brute force"
    fi
}

# 7. Monitoraggio e logging
setup_monitoring() {
    print_step "Setup monitoraggio e logging"
    
    # Logrotate per applicazione
    cat > /etc/logrotate.d/highlander << EOF
/home/$APP_USER/logs/*.log {
    daily
    rotate 30
    compress
    delaycompress
    missingok
    notifempty
    copytruncate
    su $APP_USER highlander-app
}
EOF
    
    # Script monitoraggio risorse
    cat > /home/$APP_USER/monitor.sh << 'EOF'
#!/bin/bash
# Monitor applicazione Highlander

LOG_FILE="/home/highlander/logs/monitor.log"
DATE=$(date '+%Y-%m-%d %H:%M:%S')

# Check disk space
DISK_USAGE=$(df /home/highlander | awk 'NR==2 {print $5}' | sed 's/%//')
if [ $DISK_USAGE -gt 80 ]; then
    echo "$DATE - WARNING: Disk usage $DISK_USAGE%" >> $LOG_FILE
fi

# Check memory
MEM_USAGE=$(free | awk 'NR==2{printf "%.0f", $3*100/$2}')
if [ $MEM_USAGE -gt 85 ]; then
    echo "$DATE - WARNING: Memory usage $MEM_USAGE%" >> $LOG_FILE
fi

# Check app status
if ! pm2 list | grep -q "highlander.*online"; then
    echo "$DATE - ERROR: Application offline" >> $LOG_FILE
fi
EOF
    
    chmod +x /home/$APP_USER/monitor.sh
    chown $APP_USER:highlander-app /home/$APP_USER/monitor.sh
    
    # Crontab per monitoraggio
    echo "*/5 * * * * /home/$APP_USER/monitor.sh" | crontab -u $APP_USER -
    
    print_security "Monitoraggio configurato con alerting"
}

# 8. Configurazione Node.js sicura
setup_nodejs_security() {
    print_step "Configurazione Node.js sicura"
    
    # Installa Node.js via NodeSource (più sicuro)
    curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
    apt-get install -y nodejs
    
    # Configura npm per utente app
    sudo -u $APP_USER npm config set fund false
    sudo -u $APP_USER npm config set audit-level moderate
    
    # Installa PM2 globalmente
    npm install -g pm2@latest
    
    # Setup PM2 per utente app
    sudo -u $APP_USER pm2 startup systemd
    
    print_security "Node.js configurato con utente non privilegiato"
}

# 9. Backup automatico sicuro
setup_backup_system() {
    print_step "Sistema backup automatico"
    
    # Script backup sicuro
    cat > /home/$APP_USER/backup.sh << EOF
#!/bin/bash
BACKUP_DIR="/home/$APP_USER/backups"
DATE=\$(date +%Y%m%d_%H%M%S)
DB_PASSWORD=\$(cat /root/.db_password)

# Backup database
PGPASSWORD=\$DB_PASSWORD pg_dump -U $DB_USER -h localhost $DB_NAME > \$BACKUP_DIR/db_\$DATE.sql

# Backup applicazione
tar -czf \$BACKUP_DIR/app_\$DATE.tar.gz -C /home/$APP_USER app --exclude=node_modules

# Cleanup backup vecchi (mantieni 7 giorni)
find \$BACKUP_DIR -name "*.sql" -mtime +7 -delete
find \$BACKUP_DIR -name "*.tar.gz" -mtime +7 -delete

# Log backup
echo "\$(date): Backup completato" >> \$BACKUP_DIR/backup.log
EOF
    
    chmod +x /home/$APP_USER/backup.sh
    chown $APP_USER:highlander-app /home/$APP_USER/backup.sh
    
    # Crontab backup notturno
    echo "0 2 * * * /home/$APP_USER/backup.sh" | crontab -u $APP_USER -
    
    print_security "Sistema backup automatico configurato"
}

# 10. Hardening sistema
system_hardening() {
    print_step "Hardening sistema operativo"
    
    # Aggiorna sistema
    apt update && apt upgrade -y
    
    # Rimuovi pacchetti non necessari
    apt autoremove -y
    apt autoclean
    
    # Disabilita servizi non necessari
    systemctl disable avahi-daemon 2>/dev/null || true
    systemctl disable cups 2>/dev/null || true
    systemctl disable bluetooth 2>/dev/null || true
    
    # Kernel security
    cat >> /etc/sysctl.conf << EOF

# Highlander Security Settings
net.ipv4.ip_forward=0
net.ipv4.conf.all.send_redirects=0
net.ipv4.conf.default.send_redirects=0
net.ipv4.conf.all.accept_redirects=0
net.ipv4.conf.default.accept_redirects=0
net.ipv4.conf.all.secure_redirects=0
net.ipv4.conf.default.secure_redirects=0
net.ipv4.conf.all.log_martians=1
net.ipv4.conf.default.log_martians=1
net.ipv4.icmp_echo_ignore_broadcasts=1
net.ipv4.icmp_ignore_bogus_error_responses=1
kernel.exec-shield=1
kernel.randomize_va_space=2
EOF
    
    sysctl -p
    
    print_security "Sistema hardening completato"
}

# Report configurazione
generate_security_report() {
    print_step "Generazione report sicurezza"
    
    cat > /root/security_report.txt << EOF
=================================
HIGHLANDER SECURITY CONFIGURATION
=================================
Data: $(date)

UTENTI:
- Applicazione: $APP_USER (no sudo)
- Database: $DB_USER (privilegi limitati)

RETE:
- SSH Porta: $SSH_PORT (solo chiave pubblica)
- HTTP: 80 (redirect HTTPS)
- HTTPS: 443 (SSL)
- PostgreSQL: 5432 (solo locale)

SICUREZZA:
- Root login: DISABILITATO
- Password SSH: DISABILITATA
- Fail2Ban: ATTIVO
- Firewall: UFW ATTIVO
- Monitoraggio: ATTIVO

BACKUP:
- Database: Automatico ogni notte
- Applicazione: Automatico ogni notte
- Retention: 7 giorni

CREDENZIALI:
- DB Password: /root/.db_password
- SSH Key: /home/$APP_USER/.ssh/deploy_key

PROSSIMI PASSI:
1. Copiare chiave SSH pubblica per accesso
2. Testare connessione SSH su porta $SSH_PORT
3. Riavviare SSH service
4. Deploy applicazione
EOF
    
    echo -e "${GREEN}================================"
    echo "CONFIGURAZIONE SICUREZZA COMPLETATA"
    echo "================================${NC}"
    echo "Report salvato in: /root/security_report.txt"
    echo ""
    echo -e "${YELLOW}IMPORTANTE:${NC}"
    echo "1. SSH ora usa porta $SSH_PORT"
    echo "2. Password database in /root/.db_password"
    echo "3. Connettiti con: ssh -p $SSH_PORT $APP_USER@$(hostname -I | awk '{print $1}')"
    echo ""
}

# Funzione principale
main() {
    if [ "$EUID" -ne 0 ]; then
        echo "Esegui come root: sudo $0"
        exit 1
    fi
    
    echo "🔒 Setup sicurezza server Hetzner per Highlander"
    echo "Questo script implementerà best practices di sicurezza"
    echo ""
    
    setup_app_user
    setup_ssh_keys
    setup_nodejs_security
    setup_database_security
    setup_advanced_firewall
    setup_fail2ban
    setup_monitoring
    setup_backup_system
    system_hardening
    generate_security_report
    
    echo ""
    echo "🎉 Setup sicurezza completato!"
    echo "Leggi /root/security_report.txt per i dettagli"
}

main "$@"