#!/bin/bash

# Script di monitoraggio per Highlander App
set -e

# Colori per output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Funzione per logging
log() {
    echo -e "${GREEN}[$(date +'%Y-%m-%d %H:%M:%S')] $1${NC}"
}

warn() {
    echo -e "${YELLOW}[$(date +'%Y-%m-%d %H:%M:%S')] WARNING: $1${NC}"
}

error() {
    echo -e "${RED}[$(date +'%Y-%m-%d %H:%M:%S')] ERROR: $1${NC}"
}

# Verifica stato container
check_containers() {
    log "Controllo stato container..."
    
    if ! docker-compose ps | grep -q "Up"; then
        error "Nessun container in esecuzione"
        return 1
    fi
    
    # Verifica container specifici
    containers=("highlander-app" "highlander-postgres" "highlander-nginx")
    for container in "${containers[@]}"; do
        if docker-compose ps | grep $container | grep -q "Up"; then
            log "$container: ONLINE"
        else
            warn "$container: OFFLINE o NON TROVATO"
        fi
    done
}

# Health check applicazione
check_health() {
    log "Health check applicazione..."
    
    # Test connettività interna
    if docker exec highlander-app curl -sf http://localhost:3000/api/health > /dev/null; then
        log "Health check interno: OK"
    else
        error "Health check interno: FALLITO"
    fi
    
    # Test connettività esterna
    if curl -sf http://localhost/health > /dev/null; then
        log "Health check esterno: OK"
    else
        warn "Health check esterno: FALLITO"
    fi
}

# Verifica database
check_database() {
    log "Controllo database..."
    
    if docker exec highlander-postgres pg_isready -U highlander > /dev/null; then
        log "Database: ONLINE"
        
        # Verifica connessioni attive
        connections=$(docker exec highlander-postgres psql -U highlander -d highlander_prod -t -c "SELECT count(*) FROM pg_stat_activity WHERE state = 'active';")
        log "Connessioni attive: $connections"
        
        # Verifica dimensione database
        size=$(docker exec highlander-postgres psql -U highlander -d highlander_prod -t -c "SELECT pg_size_pretty(pg_database_size('highlander_prod'));")
        log "Dimensione database: $size"
    else
        error "Database: OFFLINE"
    fi
}

# Monitoraggio risorse
check_resources() {
    log "Controllo risorse sistema..."
    
    # CPU e Memoria
    echo "=== Uso CPU e Memoria ==="
    docker stats --no-stream --format "table {{.Container}}\t{{.CPUPerc}}\t{{.MemUsage}}\t{{.MemPerc}}"
    
    # Spazio disco
    echo "=== Spazio Disco ==="
    df -h /
    
    # Verifica log size
    echo "=== Dimensione Log ==="
    du -sh /var/lib/docker/containers/*/
}

# Backup automatico
backup_database() {
    log "Avvio backup database..."
    
    backup_dir="/opt/highlander/backups"
    mkdir -p $backup_dir
    
    backup_file="$backup_dir/highlander_$(date +%Y%m%d_%H%M%S).sql"
    
    if docker exec highlander-postgres pg_dump -U highlander highlander_prod > $backup_file; then
        log "Backup completato: $backup_file"
        
        # Comprimi backup
        gzip $backup_file
        log "Backup compresso: $backup_file.gz"
        
        # Rimuovi backup vecchi (mantieni ultimi 7 giorni)
        find $backup_dir -name "*.sql.gz" -mtime +7 -delete
        log "Backup vecchi rimossi"
    else
        error "Backup fallito"
    fi
}

# Pulizia sistema
cleanup_system() {
    log "Pulizia sistema..."
    
    # Rimuovi container fermi
    docker container prune -f
    
    # Rimuovi immagini non utilizzate
    docker image prune -f
    
    # Rimuovi volumi orfani
    docker volume prune -f
    
    # Pulisci log Docker
    docker system prune -f
    
    log "Pulizia completata"
}

# Verifica SSL
check_ssl() {
    log "Controllo certificati SSL..."
    
    domain=$(grep -o 'server_name [^;]*' deploy/nginx.conf | head -1 | awk '{print $2}')
    
    if [[ -f "/opt/highlander/ssl/fullchain.pem" ]]; then
        expiry=$(openssl x509 -in /opt/highlander/ssl/fullchain.pem -noout -enddate | cut -d= -f2)
        log "Certificato SSL scade: $expiry"
        
        # Verifica se scade nei prossimi 30 giorni
        if openssl x509 -in /opt/highlander/ssl/fullchain.pem -noout -checkend $((30*24*3600)) > /dev/null; then
            log "Certificato SSL: VALIDO"
        else
            warn "Certificato SSL: SCADE TRA MENO DI 30 GIORNI"
        fi
    else
        warn "Certificato SSL non trovato"
    fi
}

# Funzione principale
main() {
    case "${1:-status}" in
        "status")
            check_containers
            check_health
            check_database
            check_ssl
            ;;
        "resources")
            check_resources
            ;;
        "backup")
            backup_database
            ;;
        "cleanup")
            cleanup_system
            ;;
        "full")
            check_containers
            check_health
            check_database
            check_resources
            check_ssl
            backup_database
            ;;
        *)
            echo "Uso: $0 {status|resources|backup|cleanup|full}"
            echo "  status    - Controllo stato servizi"
            echo "  resources - Monitoraggio risorse"
            echo "  backup    - Backup database"
            echo "  cleanup   - Pulizia sistema"
            echo "  full      - Controllo completo"
            exit 1
            ;;
    esac
}

main "$@"