import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Link } from "wouter";
import { ArrowLeft, Mail, CheckCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const forgotPasswordSchema = z.object({
  email: z.string().email("Inserisci un indirizzo email valido"),
});

type ForgotPasswordData = z.infer<typeof forgotPasswordSchema>;

export default function ForgotPasswordPage() {
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const form = useForm<ForgotPasswordData>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: {
      email: "",
    },
  });

  const onSubmit = async (data: ForgotPasswordData) => {
    setIsLoading(true);
    
    try {
      const response = await fetch("/api/forgot-password", {
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
            <CardTitle className="text-2xl font-bold text-green-800">Email Inviata</CardTitle>
            <CardDescription>
              Se l'email esiste nel nostro sistema, riceverai un link per reimpostare la password
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="bg-blue-50 p-4 rounded-lg">
                <p className="text-sm text-blue-800">
                  <strong>Controlla la tua casella email</strong> (inclusa la cartella spam) 
                  e clicca sul link per reimpostare la password.
                </p>
              </div>
              
              <div className="text-center">
                <Link href="/auth">
                  <Button variant="outline" className="w-full">
                    <ArrowLeft className="w-4 h-4 mr-2" />
                    Torna al Login
                  </Button>
                </Link>
              </div>
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
            <Mail className="w-6 h-6 text-blue-600" />
          </div>
          <CardTitle className="text-2xl font-bold">Password Dimenticata?</CardTitle>
          <CardDescription>
            Inserisci la tua email per ricevere un link di reset della password
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

              <Button
                type="submit"
                className="w-full"
                disabled={isLoading}
              >
                {isLoading ? "Invio in corso..." : "Invia Link di Reset"}
              </Button>

              <div className="text-center">
                <Link href="/auth">
                  <Button variant="link" className="text-sm text-muted-foreground">
                    <ArrowLeft className="w-4 h-4 mr-1" />
                    Torna al Login
                  </Button>
                </Link>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}