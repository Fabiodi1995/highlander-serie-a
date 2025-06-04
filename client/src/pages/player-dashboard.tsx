import { useAuth } from "@/hooks/use-auth";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { User, LogOut, Calendar, Trophy, Target, BarChart3 } from "lucide-react";
import { Link } from "wouter";
import type { Game, Ticket } from "@shared/schema";

export default function PlayerDashboard() {
  const { user, logoutMutation } = useAuth();

  const { data: games, isLoading: gamesLoading } = useQuery<Game[]>({
    queryKey: ["/api/games"],
  });

  const handleLogout = () => {
    logoutMutation.mutate();
  };

  if (gamesLoading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  const activeGames = games?.filter(game => game.status === "active") || [];
  const completedGames = games?.filter(game => game.status === "completed") || [];

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Navigation Header */}
      <nav className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <h1 className="text-xl font-bold text-primary">Highlander</h1>
            </div>
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <User className="h-4 w-4 text-gray-500" />
                <span className="text-gray-700">{user?.username}</span>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleLogout}
                disabled={logoutMutation.isPending}
              >
                <LogOut className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Welcome Section */}
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            Welcome back, {user?.username}!
          </h2>
          <p className="text-gray-600">
            Manage your tickets and track your progress across all games.
          </p>
        </div>

        {/* Active Games Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {activeGames.length === 0 ? (
            <div className="col-span-full">
              <Card className="text-center p-8">
                <CardContent>
                  <Target className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No Active Games</h3>
                  <p className="text-gray-500">
                    You're not currently participating in any active games.
                  </p>
                </CardContent>
              </Card>
            </div>
          ) : (
            activeGames.map((game) => (
              <GameCard key={game.id} game={game} />
            ))
          )}
        </div>

        {/* Statistics Section */}
        <div className="bg-white rounded-xl shadow-sm border p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
            <BarChart3 className="h-5 w-5 mr-2" />
            Your Statistics
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-primary">
                {(games?.length || 0)}
              </div>
              <div className="text-sm text-gray-600">Games Played</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-secondary">
                {completedGames.length}
              </div>
              <div className="text-sm text-gray-600">Completed</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-warning">
                {activeGames.length}
              </div>
              <div className="text-sm text-gray-600">Active Games</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-gray-600">
                {games?.length ? Math.round((completedGames.length / games.length) * 100) : 0}%
              </div>
              <div className="text-sm text-gray-600">Completion Rate</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function GameCard({ game }: { game: Game }) {
  const { data: tickets } = useQuery<Ticket[]>({
    queryKey: [`/api/games/${game.id}/tickets`],
  });

  const activeTickets = tickets?.filter(t => t.isActive) || [];
  const eliminatedTickets = tickets?.filter(t => !t.isActive) || [];

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "active":
        return <Badge className="bg-secondary text-white">Active</Badge>;
      case "completed":
        return <Badge variant="destructive">Completed</Badge>;
      case "registration":
        return <Badge className="bg-warning text-white">Registration Open</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardHeader>
        <div className="flex justify-between items-start">
          <div>
            <CardTitle className="text-lg">{game.name}</CardTitle>
            <CardDescription>
              Started: {new Date(game.createdAt).toLocaleDateString()}
            </CardDescription>
          </div>
          {getStatusBadge(game.status)}
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 gap-4 mb-4">
          <div className="text-center p-3 bg-slate-50 rounded-lg">
            <div className="text-2xl font-bold text-secondary">
              {activeTickets.length}
            </div>
            <div className="text-xs text-gray-600">Active Tickets</div>
          </div>
          <div className="text-center p-3 bg-slate-50 rounded-lg">
            <div className="text-2xl font-bold text-gray-400">
              {eliminatedTickets.length}
            </div>
            <div className="text-xs text-gray-600">Eliminated</div>
          </div>
        </div>

        <div className="space-y-2 mb-4">
          <div className="text-sm font-medium text-gray-700 flex items-center">
            <Calendar className="h-4 w-4 mr-1" />
            Current Round: Giornata {game.currentRound}
          </div>
        </div>

        {game.status === "active" && activeTickets.length > 0 ? (
          <Link href={`/game/${game.id}`}>
            <Button className="w-full">Make Selections</Button>
          </Link>
        ) : (
          <Button className="w-full" variant="secondary" disabled>
            {game.status === "completed" ? "Game Over" : "No Active Tickets"}
          </Button>
        )}
      </CardContent>
    </Card>
  );
}
