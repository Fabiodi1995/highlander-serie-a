import { useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { z } from "zod";
import { 
  User, 
  Mail, 
  MapPin, 
  Phone, 
  Calendar, 
  Shield,
  Clock,
  Edit,
  Save,
  X
} from "lucide-react";

const updateProfileSchema = z.object({
  firstName: z.string().min(2, "Nome deve avere almeno 2 caratteri"),
  lastName: z.string().min(2, "Cognome deve avere almeno 2 caratteri"),
  email: z.string().email("Email non valida"),
  phoneNumber: z.string().optional(),
  city: z.string().optional(),
  country: z.string().optional(),
  dateOfBirth: z.string().optional(),
});

type UpdateProfileData = z.infer<typeof updateProfileSchema>;

export default function ProfilePage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isEditing, setIsEditing] = useState(false);

  const updateProfileForm = useForm<UpdateProfileData>({
    resolver: zodResolver(updateProfileSchema),
    defaultValues: {
      firstName: user?.firstName || "",
      lastName: user?.lastName || "",
      email: user?.email || "",
      phoneNumber: user?.phoneNumber || "",
      city: user?.city || "",
      country: user?.country || "Italia",
      dateOfBirth: user?.dateOfBirth ? new Date(user.dateOfBirth).toISOString().split('T')[0] : "",
    },
  });

  const updateProfileMutation = useMutation({
    mutationFn: async (data: UpdateProfileData) => {
      const res = await apiRequest("PATCH", "/api/user/profile", data);
      return await res.json();
    },
    onSuccess: (updatedUser) => {
      queryClient.setQueryData(["/api/user"], updatedUser);
      toast({
        title: "Profilo aggiornato",
        description: "I tuoi dati sono stati salvati con successo",
      });
      setIsEditing(false);
    },
    onError: (error: Error) => {
      toast({
        title: "Errore",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const onUpdateProfile = (data: UpdateProfileData) => {
    updateProfileMutation.mutate(data);
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 py-8">
        <div className="container mx-auto px-4 max-w-4xl">
          <div className="text-center">
            <p>Devi essere autenticato per vedere il profilo</p>
          </div>
        </div>
      </div>
    );
  }

  const formatDate = (date: Date | string | null) => {
    if (!date) return "Non specificata";
    const d = new Date(date);
    return d.toLocaleDateString('it-IT');
  };

  const getInitials = (firstName: string, lastName: string) => {
    return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 py-8">
      <div className="container mx-auto px-4 max-w-4xl">
        <div className="mb-8">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
                Il Mio Profilo
              </h1>
              <p className="text-gray-600 dark:text-gray-300">
                Visualizza e modifica i tuoi dati personali
              </p>
            </div>
            <div className="flex gap-2">
              {!isEditing ? (
                <Button
                  onClick={() => setIsEditing(true)}
                  variant="outline"
                  className="bg-white/80 dark:bg-gray-800/80"
                >
                  <Edit className="h-4 w-4 mr-2" />
                  Modifica Profilo
                </Button>
              ) : (
                <Button
                  onClick={() => setIsEditing(false)}
                  variant="outline"
                  className="bg-white/80 dark:bg-gray-800/80"
                >
                  <X className="h-4 w-4 mr-2" />
                  Annulla
                </Button>
              )}
            </div>
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
          {/* Profile Card */}
          <div className="lg:col-span-1">
            <Card>
              <CardHeader className="text-center pb-4">
                <Avatar className="w-20 h-20 mx-auto mb-4">
                  <AvatarFallback className="text-lg font-semibold bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300">
                    {getInitials(user.firstName || user.username, user.lastName || "")}
                  </AvatarFallback>
                </Avatar>
                <CardTitle className="text-xl">
                  {user.firstName && user.lastName ? `${user.firstName} ${user.lastName}` : user.username}
                </CardTitle>
                <CardDescription className="flex items-center justify-center gap-1">
                  <Mail className="w-4 h-4" />
                  {user.email}
                </CardDescription>
                {user.isAdmin && (
                  <Badge variant="secondary" className="mt-2">
                    <Shield className="w-3 h-3 mr-1" />
                    Amministratore
                  </Badge>
                )}
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center text-sm text-gray-600 dark:text-gray-300">
                  <User className="w-4 h-4 mr-2" />
                  <span>@{user.username}</span>
                </div>
                {user.phoneNumber && (
                  <div className="flex items-center text-sm text-gray-600 dark:text-gray-300">
                    <Phone className="w-4 h-4 mr-2" />
                    <span>{user.phoneNumber}</span>
                  </div>
                )}
                {(user.city || user.country) && (
                  <div className="flex items-center text-sm text-gray-600 dark:text-gray-300">
                    <MapPin className="w-4 h-4 mr-2" />
                    <span>{[user.city, user.country].filter(Boolean).join(", ")}</span>
                  </div>
                )}
                <div className="flex items-center text-sm text-gray-600 dark:text-gray-300">
                  <Calendar className="w-4 h-4 mr-2" />
                  <span>Nato il {formatDate(user.dateOfBirth)}</span>
                </div>
                <div className="flex items-center text-sm text-gray-600 dark:text-gray-300">
                  <Clock className="w-4 h-4 mr-2" />
                  <span>Membro dal {formatDate(user.createdAt)}</span>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Main Content */}
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle>Informazioni Personali</CardTitle>
                <CardDescription>
                  {isEditing ? "Modifica i tuoi dati personali" : "I tuoi dati personali registrati"}
                </CardDescription>
              </CardHeader>
              <CardContent>
                {!isEditing ? (
                  <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-medium text-gray-600 dark:text-gray-300">Nome</label>
                      <p className="mt-1 text-sm">{user.firstName || "Non specificato"}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-600 dark:text-gray-300">Cognome</label>
                      <p className="mt-1 text-sm">{user.lastName || "Non specificato"}</p>
                    </div>
                  </div>
                  
                  <div>
                    <label className="text-sm font-medium text-gray-600 dark:text-gray-300">Email</label>
                    <p className="mt-1 text-sm">{user.email}</p>
                    {!user.emailVerified && (
                      <Badge variant="outline" className="mt-1">
                        Email non verificata
                      </Badge>
                    )}
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-medium text-gray-600 dark:text-gray-300">Telefono</label>
                      <p className="mt-1 text-sm">{user.phoneNumber || "Non specificato"}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-600 dark:text-gray-300">Data di nascita</label>
                      <p className="mt-1 text-sm">{formatDate(user.dateOfBirth)}</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-medium text-gray-600 dark:text-gray-300">Città</label>
                      <p className="mt-1 text-sm">{user.city || "Non specificata"}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-600 dark:text-gray-300">Paese</label>
                      <p className="mt-1 text-sm">{user.country || "Non specificato"}</p>
                    </div>
                  </div>

                  <div className="pt-4 border-t">
                    <h4 className="text-sm font-medium text-gray-600 dark:text-gray-300 mb-2">
                      Informazioni Account
                    </h4>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="text-sm font-medium text-gray-600 dark:text-gray-300">Username</label>
                        <p className="mt-1 text-sm">@{user.username}</p>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-gray-600 dark:text-gray-300">Ruolo</label>
                        <p className="mt-1 text-sm">
                          {user.isAdmin ? "Amministratore" : "Giocatore"}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
                ) : (
                  <Form {...updateProfileForm}>
                    <form onSubmit={updateProfileForm.handleSubmit(onUpdateProfile)} className="space-y-6">
                      <div className="grid md:grid-cols-2 gap-4">
                        <FormField
                          control={updateProfileForm.control}
                          name="firstName"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Nome *</FormLabel>
                              <FormControl>
                                <Input {...field} placeholder="Il tuo nome" />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={updateProfileForm.control}
                          name="lastName"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Cognome *</FormLabel>
                              <FormControl>
                                <Input {...field} placeholder="Il tuo cognome" />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={updateProfileForm.control}
                          name="email"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Email *</FormLabel>
                              <FormControl>
                                <Input {...field} type="email" placeholder="la-tua-email@esempio.com" />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={updateProfileForm.control}
                          name="phoneNumber"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Telefono</FormLabel>
                              <FormControl>
                                <Input {...field} placeholder="+39 123 456 7890" />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={updateProfileForm.control}
                          name="city"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Città</FormLabel>
                              <FormControl>
                                <Input {...field} placeholder="La tua città" />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={updateProfileForm.control}
                          name="country"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Paese</FormLabel>
                              <FormControl>
                                <Input {...field} placeholder="Il tuo paese" />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={updateProfileForm.control}
                          name="dateOfBirth"
                          render={({ field }) => (
                            <FormItem className="md:col-span-2">
                              <FormLabel>Data di nascita</FormLabel>
                              <FormControl>
                                <Input {...field} type="date" />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>

                      <div className="flex justify-end gap-3 pt-4">
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => setIsEditing(false)}
                        >
                          <X className="h-4 w-4 mr-2" />
                          Annulla
                        </Button>
                        <Button 
                          type="submit" 
                          disabled={updateProfileMutation.isPending}
                          className="bg-blue-600 hover:bg-blue-700"
                        >
                          {updateProfileMutation.isPending ? (
                            <>
                              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                              Salvataggio...
                            </>
                          ) : (
                            <>
                              <Save className="h-4 w-4 mr-2" />
                              Salva Modifiche
                            </>
                          )}
                        </Button>
                      </div>
                    </form>
                  </Form>
                )}
              </CardContent>
            </Card>

            {/* Coming Soon Features */}
            <Card className="mt-6">
              <CardHeader>
                <CardTitle>Prossimamente</CardTitle>
                <CardDescription>
                  Funzionalità in arrivo
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 text-sm text-gray-600 dark:text-gray-300">
                  <p>• Modifica dati personali</p>
                  <p>• Statistiche di gioco</p>
                  <p>• Storico partite</p>
                  <p>• Sistema achievements</p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}