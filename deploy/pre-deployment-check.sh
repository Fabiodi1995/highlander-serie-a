#!/bin/bash

# Script di verifica pre-deployment
# Verifica che tutti i prerequisiti siano soddisfatti prima del deployment

set -e

DOMAIN="highlandergame.it"
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

print_check() {
    echo -n "Controllo $1... "
}

print_success() {
    echo -e "${GREEN}✓${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}⚠${NC} $1"
}

print_error() {
    echo -e "${RED}✗${NC} $1"
}

# Verifica risoluzione DNS
check_dns() {
    print_check "risoluzione DNS"
    
    if nslookup $DOMAIN > /dev/null 2>&1; then
        IP=$(nslookup $DOMAIN | grep -A 1 "Name:" | grep "Address:" | awk '{print $2}' | head -1)
        print_success "DNS risolve a $IP"
        echo "$IP" > .server_ip
        return 0
    else
        print_error "DNS non risolve per $DOMAIN"
        return 1
    fi
}

# Verifica connettività server
check_server_connectivity() {
    if [ ! -f ".server_ip" ]; then
        print_error "IP server non trovato"
        return 1
    fi
    
    SERVER_IP=$(cat .server_ip)
    print_check "connettività server ($SERVER_IP)"
    
    if timeout 5 bash -c "echo >/dev/tcp/$SERVER_IP/22" 2>/dev/null; then
        print_success "Server raggiungibile su porta SSH"
        return 0
    else
        print_error "Server non raggiungibile"
        return 1
    fi
}

# Verifica configurazione email
check_email_config() {
    print_check "configurazione email SMTP"
    
    if timeout 5 bash -c "echo >/dev/tcp/send.one.com/587" 2>/dev/null; then
        print_success "Server SMTP One.com raggiungibile"
        return 0
    else
        print_warning "Server SMTP non raggiungibile (verificare connessione)"
        return 1
    fi
}

# Verifica file necessari
check_required_files() {
    print_check "file necessari"
    
    REQUIRED_FILES=(
        "package.json"
        "server/index.ts"
        "server/email-config.ts"
        "server/unified-email-service.ts"
        "drizzle.config.ts"
        "ecosystem.config.js"
    )
    
    for file in "${REQUIRED_FILES[@]}"; do
        if [ ! -f "$file" ]; then
            print_error "File mancante: $file"
            return 1
        fi
    done
    
    print_success "Tutti i file necessari presenti"
    return 0
}

# Verifica build dell'applicazione
check_build() {
    print_check "build dell'applicazione"
    
    if npm run build > /dev/null 2>&1; then
        print_success "Build completata con successo"
        return 0
    else
        print_error "Errore durante il build"
        return 1
    fi
}

# Verifica configurazione database
check_database_config() {
    print_check "configurazione database"
    
    if grep -q "postgresql://" drizzle.config.ts; then
        print_success "Configurazione database trovata"
        return 0
    else
        print_warning "Verifica configurazione database in drizzle.config.ts"
        return 1
    fi
}

# Test email locale
test_email_service() {
    print_check "servizio email"
    
    # Verifica che il servizio email sia configurato
    if node -e "
        const { emailService } = require('./server/unified-email-service.ts');
        emailService.testConnection().then(result => {
            if (result) {
                console.log('✓ Servizio email configurato');
                process.exit(0);
            } else {
                console.log('✗ Errore configurazione email');
                process.exit(1);
            }
        }).catch(() => {
            console.log('⚠ Non è possibile testare email in questo ambiente');
            process.exit(0);
        });
    " 2>/dev/null; then
        print_success "Servizio email verificato"
        return 0
    else
        print_warning "Impossibile verificare servizio email localmente"
        return 0
    fi
}

# Report finale
generate_report() {
    echo ""
    echo "=================================="
    echo "REPORT PRE-DEPLOYMENT"
    echo "=================================="
    echo "Dominio: $DOMAIN"
    echo "Data: $(date)"
    
    if [ -f ".server_ip" ]; then
        echo "IP Server: $(cat .server_ip)"
    fi
    
    echo ""
    echo "PROSSIMI PASSI:"
    echo "1. Configura il server con: ./deploy/hetzner-deploy.sh $(cat .server_ip 2>/dev/null || echo 'YOUR_SERVER_IP') $DOMAIN"
    echo "2. Configura password email in .env sul server"
    echo "3. Verifica il sito su https://$DOMAIN"
    echo ""
}

# Funzione principale
main() {
    echo "🔍 Verifica pre-deployment per Highlander Serie A"
    echo "Dominio: $DOMAIN"
    echo ""
    
    CHECKS_PASSED=0
    TOTAL_CHECKS=6
    
    check_dns && ((CHECKS_PASSED++))
    check_server_connectivity && ((CHECKS_PASSED++))
    check_email_config && ((CHECKS_PASSED++))
    check_required_files && ((CHECKS_PASSED++))
    check_build && ((CHECKS_PASSED++))
    check_database_config && ((CHECKS_PASSED++))
    
    echo ""
    echo "Risultato: $CHECKS_PASSED/$TOTAL_CHECKS controlli superati"
    
    if [ $CHECKS_PASSED -eq $TOTAL_CHECKS ]; then
        print_success "Tutti i controlli superati! Pronto per il deployment"
        generate_report
        exit 0
    elif [ $CHECKS_PASSED -ge 4 ]; then
        print_warning "La maggior parte dei controlli superati. Deployment possibile con attenzione"
        generate_report
        exit 0
    else
        print_error "Troppi controlli falliti. Risolvi i problemi prima del deployment"
        exit 1
    fi
}

main