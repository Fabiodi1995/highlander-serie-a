import { useState, useEffect } from "react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { WifiOff, Wifi, RefreshCw } from "lucide-react";

export function OfflineIndicator() {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [showOfflineAlert, setShowOfflineAlert] = useState(false);

  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      setShowOfflineAlert(false);
    };

    const handleOffline = () => {
      setIsOnline(false);
      setShowOfflineAlert(true);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Check initial state
    if (!navigator.onLine) {
      setShowOfflineAlert(true);
    }

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  return (
    <>
      {/* Status indicator in header */}
      <div className="flex items-center space-x-2">
        <Badge variant={isOnline ? "default" : "destructive"} className="text-xs">
          {isOnline ? <Wifi className="h-3 w-3 mr-1" /> : <WifiOff className="h-3 w-3 mr-1" />}
          {isOnline ? "Online" : "Offline"}
        </Badge>
      </div>

      {/* Offline alert */}
      {showOfflineAlert && (
        <div className="fixed top-20 left-4 right-4 z-40 md:left-auto md:right-4 md:w-96">
          <Alert className="bg-yellow-50 border-yellow-200">
            <WifiOff className="h-4 w-4 text-yellow-600" />
            <AlertDescription className="text-yellow-800">
              <div className="flex items-center justify-between">
                <span>Connessione assente - modalità offline attiva</span>
                <RefreshCw 
                  className="h-4 w-4 cursor-pointer hover:text-yellow-600" 
                  onClick={() => window.location.reload()}
                />
              </div>
            </AlertDescription>
          </Alert>
        </div>
      )}
    </>
  );
}