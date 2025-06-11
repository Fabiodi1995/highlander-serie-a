import { createContext, ReactNode, useContext, useEffect, useState } from "react";
import { useAuth } from "./use-auth";

interface NotificationPermission {
  granted: boolean;
  denied: boolean;
  default: boolean;
}

interface NotificationContextType {
  permission: NotificationPermission;
  requestPermission: () => Promise<boolean>;
  sendNotification: (title: string, options?: NotificationOptions) => void;
  scheduleGameReminder: (gameId: number, deadline: Date) => void;
  subscriptionStatus: 'unsupported' | 'denied' | 'granted' | 'pending';
}

const NotificationContext = createContext<NotificationContextType | null>(null);

export function NotificationProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [permission, setPermission] = useState<NotificationPermission>({
    granted: false,
    denied: false,
    default: true
  });
  const [subscriptionStatus, setSubscriptionStatus] = useState<'unsupported' | 'denied' | 'granted' | 'pending'>('unsupported');

  useEffect(() => {
    if ('Notification' in window) {
      const currentPermission = Notification.permission;
      setPermission({
        granted: currentPermission === 'granted',
        denied: currentPermission === 'denied',
        default: currentPermission === 'default'
      });
      
      if (currentPermission === 'granted') {
        setSubscriptionStatus('granted');
      } else if (currentPermission === 'denied') {
        setSubscriptionStatus('denied');
      } else {
        setSubscriptionStatus('pending');
      }
    }
  }, []);

  const requestPermission = async (): Promise<boolean> => {
    if (!('Notification' in window)) {
      console.log('Browser does not support notifications');
      setSubscriptionStatus('unsupported');
      return false;
    }

    try {
      const permission = await Notification.requestPermission();
      const granted = permission === 'granted';
      
      setPermission({
        granted,
        denied: permission === 'denied',
        default: permission === 'default'
      });
      
      setSubscriptionStatus(granted ? 'granted' : 'denied');
      
      if (granted && 'serviceWorker' in navigator) {
        // Register service worker for better notification handling
        try {
          await navigator.serviceWorker.register('/sw.js');
        } catch (error) {
          console.log('Service worker registration failed:', error);
        }
      }
      
      return granted;
    } catch (error) {
      console.error('Error requesting notification permission:', error);
      return false;
    }
  };

  const sendNotification = (title: string, options?: NotificationOptions) => {
    if (!permission.granted) return;

    const defaultOptions: NotificationOptions = {
      icon: '/favicon.ico',
      badge: '/favicon.ico',
      tag: 'highlander-notification',
      requireInteraction: false,
      ...options
    };

    try {
      const notification = new Notification(title, defaultOptions);
      
      notification.onclick = () => {
        window.focus();
        notification.close();
        if (options?.data?.url) {
          window.location.href = options.data.url;
        }
      };

      // Auto close after 5 seconds
      setTimeout(() => notification.close(), 5000);
    } catch (error) {
      console.error('Error sending notification:', error);
    }
  };

  const scheduleGameReminder = (gameId: number, deadline: Date) => {
    if (!permission.granted) return;

    const timeUntilDeadline = deadline.getTime() - Date.now();
    const reminderTime = timeUntilDeadline - (2 * 60 * 60 * 1000); // 2 hours before deadline

    if (reminderTime > 0) {
      setTimeout(() => {
        sendNotification(
          'Scadenza Selezioni Vicina!',
          {
            body: `Hai ancora 2 ore per effettuare le tue selezioni nel gioco.`,
            icon: '/favicon.ico',
            tag: `game-reminder-${gameId}`,
            requireInteraction: true,
            data: { url: `/games/${gameId}` }
          }
        );
      }, reminderTime);
    }

    // Final reminder 30 minutes before
    const finalReminderTime = timeUntilDeadline - (30 * 60 * 1000);
    if (finalReminderTime > 0) {
      setTimeout(() => {
        sendNotification(
          'ULTIMA CHIAMATA!',
          {
            body: `Solo 30 minuti rimasti per le selezioni!`,
            icon: '/favicon.ico',
            tag: `game-final-reminder-${gameId}`,
            requireInteraction: true,
            data: { url: `/games/${gameId}` }
          }
        );
      }, finalReminderTime);
    }
  };

  return (
    <NotificationContext.Provider
      value={{
        permission,
        requestPermission,
        sendNotification,
        scheduleGameReminder,
        subscriptionStatus
      }}
    >
      {children}
    </NotificationContext.Provider>
  );
}

export function useNotifications() {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error("useNotifications must be used within a NotificationProvider");
  }
  return context;
}

// Push notification utility functions
export const pushNotificationUtils = {
  async subscribeToPush() {
    if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
      throw new Error('Push messaging is not supported');
    }

    const registration = await navigator.serviceWorker.ready;
    
    // Check if already subscribed
    const existingSubscription = await registration.pushManager.getSubscription();
    if (existingSubscription) {
      return existingSubscription;
    }

    // Subscribe to push notifications
    const subscription = await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: process.env.VITE_VAPID_PUBLIC_KEY
    });

    // Send subscription to server
    await fetch('/api/push/subscribe', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(subscription),
    });

    return subscription;
  },

  async unsubscribeFromPush() {
    if (!('serviceWorker' in navigator)) return;

    const registration = await navigator.serviceWorker.ready;
    const subscription = await registration.pushManager.getSubscription();
    
    if (subscription) {
      await subscription.unsubscribe();
      
      // Notify server
      await fetch('/api/push/unsubscribe', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ endpoint: subscription.endpoint }),
      });
    }
  }
};