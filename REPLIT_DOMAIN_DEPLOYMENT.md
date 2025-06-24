# Deploy Replit con Dominio Personalizzato

## Configurazione Dominio Personalizzato

### 1. Deploy su Replit
- Vai su Deployments nel tuo Repl
- Clicca "Deploy" per creare un deployment
- Scegli il piano appropriato (vedi costi sotto)

### 2. Configurazione DNS
Nel tuo provider DNS (dove hai registrato highlandergame.it):
```
CNAME record:
Nome: www (o @)
Valore: your-app-name.replit.app
TTL: 300
```

### 3. Configurazione in Replit
- Vai nelle impostazioni del deployment
- Sezione "Custom Domain"
- Aggiungi: highlandergame.it
- Replit genererà automaticamente certificato SSL

## Costi Deployment Replit (Dicembre 2024)

### Piano Consigliato: Replit Core + Deployment
- **Replit Core**: $20/mese
- **Autoscale Deployment**: $2/100K requests + $0.50/GB RAM utilizzata

### Calcolo per 300 Utenti (3 sessioni/settimana, 15 min/sessione)

**Traffico Stimato:**
- 300 utenti × 3 sessioni/settimana = 900 sessioni/settimana
- 900 × 52 settimane = 46,800 sessioni/anno
- 46,800 × 4 mesi = 15,600 sessioni/mese

**Requests Stimati:**
- 15 min sessione = ~50 API calls/sessione
- 15,600 sessioni × 50 calls = 780,000 requests/mese

**RAM Utilizzata:**
- Applicazione Node.js: ~512MB
- Con 300 utenti concorrenti peak: ~1GB media

**Costi Mensili Stimati:**
- Replit Core: $20
- Deployment requests: 780,000 / 100,000 × $2 = $15.60
- RAM usage: 1GB × $0.50 = $0.50
- **TOTALE MENSILE: ~$36**

**Costi Annuali Stimati:**
- $36 × 12 = **$432/anno**

## Vantaggi Replit vs Server Dedicato

### Replit Pro:
- Zero configurazione server
- Scaling automatico
- SSL automatico
- Backup automatici
- Monitoraggio incluso
- Deploy con git push

### Server Dedicato Pro:
- Controllo completo
- Costi fissi
- Performance prevedibili
- Nessun limite di requests

## Configurazione Alternativa: Hybrid

Mantenere server Hetzner per produzione e usare Replit per:
- Staging/testing
- Backup deployment
- Sviluppo collaborativo

**Costo Hybrid:**
- Hetzner: €4.90/mese
- Replit (solo staging): $20/mese
- Totale: ~€27/mese ($29)

## Raccomandazione

Per 300 utenti attivi:
1. **Short term**: Continuare con Hetzner (più economico)
2. **Long term**: Migrare a Replit quando utenti > 1000
3. **Hybrid**: Usare Replit per staging, Hetzner per produzione

Il break-even è circa 500-600 utenti attivi dove i vantaggi Replit compensano i costi maggiori.