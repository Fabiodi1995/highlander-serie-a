import { useState, useEffect } from "react";

interface PushNotificationState {
  isSupported: boolean;
  isSubscribed: boolean;
  subscription: PushSubscription | null;
  permission: NotificationPermission;
}

export function usePushNotifications() {
  const [state, setState] = useState<PushNotificationState>({
    isSupported: false,
    isSubscribed: false,
    subscription: null,
    permission: 'default'
  });

  useEffect(() => {
    if ('serviceWorker' in navigator && 'PushManager' in window) {
      setState(prev => ({ ...prev, isSupported: true }));
      checkSubscription();
    }
  }, []);

  const checkSubscription = async () => {
    try {
      const registration = await navigator.serviceWorker.ready;
      const subscription = await registration.pushManager.getSubscription();
      
      setState(prev => ({
        ...prev,
        isSubscribed: !!subscription,
        subscription,
        permission: Notification.permission
      }));
    } catch (error) {
      console.error('Error checking push subscription:', error);
    }
  };

  const requestPermission = async (): Promise<boolean> => {
    if (!state.isSupported) return false;

    try {
      const permission = await Notification.requestPermission();
      setState(prev => ({ ...prev, permission }));
      return permission === 'granted';
    } catch (error) {
      console.error('Error requesting notification permission:', error);
      return false;
    }
  };

  const subscribe = async (): Promise<boolean> => {
    if (!state.isSupported) return false;

    try {
      const registration = await navigator.serviceWorker.ready;
      
      // Generate VAPID key (in production, this should come from your server)
      const vapidPublicKey = 'BEl62iUYgUivxIkv69yViEuiBIa40HI0DLKlCjxjkXL3YTvHFgGT2HKJyJqCgAjqv4_VcQANxsHSgJqJdEBUuGc';
      
      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(vapidPublicKey)
      });

      // Send subscription to server
      await fetch('/api/push/subscribe', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(subscription)
      });

      setState(prev => ({
        ...prev,
        isSubscribed: true,
        subscription
      }));

      return true;
    } catch (error) {
      console.error('Error subscribing to push notifications:', error);
      return false;
    }
  };

  const unsubscribe = async (): Promise<boolean> => {
    if (!state.subscription) return false;

    try {
      await state.subscription.unsubscribe();
      
      // Notify server
      await fetch('/api/push/unsubscribe', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ endpoint: state.subscription.endpoint })
      });

      setState(prev => ({
        ...prev,
        isSubscribed: false,
        subscription: null
      }));

      return true;
    } catch (error) {
      console.error('Error unsubscribing from push notifications:', error);
      return false;
    }
  };

  const sendTestNotification = async () => {
    if (state.permission === 'granted') {
      new Notification('Test Highlander', {
        body: 'Le notifiche funzionano correttamente!',
        icon: '/icons/icon-192x192.png',
        badge: '/icons/icon-72x72.png',
        tag: 'test-notification'
      });
    }
  };

  return {
    ...state,
    requestPermission,
    subscribe,
    unsubscribe,
    sendTestNotification,
    checkSubscription
  };
}

// Helper function to convert VAPID key
function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = '='.repeat((4 - base64String.length % 4) % 4);
  const base64 = (base64String + padding)
    .replace(/-/g, '+')
    .replace(/_/g, '/');

  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);

  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}