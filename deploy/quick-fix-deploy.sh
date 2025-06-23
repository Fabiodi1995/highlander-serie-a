#!/bin/bash

# Deploy rapido del fix login su Hetzner
# Modifica SERVER_IP con l'IP del tuo server

SERVER_IP="YOUR_HETZNER_IP"
SERVER_USER="root"

echo "Deploy fix login su server Hetzner..."

# Crea pacchetto con solo i file modificati
mkdir -p /tmp/highlander-fix
cp -r client/src/lib/queryClient.ts /tmp/highlander-fix/
cp -r client/src/pages/reset-password.tsx /tmp/highlander-fix/

# Applica fix direttamente sul server
ssh $SERVER_USER@$SERVER_IP << 'EOF'
cd /home/highlander/app

# Backup configurazione
cp .env .env.backup 2>/dev/null || true

# Ferma app
pm2 stop highlander 2>/dev/null || true

# Applica fix queryClient
cat > client/src/lib/queryClient.ts << 'QUERY_CLIENT'
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
QUERY_CLIENT

# Fix reset-password gestione errori
sed -i '/const result = await response.json();/,/} else {/c\
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

# Build app
npm run build

# Ripristina .env
cp .env.backup .env 2>/dev/null || true

# Riavvia app
pm2 start highlander 2>/dev/null || pm2 restart highlander

sleep 3

if pm2 list | grep -q "highlander.*online"; then
    echo "Fix applicato con successo"
    echo "Test login: https://highlandergame.it"
else
    echo "Errore nell'applicazione del fix"
    pm2 logs highlander --lines 10
fi
EOF

echo "Fix deploy completato"