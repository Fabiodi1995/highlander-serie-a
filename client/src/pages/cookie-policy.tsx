import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Cookie, Settings, Shield, Clock, Info, CheckCircle } from "lucide-react";
import { useState, useEffect } from "react";

export default function CookiePolicyPage() {
  const [cookiePreferences, setCookiePreferences] = useState({
    necessary: true, // Always true, cannot be disabled
    functional: false,
    analytics: false,
    marketing: false
  });

  const [hasUserInteracted, setHasUserInteracted] = useState(false);

  useEffect(() => {
    // Load saved preferences from localStorage
    const saved = localStorage.getItem('cookiePreferences');
    if (saved) {
      setCookiePreferences(JSON.parse(saved));
    }
  }, []);

  const handlePreferenceChange = (type: keyof typeof cookiePreferences, value: boolean) => {
    if (type === 'necessary') return; // Cannot change necessary cookies
    
    const newPreferences = { ...cookiePreferences, [type]: value };
    setCookiePreferences(newPreferences);
    setHasUserInteracted(true);
  };

  const savePreferences = () => {
    localStorage.setItem('cookiePreferences', JSON.stringify(cookiePreferences));
    localStorage.setItem('cookieConsentGiven', 'true');
    setHasUserInteracted(false);
    // Here you would typically also trigger actual cookie setting/removal
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 to-yellow-50 dark:from-gray-900 dark:to-gray-800 py-8">
      <div className="container mx-auto px-4 max-w-4xl">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="flex items-center justify-center gap-3 mb-4">
            <Cookie className="h-12 w-12 text-orange-600" />
            <h1 className="text-4xl font-bold text-gray-900 dark:text-white">
              Cookie Policy
            </h1>
          </div>
          <p className="text-xl text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
            Informazioni sui cookie utilizzati e gestione delle preferenze
          </p>
          <Badge variant="secondary" className="mt-4 text-lg px-4 py-2">
            <Clock className="h-4 w-4 mr-2" />
            Ultimo aggiornamento: Gennaio 2025
          </Badge>
        </div>

        {/* Cookie Preferences Manager */}
        <Card className="mb-8 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm border-0 shadow-lg">
          <CardHeader className="bg-gradient-to-r from-orange-600 to-yellow-600 text-white rounded-t-lg">
            <CardTitle className="flex items-center gap-3 text-2xl">
              <Settings className="h-6 w-6" />
              Gestione Preferenze Cookie
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <div className="space-y-6">
              {/* Necessary Cookies */}
              <div className="flex items-center justify-between p-4 border border-green-200 dark:border-green-800 rounded-lg bg-green-50 dark:bg-green-900/20">
                <div className="flex-1">
                  <h4 className="font-semibold text-green-800 dark:text-green-200 mb-1">
                    Cookie Necessari
                  </h4>
                  <p className="text-green-700 dark:text-green-300 text-sm">
                    Essenziali per il funzionamento del sito. Non possono essere disabilitati.
                  </p>
                </div>
                <Switch 
                  checked={cookiePreferences.necessary}
                  disabled={true}
                  className="ml-4"
                />
              </div>

              {/* Functional Cookies */}
              <div className="flex items-center justify-between p-4 border border-blue-200 dark:border-blue-800 rounded-lg bg-blue-50 dark:bg-blue-900/20">
                <div className="flex-1">
                  <h4 className="font-semibold text-blue-800 dark:text-blue-200 mb-1">
                    Cookie di Funzionalità
                  </h4>
                  <p className="text-blue-700 dark:text-blue-300 text-sm">
                    Memorizzano le tue preferenze per migliorare l'esperienza di navigazione.
                  </p>
                </div>
                <Switch 
                  checked={cookiePreferences.functional}
                  onCheckedChange={(value) => handlePreferenceChange('functional', value)}
                  className="ml-4"
                />
              </div>

              {/* Analytics Cookies */}
              <div className="flex items-center justify-between p-4 border border-purple-200 dark:border-purple-800 rounded-lg bg-purple-50 dark:bg-purple-900/20">
                <div className="flex-1">
                  <h4 className="font-semibold text-purple-800 dark:text-purple-200 mb-1">
                    Cookie di Analisi
                  </h4>
                  <p className="text-purple-700 dark:text-purple-300 text-sm">
                    Ci aiutano a capire come utilizzi il sito per migliorare i nostri servizi.
                  </p>
                </div>
                <Switch 
                  checked={cookiePreferences.analytics}
                  onCheckedChange={(value) => handlePreferenceChange('analytics', value)}
                  className="ml-4"
                />
              </div>

              {/* Marketing Cookies */}
              <div className="flex items-center justify-between p-4 border border-red-200 dark:border-red-800 rounded-lg bg-red-50 dark:bg-red-900/20">
                <div className="flex-1">
                  <h4 className="font-semibold text-red-800 dark:text-red-200 mb-1">
                    Cookie di Marketing
                  </h4>
                  <p className="text-red-700 dark:text-red-300 text-sm">
                    Utilizzati per mostrarti contenuti personalizzati e pubblicità rilevante.
                  </p>
                </div>
                <Switch 
                  checked={cookiePreferences.marketing}
                  onCheckedChange={(value) => handlePreferenceChange('marketing', value)}
                  className="ml-4"
                />
              </div>

              {hasUserInteracted && (
                <div className="flex justify-center pt-4">
                  <Button onClick={savePreferences} className="bg-orange-600 hover:bg-orange-700">
                    <CheckCircle className="h-4 w-4 mr-2" />
                    Salva Preferenze
                  </Button>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Cosa sono i Cookie */}
        <Card className="mb-8 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm border-0 shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center gap-3 text-xl">
              <Info className="h-5 w-5 text-blue-600" />
              Cosa sono i Cookie
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-gray-700 dark:text-gray-300">
              I cookie sono piccoli file di testo che vengono memorizzati sul tuo dispositivo quando visiti un sito web. 
              Ci permettono di ricordare le tue preferenze e di migliorare la tua esperienza di navigazione.
            </p>
            
            <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
              <h4 className="font-semibold text-blue-800 dark:text-blue-200 mb-2">Come Utilizziamo i Cookie</h4>
              <ul className="space-y-1 text-blue-700 dark:text-blue-300">
                <li>• Per mantenerti autenticato durante la navigazione</li>
                <li>• Per ricordare le tue preferenze di gioco</li>
                <li>• Per migliorare le prestazioni del sito</li>
                <li>• Per fornire contenuti personalizzati</li>
                <li>• Per analizzare l'utilizzo del sito (in forma anonima)</li>
              </ul>
            </div>
          </CardContent>
        </Card>

        {/* Tipi di Cookie Dettagliati */}
        <Card className="mb-8 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm border-0 shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center gap-3 text-xl">
              <Shield className="h-5 w-5 text-green-600" />
              Tipi di Cookie Utilizzati
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid gap-6">
              {/* Cookie Tecnici */}
              <div className="p-4 border border-green-200 dark:border-green-800 rounded-lg bg-green-50 dark:bg-green-900/20">
                <h4 className="font-semibold text-green-800 dark:text-green-200 mb-3">
                  Cookie Tecnici Necessari
                </h4>
                <div className="space-y-2">
                  <div className="flex justify-between items-center text-sm">
                    <span className="font-medium text-green-700 dark:text-green-300">session_token</span>
                    <span className="text-green-600 dark:text-green-400">Sessione</span>
                  </div>
                  <p className="text-green-700 dark:text-green-300 text-sm">
                    Mantiene l'autenticazione dell'utente durante la navigazione
                  </p>
                  
                  <div className="flex justify-between items-center text-sm">
                    <span className="font-medium text-green-700 dark:text-green-300">csrf_token</span>
                    <span className="text-green-600 dark:text-green-400">Sessione</span>
                  </div>
                  <p className="text-green-700 dark:text-green-300 text-sm">
                    Protezione contro attacchi Cross-Site Request Forgery
                  </p>
                </div>
              </div>

              {/* Cookie di Preferenze */}
              <div className="p-4 border border-blue-200 dark:border-blue-800 rounded-lg bg-blue-50 dark:bg-blue-900/20">
                <h4 className="font-semibold text-blue-800 dark:text-blue-200 mb-3">
                  Cookie di Preferenze
                </h4>
                <div className="space-y-2">
                  <div className="flex justify-between items-center text-sm">
                    <span className="font-medium text-blue-700 dark:text-blue-300">theme_preference</span>
                    <span className="text-blue-600 dark:text-blue-400">30 giorni</span>
                  </div>
                  <p className="text-blue-700 dark:text-blue-300 text-sm">
                    Ricorda se preferisci il tema chiaro o scuro
                  </p>
                  
                  <div className="flex justify-between items-center text-sm">
                    <span className="font-medium text-blue-700 dark:text-blue-300">language_preference</span>
                    <span className="text-blue-600 dark:text-blue-400">365 giorni</span>
                  </div>
                  <p className="text-blue-700 dark:text-blue-300 text-sm">
                    Memorizza la lingua preferita per l'interfaccia
                  </p>
                </div>
              </div>

              {/* Cookie di Analisi */}
              <div className="p-4 border border-purple-200 dark:border-purple-800 rounded-lg bg-purple-50 dark:bg-purple-900/20">
                <h4 className="font-semibold text-purple-800 dark:text-purple-200 mb-3">
                  Cookie di Analisi
                </h4>
                <div className="space-y-2">
                  <div className="flex justify-between items-center text-sm">
                    <span className="font-medium text-purple-700 dark:text-purple-300">_analytics_session</span>
                    <span className="text-purple-600 dark:text-purple-400">30 minuti</span>
                  </div>
                  <p className="text-purple-700 dark:text-purple-300 text-sm">
                    Traccia la sessione di navigazione per statistiche anonime
                  </p>
                  
                  <div className="flex justify-between items-center text-sm">
                    <span className="font-medium text-purple-700 dark:text-purple-300">_page_views</span>
                    <span className="text-purple-600 dark:text-purple-400">24 ore</span>
                  </div>
                  <p className="text-purple-700 dark:text-purple-300 text-sm">
                    Conta le visualizzazioni di pagina per migliorare l'esperienza utente
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Cookie di Terze Parti */}
        <Card className="mb-8 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm border-0 shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center gap-3 text-xl">
              <Cookie className="h-5 w-5 text-orange-600" />
              Cookie di Terze Parti
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-gray-700 dark:text-gray-300">
              Attualmente non utilizziamo cookie di terze parti. Se in futuro dovessimo integrare servizi esterni 
              (come Google Analytics, sistemi di pagamento, ecc.), aggiorneremo questa sezione e ti informeremo.
            </p>
            
            <div className="p-4 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg border border-yellow-200 dark:border-yellow-800">
              <h4 className="font-semibold text-yellow-800 dark:text-yellow-200 mb-2">Eventuali Integrazioni Future</h4>
              <p className="text-yellow-700 dark:text-yellow-300 text-sm">
                Se dovessimo integrare servizi di terze parti, ti chiederemo esplicitamente il consenso 
                e aggiorneremo questa policy con almeno 30 giorni di preavviso.
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Gestione Cookie nel Browser */}
        <Card className="mb-8 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm border-0 shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center gap-3 text-xl">
              <Settings className="h-5 w-5 text-gray-600" />
              Gestione Cookie nel Browser
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-gray-700 dark:text-gray-300 mb-4">
              Oltre alle impostazioni su questa pagina, puoi gestire i cookie direttamente nel tuo browser:
            </p>
            
            <div className="grid md:grid-cols-2 gap-4">
              <div className="p-3 border border-gray-200 dark:border-gray-600 rounded-lg">
                <h5 className="font-semibold text-gray-900 dark:text-white mb-2">Chrome/Edge</h5>
                <p className="text-gray-700 dark:text-gray-300 text-sm">
                  Impostazioni → Privacy e sicurezza → Cookie e altri dati dei siti
                </p>
              </div>
              
              <div className="p-3 border border-gray-200 dark:border-gray-600 rounded-lg">
                <h5 className="font-semibold text-gray-900 dark:text-white mb-2">Firefox</h5>
                <p className="text-gray-700 dark:text-gray-300 text-sm">
                  Impostazioni → Privacy e sicurezza → Cookie e dati dei siti web
                </p>
              </div>
              
              <div className="p-3 border border-gray-200 dark:border-gray-600 rounded-lg">
                <h5 className="font-semibold text-gray-900 dark:text-white mb-2">Safari</h5>
                <p className="text-gray-700 dark:text-gray-300 text-sm">
                  Preferenze → Privacy → Gestisci dati dei siti web
                </p>
              </div>
              
              <div className="p-3 border border-gray-200 dark:border-gray-600 rounded-lg">
                <h5 className="font-semibold text-gray-900 dark:text-white mb-2">Mobile</h5>
                <p className="text-gray-700 dark:text-gray-300 text-sm">
                  Impostazioni browser → Privacy → Cookie
                </p>
              </div>
            </div>

            <div className="mt-4 p-3 bg-red-50 dark:bg-red-900/20 rounded-lg border border-red-200 dark:border-red-800">
              <p className="text-red-700 dark:text-red-300 text-sm">
                <strong>Attenzione:</strong> Disabilitare tutti i cookie potrebbe compromettere 
                il funzionamento del sito e impedire l'accesso ad alcune funzionalità.
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Footer */}
        <div className="text-center mt-12 pt-8 border-t border-gray-200 dark:border-gray-700">
          <p className="text-gray-500 dark:text-gray-400">
            Cookie Policy - Highlander Gaming | Conforme alla normativa italiana ed europea
          </p>
          <p className="text-sm text-gray-400 dark:text-gray-500 mt-2">
            Ultimo aggiornamento: Gennaio 2025 | Versione 1.0
          </p>
        </div>
      </div>
    </div>
  );
}