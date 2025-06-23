import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { 
  Smartphone, 
  Wifi, 
  Download, 
  CheckCircle, 
  Clock, 
  Zap,
  HardDrive,
  Bell
} from "lucide-react";
import { usePWA } from "@/hooks/usePWA";

export function PWAStatus() {
  const { canInstall, isInstalled, isStandalone, installApp } = usePWA();
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [storageUsage, setStorageUsage] = useState<{ used: number; quota: number }>({ used: 0, quota: 0 });
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Check storage usage
    if ('storage' in navigator && 'estimate' in navigator.storage) {
      navigator.storage.estimate().then(estimate => {
        setStorageUsage({
          used: estimate.usage || 0,
          quota: estimate.quota || 0
        });
      });
    }

    // Check last update time
    const lastUpdate = localStorage.getItem('app-last-updated');
    if (lastUpdate) {
      setLastUpdated(new Date(lastUpdate));
    }

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const formatBytes = (bytes: number): string => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const getStoragePercentage = (): number => {
    if (storageUsage.quota === 0) return 0;
    return (storageUsage.used / storageUsage.quota) * 100;
  };

  const getPWACapabilities = () => {
    const capabilities = [];
    
    if (isInstalled || isStandalone) {
      capabilities.push({ name: "Installata", icon: <CheckCircle className="h-4 w-4" />, status: "success" });
    } else if (canInstall) {
      capabilities.push({ name: "Installabile", icon: <Download className="h-4 w-4" />, status: "pending" });
    }
    
    capabilities.push({ 
      name: "Connessione", 
      icon: <Wifi className="h-4 w-4" />, 
      status: isOnline ? "success" : "error" 
    });
    
    if ('serviceWorker' in navigator) {
      capabilities.push({ name: "Cache Offline", icon: <HardDrive className="h-4 w-4" />, status: "success" });
    }
    
    if ('Notification' in window) {
      capabilities.push({ 
        name: "Notifiche", 
        icon: <Bell className="h-4 w-4" />, 
        status: Notification.permission === 'granted' ? "success" : "pending" 
      });
    }

    return capabilities;
  };

  const capabilities = getPWACapabilities();

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <Smartphone className="h-5 w-5" />
          <span>Stato App Mobile</span>
          <Badge variant={isInstalled ? "default" : "secondary"} className="ml-auto">
            {isInstalled ? "PWA Installata" : "Web App"}
          </Badge>
        </CardTitle>
        <CardDescription>
          Stato e capacità dell'applicazione mobile
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* PWA Capabilities */}
        <div>
          <h4 className="font-semibold mb-3">Funzionalità Disponibili</h4>
          <div className="grid grid-cols-2 gap-3">
            {capabilities.map((capability, index) => (
              <div key={index} className="flex items-center space-x-2 p-2 rounded-lg bg-gray-50">
                <div className={`
                  ${capability.status === 'success' ? 'text-green-600' : 
                    capability.status === 'pending' ? 'text-yellow-600' : 'text-red-600'}
                `}>
                  {capability.icon}
                </div>
                <span className="text-sm font-medium">{capability.name}</span>
                <div className={`w-2 h-2 rounded-full ml-auto
                  ${capability.status === 'success' ? 'bg-green-500' : 
                    capability.status === 'pending' ? 'bg-yellow-500' : 'bg-red-500'}
                `} />
              </div>
            ))}
          </div>
        </div>

        {/* Storage Usage */}
        {storageUsage.quota > 0 && (
          <div>
            <div className="flex items-center justify-between mb-2">
              <h4 className="font-semibold">Utilizzo Storage</h4>
              <span className="text-sm text-gray-600">
                {formatBytes(storageUsage.used)} / {formatBytes(storageUsage.quota)}
              </span>
            </div>
            <Progress value={getStoragePercentage()} className="h-2" />
            <p className="text-xs text-gray-500 mt-1">
              {getStoragePercentage().toFixed(1)}% utilizzato per cache offline
            </p>
          </div>
        )}

        {/* Last Updated */}
        {lastUpdated && (
          <div className="flex items-center space-x-2 text-sm text-gray-600">
            <Clock className="h-4 w-4" />
            <span>Ultimo aggiornamento: {lastUpdated.toLocaleDateString('it-IT')}</span>
          </div>
        )}

        {/* Install Button */}
        {canInstall && !isInstalled && (
          <Button onClick={installApp} className="w-full">
            <Download className="h-4 w-4 mr-2" />
            Installa App Mobile
          </Button>
        )}

        {/* Performance Indicator */}
        <div className="flex items-center justify-center space-x-2 p-3 bg-blue-50 rounded-lg">
          <Zap className="h-4 w-4 text-blue-600" />
          <span className="text-sm font-medium text-blue-800">
            App ottimizzata per prestazioni mobile
          </span>
        </div>
      </CardContent>
    </Card>
  );
}