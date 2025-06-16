/**
 * Centralized error handling utilities for consistent error management
 */

export interface ApiError {
  message: string;
  code?: string;
  status?: number;
  errors?: Array<{ field: string; error: string }>;
  timestamp?: string;
}

export class AppError extends Error {
  public code?: string;
  public status?: number;
  public errors?: Array<{ field: string; error: string }>;
  public timestamp: string;

  constructor(message: string, code?: string, status?: number) {
    super(message);
    this.name = 'AppError';
    this.code = code;
    this.status = status;
    this.timestamp = new Date().toISOString();
  }
}

/**
 * Parse API response errors into standardized format
 */
export async function parseApiError(response: Response): Promise<AppError> {
  let errorData: any = {};
  
  try {
    errorData = await response.json();
  } catch {
    // If JSON parsing fails, use status text
    errorData = { message: response.statusText };
  }

  const message = errorData.message || `HTTP ${response.status}: ${response.statusText}`;
  const error = new AppError(message, errorData.code, response.status);
  
  if (errorData.errors) {
    error.errors = errorData.errors;
  }

  return error;
}

/**
 * Handle common API errors with user-friendly messages
 */
export function getErrorMessage(error: AppError | Error | unknown): {
  title: string;
  description: string;
  action?: string;
} {
  if (error instanceof AppError) {
    switch (error.code) {
      case 'VALIDATION_FAILED':
        return {
          title: 'Dati Non Validi',
          description: error.errors?.[0]?.error || error.message,
          action: 'Controlla i dati inseriti e riprova'
        };
      
      case 'UNAUTHORIZED':
        return {
          title: 'Accesso Negato',
          description: 'Non hai i permessi per questa operazione',
          action: 'Effettua il login o contatta l\'amministratore'
        };
      
      case 'GAME_NOT_FOUND':
        return {
          title: 'Gioco Non Trovato',
          description: 'Il gioco richiesto non esiste o è stato eliminato',
          action: 'Torna alla dashboard'
        };
      
      case 'SELECTIONS_LOCKED':
        return {
          title: 'Selezioni Bloccate',
          description: 'Le selezioni per questo round sono state chiuse',
          action: 'Attendi il prossimo round'
        };
      
      case 'TEAM_ALREADY_SELECTED':
        return {
          title: 'Squadra Già Selezionata',
          description: 'Hai già utilizzato questa squadra in un round precedente',
          action: 'Scegli una squadra diversa'
        };
      
      case 'NETWORK_ERROR':
        return {
          title: 'Errore di Connessione',
          description: 'Non è possibile comunicare con il server',
          action: 'Controlla la connessione e riprova'
        };
      
      default:
        return {
          title: 'Errore',
          description: error.message,
          action: 'Riprova più tardi'
        };
    }
  }

  if (error instanceof Error) {
    if (error.message.includes('NetworkError') || error.message.includes('fetch')) {
      return {
        title: 'Errore di Rete',
        description: 'Problemi di connessione al server',
        action: 'Controlla la connessione internet'
      };
    }

    if (error.message.includes('ChunkLoadError')) {
      return {
        title: 'Errore di Caricamento',
        description: 'Aggiornamento dell\'applicazione rilevato',
        action: 'Ricarica la pagina'
      };
    }

    return {
      title: 'Errore',
      description: error.message,
      action: 'Riprova'
    };
  }

  return {
    title: 'Errore Imprevisto',
    description: 'Si è verificato un errore sconosciuto',
    action: 'Ricarica la pagina o contatta il supporto'
  };
}

/**
 * Retry mechanism for failed operations
 */
export async function withRetry<T>(
  operation: () => Promise<T>,
  maxRetries: number = 3,
  delay: number = 1000
): Promise<T> {
  let lastError: Error;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await operation();
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));
      
      if (attempt === maxRetries) {
        break;
      }

      // Exponential backoff
      const waitTime = delay * Math.pow(2, attempt - 1);
      await new Promise(resolve => setTimeout(resolve, waitTime));
    }
  }

  throw lastError!;
}

/**
 * Log errors for debugging and monitoring
 */
export function logError(error: Error | AppError, context?: string) {
  const errorInfo = {
    message: error.message,
    stack: error.stack,
    timestamp: new Date().toISOString(),
    context,
    url: window.location.href,
    userAgent: navigator.userAgent
  };

  console.error('Application Error:', errorInfo);

  // Send to monitoring service in production
  if (process.env.NODE_ENV === 'production' && 'fetch' in window) {
    fetch('/api/client-errors', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        errorId: `ERR_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        ...errorInfo
      })
    }).catch(reportError => {
      console.error('Failed to report error:', reportError);
    });
  }
}

/**
 * Enhanced API request wrapper with error handling
 */
export async function safeApiRequest<T>(
  url: string,
  options?: RequestInit
): Promise<T> {
  try {
    const response = await fetch(url, {
      headers: {
        'Content-Type': 'application/json',
        ...options?.headers
      },
      ...options
    });

    if (!response.ok) {
      const apiError = await parseApiError(response);
      throw apiError;
    }

    return await response.json();
  } catch (error) {
    if (error instanceof AppError) {
      throw error;
    }

    // Handle network errors
    if (error instanceof TypeError && error.message.includes('fetch')) {
      throw new AppError('Errore di connessione', 'NETWORK_ERROR', 0);
    }

    // Handle JSON parsing errors
    if (error instanceof SyntaxError) {
      throw new AppError('Risposta server non valida', 'INVALID_RESPONSE', 0);
    }

    throw new AppError(
      error instanceof Error ? error.message : 'Errore sconosciuto',
      'UNKNOWN_ERROR'
    );
  }
}