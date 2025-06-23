import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { X, RefreshCw, Download, CheckCircle } from "lucide-react";

export function AppUpdateBanner() {
  const [showBanner, setShowBanner] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [updateAvailable, setUpdateAvailable] = useState(false);

  useEffect(() => {
    if ('serviceWorker' in navigator) {
      // Listen for service worker updates
      navigator.serviceWorker.addEventListener('controllerchange', () => {
        setUpdateAvailable(true);
        setShowBanner(true);
      });

      // Check for waiting service worker
      navigator.serviceWorker.ready.then(registration => {
        if (registration.waiting) {
          setUpdateAvailable(true);
          setShowBanner(true);
        }

        // Listen for new service worker waiting
        registration.addEventListener('updatefound', () => {
          const newWorker = registration.installing;
          if (newWorker) {
            newWorker.addEventListener('statechange', () => {
              if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                setUpdateAvailable(true);
                setShowBanner(true);
              }
            });
          }
        });
      });
    }
  }, []);

  const handleUpdate = async () => {
    if (!('serviceWorker' in navigator)) return;

    setIsUpdating(true);
    
    try {
      const registration = await navigator.serviceWorker.ready;
      
      if (registration.waiting) {
        // Tell the waiting service worker to skip waiting
        registration.waiting.postMessage({ type: 'SKIP_WAITING' });
        
        // Wait a bit for the new service worker to take control
        setTimeout(() => {
          window.location.reload();
        }, 1000);
      }
    } catch (error) {
      console.error('Error updating app:', error);
      setIsUpdating(false);
    }
  };

  const handleDismiss = () => {
    setShowBanner(false);
    // Don't dismiss permanently for updates
  };

  if (!showBanner || !updateAvailable) {
    return null;
  }

  return (
    <div className="fixed top-20 left-4 right-4 z-50 md:left-auto md:right-4 md:w-96">
      <Card className="bg-gradient-to-r from-green-600 to-green-700 text-white border-green-500 shadow-lg">
        <div className="p-4">
          <div className="flex items-start justify-between">
            <div className="flex items-center space-x-3 flex-1">
              <div className="bg-white/20 p-2 rounded-lg">
                <RefreshCw className="h-5 w-5" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center space-x-2 mb-1">
                  <h3 className="font-semibold text-sm">Aggiornamento Disponibile</h3>
                  <Badge variant="secondary" className="text-xs bg-white/20 text-white border-white/30">
                    Nuovo
                  </Badge>
                </div>
                <p className="text-xs text-green-100">
                  Una nuova versione dell'app è pronta per l'installazione
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
              onClick={handleUpdate}
              disabled={isUpdating}
              size="sm"
              className="bg-white text-green-600 hover:bg-gray-100 flex-1"
            >
              {isUpdating ? (
                <>
                  <RefreshCw className="h-4 w-4 mr-1 animate-spin" />
                  Aggiornamento...
                </>
              ) : (
                <>
                  <Download className="h-4 w-4 mr-1" />
                  Aggiorna Ora
                </>
              )}
            </Button>
            <Button
              onClick={handleDismiss}
              variant="ghost"
              size="sm"
              className="text-white hover:bg-white/20"
            >
              Dopo
            </Button>
          </div>
          
          <div className="mt-2 text-xs text-green-100">
            <CheckCircle className="h-3 w-3 inline mr-1" />
            Aggiornamento automatico e sicuro
          </div>
        </div>
      </Card>
    </div>
  );
}