import { useAuth } from "@/hooks/use-auth";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { User, LogOut, Calendar, Trophy, Target, BarChart3, Users } from "lucide-react";
import { Link } from "wouter";
import type { Game, Ticket, Team, TeamSelection } from "@shared/schema";

// Team Selections Table Component
function TeamSelectionsTable({ userTeamSelections, teams }: { 
  userTeamSelections: any; 
  teams: Team[] | undefined; 
}) {
  if (!userTeamSelections || !teams) {
    return <div className="text-center py-8 text-gray-500">Loading team selections...</div>;
  }

  const getTeamName = (teamId: number) => {
    return teams.find(t => t.id === teamId)?.name || `Team ${teamId}`;
  };

  return (
    <div className="space-y-6">
      {userTeamSelections.map((gameData: any) => (
        <div key={gameData.game?.id} className="space-y-4">
          <div className="flex items-center gap-2">
            <h3 className="text-lg font-semibold text-gray-900">
              {gameData.game?.name || 'Unknown Game'}
            </h3>
            <Badge variant={gameData.game?.status === 'active' ? 'default' : 'secondary'}>
              {gameData.game?.status}
            </Badge>
          </div>
          
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Ticket #</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Round 1</TableHead>
                <TableHead>Round 2</TableHead>
                <TableHead>Round 3</TableHead>
                <TableHead>Round 4</TableHead>
                <TableHead>Round 5</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {gameData.ticketSelections?.map((ticketData: any) => {
                const selections = ticketData.selections || [];
                const selectionsByRound = selections.reduce((acc: any, sel: TeamSelection) => {
                  acc[sel.round] = sel;
                  return acc;
                }, {});

                return (
                  <TableRow key={ticketData.ticket?.id}>
                    <TableCell className="font-medium">#{ticketData.ticket?.id}</TableCell>
                    <TableCell>
                      <Badge variant={ticketData.ticket?.isActive ? 'default' : 'destructive'}>
                        {ticketData.ticket?.isActive ? 'Active' : 'Eliminated'}
                      </Badge>
                    </TableCell>
                    {[1, 2, 3, 4, 5].map(round => (
                      <TableCell key={round}>
                        {selectionsByRound[round] ? 
                          getTeamName(selectionsByRound[round].teamId) : 
                          '-'
                        }
                      </TableCell>
                    ))}
                    <TableCell>
                      {gameData.game?.status === 'active' && ticketData.ticket?.isActive && (
                        <Link href={`/game/${gameData.game.id}`}>
                          <Button size="sm" variant="outline">Edit</Button>
                        </Link>
                      )}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      ))}
    </div>
  );
}

// Round Results Table Component
function RoundResultsTable({ userTeamSelections, teams }: { 
  userTeamSelections: any; 
  teams: Team[] | undefined; 
}) {
  if (!userTeamSelections || !teams) {
    return <div className="text-center py-8 text-gray-500">Loading round results...</div>;
  }

  const getTeamName = (teamId: number) => {
    return teams.find(t => t.id === teamId)?.name || `Team ${teamId}`;
  };

  return (
    <div className="space-y-6">
      {userTeamSelections.map((gameData: any) => (
        <div key={gameData.game?.id} className="space-y-4">
          <div className="flex items-center gap-2">
            <h3 className="text-lg font-semibold text-gray-900">
              {gameData.game?.name || 'Unknown Game'}
            </h3>
            <Badge variant={gameData.game?.status === 'active' ? 'default' : 'secondary'}>
              Current Round: {gameData.game?.currentRound || 1}
            </Badge>
          </div>
          
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Player</TableHead>
                <TableHead>Ticket #</TableHead>
                <TableHead>Round 1</TableHead>
                <TableHead>Round 2</TableHead>
                <TableHead>Round 3</TableHead>
                <TableHead>Round 4</TableHead>
                <TableHead>Round 5</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {gameData.ticketSelections?.map((ticketData: any) => {
                const selections = ticketData.selections || [];
                const selectionsByRound = selections.reduce((acc: any, sel: TeamSelection) => {
                  acc[sel.round] = sel;
                  return acc;
                }, {});

                return (
                  <TableRow key={ticketData.ticket?.id}>
                    <TableCell className="font-medium">You</TableCell>
                    <TableCell>#{ticketData.ticket?.id}</TableCell>
                    {[1, 2, 3, 4, 5].map(round => (
                      <TableCell key={round}>
                        {selectionsByRound[round] ? (
                          <div className="flex flex-col">
                            <span className="text-sm">
                              {getTeamName(selectionsByRound[round].teamId)}
                            </span>
                            {round < (gameData.game?.currentRound || 1) && (
                              <Badge variant="outline" className="text-xs w-fit mt-1">
                                Result pending
                              </Badge>
                            )}
                          </div>
                        ) : '-'}
                      </TableCell>
                    ))}
                    <TableCell>
                      <Badge variant={ticketData.ticket?.isActive ? 'default' : 'destructive'}>
                        {ticketData.ticket?.isActive ? 'In Game' : 'Eliminated'}
                      </Badge>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      ))}
    </div>
  );
}

export default function PlayerDashboard() {
  const { user, logoutMutation } = useAuth();

  const { data: games, isLoading: gamesLoading } = useQuery<Game[]>({
    queryKey: ["/api/games"],
  });

  const { data: teams } = useQuery<Team[]>({
    queryKey: ["/api/teams"],
  });

  const { data: userTeamSelections } = useQuery({
    queryKey: ["/api/user/team-selections"],
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

        {/* Game Data Tables */}
        <Tabs defaultValue="selections" className="bg-white rounded-xl shadow-sm border">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="selections" className="flex items-center gap-2">
              <Target className="h-4 w-4" />
              Team Selections
            </TabsTrigger>
            <TabsTrigger value="results" className="flex items-center gap-2">
              <Trophy className="h-4 w-4" />
              Round Results
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="selections" className="p-6">
            <TeamSelectionsTable 
              userTeamSelections={userTeamSelections} 
              teams={teams} 
            />
          </TabsContent>
          
          <TabsContent value="results" className="p-6">
            <RoundResultsTable 
              userTeamSelections={userTeamSelections} 
              teams={teams} 
            />
          </TabsContent>
        </Tabs>
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
