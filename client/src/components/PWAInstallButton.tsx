import { Button } from "@/components/ui/button";
import { Download, Smartphone } from "lucide-react";
import { usePWA } from "@/hooks/usePWA";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

export function PWAInstallButton() {
  const { canInstall, isInstalled, installApp } = usePWA();

  if (isInstalled) return null;

  const handleInstall = async () => {
    const success = await installApp();
    if (success) {
      console.log('App installed successfully');
    }
  };

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button 
          variant="outline" 
          size="sm" 
          className="gap-2"
        >
          <Smartphone className="h-4 w-4" />
          Installa App
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Smartphone className="h-5 w-5" />
            Installa Highlander
          </DialogTitle>
          <DialogDescription>
            Installa l'app sul tuo dispositivo per un'esperienza migliore
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4">
          {canInstall ? (
            <div className="text-center space-y-4">
              <p className="text-sm text-muted-foreground">
                Clicca il pulsante per installare l'app direttamente sul tuo dispositivo
              </p>
              <Button onClick={handleInstall} className="w-full gap-2">
                <Download className="h-4 w-4" />
                Installa Adesso
              </Button>
            </div>
          ) : (
            <div className="space-y-4 text-sm">
              <div className="border rounded-lg p-4 space-y-3">
                <h4 className="font-semibold">📱 Android:</h4>
                <ol className="list-decimal list-inside space-y-1 text-muted-foreground">
                  <li>Apri Chrome e vai su highlandergame.it</li>
                  <li>Tocca i tre puntini (⋮) in alto a destra</li>
                  <li>Seleziona "Installa app" o "Aggiungi alla schermata Home"</li>
                  <li>Conferma l'installazione</li>
                </ol>
              </div>
              
              <div className="border rounded-lg p-4 space-y-3">
                <h4 className="font-semibold">🍎 iPhone/iPad:</h4>
                <ol className="list-decimal list-inside space-y-1 text-muted-foreground">
                  <li>Apri Safari e vai su highlandergame.it</li>
                  <li>Tocca il pulsante Condividi (📤) in basso</li>
                  <li>Scorri e tocca "Aggiungi alla schermata Home"</li>
                  <li>Tocca "Aggiungi" per confermare</li>
                </ol>
              </div>
              
              <div className="border rounded-lg p-4 space-y-3">
                <h4 className="font-semibold">💻 Desktop:</h4>
                <ol className="list-decimal list-inside space-y-1 text-muted-foreground">
                  <li>Apri Chrome/Edge e vai su highlandergame.it</li>
                  <li>Clicca sull'icona "Installa" nella barra degli indirizzi</li>
                  <li>Oppure vai su Menu → "Installa Highlander..."</li>
                </ol>
              </div>
              
              <p className="text-xs text-muted-foreground text-center">
                L'app funziona offline e riceve aggiornamenti automatici
              </p>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}