import { useState, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";

interface OfflineAction {
  id: string;
  type: 'CREATE_TICKET' | 'UPDATE_SELECTION' | 'DELETE_TICKET';
  data: any;
  timestamp: number;
  retryCount: number;
}

export function useOfflineSync() {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [pendingActions, setPendingActions] = useState<OfflineAction[]>([]);
  const [isSyncing, setIsSyncing] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    // Load pending actions from localStorage
    const stored = localStorage.getItem('offline-actions');
    if (stored) {
      try {
        setPendingActions(JSON.parse(stored));
      } catch (error) {
        console.error('Error loading offline actions:', error);
      }
    }

    const handleOnline = () => {
      setIsOnline(true);
      toast({
        title: "Connessione ripristinata",
        description: "Sincronizzazione delle azioni offline in corso...",
      });
      syncPendingActions();
    };

    const handleOffline = () => {
      setIsOnline(false);
      toast({
        title: "Modalità offline",
        description: "Le tue azioni verranno salvate e sincronizzate alla riconnessione",
        variant: "destructive",
      });
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Sync on mount if online and has pending actions
    if (navigator.onLine && pendingActions.length > 0) {
      syncPendingActions();
    }

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const addOfflineAction = (type: OfflineAction['type'], data: any) => {
    const action: OfflineAction = {
      id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      type,
      data,
      timestamp: Date.now(),
      retryCount: 0
    };

    const newActions = [...pendingActions, action];
    setPendingActions(newActions);
    localStorage.setItem('offline-actions', JSON.stringify(newActions));

    toast({
      title: "Azione salvata offline",
      description: "Verrà sincronizzata quando torni online",
    });

    return action.id;
  };

  const syncPendingActions = async () => {
    if (isSyncing || pendingActions.length === 0) return;

    setIsSyncing(true);
    const failedActions: OfflineAction[] = [];
    let successCount = 0;

    for (const action of pendingActions) {
      try {
        await executeAction(action);
        successCount++;
      } catch (error) {
        console.error('Failed to sync action:', action, error);
        
        // Retry logic
        if (action.retryCount < 3) {
          failedActions.push({
            ...action,
            retryCount: action.retryCount + 1
          });
        } else {
          // Remove action after 3 failed attempts
          toast({
            title: "Azione fallita",
            description: `Impossibile sincronizzare: ${action.type}`,
            variant: "destructive",
          });
        }
      }
    }

    setPendingActions(failedActions);
    localStorage.setItem('offline-actions', JSON.stringify(failedActions));
    setIsSyncing(false);

    if (successCount > 0) {
      toast({
        title: "Sincronizzazione completata",
        description: `${successCount} azioni sincronizzate con successo`,
      });
    }
  };

  const executeAction = async (action: OfflineAction) => {
    const baseUrl = window.location.origin;
    
    switch (action.type) {
      case 'CREATE_TICKET':
        return fetch(`${baseUrl}/api/tickets`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(action.data),
          credentials: 'include'
        });
        
      case 'UPDATE_SELECTION':
        return fetch(`${baseUrl}/api/team-selections/${action.data.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(action.data),
          credentials: 'include'
        });
        
      case 'DELETE_TICKET':
        return fetch(`${baseUrl}/api/tickets/${action.data.id}`, {
          method: 'DELETE',
          credentials: 'include'
        });
        
      default:
        throw new Error(`Unknown action type: ${action.type}`);
    }
  };

  const clearPendingActions = () => {
    setPendingActions([]);
    localStorage.removeItem('offline-actions');
  };

  return {
    isOnline,
    pendingActions,
    isSyncing,
    addOfflineAction,
    syncPendingActions,
    clearPendingActions,
    hasPendingActions: pendingActions.length > 0
  };
}