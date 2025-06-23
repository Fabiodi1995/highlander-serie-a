import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Smartphone, 
  Download, 
  Share, 
  Plus, 
  CheckCircle,
  Info,
  ExternalLink,
  Apple,
  Chrome,
  Monitor
} from "lucide-react";
import { usePWA } from "@/hooks/usePWA";

export default function DownloadAppPage() {
  const { canInstall, isInstalled, isStandalone, installApp } = usePWA();
  const [deviceType, setDeviceType] = useState<'ios' | 'android' | 'windows' | 'unknown'>('unknown');
  const [browserType, setBrowserType] = useState<'chrome' | 'safari' | 'edge' | 'samsung' | 'firefox' | 'unknown'>('unknown');

  useEffect(() => {
    const userAgent = navigator.userAgent.toLowerCase();
    
    // Detect device type
    if (/iphone|ipad|ipod/.test(userAgent)) {
      setDeviceType('ios');
    } else if (/android/.test(userAgent)) {
      setDeviceType('android');
    } else if (/windows/.test(userAgent)) {
      setDeviceType('windows');
    }

    // Detect browser type
    if (/chrome/.test(userAgent) && !/edg/.test(userAgent)) {
      setBrowserType('chrome');
    } else if (/safari/.test(userAgent) && !/chrome/.test(userAgent)) {
      setBrowserType('safari');
    } else if (/edg/.test(userAgent)) {
      setBrowserType('edge');
    } else if (/samsungbrowser/.test(userAgent)) {
      setBrowserType('samsung');
    } else if (/firefox/.test(userAgent)) {
      setBrowserType('firefox');
    }
  }, []);

  const handleInstallPWA = async () => {
    await installApp();
  };

  const getInstallationInstructions = () => {
    if (deviceType === 'ios') {
      return {
        title: "Installazione iPhone/iPad",
        icon: <Apple className="h-6 w-6" />,
        steps: [
          "Apri questa pagina in Safari (non Chrome)",
          "Tocca il pulsante Condividi (📤) in basso",
          "Scorri verso il basso e tocca 'Aggiungi alla schermata Home'",
          "Tocca 'Aggiungi' per confermare",
          "L'app Highlander apparirà sulla schermata home"
        ],
        note: "Importante: L'installazione funziona solo con Safari su iOS"
      };
    } else if (deviceType === 'android') {
      return {
        title: "Installazione Android",
        icon: <Smartphone className="h-6 w-6" />,
        steps: [
          "Usa Chrome, Edge o Samsung Internet",
          "Tocca il pulsante 'Installa' qui sotto",
          "Conferma l'installazione nella finestra popup",
          "L'app sarà aggiunta alla schermata home",
          "Avvia l'app come qualsiasi altra app"
        ],
        note: "Funziona con la maggior parte dei browser moderni"
      };
    } else {
      return {
        title: "Installazione Desktop",
        icon: <Monitor className="h-6 w-6" />,
        steps: [
          "Usa Chrome, Edge o un browser compatibile",
          "Clicca il pulsante 'Installa' qui sotto",
          "Conferma l'installazione",
          "L'app sarà disponibile nel menu Start/Applicazioni",
          "Funziona come un'applicazione nativa"
        ],
        note: "Disponibile su Windows, Mac e Linux"
      };
    }
  };

  const instructions = getInstallationInstructions();

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="mobile-container">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="flex items-center justify-center mb-4">
              <div className="bg-blue-100 p-3 rounded-full">
                <Smartphone className="h-8 w-8 text-blue-600" />
              </div>
            </div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              Scarica l'App Highlander
            </h1>
            <p className="text-gray-600 max-w-2xl mx-auto">
              Installa l'app mobile per un'esperienza ottimale: accesso rapido, 
              notifiche push e funzionalità offline.
            </p>
          </div>

          {/* Installation Status */}
          {isInstalled && (
            <Alert className="mb-8 bg-green-50 border-green-200">
              <CheckCircle className="h-4 w-4 text-green-600" />
              <AlertDescription className="text-green-800">
                L'app Highlander è già installata sul tuo dispositivo!
              </AlertDescription>
            </Alert>
          )}

          <Tabs defaultValue="quick" className="space-y-6">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="quick">Installazione Rapida</TabsTrigger>
              <TabsTrigger value="manual">Guida Dettagliata</TabsTrigger>
              <TabsTrigger value="download">Download Diretto</TabsTrigger>
            </TabsList>

            {/* Quick Installation */}
            <TabsContent value="quick">
              <Card>
                <CardHeader>
                  <div className="flex items-center space-x-3">
                    {instructions.icon}
                    <div>
                      <CardTitle>{instructions.title}</CardTitle>
                      <CardDescription>{instructions.note}</CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* Features */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    <Badge variant="secondary" className="justify-center p-2">
                      📱 App Nativa
                    </Badge>
                    <Badge variant="secondary" className="justify-center p-2">
                      ⚡ Più Veloce
                    </Badge>
                    <Badge variant="secondary" className="justify-center p-2">
                      🔔 Notifiche
                    </Badge>
                    <Badge variant="secondary" className="justify-center p-2">
                      📲 Offline
                    </Badge>
                  </div>

                  {/* Install Button */}
                  <div className="space-y-4">
                    {canInstall && !isInstalled && (
                      <Button 
                        onClick={handleInstallPWA} 
                        size="lg" 
                        className="w-full"
                      >
                        <Download className="h-5 w-5 mr-2" />
                        Installa Adesso
                      </Button>
                    )}

                    {deviceType === 'ios' && (
                      <Alert>
                        <Share className="h-4 w-4" />
                        <AlertDescription>
                          Su iPhone/iPad: usa il pulsante Condividi di Safari per installare
                        </AlertDescription>
                      </Alert>
                    )}

                    {!canInstall && !isInstalled && (
                      <Alert>
                        <Info className="h-4 w-4" />
                        <AlertDescription>
                          Il tuo browser non supporta l'installazione PWA. 
                          Prova con Chrome, Edge o Safari.
                        </AlertDescription>
                      </Alert>
                    )}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Manual Guide */}
            <TabsContent value="manual">
              <div className="grid gap-6 md:grid-cols-2">
                {/* iOS Instructions */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center space-x-2">
                      <Apple className="h-5 w-5" />
                      <span>iPhone / iPad</span>
                    </CardTitle>
                    <CardDescription>
                      Installazione tramite Safari
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <ol className="space-y-3 text-sm">
                      <li className="flex items-start space-x-2">
                        <span className="flex-shrink-0 w-6 h-6 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-xs font-bold">1</span>
                        <span>Apri Safari e vai su highlandergame.it</span>
                      </li>
                      <li className="flex items-start space-x-2">
                        <span className="flex-shrink-0 w-6 h-6 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-xs font-bold">2</span>
                        <span>Tocca il pulsante Condividi (📤) in basso</span>
                      </li>
                      <li className="flex items-start space-x-2">
                        <span className="flex-shrink-0 w-6 h-6 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-xs font-bold">3</span>
                        <span>Scorri e tocca "Aggiungi alla schermata Home"</span>
                      </li>
                      <li className="flex items-start space-x-2">
                        <span className="flex-shrink-0 w-6 h-6 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-xs font-bold">4</span>
                        <span>Tocca "Aggiungi" per confermare</span>
                      </li>
                    </ol>
                  </CardContent>
                </Card>

                {/* Android Instructions */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center space-x-2">
                      <Smartphone className="h-5 w-5" />
                      <span>Android</span>
                    </CardTitle>
                    <CardDescription>
                      Installazione tramite Chrome/Edge
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <ol className="space-y-3 text-sm">
                      <li className="flex items-start space-x-2">
                        <span className="flex-shrink-0 w-6 h-6 bg-green-100 text-green-600 rounded-full flex items-center justify-center text-xs font-bold">1</span>
                        <span>Apri Chrome e vai su highlandergame.it</span>
                      </li>
                      <li className="flex items-start space-x-2">
                        <span className="flex-shrink-0 w-6 h-6 bg-green-100 text-green-600 rounded-full flex items-center justify-center text-xs font-bold">2</span>
                        <span>Cerca l'icona "Installa" nella barra degli indirizzi</span>
                      </li>
                      <li className="flex items-start space-x-2">
                        <span className="flex-shrink-0 w-6 h-6 bg-green-100 text-green-600 rounded-full flex items-center justify-center text-xs font-bold">3</span>
                        <span>Tocca "Installa Highlander"</span>
                      </li>
                      <li className="flex items-start space-x-2">
                        <span className="flex-shrink-0 w-6 h-6 bg-green-100 text-green-600 rounded-full flex items-center justify-center text-xs font-bold">4</span>
                        <span>Conferma l'installazione</span>
                      </li>
                    </ol>
                  </CardContent>
                </Card>

                {/* Desktop Instructions */}
                <Card className="md:col-span-2">
                  <CardHeader>
                    <CardTitle className="flex items-center space-x-2">
                      <Monitor className="h-5 w-5" />
                      <span>Windows / Mac / Linux</span>
                    </CardTitle>
                    <CardDescription>
                      Installazione desktop tramite browser
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <ol className="grid md:grid-cols-2 gap-3 text-sm">
                      <li className="flex items-start space-x-2">
                        <span className="flex-shrink-0 w-6 h-6 bg-purple-100 text-purple-600 rounded-full flex items-center justify-center text-xs font-bold">1</span>
                        <span>Apri Chrome, Edge o browser compatibile</span>
                      </li>
                      <li className="flex items-start space-x-2">
                        <span className="flex-shrink-0 w-6 h-6 bg-purple-100 text-purple-600 rounded-full flex items-center justify-center text-xs font-bold">2</span>
                        <span>Vai su highlandergame.it</span>
                      </li>
                      <li className="flex items-start space-x-2">
                        <span className="flex-shrink-0 w-6 h-6 bg-purple-100 text-purple-600 rounded-full flex items-center justify-center text-xs font-bold">3</span>
                        <span>Clicca l'icona "Installa" nella barra degli indirizzi</span>
                      </li>
                      <li className="flex items-start space-x-2">
                        <span className="flex-shrink-0 w-6 h-6 bg-purple-100 text-purple-600 rounded-full flex items-center justify-center text-xs font-bold">4</span>
                        <span>Conferma l'installazione nel popup</span>
                      </li>
                    </ol>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            {/* Direct Download - Removed APK, PWA Only */}
            <TabsContent value="download">
              <div className="space-y-6">
                <Alert>
                  <Info className="h-4 w-4" />
                  <AlertDescription>
                    <strong>Aggiornamento Importante:</strong> Per evitare errori di installazione, 
                    abbiamo rimosso il download APK. L'installazione PWA è più affidabile e sicura.
                  </AlertDescription>
                </Alert>
                
                <Card>
                  <CardHeader>
                    <CardTitle>Installazione PWA Consigliata</CardTitle>
                    <CardDescription>
                      Metodo di installazione più sicuro e affidabile
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="text-sm text-gray-600">
                      <p>✅ Nessun errore di parsing</p>
                      <p>✅ Aggiornamenti automatici</p>
                      <p>✅ Funzionalità complete</p>
                      <p>✅ Sicurezza garantita</p>
                    </div>
                    {canInstall && (
                      <Button onClick={installApp} className="w-full">
                        <Plus className="h-4 w-4 mr-2" />
                        Installa App Ora
                      </Button>
                    )}
                    <div className="text-xs text-gray-500">
                      Se non vedi il pulsante "Installa", segui le istruzioni nella sezione "Installazione Rapida"
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>App Store (Prossimamente)</CardTitle>
                    <CardDescription>
                      Versioni ufficiali degli store
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2 text-sm text-gray-500">
                      <p>🔄 Google Play Store - In sviluppo</p>
                      <p>🔄 Apple App Store - In pianificazione</p>
                      <p>🔄 Microsoft Store - In valutazione</p>
                    </div>
                    <Button disabled className="w-full">
                      Non ancora disponibile
                    </Button>
                    <p className="text-xs text-gray-500">
                      Le versioni store saranno disponibili nelle prossime settimane
                    </p>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>
          </Tabs>

          {/* Help Section */}
          <Card className="mt-8">
            <CardHeader>
              <CardTitle>Hai bisogno di aiuto?</CardTitle>
              <CardDescription>
                Problemi con l'installazione? Ecco le soluzioni più comuni
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <h4 className="font-semibold mb-2">Problemi comuni Android:</h4>
                  <ul className="text-sm text-gray-600 space-y-1">
                    <li>• Abilita "Sorgenti sconosciute" per APK</li>
                    <li>• Aggiorna Chrome all'ultima versione</li>
                    <li>• Cancella cache del browser</li>
                  </ul>
                </div>
                <div>
                  <h4 className="font-semibold mb-2">Problemi comuni iOS:</h4>
                  <ul className="text-sm text-gray-600 space-y-1">
                    <li>• Usa solo Safari (non Chrome)</li>
                    <li>• Assicurati di essere su highlandergame.it</li>
                    <li>• Aggiorna iOS all'ultima versione</li>
                  </ul>
                </div>
              </div>
              <div className="mt-4 p-4 bg-blue-50 rounded-lg">
                <p className="text-sm text-blue-800">
                  <strong>Supporto:</strong> support@highlandergame.it | 
                  Rispondiamo entro 24 ore
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}