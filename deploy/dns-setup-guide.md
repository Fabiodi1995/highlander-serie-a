# Configurazione DNS per highlandergame.it

## 1. Configurazione DNS Records

Nel pannello di controllo del tuo provider DNS (probabilmente One.com), configura questi record:

```
Tipo    Nome                Valore                      TTL
A       @                   [IP-SERVER-HETZNER]         3600
A       www                 [IP-SERVER-HETZNER]         3600
CNAME   mail                @                           3600
MX      @                   mail.highlandergame.it      10
TXT     @                   "v=spf1 include:spf.one.com ~all"   3600
```

**Sostituisci `[IP-SERVER-HETZNER]` con l'IP reale del tuo server.**

## 2. Verifica DNS

Dopo aver configurato i record DNS, verifica la propagazione:

```bash
# Verifica record A
dig highlandergame.it A
dig www.highlandergame.it A

# Verifica record MX
dig highlandergame.it MX

# Test connessione
ping highlandergame.it
```

## 3. Tempi di Propagazione

- **DNS locale**: 5-15 minuti
- **DNS globale**: 24-48 ore (massimo)
- **Verifica**: Usa tools online come `whatsmydns.net`

## 4. Configurazione Email (One.com)

Se il dominio è registrato su One.com:

1. **Accedi al pannello One.com**
2. **Vai su "Email" → "Gestione Email"**
3. **Crea account**: `support@highlandergame.it`
4. **Imposta password sicura**
5. **Copia le credenziali SMTP**:
   - Server: `send.one.com`
   - Porta: `587`
   - Username: `support@highlandergame.it`
   - Password: [quella che hai impostato]

## 5. Test Finale

Prima del deployment, verifica:

```bash
# Test risoluzione DNS
nslookup highlandergame.it

# Test connessione server
telnet [IP-SERVER-HETZNER] 80
telnet [IP-SERVER-HETZNER] 443

# Test email SMTP (dal server)
telnet send.one.com 587
```

## 6. Checklist Pre-Deployment

- [ ] Record DNS A configurati
- [ ] Record DNS CNAME per www configurato  
- [ ] Record MX per email configurato
- [ ] Email support@highlandergame.it creata
- [ ] Password email salvata in sicurezza
- [ ] IP server Hetzner annotato
- [ ] Accesso SSH al server funzionante

## 7. Configurazione Firewall Server

Sul server Hetzner, assicurati che questi porti siano aperti:

```bash
# SSH
ufw allow 22

# HTTP/HTTPS
ufw allow 80
ufw allow 443

# PostgreSQL (locale)
ufw allow from localhost to any port 5432

# Attiva firewall
ufw enable
```

## 8. Configurazione One.com Email

### Impostazioni IMAP (per leggere email)
- Server: `imap.one.com`
- Porta: `993` (SSL)
- Sicurezza: `SSL/TLS`

### Impostazioni SMTP (per inviare email)
- Server: `send.one.com`
- Porta: `587` (STARTTLS)
- Sicurezza: `STARTTLS`
- Autenticazione: `Username/Password`

## 9. Backup Configurazione

Salva queste informazioni in un posto sicuro:
- IP server Hetzner
- Credenziali email support@highlandergame.it
- Password database PostgreSQL
- Chiavi SSH

## 10. Monitoraggio Post-Deployment

Dopo il deployment, monitora:
- Uptime del sito: `https://highlandergame.it`
- Funzionalità email di verifica
- Performance database
- Log dell'applicazione: `/home/highlander/logs/`