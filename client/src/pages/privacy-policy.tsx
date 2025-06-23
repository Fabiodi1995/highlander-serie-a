import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Shield, Mail, Phone, MapPin, Clock, AlertTriangle, CheckCircle, Lock } from "lucide-react";

export default function PrivacyPolicyPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-gray-900 dark:to-gray-800 py-8">
      <div className="container mx-auto px-4 max-w-4xl">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="flex items-center justify-center gap-3 mb-4">
            <Shield className="h-12 w-12 text-blue-600" />
            <h1 className="text-4xl font-bold text-gray-900 dark:text-white">
              Informativa Privacy
            </h1>
          </div>
          <p className="text-xl text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
            Conforme al Regolamento Europeo (GDPR) 2016/679 e D.Lgs. 196/2003
          </p>
          <Badge variant="secondary" className="mt-4 text-lg px-4 py-2">
            <Clock className="h-4 w-4 mr-2" />
            Ultimo aggiornamento: Gennaio 2025
          </Badge>
        </div>

        {/* Titolare del Trattamento */}
        <Card className="mb-8 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm border-0 shadow-lg">
          <CardHeader className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-t-lg">
            <CardTitle className="flex items-center gap-3 text-2xl">
              <MapPin className="h-6 w-6" />
              Titolare del Trattamento
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <div className="space-y-4">
              <div>
                <h4 className="font-semibold text-gray-900 dark:text-white mb-2">Denominazione</h4>
                <p className="text-gray-700 dark:text-gray-300">Highlander Gaming S.r.l.</p>
              </div>
              <div>
                <h4 className="font-semibold text-gray-900 dark:text-white mb-2">Sede Legale</h4>
                <p className="text-gray-700 dark:text-gray-300">
                  Via Roma, 123 - 00100 Roma (RM), Italia<br />
                  P.IVA: 12345678901<br />
                  C.F.: 12345678901
                </p>
              </div>
              <div>
                <h4 className="font-semibold text-gray-900 dark:text-white mb-2">Contatti Privacy</h4>
                <div className="flex flex-col space-y-2">
                  <div className="flex items-center gap-2">
                    <Mail className="h-4 w-4 text-blue-600" />
                    <span className="text-gray-700 dark:text-gray-300">privacy@highlander-game.it</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Phone className="h-4 w-4 text-blue-600" />
                    <span className="text-gray-700 dark:text-gray-300">+39 06 12345678</span>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Finalità del Trattamento */}
        <Card className="mb-8 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm border-0 shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center gap-3 text-xl">
              <CheckCircle className="h-5 w-5 text-green-600" />
              Finalità del Trattamento
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid gap-6">
              <div className="p-4 border border-green-200 dark:border-green-800 rounded-lg bg-green-50 dark:bg-green-900/20">
                <h4 className="font-semibold text-green-800 dark:text-green-200 mb-2">
                  1. Gestione del Servizio di Gioco
                </h4>
                <ul className="space-y-1 text-green-700 dark:text-green-300">
                  <li>• Registrazione e autenticazione utenti</li>
                  <li>• Gestione partite e classifiche</li>
                  <li>• Comunicazioni relative al gioco</li>
                  <li>• Supporto tecnico e assistenza</li>
                </ul>
                <p className="text-sm text-green-600 dark:text-green-400 mt-2">
                  <strong>Base giuridica:</strong> Esecuzione del contratto (Art. 6.1.b GDPR)
                </p>
              </div>

              <div className="p-4 border border-blue-200 dark:border-blue-800 rounded-lg bg-blue-50 dark:bg-blue-900/20">
                <h4 className="font-semibold text-blue-800 dark:text-blue-200 mb-2">
                  2. Marketing e Comunicazioni Commerciali
                </h4>
                <ul className="space-y-1 text-blue-700 dark:text-blue-300">
                  <li>• Newsletter e aggiornamenti sul servizio</li>
                  <li>• Promozioni e offerte speciali</li>
                  <li>• Sondaggi di soddisfazione</li>
                </ul>
                <p className="text-sm text-blue-600 dark:text-blue-400 mt-2">
                  <strong>Base giuridica:</strong> Consenso (Art. 6.1.a GDPR)
                </p>
              </div>

              <div className="p-4 border border-purple-200 dark:border-purple-800 rounded-lg bg-purple-50 dark:bg-purple-900/20">
                <h4 className="font-semibold text-purple-800 dark:text-purple-200 mb-2">
                  3. Adempimenti Legali
                </h4>
                <ul className="space-y-1 text-purple-700 dark:text-purple-300">
                  <li>• Conservazione dati per obblighi fiscali</li>
                  <li>• Risposta a richieste autorità competenti</li>
                  <li>• Antiriciclaggio e controlli normativi</li>
                </ul>
                <p className="text-sm text-purple-600 dark:text-purple-400 mt-2">
                  <strong>Base giuridica:</strong> Obbligo legale (Art. 6.1.c GDPR)
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Categorie di Dati */}
        <Card className="mb-8 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm border-0 shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center gap-3 text-xl">
              <Lock className="h-5 w-5 text-gray-600" />
              Categorie di Dati Personali Trattati
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <h4 className="font-semibold text-gray-900 dark:text-white mb-3">Dati Identificativi</h4>
                <ul className="space-y-1 text-gray-700 dark:text-gray-300">
                  <li>• Nome e cognome</li>
                  <li>• Email</li>
                  <li>• Numero di telefono</li>
                  <li>• Data di nascita</li>
                  <li>• Città e paese di residenza</li>
                </ul>
              </div>
              <div>
                <h4 className="font-semibold text-gray-900 dark:text-white mb-3">Dati di Navigazione</h4>
                <ul className="space-y-1 text-gray-700 dark:text-gray-300">
                  <li>• Indirizzo IP</li>
                  <li>• Tipo di browser</li>
                  <li>• Sistema operativo</li>
                  <li>• Pagine visitate</li>
                  <li>• Cookie tecnici</li>
                </ul>
              </div>
              <div>
                <h4 className="font-semibold text-gray-900 dark:text-white mb-3">Dati di Gioco</h4>
                <ul className="space-y-1 text-gray-700 dark:text-gray-300">
                  <li>• Username</li>
                  <li>• Statistiche di gioco</li>
                  <li>• Storico partite</li>
                  <li>• Selezioni squadre</li>
                </ul>
              </div>
              <div>
                <h4 className="font-semibold text-gray-900 dark:text-white mb-3">Dati di Comunicazione</h4>
                <ul className="space-y-1 text-gray-700 dark:text-gray-300">
                  <li>• Messaggi di supporto</li>
                  <li>• Preferenze di comunicazione</li>
                  <li>• Log delle comunicazioni</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Diritti degli Interessati */}
        <Card className="mb-8 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm border-0 shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center gap-3 text-xl">
              <Shield className="h-5 w-5 text-blue-600" />
              I Tuoi Diritti
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-gray-700 dark:text-gray-300 mb-4">
              In conformità al GDPR, hai i seguenti diritti sui tuoi dati personali:
            </p>
            
            <div className="grid gap-4">
              <div className="flex items-start gap-3 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                <CheckCircle className="h-5 w-5 text-blue-600 mt-0.5" />
                <div>
                  <h5 className="font-semibold text-blue-800 dark:text-blue-200">Accesso (Art. 15)</h5>
                  <p className="text-blue-700 dark:text-blue-300 text-sm">
                    Diritto di ottenere conferma del trattamento e copia dei dati
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3 p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
                <CheckCircle className="h-5 w-5 text-green-600 mt-0.5" />
                <div>
                  <h5 className="font-semibold text-green-800 dark:text-green-200">Rettifica (Art. 16)</h5>
                  <p className="text-green-700 dark:text-green-300 text-sm">
                    Diritto di correggere dati inesatti o incompleti
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3 p-3 bg-red-50 dark:bg-red-900/20 rounded-lg">
                <CheckCircle className="h-5 w-5 text-red-600 mt-0.5" />
                <div>
                  <h5 className="font-semibold text-red-800 dark:text-red-200">Cancellazione (Art. 17)</h5>
                  <p className="text-red-700 dark:text-red-300 text-sm">
                    Diritto alla cancellazione dei dati (diritto all'oblio)
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3 p-3 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg">
                <CheckCircle className="h-5 w-5 text-yellow-600 mt-0.5" />
                <div>
                  <h5 className="font-semibold text-yellow-800 dark:text-yellow-200">Limitazione (Art. 18)</h5>
                  <p className="text-yellow-700 dark:text-yellow-300 text-sm">
                    Diritto di limitare il trattamento in casi specifici
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3 p-3 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
                <CheckCircle className="h-5 w-5 text-purple-600 mt-0.5" />
                <div>
                  <h5 className="font-semibold text-purple-800 dark:text-purple-200">Portabilità (Art. 20)</h5>
                  <p className="text-purple-700 dark:text-purple-300 text-sm">
                    Diritto di ricevere i dati in formato strutturato
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3 p-3 bg-orange-50 dark:bg-orange-900/20 rounded-lg">
                <CheckCircle className="h-5 w-5 text-orange-600 mt-0.5" />
                <div>
                  <h5 className="font-semibold text-orange-800 dark:text-orange-200">Opposizione (Art. 21)</h5>
                  <p className="text-orange-700 dark:text-orange-300 text-sm">
                    Diritto di opporsi al trattamento per motivi legittimi
                  </p>
                </div>
              </div>
            </div>

            <div className="mt-6 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-600">
              <h4 className="font-semibold text-gray-900 dark:text-white mb-2">Come Esercitare i Tuoi Diritti</h4>
              <p className="text-gray-700 dark:text-gray-300 text-sm mb-2">
                Per esercitare i tuoi diritti, contattaci a:
              </p>
              <div className="flex items-center gap-2">
                <Mail className="h-4 w-4 text-blue-600" />
                <span className="text-blue-600 font-semibold">privacy@highlander-game.it</span>
              </div>
              <p className="text-gray-600 dark:text-gray-400 text-xs mt-2">
                Ti risponderemo entro 30 giorni dalla richiesta.
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Conservazione e Sicurezza */}
        <Card className="mb-8 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm border-0 shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center gap-3 text-xl">
              <Lock className="h-5 w-5 text-red-600" />
              Conservazione e Sicurezza
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div>
              <h4 className="font-semibold text-gray-900 dark:text-white mb-3">Tempi di Conservazione</h4>
              <div className="space-y-3">
                <div className="p-3 border border-gray-200 dark:border-gray-600 rounded-lg">
                  <p className="font-medium text-gray-900 dark:text-white">Dati di registrazione</p>
                  <p className="text-gray-700 dark:text-gray-300 text-sm">
                    Conservati per tutta la durata del rapporto contrattuale + 10 anni per obblighi fiscali
                  </p>
                </div>
                <div className="p-3 border border-gray-200 dark:border-gray-600 rounded-lg">
                  <p className="font-medium text-gray-900 dark:text-white">Dati di navigazione</p>
                  <p className="text-gray-700 dark:text-gray-300 text-sm">
                    Conservati per 12 mesi o secondo necessità tecniche/legali
                  </p>
                </div>
                <div className="p-3 border border-gray-200 dark:border-gray-600 rounded-lg">
                  <p className="font-medium text-gray-900 dark:text-white">Dati di marketing</p>
                  <p className="text-gray-700 dark:text-gray-300 text-sm">
                    Conservati fino alla revoca del consenso o opposizione
                  </p>
                </div>
              </div>
            </div>

            <div>
              <h4 className="font-semibold text-gray-900 dark:text-white mb-3">Misure di Sicurezza</h4>
              <ul className="space-y-2 text-gray-700 dark:text-gray-300">
                <li>• Crittografia dei dati sensibili (SSL/TLS)</li>
                <li>• Accesso limitato ai dati su base "need-to-know"</li>
                <li>• Backup regolari e sistemi di disaster recovery</li>
                <li>• Monitoraggio costante degli accessi</li>
                <li>• Formazione del personale sulla privacy</li>
                <li>• Procedure di incident response per data breach</li>
              </ul>
            </div>
          </CardContent>
        </Card>

        {/* Cookie Policy */}
        <Card className="mb-8 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm border-0 shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center gap-3 text-xl">
              <AlertTriangle className="h-5 w-5 text-orange-600" />
              Cookie Policy
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-gray-700 dark:text-gray-300">
              Il nostro sito utilizza cookie per migliorare l'esperienza utente e fornire servizi personalizzati.
            </p>
            
            <div className="grid gap-4">
              <div className="p-4 border border-blue-200 dark:border-blue-800 rounded-lg bg-blue-50 dark:bg-blue-900/20">
                <h4 className="font-semibold text-blue-800 dark:text-blue-200 mb-2">Cookie Tecnici (Necessari)</h4>
                <p className="text-blue-700 dark:text-blue-300 text-sm">
                  Essenziali per il funzionamento del sito: autenticazione, sessioni, sicurezza.
                  Non richiedono consenso.
                </p>
              </div>

              <div className="p-4 border border-green-200 dark:border-green-800 rounded-lg bg-green-50 dark:bg-green-900/20">
                <h4 className="font-semibold text-green-800 dark:text-green-200 mb-2">Cookie di Prestazione</h4>
                <p className="text-green-700 dark:text-green-300 text-sm">
                  Raccolgono informazioni anonime sull'utilizzo del sito per migliorarne le funzionalità.
                  Richiedono consenso.
                </p>
              </div>

              <div className="p-4 border border-purple-200 dark:border-purple-800 rounded-lg bg-purple-50 dark:bg-purple-900/20">
                <h4 className="font-semibold text-purple-800 dark:text-purple-200 mb-2">Cookie di Funzionalità</h4>
                <p className="text-purple-700 dark:text-purple-300 text-sm">
                  Memorizzano le preferenze dell'utente per personalizzare l'esperienza di navigazione.
                  Richiedono consenso.
                </p>
              </div>
            </div>

            <div className="mt-4 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
              <p className="text-gray-600 dark:text-gray-400 text-sm">
                Puoi gestire le tue preferenze sui cookie nelle impostazioni del browser o 
                attraverso il banner dei cookie presente sul sito.
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Footer */}
        <div className="text-center mt-12 pt-8 border-t border-gray-200 dark:border-gray-700">
          <p className="text-gray-500 dark:text-gray-400">
            Informativa Privacy - Highlander Gaming | Conforme GDPR 2016/679
          </p>
          <p className="text-sm text-gray-400 dark:text-gray-500 mt-2">
            Ultimo aggiornamento: Gennaio 2025 | Versione 1.0
          </p>
          <div className="mt-4">
            <p className="text-xs text-gray-400 dark:text-gray-500">
              Per reclami relativi al trattamento dei dati personali è possibile rivolgersi al 
              <strong> Garante per la Protezione dei Dati Personali</strong> - www.garanteprivacy.it
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}