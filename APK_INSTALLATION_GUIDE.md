# 📱 Guida Installazione APK Android - Highlander

## ⚠️ Problema APK e Soluzioni Alternative

### Problema Identificato
L'APK generato automaticamente presenta errori di parsing su dispositivi Android. Questo è un problema comune con APK generati da PWA tools che non includono le corrette firme digitali Android.

### ✅ Soluzioni Raccomandate (in ordine di preferenza)

#### 1. Installazione PWA Diretta (CONSIGLIATO)
**La soluzione più semplice e affidabile:**

1. Apri Chrome/Edge su Android
2. Visita `https://highlandergame.it`
3. Tocca il menu browser (3 punti)
4. Seleziona "Aggiungi alla schermata home"
5. Conferma l'installazione
6. L'app apparirà come app nativa

**Vantaggi:**
- Installazione immediata senza errori
- Aggiornamenti automatici
- Funzionalità complete PWA
- Nessun file da scaricare

#### 2. Installazione via PWA Prompt
1. Visita il sito con Chrome Android
2. Apparirà automaticamente il banner "Installa app"
3. Tocca "Installa"
4. L'app si installerà come app nativa

#### 3. Generazione APK Professionale (per il futuro)
Per creare APK senza errori, è necessario:

```bash
# Usare Android Studio con certificato di sviluppo
keytool -genkey -v -keystore highlander-release-key.keystore \
  -alias highlander-key -keyalg RSA -keysize 2048 -validity 10000

# Compilare con gradle
./gradlew assembleRelease

# Firmare l'APK
jarsigner -verbose -sigalg SHA1withRSA -digestalg SHA1 \
  -keystore highlander-release-key.keystore \
  app-release-unsigned.apk highlander-key
```

#### 4. Pubblicazione su Google Play Store
**La soluzione professionale completa:**
- APK firmato e verificato da Google
- Distribuzione sicura
- Aggiornamenti automatici tramite Play Store
- Nessun errore di parsing

## 🔧 Risoluzione Problemi APK

### Errore "Errore durante l'analisi del pacchetto"
**Cause comuni:**
- APK non firmato correttamente
- Mancanza certificato di sviluppo Android
- Incompatibilità versione Android
- APK corrotto durante download

**Soluzioni:**
1. **Usa installazione PWA diretta** (più semplice)
2. Verifica che il dispositivo Android sia versione 7.0+
3. Abilita "Origini sconosciute" in Impostazioni > Sicurezza
4. Scarica nuovamente l'APK (potrebbe essere corrotto)

### Verifica Integrità APK
```bash
# Controllo firma APK
jarsigner -verify -verbose -certs app.apk

# Verifica metadati
aapt dump badging app.apk
```

## 📋 Checklist Installazione

### PWA Installation (Raccomandato)
- [ ] Dispositivo Android 7.0+
- [ ] Chrome browser aggiornato
- [ ] Connessione internet attiva
- [ ] Visita highlandergame.it
- [ ] Tocca "Installa" dal prompt browser

### APK Installation (Problematico)
- [ ] Abilita "Origini sconosciute"
- [ ] Download APK da fonte sicura
- [ ] APK firmato correttamente
- [ ] Compatibilità versione Android
- [ ] Spazio storage sufficiente

## 🚀 Raccomandazione Finale

**Per l'immediato utilizzo dell'app Highlander su Android:**

1. **Non usare l'APK** (presenta errori di parsing)
2. **Installa direttamente come PWA** dal browser
3. **Funzionalità identica** all'app nativa
4. **Più sicuro e affidabile**

La PWA Highlander offre l'esperienza completa di un'app nativa senza i problemi degli APK non certificati.

## 📞 Supporto Tecnico

Per assistenza nell'installazione:
- Email: support@highlandergame.it
- La PWA è sempre accessibile via browser come fallback
- Tutti i dati si sincronizzano automaticamente

### Funzionalità PWA Garantite
- ✅ Installazione schermata home
- ✅ Funzionamento offline
- ✅ Notifiche push
- ✅ Aggiornamenti automatici
- ✅ Performance native
- ✅ Sincronizzazione dati