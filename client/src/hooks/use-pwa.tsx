import { createContext, ReactNode, useContext, useEffect, useState } from "react";
import { useNotifications } from "./use-notifications";

interface PWAInstallPrompt {
  prompt(): Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

interface PWAContextType {
  isInstallable: boolean;
  isInstalled: boolean;
  isOnline: boolean;
  installPrompt: PWAInstallPrompt | null;
  showInstallPrompt: () => void;
  installApp: () => Promise<boolean>;
  checkForUpdates: () => Promise<boolean>;
  updateAvailable: boolean;
  applyUpdate: () => void;
  isStandalone: boolean;
  platform: 'ios' | 'android' | 'desktop' | 'unknown';
  canShare: boolean;
  shareContent: (data: ShareData) => Promise<void>;
}

const PWAContext = createContext<PWAContextType | null>(null);

export function PWAProvider({ children }: { children: ReactNode }) {
  const { sendNotification } = useNotifications();
  const [isInstallable, setIsInstallable] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [installPrompt, setInstallPrompt] = useState<PWAInstallPrompt | null>(null);
  const [updateAvailable, setUpdateAvailable] = useState(false);
  const [serviceWorkerRegistration, setServiceWorkerRegistration] = useState<ServiceWorkerRegistration | null>(null);

  // Detect platform
  const platform = (() => {
    const userAgent = navigator.userAgent.toLowerCase();
    if (/iphone|ipad|ipod/.test(userAgent)) return 'ios';
    if (/android/.test(userAgent)) return 'android';
    if (/windows|mac|linux/.test(userAgent)) return 'desktop';
    return 'unknown';
  })();

  // Check if running as standalone app
  const isStandalone = 
    window.matchMedia('(display-mode: standalone)').matches ||
    (window.navigator as any).standalone === true;

  // Check if Web Share API is available
  const canShare = 'share' in navigator;

  useEffect(() => {
    // Register service worker
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('/sw.js')
        .then(registration => {
          setServiceWorkerRegistration(registration);
          
          // Check for updates
          registration.addEventListener('updatefound', () => {
            const newWorker = registration.installing;
            if (newWorker) {
              newWorker.addEventListener('statechange', () => {
                if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                  setUpdateAvailable(true);
                  sendNotification(
                    'Aggiornamento Disponibile',
                    {
                      body: 'Una nuova versione di Highlander è disponibile. Tocca per aggiornare.',
                      tag: 'app-update',
                      requireInteraction: true
                    }
                  );
                }
              });
            }
          });
        })
        .catch(error => {
          console.error('Service worker registration failed:', error);
        });
    }

    // Handle install prompt
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setInstallPrompt(e as any);
      setIsInstallable(true);
    };

    // Handle app install
    const handleAppInstalled = () => {
      setIsInstalled(true);
      setIsInstallable(false);
      setInstallPrompt(null);
      sendNotification(
        'App Installata!',
        {
          body: 'Highlander è ora installata sul tuo dispositivo.',
          tag: 'app-installed'
        }
      );
    };

    // Handle online/offline status
    const handleOnline = () => {
      setIsOnline(true);
      sendNotification(
        'Connessione Ripristinata',
        {
          body: 'Sei di nuovo online. I dati verranno sincronizzati.',
          tag: 'connection-restored'
        }
      );
    };

    const handleOffline = () => {
      setIsOnline(false);
      sendNotification(
        'Modalità Offline',
        {
          body: 'Sei offline. Alcune funzionalità potrebbero essere limitate.',
          tag: 'connection-lost'
        }
      );
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Check if already installed
    if (isStandalone) {
      setIsInstalled(true);
    }

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [sendNotification]);

  const showInstallPrompt = () => {
    if (installPrompt) {
      installPrompt.prompt();
    }
  };

