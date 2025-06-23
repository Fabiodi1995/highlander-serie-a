import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { X, Smartphone, Download, Share, Plus } from "lucide-react";
import { usePWA } from "@/hooks/usePWA";

interface MobileInstallPromptProps {
  onClose: () => void;
}

export function MobileInstallPrompt({ onClose }: MobileInstallPromptProps) {
  const { canInstall, isInstalled, installApp } = usePWA();
  const [deviceType, setDeviceType] = useState<'ios' | 'android' | 'desktop'>('desktop');

  useEffect(() => {
    const userAgent = navigator.userAgent.toLowerCase();
    if (/iphone|ipad|ipod/.test(userAgent)) {
      setDeviceType('ios');
    } else if (/android/.test(userAgent)) {
      setDeviceType('android');
    }
  }, []);

  const handleInstall = async () => {
    const success = await installApp();
    if (success) {
      onClose();
    }
  };

  const getInstructions = () => {
    switch (deviceType) {
      case 'ios':
        return {
          title: "Installa Highlander su iPhone/iPad",
          steps: [
            "Tocca il pulsante Condividi (📤) in basso",
            "Scorri e seleziona 'Aggiungi alla schermata Home'",
            "Tocca 'Aggiungi' per confermare",
            "L'app apparirà sulla schermata home"
          ],
          icon: <Share className="h-5 w-5" />
        };
      case 'android':
        return {
          title: "Installa Highlander su Android",
          steps: [
            "Tocca il pulsante 'Installa' qui sotto",
            "Conferma l'installazione nella finestra popup",
            "L'app sarà aggiunta alla schermata home",
            "Potrai usarla come app nativa"
          ],
          icon: <Download className="h-5 w-5" />
        };
      default:
        return {
          title: "Installa Highlander",
          steps: [
            "Clicca il pulsante 'Installa' qui sotto",
            "Conferma l'installazione",
            "L'app sarà disponibile nel tuo sistema",
            "Accesso rapido senza browser"
          ],
          icon: <Plus className="h-5 w-5" />
        };
    }
  };

  if (isInstalled) {
    return null;
  }

  const instructions = getInstructions();

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <Card className="w-full max-w-md">
        <CardHeader className="relative">
          <Button
            variant="ghost"
            size="sm"
            className="absolute right-2 top-2"
            onClick={onClose}
          >
            <X className="h-4 w-4" />
          </Button>
          <div className="flex items-center space-x-2">
            <Smartphone className="h-6 w-6 text-blue-600" />
            <div>
              <CardTitle className="text-lg">{instructions.title}</CardTitle>
              <CardDescription>
                Installa l'app per un'esperienza ottimale
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-wrap gap-2">
            <Badge variant="secondary">📱 App Nativa</Badge>
            <Badge variant="secondary">⚡ Più Veloce</Badge>
            <Badge variant="secondary">🔔 Notifiche</Badge>
            <Badge variant="secondary">📲 Offline</Badge>
          </div>

          <div className="space-y-3">
            <h4 className="font-semibold text-sm">Come installare:</h4>
            <ol className="space-y-2 text-sm text-gray-600">
              {instructions.steps.map((step, index) => (
                <li key={index} className="flex items-start space-x-2">
                  <span className="flex-shrink-0 w-5 h-5 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-xs font-bold">
                    {index + 1}
                  </span>
                  <span>{step}</span>
                </li>
              ))}
            </ol>
          </div>

          <div className="space-y-2">
            {canInstall && deviceType === 'android' && (
              <Button onClick={handleInstall} className="w-full" size="lg">
                <Download className="h-4 w-4 mr-2" />
                Installa Adesso
              </Button>
            )}
            {deviceType === 'ios' && (
              <div className="text-center p-3 bg-blue-50 rounded-lg">
                <p className="text-sm text-blue-700">
                  <Share className="h-4 w-4 inline mr-1" />
                  Usa il pulsante Condividi di Safari per installare
                </p>
              </div>
            )}
            <Button variant="outline" onClick={onClose} className="w-full">
              Forse dopo
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}