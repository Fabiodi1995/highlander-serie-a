import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  Plus, 
  Trophy, 
  Calendar, 
  BarChart3, 
  Users, 
  Settings, 
  Zap,
  ArrowRight
} from "lucide-react";
import { Link } from "wouter";
import { useAuth } from "@/hooks/use-auth";

export function AppShortcuts() {
  const { user } = useAuth();
  const [recentActions, setRecentActions] = useState<string[]>([]);

  useEffect(() => {
    // Load recent actions from localStorage
    const stored = localStorage.getItem('recent-actions');
    if (stored) {
      setRecentActions(JSON.parse(stored));
    }
  }, []);

  const shortcuts = [
    {
      title: "Nuovo Gioco",
      description: "Crea un nuovo gioco Highlander",
      icon: <Plus className="h-5 w-5" />,
      href: "/admin",
      badge: "Admin",
      show: user?.isAdmin,
      color: "bg-green-500"
    },
    {
      title: "I Miei Giochi",
      description: "Visualizza i tuoi giochi attivi",
      icon: <Trophy className="h-5 w-5" />,
      href: "/",
      badge: "Attivo",
      show: true,
      color: "bg-blue-500"
    },
    {
      title: "Calendario Serie A",
      description: "Vedi il calendario delle partite",
      icon: <Calendar className="h-5 w-5" />,
      href: "/calendar",
      badge: "Live",
      show: true,
      color: "bg-purple-500"
    },
    {
      title: "Statistiche",
      description: "Analizza le tue performance",
      icon: <BarChart3 className="h-5 w-5" />,
      href: "/analytics",
      badge: "Pro",
      show: true,
      color: "bg-orange-500"
    },
    {
      title: "Gestione Utenti",
      description: "Amministra gli utenti registrati",
      icon: <Users className="h-5 w-5" />,
      href: "/admin/users",
      badge: "Admin",
      show: user?.isAdmin,
      color: "bg-red-500"
    },
    {
      title: "Impostazioni",
      description: "Configura il tuo profilo",
      icon: <Settings className="h-5 w-5" />,
      href: "/profile",
      badge: "Account",
      show: true,
      color: "bg-gray-500"
    }
  ];

  const visibleShortcuts = shortcuts.filter(shortcut => shortcut.show);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold">Accesso Rapido</h2>
        <Badge variant="outline" className="gap-1">
          <Zap className="h-3 w-3" />
          PWA Ready
        </Badge>
      </div>
      
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {visibleShortcuts.map((shortcut, index) => (
          <Link key={index} href={shortcut.href}>
            <Card className="cursor-pointer hover:shadow-lg transition-all duration-200 hover:-translate-y-1 group">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div className={`p-2 rounded-lg ${shortcut.color} bg-opacity-10`}>
                    <div className={`${shortcut.color.replace('bg-', 'text-')}`}>
                      {shortcut.icon}
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Badge 
                      variant={shortcut.badge === 'Admin' ? 'default' : 'secondary'}
                      className="text-xs"
                    >
                      {shortcut.badge}
                    </Badge>
                    <ArrowRight className="h-4 w-4 text-gray-400 group-hover:text-gray-600 transition-colors" />
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <CardTitle className="text-lg mb-1">{shortcut.title}</CardTitle>
                <CardDescription className="text-sm">
                  {shortcut.description}
                </CardDescription>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>

      {recentActions.length > 0 && (
        <div>
          <h3 className="text-lg font-semibold mb-3">Azioni Recenti</h3>
          <div className="flex flex-wrap gap-2">
            {recentActions.slice(0, 5).map((action, index) => (
              <Badge key={index} variant="outline" className="text-xs">
                {action}
              </Badge>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}