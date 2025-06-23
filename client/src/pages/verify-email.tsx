import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";
import { CheckCircle, AlertCircle, Loader2, Mail } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export default function VerifyEmailPage() {
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [message, setMessage] = useState('');
  const { toast } = useToast();

  useEffect(() => {
    const verifyEmail = async () => {
      try {
        const urlParams = new URLSearchParams(window.location.search);
        const token = urlParams.get('token');
        
        if (!token) {
          setStatus('error');
          setMessage('Token di verifica mancante');
          return;
        }

        const response = await fetch(`/api/verify-email?token=${token}`, {
          method: 'GET',
        });

        const result = await response.json();

        if (response.ok) {
          setStatus('success');
          setMessage(result.message);
          toast({
            title: "Email verificata",
            description: "Il tuo account è stato attivato con successo",
          });
        } else {
          setStatus('error');
          setMessage(result.message || 'Errore nella verifica');
          toast({
            title: "Errore verifica",
            description: result.message,
            variant: "destructive",
          });
        }
      } catch (error) {
        setStatus('error');
        setMessage('Errore di connessione');
        toast({
          title: "Errore",
          description: "Impossibile verificare l'email",
          variant: "destructive",
        });
      }
    };

    verifyEmail();
  }, [toast]);

  const getIcon = () => {
    switch (status) {
      case 'loading':
        return <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />;
      case 'success':
        return <CheckCircle className="w-8 h-8 text-green-600" />;
      case 'error':
        return <AlertCircle className="w-8 h-8 text-red-600" />;
    }
  };

  const getTitle = () => {
    switch (status) {
      case 'loading':
        return 'Verifica in corso...';
      case 'success':
        return 'Email Verificata!';
      case 'error':
        return 'Verifica Fallita';
    }
  };

  const getDescription = () => {
    switch (status) {
      case 'loading':
        return 'Stiamo verificando il tuo indirizzo email';
      case 'success':
        return 'Il tuo account è stato attivato con successo';
      case 'error':
        return 'Si è verificato un problema durante la verifica';
    }
  };

  const getBgColor = () => {
    switch (status) {
      case 'loading':
        return 'bg-blue-100';
      case 'success':
        return 'bg-green-100';
      case 'error':
        return 'bg-red-100';
    }
  };

  const getTextColor = () => {
    switch (status) {
      case 'loading':
        return 'text-blue-800';
      case 'success':
        return 'text-green-800';
      case 'error':
        return 'text-red-800';
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className={`mx-auto w-16 h-16 ${getBgColor()} rounded-full flex items-center justify-center mb-4`}>
            {getIcon()}
          </div>
          <CardTitle className={`text-2xl font-bold ${getTextColor()}`}>
            {getTitle()}
          </CardTitle>
          <CardDescription>
            {getDescription()}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {message && (
              <div className={`${getBgColor()} p-4 rounded-lg`}>
                <p className={`text-sm ${getTextColor()}`}>
                  {message}
                </p>
              </div>
            )}

            {status === 'success' && (
              <div className="text-center space-y-2">
                <p className="text-sm text-gray-600">
                  Ora puoi accedere alla tua dashboard e iniziare a giocare!
                </p>
                <Link href="/auth">
                  <Button className="w-full">
                    Accedi alla Dashboard
                  </Button>
                </Link>
              </div>
            )}

            {status === 'error' && (
              <div className="text-center space-y-2">
                <p className="text-sm text-gray-600">
                  Il link potrebbe essere scaduto o già utilizzato
                </p>
                <div className="space-y-2">
                  <Link href="/auth">
                    <Button variant="outline" className="w-full">
                      Torna al Login
                    </Button>
                  </Link>
                  <p className="text-xs text-gray-500">
                    Dopo il login potrai richiedere un nuovo link di verifica
                  </p>
                </div>
              </div>
            )}

            {status === 'loading' && (
              <div className="text-center">
                <p className="text-sm text-gray-600">
                  Attendere prego...
                </p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}