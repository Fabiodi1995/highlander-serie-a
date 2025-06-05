import { useAuth } from "@/hooks/use-auth";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { 
  User, 
  Mail, 
  MapPin, 
  Phone, 
  Calendar, 
  Shield,
  Clock
} from "lucide-react";

export default function ProfilePage() {
  const { user } = useAuth();

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
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            Il Mio Profilo
          </h1>
          <p className="text-gray-600 dark:text-gray-300">
            Visualizza i tuoi dati personali e informazioni account
          </p>
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
                  I tuoi dati personali registrati
                </CardDescription>
              </CardHeader>
              <CardContent>
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