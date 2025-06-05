import { useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
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
  Trophy,
  Edit,
  Save,
  X,
  Clock,
  Award
} from "lucide-react";

const updateProfileSchema = z.object({
  firstName: z.string().min(2, "Nome deve avere almeno 2 caratteri"),
  lastName: z.string().min(2, "Cognome deve avere almeno 2 caratteri"),
  email: z.string().email("Email non valida"),
  phoneNumber: z.string().optional(),
  city: z.string().optional(),
  country: z.string().optional(),
  dateOfBirth: z.string().optional().transform((val) => val ? new Date(val) : undefined),
});

type UpdateProfileData = z.infer<typeof updateProfileSchema>;

export default function ProfilePage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isEditing, setIsEditing] = useState(false);

  // Fetch user statistics
  const { data: userStats } = useQuery({
    queryKey: ['/api/user/stats'],
    enabled: !!user
  });

  // Fetch user games history
  const { data: userGames } = useQuery({
    queryKey: ['/api/user/games'],
    enabled: !!user
  });

  const updateProfileForm = useForm<UpdateProfileData>({
    resolver: zodResolver(updateProfileSchema),
    defaultValues: {
      firstName: user?.firstName || "",
      lastName: user?.lastName || "",
      email: user?.email || "",
      phoneNumber: user?.phoneNumber || "",
      city: user?.city || "",
      country: user?.country || "Italia",
      dateOfBirth: user?.dateOfBirth ? user.dateOfBirth.toISOString().split('T')[0] : undefined,
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

  if (!user) return null;

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
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            Il Mio Profilo
          </h1>
          <p className="text-gray-600 dark:text-gray-300">
            Gestisci i tuoi dati personali e visualizza le tue statistiche
          </p>
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
          {/* Profile Card */}
          <div className="lg:col-span-1">
            <Card>
              <CardHeader className="text-center pb-4">
                <Avatar className="w-20 h-20 mx-auto mb-4">
                  <AvatarFallback className="text-lg font-semibold bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300">
                    {getInitials(user.firstName, user.lastName)}
                  </AvatarFallback>
                </Avatar>
                <CardTitle className="text-xl">
                  {user.firstName} {user.lastName}
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

            {/* Quick Stats */}
            {userStats && (
              <Card className="mt-6">
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Trophy className="w-5 h-5" />
                    Statistiche Rapide
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600 dark:text-gray-300">Partite giocate</span>
                    <Badge variant="outline">{userStats.gamesPlayed || 0}</Badge>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600 dark:text-gray-300">Partite vinte</span>
                    <Badge variant="outline">{userStats.gamesWon || 0}</Badge>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600 dark:text-gray-300">Livello</span>
                    <Badge variant="secondary">{userStats.level || 1}</Badge>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600 dark:text-gray-300">XP</span>
                    <Badge variant="outline">{userStats.xp || 0}</Badge>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Main Content */}
          <div className="lg:col-span-2">
            <Tabs defaultValue="info" className="w-full">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="info">Informazioni</TabsTrigger>
                <TabsTrigger value="games">Partite</TabsTrigger>
                <TabsTrigger value="achievements">Achievements</TabsTrigger>
              </TabsList>

              <TabsContent value="info">
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between">
                    <div>
                      <CardTitle>Informazioni Personali</CardTitle>
                      <CardDescription>
                        Visualizza e modifica i tuoi dati personali
                      </CardDescription>
                    </div>
                    {!isEditing ? (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setIsEditing(true)}
                      >
                        <Edit className="w-4 h-4 mr-2" />
                        Modifica
                      </Button>
                    ) : (
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setIsEditing(false)}
                        >
                          <X className="w-4 h-4 mr-2" />
                          Annulla
                        </Button>
                      </div>
                    )}
                  </CardHeader>
                  <CardContent>
                    {isEditing ? (
                      <Form {...updateProfileForm}>
                        <form onSubmit={updateProfileForm.handleSubmit(onUpdateProfile)} className="space-y-4">
                          <div className="grid grid-cols-2 gap-4">
                            <FormField
                              control={updateProfileForm.control}
                              name="firstName"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Nome</FormLabel>
                                  <FormControl>
                                    <Input placeholder="Il tuo nome" {...field} />
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
                                  <FormLabel>Cognome</FormLabel>
                                  <FormControl>
                                    <Input placeholder="Il tuo cognome" {...field} />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                          </div>

                          <FormField
                            control={updateProfileForm.control}
                            name="email"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Email</FormLabel>
                                <FormControl>
                                  <Input type="email" placeholder="la-tua-email@esempio.it" {...field} />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />

                          <div className="grid grid-cols-2 gap-4">
                            <FormField
                              control={updateProfileForm.control}
                              name="phoneNumber"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Telefono</FormLabel>
                                  <FormControl>
                                    <Input placeholder="+39 123 456 7890" {...field} />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                            
                            <FormField
                              control={updateProfileForm.control}
                              name="dateOfBirth"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Data di nascita</FormLabel>
                                  <FormControl>
                                    <Input 
                                      type="date" 
                                      {...field} 
                                      value={field.value ? field.value.toISOString().split('T')[0] : ''} 
                                      onChange={(e) => field.onChange(e.target.value ? new Date(e.target.value) : undefined)}
                                    />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                          </div>

                          <div className="grid grid-cols-2 gap-4">
                            <FormField
                              control={updateProfileForm.control}
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
                              control={updateProfileForm.control}
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
                          
                          <Button 
                            type="submit" 
                            className="w-full" 
                            disabled={updateProfileMutation.isPending}
                          >
                            <Save className="w-4 h-4 mr-2" />
                            {updateProfileMutation.isPending ? "Salvando..." : "Salva Modifiche"}
                          </Button>
                        </form>
                      </Form>
                    ) : (
                      <div className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <label className="text-sm font-medium text-gray-600 dark:text-gray-300">Nome</label>
                            <p className="mt-1 text-sm">{user.firstName}</p>
                          </div>
                          <div>
                            <label className="text-sm font-medium text-gray-600 dark:text-gray-300">Cognome</label>
                            <p className="mt-1 text-sm">{user.lastName}</p>
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
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="games">
                <Card>
                  <CardHeader>
                    <CardTitle>Storico Partite</CardTitle>
                    <CardDescription>
                      Le tue partite passate e in corso
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    {userGames && userGames.length > 0 ? (
                      <div className="space-y-4">
                        {userGames.map((game: any) => (
                          <div key={game.id} className="border rounded-lg p-4">
                            <div className="flex justify-between items-start">
                              <div>
                                <h4 className="font-medium">{game.name}</h4>
                                <p className="text-sm text-gray-600 dark:text-gray-300 mt-1">
                                  {game.description}
                                </p>
                              </div>
                              <Badge variant={game.status === 'active' ? 'default' : 'secondary'}>
                                {game.status === 'active' ? 'In corso' : 'Completata'}
                              </Badge>
                            </div>
                            <div className="flex gap-4 mt-3 text-xs text-gray-500">
                              <span>Round: {game.currentRound}</span>
                              <span>Partecipanti: {game.participantCount}</span>
                              <span>Creata: {formatDate(game.createdAt)}</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-8 text-gray-500">
                        <Trophy className="w-12 h-12 mx-auto mb-4 opacity-50" />
                        <p>Nessuna partita giocata ancora</p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="achievements">
                <Card>
                  <CardHeader>
                    <CardTitle>I Tuoi Achievements</CardTitle>
                    <CardDescription>
                      Traguardi sbloccati e progressi
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="text-center py-8 text-gray-500">
                      <Award className="w-12 h-12 mx-auto mb-4 opacity-50" />
                      <p>Sistema achievements in arrivo</p>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </div>
    </div>
  );
}