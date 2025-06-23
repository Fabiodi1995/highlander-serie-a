import { Link } from "wouter";
import { Home, ArrowLeft, Trophy, Users, BookOpen, BarChart3 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from "@/hooks/use-auth";
import { useFeature } from "@/lib/feature-flags";

export default function NotFound() {
  const { user } = useAuth();
  const analyticsForNonAdmin = useFeature('analyticsForNonAdmin');

  const suggestions = [
    { href: "/", icon: Home, label: "Dashboard Principale", description: "Torna alla dashboard dei tuoi giochi" },
    { href: "/rules", icon: BookOpen, label: "Regolamento", description: "Consulta le regole del gioco Highlander" },
    ...(user && (user.isAdmin || analyticsForNonAdmin) ? [
      { href: "/analytics", icon: BarChart3, label: "Analytics", description: "Visualizza statistiche e performance" }
    ] : []),
    ...(user?.isAdmin ? [
      { href: "/admin", icon: Users, label: "Pannello Admin", description: "Gestisci giochi e utenti" }
    ] : []),
    ...(user ? [
      { href: "/profile", icon: Trophy, label: "Il Tuo Profilo", description: "Gestisci account e achievement" }
    ] : []),
  ];

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 px-4 py-8">
      <div className="w-full max-w-2xl space-y-6">
        <Card className="text-center">
          <CardContent className="flex flex-col items-center space-y-6 pt-8 pb-8">
            <div className="relative">
              <div className="text-8xl font-bold text-gray-200 dark:text-gray-700">
                404
              </div>
              <div className="absolute inset-0 flex items-center justify-center">
                <Trophy className="h-16 w-16 text-green-500 opacity-50" />
              </div>
            </div>
            
            <div className="space-y-2">
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                Pagina Non Trovata
              </h1>
              <p className="text-gray-600 dark:text-gray-400 max-w-md">
                La pagina che stai cercando non esiste nel sistema Highlander Serie A 2025/26. 
                Potrebbe essere stata spostata o rimossa.
              </p>
            </div>

            <div className="flex flex-col sm:flex-row gap-3 w-full max-w-sm">
              <Button asChild variant="outline" className="flex-1">
                <a href="javascript:history.back()">
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Indietro
                </a>
              </Button>
              <Button asChild className="flex-1 bg-gradient-to-r from-green-500 to-blue-500 hover:from-green-600 hover:to-blue-600">
                <Link href="/">
                  <Home className="mr-2 h-4 w-4" />
                  Dashboard
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>

        {user && suggestions.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="text-lg text-center text-gray-900 dark:text-white">
                Pagine Disponibili
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-3">
                {suggestions.map((suggestion) => {
                  const Icon = suggestion.icon;
                  return (
                    <Link key={suggestion.href} href={suggestion.href}>
                      <div className="flex items-center p-4 rounded-lg border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors cursor-pointer group">
                        <div className="flex-shrink-0 mr-4">
                          <Icon className="h-6 w-6 text-green-500 group-hover:text-green-600 transition-colors" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-gray-900 dark:text-white group-hover:text-green-600 dark:group-hover:text-green-400 transition-colors">
                            {suggestion.label}
                          </p>
                          <p className="text-sm text-gray-500 dark:text-gray-400">
                            {suggestion.description}
                          </p>
                        </div>
                      </div>
                    </Link>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        )}

        <Card className="bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800">
          <CardContent className="pt-6">
            <div className="text-center space-y-2">
              <h3 className="font-semibold text-blue-900 dark:text-blue-100">
                Hai bisogno di aiuto?
              </h3>
              <p className="text-sm text-blue-700 dark:text-blue-300">
                Consulta il regolamento per comprendere meglio il funzionamento del gioco di eliminazione Serie A 2025/26.
              </p>
              <Button asChild variant="outline" size="sm" className="mt-3 border-blue-300 text-blue-700 hover:bg-blue-100 dark:border-blue-600 dark:text-blue-300 dark:hover:bg-blue-800">
                <Link href="/rules">
                  <BookOpen className="mr-2 h-4 w-4" />
                  Leggi il Regolamento
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}