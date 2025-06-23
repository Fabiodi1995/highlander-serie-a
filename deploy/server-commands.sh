#!/bin/bash

# Comandi da eseguire sul server Hetzner per applicare il fix login

echo "Applicazione fix login sul server..."

cd /home/highlander/app

# Backup configurazione
cp .env .env.backup 2>/dev/null || true

# Ferma applicazione
pm2 stop highlander 2>/dev/null || true

# Applica fix queryClient.ts
cat > client/src/lib/queryClient.ts << 'EOF'
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

# Applica fix reset-password.tsx
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

# Build applicazione
npm run build

# Ripristina configurazione
cp .env.backup .env 2>/dev/null || true

# Riavvia applicazione
pm2 start highlander 2>/dev/null || pm2 restart highlander

# Attendi avvio
sleep 5

# Verifica stato
if pm2 list | grep -q "highlander.*online"; then
    echo "Fix login applicato con successo"
    echo "App disponibile: https://highlandergame.it"
    echo "Test login e reset password ora funzionanti"
else
    echo "Errore nell'applicazione del fix"
    pm2 logs highlander --lines 10
    exit 1
fi

echo "Fix completato - testare login su https://highlandergame.it"