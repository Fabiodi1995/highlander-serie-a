import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { 
  Bell, 
  BellOff, 
  CheckCircle, 
  AlertCircle, 
  Smartphone,
  Clock,
  Trophy,
  Users
} from "lucide-react";
import { usePushNotifications } from "@/hooks/use-push-notifications";

export function NotificationSettings() {
  const {
    isSupported,
    isSubscribed,
    permission,
    requestPermission,
    subscribe,
    unsubscribe,
    sendTestNotification
  } = usePushNotifications();

  const [settings, setSettings] = useState({
    gameDeadlines: true,
    gameUpdates: true,
    eliminationAlerts: true,
    newRounds: true,
    socialUpdates: false,
    systemUpdates: true
  });

  const handlePermissionRequest = async () => {
    const granted = await requestPermission();
    if (granted) {
      await subscribe();
    }
  };

  const handleUnsubscribe = async () => {
    await unsubscribe();
  };

  const updateSetting = (key: keyof typeof settings, value: boolean) => {
    setSettings(prev => ({ ...prev, [key]: value }));
    // Save to localStorage
    localStorage.setItem('notification-settings', JSON.stringify({ ...settings, [key]: value }));
  };

  const getPermissionStatus = () => {
    switch (permission) {
      case 'granted':
        return { color: 'text-green-600', icon: <CheckCircle className="h-4 w-4" />, text: 'Autorizzate' };
      case 'denied':
        return { color: 'text-red-600', icon: <BellOff className="h-4 w-4" />, text: 'Bloccate' };
      default:
        return { color: 'text-yellow-600', icon: <AlertCircle className="h-4 w-4" />, text: 'In attesa' };
    }
  };

  const status = getPermissionStatus();

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Bell className="h-5 w-5" />
            <span>Impostazioni Notifiche</span>
          </CardTitle>
          <CardDescription>
            Gestisci le notifiche push per rimanere aggiornato sui tuoi giochi
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Browser Support Check */}
          {!isSupported && (
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                Il tuo browser non supporta le notifiche push. 
                Prova con Chrome, Firefox, Edge o Safari.
              </AlertDescription>
            </Alert>
          )}

          {/* Permission Status */}
          <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
            <div className="flex items-center space-x-3">
              <Smartphone className="h-5 w-5 text-gray-600" />
              <div>
                <p className="font-medium">Stato Notifiche</p>
                <p className="text-sm text-gray-600">Permessi browser correnti</p>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <div className={`flex items-center space-x-1 ${status.color}`}>
                {status.icon}
                <span className="text-sm font-medium">{status.text}</span>
              </div>
              {isSubscribed && (
                <Badge variant="default" className="text-xs">Attive</Badge>
              )}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex space-x-3">
            {permission !== 'granted' && isSupported && (
              <Button onClick={handlePermissionRequest} className="flex-1">
                <Bell className="h-4 w-4 mr-2" />
                Abilita Notifiche
              </Button>
            )}
            
            {isSubscribed && (
              <>
                <Button onClick={sendTestNotification} variant="outline">
                  Testa Notifiche
                </Button>
                <Button onClick={handleUnsubscribe} variant="destructive">
                  <BellOff className="h-4 w-4 mr-2" />
                  Disabilita
                </Button>
              </>
            )}
          </div>

          {/* Notification Categories */}
          {isSubscribed && (
            <div className="space-y-4">
              <h4 className="font-semibold">Tipi di Notifiche</h4>
              
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <Clock className="h-4 w-4 text-orange-500" />
                    <div>
                      <Label htmlFor="deadlines">Scadenze Giochi</Label>
                      <p className="text-xs text-gray-500">Avvisi prima della chiusura selezioni</p>
                    </div>
                  </div>
                  <Switch
                    id="deadlines"
                    checked={settings.gameDeadlines}
                    onCheckedChange={(checked) => updateSetting('gameDeadlines', checked)}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <Trophy className="h-4 w-4 text-blue-500" />
                    <div>
                      <Label htmlFor="updates">Aggiornamenti Giochi</Label>
                      <p className="text-xs text-gray-500">Nuovi round e risultati</p>
                    </div>
                  </div>
                  <Switch
                    id="updates"
                    checked={settings.gameUpdates}
                    onCheckedChange={(checked) => updateSetting('gameUpdates', checked)}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <AlertCircle className="h-4 w-4 text-red-500" />
                    <div>
                      <Label htmlFor="eliminations">Eliminazioni</Label>
                      <p className="text-xs text-gray-500">Quando i tuoi ticket vengono eliminati</p>
                    </div>
                  </div>
                  <Switch
                    id="eliminations"
                    checked={settings.eliminationAlerts}
                    onCheckedChange={(checked) => updateSetting('eliminationAlerts', checked)}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <Users className="h-4 w-4 text-green-500" />
                    <div>
                      <Label htmlFor="social">Aggiornamenti Social</Label>
                      <p className="text-xs text-gray-500">Attività di altri giocatori</p>
                    </div>
                  </div>
                  <Switch
                    id="social"
                    checked={settings.socialUpdates}
                    onCheckedChange={(checked) => updateSetting('socialUpdates', checked)}
                  />
                </div>
              </div>
            </div>
          )}

          {/* Help Text */}
          <div className="text-xs text-gray-500 bg-blue-50 p-3 rounded-lg">
            <p>
              <strong>Suggerimento:</strong> Le notifiche funzionano anche quando l'app è chiusa. 
              Riceverai avvisi importanti direttamente sul tuo dispositivo.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}