import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/use-auth";
import { useFieldValidation } from "@/hooks/use-field-validation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useLocation } from "wouter";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { insertUserSchema } from "@shared/schema";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription } from "@/components/ui/form";
import { Checkbox } from "@/components/ui/checkbox";
import { Link } from "wouter";
import { CheckCircle, XCircle, Loader2 } from "lucide-react";
import { z } from "zod";

const loginSchema = z.object({
  username: z.string().min(1, "Username richiesto"),
  password: z.string().min(1, "Password richiesta"),
});

const registerSchema = insertUserSchema.extend({
  acceptTerms: z.boolean().refine(val => val === true, {
    message: "Devi accettare i Termini di Servizio per procedere"
  }),
  acceptPrivacy: z.boolean().refine(val => val === true, {
    message: "Devi accettare l'Informativa Privacy per procedere"
  }),
  acceptMarketing: z.boolean().optional()
});

type LoginData = z.infer<typeof loginSchema>;
type RegisterData = z.infer<typeof registerSchema>;

export default function AuthPage() {
  const { user, loginMutation, registerMutation } = useAuth();
  const [, setLocation] = useLocation();
  const {
    usernameValidation,
    emailValidation,
    validateUsername,
    validateEmail,
    resetValidation
  } = useFieldValidation();

  const loginForm = useForm<LoginData>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      username: "",
      password: "",
    },
  });

  const registerForm = useForm<RegisterData>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      username: "",
      email: "",
      password: "",
      firstName: "",
      lastName: "",
      dateOfBirth: undefined,
      phoneNumber: "",
      city: "",
      country: "Italia",
    },
  });

  // Redirect if already logged in
  if (user) {
    setTimeout(() => setLocation("/"), 0);
    return null;
  }

  const onLogin = (data: LoginData) => {
    loginMutation.mutate(data, {
      onSuccess: () => {
        setLocation("/");
      },
    });
  };

  const onRegister = (data: RegisterData) => {
    registerMutation.mutate(data, {
      onSuccess: () => {
        setLocation("/");
      },
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary to-blue-800 flex items-center justify-center p-4">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 w-full max-w-6xl">
        {/* Left side - Forms */}
        <div className="flex items-center justify-center">
          <Card className="w-full max-w-md">
            <CardHeader className="text-center">
              <CardTitle className="text-3xl font-bold text-primary">Highlander</CardTitle>
              <CardDescription>Serie A Elimination Game</CardDescription>
            </CardHeader>
            <CardContent>
              <Tabs defaultValue="login" className="w-full">
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="login">Login</TabsTrigger>
                  <TabsTrigger value="register">Register</TabsTrigger>
                </TabsList>
                
                <TabsContent value="login">
                  <Form {...loginForm}>
                    <form onSubmit={loginForm.handleSubmit(onLogin)} className="space-y-4">
                      <FormField
                        control={loginForm.control}
                        name="username"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Username</FormLabel>
                            <FormControl>
                              <Input placeholder="Enter your username" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={loginForm.control}
                        name="password"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Password</FormLabel>
                            <FormControl>
                              <Input type="password" placeholder="Enter your password" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <Button 
                        type="submit" 
                        className="w-full" 
                        disabled={loginMutation.isPending}
                      >
                        {loginMutation.isPending ? "Logging in..." : "Login"}
                      </Button>
                      
                      <div className="text-center mt-4">
                        <Link href="/forgot-password">
                          <Button variant="link" className="text-sm text-muted-foreground">
                            Password dimenticata?
                          </Button>
                        </Link>
                      </div>
                    </form>
                  </Form>
                </TabsContent>
                
                <TabsContent value="register">
                  <Form {...registerForm}>
                    <form onSubmit={registerForm.handleSubmit(onRegister)} className="space-y-4">
                      {/* Dati personali */}
                      <div className="grid grid-cols-2 gap-4">
                        <FormField
                          control={registerForm.control}
                          name="firstName"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Nome *</FormLabel>
                              <FormControl>
                                <Input placeholder="Il tuo nome" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        
                        <FormField
                          control={registerForm.control}
                          name="lastName"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Cognome *</FormLabel>
                              <FormControl>
                                <Input placeholder="Il tuo cognome" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>

                      <FormField
                        control={registerForm.control}
                        name="email"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Email *</FormLabel>
                            <FormControl>
                              <div className="relative">
                                <Input 
                                  type="email" 
                                  placeholder="la-tua-email@esempio.it" 
                                  {...field}
                                  onChange={(e) => {
                                    field.onChange(e);
                                    validateEmail(e.target.value);
                                  }}
                                />
                                <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                                  {emailValidation.isChecking && (
                                    <Loader2 className="h-4 w-4 animate-spin text-gray-400" />
                                  )}
                                  {!emailValidation.isChecking && field.value && (
                                    emailValidation.isValid ? (
                                      <CheckCircle className="h-4 w-4 text-green-500" />
                                    ) : (
                                      <XCircle className="h-4 w-4 text-red-500" />
                                    )
                                  )}
                                </div>
                              </div>
                            </FormControl>
                            <FormMessage />
                            {emailValidation.message && field.value && (
                              <FormDescription className={
                                emailValidation.isValid ? "text-green-600" : "text-red-600"
                              }>
                                {emailValidation.message}
                              </FormDescription>
                            )}
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={registerForm.control}
                        name="username"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Username *</FormLabel>
                            <FormControl>
                              <div className="relative">
                                <Input 
                                  placeholder="Scegli un username" 
                                  {...field}
                                  onChange={(e) => {
                                    field.onChange(e);
                                    validateUsername(e.target.value);
                                  }}
                                />
                                <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                                  {usernameValidation.isChecking && (
                                    <Loader2 className="h-4 w-4 animate-spin text-gray-400" />
                                  )}
                                  {!usernameValidation.isChecking && field.value && (
                                    usernameValidation.isValid ? (
                                      <CheckCircle className="h-4 w-4 text-green-500" />
                                    ) : (
                                      <XCircle className="h-4 w-4 text-red-500" />
                                    )
                                  )}
                                </div>
                              </div>
                            </FormControl>
                            <FormMessage />
                            {usernameValidation.message && field.value && (
                              <FormDescription className={
                                usernameValidation.isValid ? "text-green-600" : "text-red-600"
                              }>
                                {usernameValidation.message}
                              </FormDescription>
                            )}
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={registerForm.control}
                        name="password"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Password *</FormLabel>
                            <FormControl>
                              <Input type="password" placeholder="Almeno 6 caratteri" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      {/* Dati opzionali */}
                      <div className="pt-4 border-t">
                        <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                          Informazioni aggiuntive (opzionali)
                        </h4>
                        
                        <div className="grid grid-cols-2 gap-4">
                          <FormField
                            control={registerForm.control}
                            name="dateOfBirth"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Data di nascita</FormLabel>
                                <FormControl>
                                  <Input 
                                    type="date" 
                                    {...field} 
                                    value={field.value || ''} 
                                    onChange={(e) => field.onChange(e.target.value || undefined)}
                                  />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          
                          <FormField
                            control={registerForm.control}
                            name="phoneNumber"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Telefono</FormLabel>
                                <FormControl>
                                  <Input 
                                    {...field}
                                    placeholder="+39 123 456 7890"
                                    onChange={(e) => {
                                      let value = e.target.value;
                                      
                                      // Remove all non-numeric characters except +
                                      value = value.replace(/[^\d+]/g, '');
                                      
                                      // Auto-add +39 prefix if user starts typing numbers without +
                                      if (value.length > 0 && !value.startsWith('+')) {
                                        value = '+39' + value;
                                      }
                                      
                                      // Ensure only one + at the beginning
                                      if (value.indexOf('+') > 0) {
                                        value = '+' + value.replace(/\+/g, '');
                                      }
                                      
                                      // Limit total length to reasonable phone number length
                                      if (value.length > 16) {
                                        value = value.substring(0, 16);
                                      }
                                      
                                      field.onChange(value);
                                    }}
                                    onKeyPress={(e) => {
                                      // Allow only numbers, + symbol, and control keys
                                      if (!/[\d+]/.test(e.key) && !['Backspace', 'Delete', 'Tab', 'Escape', 'Enter'].includes(e.key)) {
                                        e.preventDefault();
                                      }
                                    }}
                                  />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </div>

                        <div className="grid grid-cols-2 gap-4 mt-4">
                          <FormField
                            control={registerForm.control}
                            name="city"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Città</FormLabel>
                                <FormControl>
                                  <Input placeholder="Roma, Milano, ..." {...field} />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          
                          <FormField
                            control={registerForm.control}
                            name="country"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Paese</FormLabel>
                                <FormControl>
                                  <Input placeholder="Italia" {...field} />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </div>
                      </div>

                      {/* Legal Acceptance Section */}
                      <div className="pt-4 border-t space-y-4">
                        <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                          Accettazione Termini Legali *
                        </h4>
                        
                        <FormField
                          control={registerForm.control}
                          name="acceptTerms"
                          render={({ field }) => (
                            <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                              <FormControl>
                                <Checkbox
                                  checked={field.value}
                                  onCheckedChange={field.onChange}
                                />
                              </FormControl>
                              <div className="space-y-1 leading-none">
                                <FormLabel className="text-sm">
                                  Accetto i{" "}
                                  <Link href="/terms-of-service">
                                    <a className="text-blue-600 hover:underline" target="_blank">
                                      Termini di Servizio
                                    </a>
                                  </Link>
                                  {" "}*
                                </FormLabel>
                                <FormMessage />
                              </div>
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={registerForm.control}
                          name="acceptPrivacy"
                          render={({ field }) => (
                            <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                              <FormControl>
                                <Checkbox
                                  checked={field.value}
                                  onCheckedChange={field.onChange}
                                />
                              </FormControl>
                              <div className="space-y-1 leading-none">
                                <FormLabel className="text-sm">
                                  Accetto l'{" "}
                                  <Link href="/privacy-policy">
                                    <a className="text-blue-600 hover:underline" target="_blank">
                                      Informativa Privacy
                                    </a>
                                  </Link>
                                  {" "}e autorizzo il trattamento dei miei dati personali *
                                </FormLabel>
                                <FormMessage />
                              </div>
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={registerForm.control}
                          name="acceptMarketing"
                          render={({ field }) => (
                            <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                              <FormControl>
                                <Checkbox
                                  checked={field.value}
                                  onCheckedChange={field.onChange}
                                />
                              </FormControl>
                              <div className="space-y-1 leading-none">
                                <FormLabel className="text-sm">
                                  Acconsento a ricevere comunicazioni commerciali e di marketing
                                  <span className="text-gray-500 ml-1">(opzionale)</span>
                                </FormLabel>
                                <FormDescription className="text-xs text-gray-500">
                                  Newsletter, promozioni e aggiornamenti sul servizio
                                </FormDescription>
                              </div>
                            </FormItem>
                          )}
                        />
                      </div>
                      
                      <Button 
                        type="submit" 
                        className="w-full mt-6" 
                        disabled={
                          registerMutation.isPending ||
                          !usernameValidation.isValid ||
                          !emailValidation.isValid ||
                          usernameValidation.isChecking ||
                          emailValidation.isChecking
                        }
                      >
                        {registerMutation.isPending ? "Creazione account..." : "Registrati"}
                      </Button>
                    </form>
                  </Form>
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        </div>

        {/* Right side - Hero section */}
        <div className="hidden lg:flex items-center justify-center text-white">
          <div className="text-center">
            <h1 className="text-4xl font-bold mb-6">Welcome to Highlander</h1>
            <p className="text-xl mb-8 leading-relaxed">
              The ultimate Serie A elimination game where only the strongest survive.
            </p>
            <div className="space-y-4 text-left max-w-md">
              <div className="flex items-center space-x-3">
                <div className="w-2 h-2 bg-white rounded-full"></div>
                <span>Select teams for your tickets each round</span>
              </div>
              <div className="flex items-center space-x-3">
                <div className="w-2 h-2 bg-white rounded-full"></div>
                <span>Tickets are eliminated if your team loses or draws</span>
              </div>
              <div className="flex items-center space-x-3">
                <div className="w-2 h-2 bg-white rounded-full"></div>
                <span>Last player standing wins the game</span>
              </div>
              <div className="flex items-center space-x-3">
                <div className="w-2 h-2 bg-white rounded-full"></div>
                <span>Multiple games running simultaneously</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
