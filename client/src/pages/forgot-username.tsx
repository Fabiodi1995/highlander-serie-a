import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Link } from "wouter";
import { ArrowLeft, User, CheckCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const forgotUsernameSchema = z.object({
  email: z.string().email("Inserisci un indirizzo email valido"),
});

type ForgotUsernameData = z.infer<typeof forgotUsernameSchema>;

export default function ForgotUsernamePage() {
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const form = useForm<ForgotUsernameData>({
    resolver: zodResolver(forgotUsernameSchema),
    defaultValues: {
      email: "",
    },
  });

  const onSubmit = async (data: ForgotUsernameData) => {
    setIsLoading(true);
    
    try {
      const response = await fetch("/api/forgot-username", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      });

      const result = await response.json();

      if (response.ok) {
        setIsSubmitted(true);
        toast({
          title: "Email inviata",
          description: result.message,
        });
      } else {
        toast({
          title: "Errore",
          description: result.message || "Si è verificato un errore",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Errore",
        description: "Impossibile inviare la richiesta. Riprova più tardi.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  if (isSubmitted) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="mx-auto w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mb-4">
              <CheckCircle className="w-6 h-6 text-green-600" />
            </div>
            <CardTitle className="text-2xl font-bold text-green-700">Email Inviata!</CardTitle>
            <CardDescription>
              Controlla la tua casella email per il tuo username.
            </CardDescription>
          </CardHeader>
          <CardContent className="text-center space-y-4">
            <p className="text-sm text-gray-600">
              Se l'indirizzo email è associato a un account, riceverai il tuo username entro pochi minuti.
            </p>
            <div className="space-y-2">
              <Link href="/auth">
                <Button className="w-full">
                  Torna al Login
                </Button>
              </Link>
              <Button
                variant="outline"
                className="w-full"
                onClick={() => setIsSubmitted(false)}
              >
                Riprova con altra email
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mb-4">
            <User className="w-6 h-6 text-blue-600" />
          </div>
          <CardTitle className="text-2xl font-bold">Username Dimenticato?</CardTitle>
          <CardDescription>
            Inserisci la tua email per ricevere il tuo username
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email</FormLabel>
                    <FormControl>
                      <Input
                        type="email"
                        placeholder="la-tua-email@esempio.it"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading ? "Invio in corso..." : "Invia Username"}
              </Button>
            </form>
          </Form>
          
          <div className="mt-6 space-y-3">
            <div className="text-center">
              <span className="text-sm text-gray-600">
                Ricordi il tuo username?{" "}
              </span>
              <Link href="/auth" className="text-sm text-blue-600 hover:underline font-medium">
                Torna al login
              </Link>
            </div>
            
            <div className="text-center">
              <span className="text-sm text-gray-600">
                Password dimenticata?{" "}
              </span>
              <Link href="/forgot-password" className="text-sm text-blue-600 hover:underline font-medium">
                Recupera password
              </Link>
            </div>
          </div>
          
          <div className="mt-6 flex items-center justify-center">
            <Link href="/auth">
              <Button variant="ghost" size="sm" className="text-gray-600">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Torna indietro
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}