  const installApp = async (): Promise<boolean> => {
    if (!installPrompt) return false;

    try {
      installPrompt.prompt();
      const choiceResult = await installPrompt.userChoice;
      
      if (choiceResult.outcome === 'accepted') {
        setIsInstalled(true);
        setIsInstallable(false);
        setInstallPrompt(null);
        return true;
      }
      return false;
    } catch (error) {
      console.error('Install failed:', error);
      return false;
    }
  };

  const checkForUpdates = async (): Promise<boolean> => {
    if (!serviceWorkerRegistration) return false;

    try {
      await serviceWorkerRegistration.update();
      return updateAvailable;
    } catch (error) {
      console.error('Update check failed:', error);
      return false;
    }
  };

  const applyUpdate = () => {
    if (serviceWorkerRegistration && updateAvailable) {
      serviceWorkerRegistration.waiting?.postMessage({ type: 'SKIP_WAITING' });
      window.location.reload();
    }
  };

  const shareContent = async (data: ShareData): Promise<void> => {
    if (canShare) {
      try {
        await navigator.share(data);
      } catch (error) {
        console.error('Share failed:', error);
        // Fallback to clipboard
        if (data.url && navigator.clipboard) {
          await navigator.clipboard.writeText(data.url);
        }
      }
    } else {
      // Fallback for browsers without Web Share API
      if (data.url && navigator.clipboard) {
        await navigator.clipboard.writeText(data.url);
      }
    }
  };

  return (
    <PWAContext.Provider
      value={{
        isInstallable,
        isInstalled,
        isOnline,
        installPrompt,
        showInstallPrompt,
        installApp,
        checkForUpdates,
        updateAvailable,
        applyUpdate,
        isStandalone,
        platform,
        canShare,
        shareContent
      }}
    >
      {children}
    </PWAContext.Provider>
  );
}

export function usePWA() {
  const context = useContext(PWAContext);
  if (!context) {
    throw new Error("usePWA must be used within a PWAProvider");
  }
  return context;
}

// PWA utilities
export const pwaUtils = {
  getInstallInstructions: (platform: string) => {
    switch (platform) {
      case 'ios':
        return {
          title: 'Installa su iOS',
          steps: [
            'Apri Safari e vai su highlander-game.it',
            'Tocca il pulsante Condividi',
            'Scorri verso il basso e tocca "Aggiungi alla schermata Home"',
            'Tocca "Aggiungi" per confermare'
          ]
        };
      case 'android':
        return {
          title: 'Installa su Android',
          steps: [
            'Apri Chrome e vai su highlander-game.it',
            'Tocca il menu (tre punti) in alto a destra',
            'Seleziona "Aggiungi alla schermata Home"',
            'Tocca "Aggiungi" per confermare'
          ]
        };
      case 'desktop':
        return {
          title: 'Installa su Desktop',
          steps: [
            'Apri Chrome/Edge e vai su highlander-game.it',
            'Clicca sull\'icona di installazione nella barra degli indirizzi',
            'Oppure vai al menu > Installa Highlander',
            'Clicca "Installa" per confermare'
          ]
        };
      default:
        return {
          title: 'Installa App',
          steps: ['Cerca l\'opzione di installazione nel menu del tuo browser']
        };
    }
  },

  detectInstallMethod: () => {
    if ('beforeinstallprompt' in window) {
      return 'native'; // Browser supports native install prompt
    }
    if ('serviceWorker' in navigator) {
      return 'manual'; // Manual install instructions needed
    }
    return 'unsupported';
  },

  isRunningStandalone: () => {
    return window.matchMedia('(display-mode: standalone)').matches ||
           (window.navigator as any).standalone === true;
  },

  addToHomeScreen: {
    isSupported: () => 'beforeinstallprompt' in window || 'serviceWorker' in navigator,
    
    canInstall: () => {
      // Check if app can be installed
      return !pwaUtils.isRunningStandalone() && pwaUtils.addToHomeScreen.isSupported();
    }
  }
};