#!/bin/bash

# Script per aggiornare il codice in produzione con il fix del login
echo "🚀 Aggiornamento codice produzione - Fix Login..."

# Crea backup del codice corrente
BACKUP_DIR="/home/highlander/app_backup_$(date +%Y%m%d_%H%M%S)"
echo "📦 Creazione backup in: $BACKUP_DIR"
sudo cp -r /home/highlander/app $BACKUP_DIR

# Naviga alla directory app
cd /home/highlander/app

# Ferma l'applicazione
echo "⏹️ Fermata applicazione..."
sudo pm2 stop highlander || true

# Aggiorna il query client con il fix
echo "🔧 Aggiornamento query client..."

# Backup del file originale
sudo cp client/src/lib/queryClient.ts client/src/lib/queryClient.ts.backup

# Applica il fix per il response cloning
sudo tee client/src/lib/queryClient.ts > /dev/null << 'EOF'
import { QueryClient, QueryFunction } from "@tanstack/react-query";

async function throwIfResNotOk(res: Response) {
  if (!res.ok) {
    let errorMessage = res.statusText;
    
    try {
      // Clone the response to avoid consuming the body
      const clonedRes = res.clone();
      const errorData = await clonedRes.json();
      errorMessage = errorData.message || res.statusText;
    } catch (jsonError) {
      // If JSON parsing fails, try to read as text
      try {
        const clonedRes = res.clone();
        const text = await clonedRes.text();
        errorMessage = text || res.statusText;
      } catch (textError) {
        // Use status text as fallback
        errorMessage = res.statusText;
      }
    }
    
    throw new Error(errorMessage);
  }
}

export async function apiRequest(
  method: string,
  url: string,
  data?: unknown | undefined,
): Promise<Response> {
  const res = await fetch(url, {
    method,
    headers: data ? { "Content-Type": "application/json" } : {},
    body: data ? JSON.stringify(data) : undefined,
    credentials: "include",
  });

  await throwIfResNotOk(res);
  return res;
}

type UnauthorizedBehavior = "returnNull" | "throw";
export const getQueryFn: <T>(options: {
  on401: UnauthorizedBehavior;
}) => QueryFunction<T> =
  ({ on401: unauthorizedBehavior }) =>
  async ({ queryKey }) => {
    const res = await fetch(queryKey[0] as string, {
      credentials: "include",
    });

    if (unauthorizedBehavior === "returnNull" && res.status === 401) {
      return null;
    }

    await throwIfResNotOk(res);
    return await res.json();
  };

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      queryFn: getQueryFn({ on401: "throw" }),
      refetchInterval: false,
      refetchOnWindowFocus: false,
      staleTime: Infinity,
      retry: false,
    },
    mutations: {
      retry: false,
    },
  },
});
EOF

echo "✅ Query client aggiornato"

# Aggiorna reset-password.tsx con gestione errori migliorata
echo "🔧 Aggiornamento reset password..."

# Trova e aggiorna la gestione errori nel reset password
sudo sed -i '/const result = await response.json();/,/} else {/c\
      if (response.ok) {\
        const result = await response.json();\
        setIsSuccess(true);\
        toast({\
          title: "Password aggiornata",\
          description: "La tua password è stata cambiata con successo",\
        });\
      } else {\
        let errorMessage = "Si è verificato un errore";\
        try {\
          const result = await response.json();\
          errorMessage = result.message || errorMessage;\
        } catch {\
          errorMessage = `Errore ${response.status}: ${response.statusText}`;\
        }\
        \
        toast({\
          title: "Errore",\
          description: errorMessage,\
          variant: "destructive",\
        });\
      }\
    } catch (error) {' client/src/pages/reset-password.tsx

echo "✅ Reset password aggiornato"

# Ricompila l'applicazione
echo "🔨 Compilazione applicazione..."
sudo npm run build

if [ $? -eq 0 ]; then
    echo "✅ Compilazione completata con successo"
else
    echo "❌ Errore nella compilazione"
    echo "🔄 Ripristino backup..."
    sudo rm -rf /home/highlander/app
    sudo mv $BACKUP_DIR /home/highlander/app
    exit 1
fi

# Riavvia l'applicazione
echo "▶️ Riavvio applicazione..."
sudo pm2 start highlander

# Attendi che l'applicazione si avvii
sleep 5

# Verifica stato
if sudo pm2 list | grep -q "highlander.*online"; then
    echo "✅ Applicazione riavviata con successo"
    echo ""
    echo "🌐 Test login disponibile su: https://highlandergame.it"
    echo ""
    echo "🧪 Test consigliati:"
    echo "   1. Login con credenziali esistenti"
    echo "   2. Reset password"
    echo "   3. Registrazione nuovo utente"
    echo ""
    echo "📋 Backup salvato in: $BACKUP_DIR"
else
    echo "❌ Errore nel riavvio dell'applicazione"
    echo "📋 Log errori:"
    sudo pm2 logs highlander --lines 20
    
    echo "🔄 Ripristino backup..."
    sudo pm2 stop highlander || true
    sudo rm -rf /home/highlander/app
    sudo mv $BACKUP_DIR /home/highlander/app
    sudo pm2 start highlander
    exit 1
fi

echo "🎉 Aggiornamento completato!"
EOF