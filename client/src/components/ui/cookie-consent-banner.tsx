import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Cookie, Settings, X, Check } from "lucide-react";
import { Link } from "wouter";

export function CookieConsentBanner() {
  const [isVisible, setIsVisible] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [preferences, setPreferences] = useState({
    necessary: true,
    functional: false,
    analytics: false,
    marketing: false
  });

  useEffect(() => {
    // Check if user has already given consent
    const consentGiven = localStorage.getItem('cookieConsentGiven');
    if (!consentGiven) {
      setIsVisible(true);
    }
  }, []);

  const acceptAll = () => {
    const allAccepted = {
      necessary: true,
      functional: true,
      analytics: true,
      marketing: true
    };
    localStorage.setItem('cookiePreferences', JSON.stringify(allAccepted));
    localStorage.setItem('cookieConsentGiven', 'true');
    setIsVisible(false);
  };

  const acceptNecessaryOnly = () => {
    const necessaryOnly = {
      necessary: true,
      functional: false,
      analytics: false,
      marketing: false
    };
    localStorage.setItem('cookiePreferences', JSON.stringify(necessaryOnly));
    localStorage.setItem('cookieConsentGiven', 'true');
    setIsVisible(false);
  };

  const saveCustomPreferences = () => {
    localStorage.setItem('cookiePreferences', JSON.stringify(preferences));
    localStorage.setItem('cookieConsentGiven', 'true');
    setIsVisible(false);
  };

  const handlePreferenceChange = (type: keyof typeof preferences, value: boolean) => {
    if (type === 'necessary') return; // Cannot change necessary cookies
    setPreferences(prev => ({ ...prev, [type]: value }));
  };

  if (!isVisible) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 p-4 bg-black/50 backdrop-blur-sm">
      <Card className="max-w-4xl mx-auto bg-white dark:bg-gray-800 shadow-2xl">
        <CardContent className="p-6">
          <div className="flex items-start gap-4">
            <Cookie className="h-8 w-8 text-orange-600 flex-shrink-0 mt-1" />
            
            <div className="flex-1">
              <h3 className="font-bold text-lg text-gray-900 dark:text-white mb-2">
                Utilizziamo i Cookie
              </h3>
              
              {!showSettings ? (
                <>
                  <p className="text-gray-700 dark:text-gray-300 mb-4">
                    Utilizziamo cookie essenziali per il funzionamento del sito e cookie opzionali per migliorare 
                    la tua esperienza. Puoi gestire le tue preferenze o accettare tutti i cookie.
                  </p>
                  
                  <div className="flex flex-wrap gap-3">
                    <Button onClick={acceptAll} className="bg-green-600 hover:bg-green-700">
                      <Check className="h-4 w-4 mr-2" />
                      Accetta Tutti
                    </Button>
                    
                    <Button 
                      onClick={acceptNecessaryOnly} 
                      variant="outline"
                      className="border-gray-300 hover:bg-gray-50 dark:border-gray-600 dark:hover:bg-gray-700"
                    >
                      Solo Necessari
                    </Button>
                    
                    <Button 
                      onClick={() => setShowSettings(true)} 
                      variant="outline"
                      className="border-blue-300 text-blue-600 hover:bg-blue-50 dark:border-blue-600 dark:text-blue-400 dark:hover:bg-blue-900/20"
                    >
                      <Settings className="h-4 w-4 mr-2" />
                      Personalizza
                    </Button>
                    
                    <Link href="/cookie-policy">
                      <Button variant="ghost" className="text-gray-600 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-200">
                        Cookie Policy
                      </Button>
                    </Link>
                  </div>
                </>
              ) : (
                <>
                  <p className="text-gray-700 dark:text-gray-300 mb-4">
                    Personalizza le tue preferenze sui cookie:
                  </p>
                  
                  <div className="space-y-3 mb-4">
                    <div className="flex items-center justify-between p-3 border border-green-200 dark:border-green-800 rounded-lg bg-green-50 dark:bg-green-900/20">
                      <div>
                        <h5 className="font-semibold text-green-800 dark:text-green-200">Cookie Necessari</h5>
                        <p className="text-sm text-green-700 dark:text-green-300">Essenziali per il funzionamento</p>
                      </div>
                      <input 
                        type="checkbox" 
                        checked={preferences.necessary} 
                        disabled 
                        className="w-4 h-4" 
                      />
                    </div>
                    
                    <div className="flex items-center justify-between p-3 border border-blue-200 dark:border-blue-800 rounded-lg bg-blue-50 dark:bg-blue-900/20">
                      <div>
                        <h5 className="font-semibold text-blue-800 dark:text-blue-200">Cookie di Funzionalità</h5>
                        <p className="text-sm text-blue-700 dark:text-blue-300">Migliorano l'esperienza</p>
                      </div>
                      <input 
                        type="checkbox" 
                        checked={preferences.functional}
                        onChange={(e) => handlePreferenceChange('functional', e.target.checked)}
                        className="w-4 h-4" 
                      />
                    </div>
                    
                    <div className="flex items-center justify-between p-3 border border-purple-200 dark:border-purple-800 rounded-lg bg-purple-50 dark:bg-purple-900/20">
                      <div>
                        <h5 className="font-semibold text-purple-800 dark:text-purple-200">Cookie di Analisi</h5>
                        <p className="text-sm text-purple-700 dark:text-purple-300">Statistiche anonime</p>
                      </div>
                      <input 
                        type="checkbox" 
                        checked={preferences.analytics}
                        onChange={(e) => handlePreferenceChange('analytics', e.target.checked)}
                        className="w-4 h-4" 
                      />
                    </div>
                    
                    <div className="flex items-center justify-between p-3 border border-red-200 dark:border-red-800 rounded-lg bg-red-50 dark:bg-red-900/20">
                      <div>
                        <h5 className="font-semibold text-red-800 dark:text-red-200">Cookie di Marketing</h5>
                        <p className="text-sm text-red-700 dark:text-red-300">Contenuti personalizzati</p>
                      </div>
                      <input 
                        type="checkbox" 
                        checked={preferences.marketing}
                        onChange={(e) => handlePreferenceChange('marketing', e.target.checked)}
                        className="w-4 h-4" 
                      />
                    </div>
                  </div>
                  
                  <div className="flex flex-wrap gap-3">
                    <Button onClick={saveCustomPreferences} className="bg-blue-600 hover:bg-blue-700">
                      <Check className="h-4 w-4 mr-2" />
                      Salva Preferenze
                    </Button>
                    
                    <Button 
                      onClick={() => setShowSettings(false)} 
                      variant="outline"
                    >
                      Indietro
                    </Button>
                  </div>
                </>
              )}
            </div>
            
            <Button
              onClick={() => setIsVisible(false)}
              variant="ghost"
              size="sm"
              className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}