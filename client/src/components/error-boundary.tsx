import React, { Component, ErrorInfo, ReactNode } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertTriangle, RefreshCw, Home } from 'lucide-react';
import { Link } from 'wouter';

interface Props {
  children: ReactNode;
  fallbackComponent?: React.ComponentType<ErrorBoundaryState>;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
  errorId: string;
}

export class ErrorBoundary extends Component<Props, ErrorBoundaryState> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      errorId: ''
    };
  }

  static getDerivedStateFromError(error: Error): Partial<ErrorBoundaryState> {
    // Generate unique error ID for tracking
    const errorId = `ERR_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    return {
      hasError: true,
      error,
      errorId
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    this.setState({
      error,
      errorInfo
    });

    // Log error details for debugging
    console.error('ErrorBoundary caught an error:', {
      error: error.message,
      stack: error.stack,
      componentStack: errorInfo.componentStack,
      errorId: this.state.errorId,
      timestamp: new Date().toISOString(),
      userAgent: navigator.userAgent,
      url: window.location.href
    });

    // Call custom error handler if provided
    if (this.props.onError) {
      this.props.onError(error, errorInfo);
    }

    // Send error to monitoring service in production
    if (process.env.NODE_ENV === 'production') {
      this.reportErrorToService(error, errorInfo);
    }
  }

  private reportErrorToService(error: Error, errorInfo: ErrorInfo) {
    // In a real app, this would send to Sentry, LogRocket, etc.
    fetch('/api/client-errors', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        errorId: this.state.errorId,
        message: error.message,
        stack: error.stack,
        componentStack: errorInfo.componentStack,
        timestamp: new Date().toISOString(),
        userAgent: navigator.userAgent,
        url: window.location.href
      })
    }).catch(reportError => {
      console.error('Failed to report error:', reportError);
    });
  }

  private handleRetry = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
      errorId: ''
    });
  };

  private getErrorType(error: Error): string {
    if (error.message.includes('ChunkLoadError') || error.message.includes('Loading chunk')) {
      return 'CHUNK_LOAD_ERROR';
    }
    if (error.message.includes('Network Error') || error.message.includes('fetch')) {
      return 'NETWORK_ERROR';
    }
    if (error.message.includes('React') || error.message.includes('component')) {
      return 'REACT_ERROR';
    }
    return 'UNKNOWN_ERROR';
  }

  private getErrorMessage(errorType: string): { title: string; description: string; suggestion: string } {
    switch (errorType) {
      case 'CHUNK_LOAD_ERROR':
        return {
          title: 'Errore di Caricamento',
          description: 'Non è stato possibile caricare una parte dell\'applicazione.',
          suggestion: 'Questo può accadere dopo un aggiornamento. Prova a ricaricare la pagina.'
        };
      case 'NETWORK_ERROR':
        return {
          title: 'Errore di Connessione',
          description: 'Non è stato possibile comunicare con il server.',
          suggestion: 'Controlla la tua connessione internet e riprova.'
        };
      case 'REACT_ERROR':
        return {
          title: 'Errore dell\'Interfaccia',
          description: 'Si è verificato un problema con l\'interfaccia utente.',
          suggestion: 'Prova a ricaricare la pagina o torna alla homepage.'
        };
      default:
        return {
          title: 'Errore Imprevisto',
          description: 'Si è verificato un errore imprevisto.',
          suggestion: 'Prova a ricaricare la pagina. Se il problema persiste, contatta il supporto.'
        };
    }
  }

  render() {
    if (this.state.hasError) {
      // Use custom fallback component if provided
      if (this.props.fallbackComponent) {
        const FallbackComponent = this.props.fallbackComponent;
        return <FallbackComponent {...this.state} />;
      }

      const errorType = this.getErrorType(this.state.error!);
      const { title, description, suggestion } = this.getErrorMessage(errorType);

      return (
        <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
          <Card className="w-full max-w-md">
            <CardHeader className="text-center">
              <div className="mx-auto mb-4 p-3 rounded-full bg-red-100">
                <AlertTriangle className="h-8 w-8 text-red-600" />
              </div>
              <CardTitle className="text-red-900">{title}</CardTitle>
              <CardDescription>{description}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-gray-600 text-center">
                {suggestion}
              </p>
              
              {process.env.NODE_ENV === 'development' && this.state.error && (
                <details className="bg-gray-100 p-3 rounded text-xs">
                  <summary className="cursor-pointer font-medium">
                    Dettagli Tecnici (Development)
                  </summary>
                  <div className="mt-2 space-y-2">
                    <div>
                      <strong>Error ID:</strong> {this.state.errorId}
                    </div>
                    <div>
                      <strong>Message:</strong> {this.state.error.message}
                    </div>
                    <div>
                      <strong>Stack:</strong>
                      <pre className="mt-1 whitespace-pre-wrap text-xs">
                        {this.state.error.stack}
                      </pre>
                    </div>
                  </div>
                </details>
              )}

              <div className="flex flex-col sm:flex-row gap-2">
                <Button 
                  onClick={this.handleRetry}
                  className="flex-1"
                  variant="default"
                >
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Riprova
                </Button>
                <Link href="/" className="flex-1">
                  <Button variant="outline" className="w-full">
                    <Home className="h-4 w-4 mr-2" />
                    Homepage
                  </Button>
                </Link>
              </div>

              <div className="text-center text-xs text-gray-500">
                Error ID: {this.state.errorId}
              </div>
            </CardContent>
          </Card>
        </div>
      );
    }

    return this.props.children;
  }
}

// Hook for functional components to report errors
export const useErrorHandler = () => {
  const reportError = (error: Error, context?: string) => {
    console.error('Manual error report:', { error, context });
    
    // Report to monitoring service
    if (process.env.NODE_ENV === 'production') {
      fetch('/api/client-errors', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          errorId: `MANUAL_${Date.now()}`,
          message: error.message,
          stack: error.stack,
          context,
          timestamp: new Date().toISOString(),
          userAgent: navigator.userAgent,
          url: window.location.href
        })
      }).catch(console.error);
    }
  };

  return { reportError };
};

// Simple error boundary for wrapping specific components
export const SimpleErrorBoundary: React.FC<{ children: ReactNode }> = ({ children }) => {
  return (
    <ErrorBoundary
      fallbackComponent={() => (
        <div className="p-4 border border-red-200 bg-red-50 rounded-lg">
          <div className="flex items-center mb-2">
            <AlertTriangle className="h-4 w-4 text-red-600 mr-2" />
            <span className="text-sm font-medium text-red-800">
              Errore nel componente
            </span>
          </div>
          <p className="text-sm text-red-700">
            Questo componente ha riscontrato un errore. Prova a ricaricare la pagina.
          </p>
        </div>
      )}
    >
      {children}
    </ErrorBoundary>
  );
};