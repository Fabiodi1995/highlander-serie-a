import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { X, Smartphone, Download } from "lucide-react";
import { usePWA } from "@/hooks/usePWA";

export function MobileAppBanner() {
  const { canInstall, isInstalled, isStandalone, installApp } = usePWA();
  const [showBanner, setShowBanner] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    // Show banner only on mobile devices that can install PWA
    const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
    const hasBeenDismissed = localStorage.getItem('pwa-banner-dismissed') === 'true';
    
    if (isMobile && canInstall && !isInstalled && !isStandalone && !hasBeenDismissed) {
      // Show banner after 3 seconds
      const timer = setTimeout(() => {
        setShowBanner(true);
      }, 3000);
      
      return () => clearTimeout(timer);
    }
  }, [canInstall, isInstalled, isStandalone]);

  const handleDismiss = () => {
    setShowBanner(false);
    setDismissed(true);
    localStorage.setItem('pwa-banner-dismissed', 'true');
  };

  const handleInstall = async () => {
    const success = await installApp();
    if (success) {
      setShowBanner(false);
    }
  };

  if (!showBanner || dismissed) {
    return null;
  }

  return (
    <div className="fixed bottom-4 left-4 right-4 z-50 md:left-auto md:right-4 md:w-80">
      <Card className="bg-gradient-to-r from-blue-600 to-blue-700 text-white border-blue-500 shadow-lg">
        <div className="p-4">
          <div className="flex items-start justify-between">
            <div className="flex items-center space-x-3 flex-1">
              <div className="bg-white/20 p-2 rounded-lg">
                <Smartphone className="h-5 w-5" />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="font-semibold text-sm">Installa l'App Highlander</h3>
                <p className="text-xs text-blue-100 mt-1">
                  Accesso rapido, notifiche e modalità offline
                </p>
              </div>
            </div>
            <Button
              variant="ghost"
              size="sm"
              className="text-white hover:bg-white/20 h-6 w-6 p-0 flex-shrink-0"
              onClick={handleDismiss}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
          
          <div className="flex space-x-2 mt-3">
            <Button
              onClick={handleInstall}
              size="sm"
              className="bg-white text-blue-600 hover:bg-gray-100 flex-1"
            >
              <Download className="h-4 w-4 mr-1" />
              Installa
            </Button>
            <Button
              onClick={handleDismiss}
              variant="ghost"
              size="sm"
              className="text-white hover:bg-white/20"
            >
              Non ora
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );
}