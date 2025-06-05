import { useAuth } from "@/hooks/use-auth";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { User, LogOut, Calendar, Trophy, Target } from "lucide-react";
import { Link } from "wouter";
import { TeamLogo } from "@/components/team-logo";
import type { Game, Ticket, Team, TeamSelection, User as UserType } from "@shared/schema";

// Player History Table Component - adapted from admin dashboard
function PlayerHistoryTable({ 
  game, 
  userTickets, 
  allTeamSelections, 
  teams 
}: { 
  game: Game; 
  userTickets: Ticket[] | undefined; 
  allTeamSelections: any[] | undefined; 
  teams: Team[] | undefined; 
}) {
  if (!userTickets || !allTeamSelections || !teams) {
    return <div className="text-center py-4">Caricamento dati...</div>;
  }

  // Filter team selections for this game
  const gameSelections = allTeamSelections.find(gameData => gameData.game.id === game.id)?.selections || [];
  
  // Create rounds array (startRound to currentRound)
  const gameRounds: number[] = [];
  for (let round = game.startRound; round <= game.currentRound; round++) {
    gameRounds.push(round);
  }
  
  // Group selections by ticket and round
  const selectionsByTicket = gameSelections.reduce((acc: any, selection: any) => {
    if (!acc[selection.ticketId]) {
      acc[selection.ticketId] = {};
    }
    acc[selection.ticketId][selection.round] = selection;
    return acc;
  }, {});

  // Get team helper
  const getTeam = (teamId: number) => {
    return teams.find(t => t.id === teamId);
  };

  // Get cell style based on ticket status and round
  const getCellStyle = (ticket: any, round: number) => {
    const selection = selectionsByTicket[ticket.id]?.[round];
    
    // If ticket was eliminated before this round - show red
    if (ticket.eliminatedInRound && ticket.eliminatedInRound < round) {
      return "bg-red-100 text-red-800 border border-red-200";
    }
    
    // If ticket was eliminated in this round - show dark red
    if (ticket.eliminatedInRound === round) {
      return "bg-red-200 text-red-900 font-semibold border border-red-300";
    }
    
    // Check if this round is the current one being played (not calculated yet)
    const isCurrentRound = round === game.currentRound && game.roundStatus !== "calculated";
    
    // If this is the current round being played and not calculated yet
    if (isCurrentRound && ticket.isActive) {
      return selection 
        ? "bg-yellow-100 text-yellow-800 border border-yellow-200" 
        : "bg-orange-100 text-orange-800 border border-orange-200";
    }
    
    // If this round is completed (has selection and either round < currentRound OR current round is calculated)
    if (selection && (round < game.currentRound || (round === game.currentRound && game.roundStatus === "calculated"))) {
      return "bg-green-100 text-green-800 border border-green-200";
    }
    
    // If ticket has a selection for this round (fallback)
    if (selection) {
      return "bg-green-100 text-green-800 border border-green-200";
    }
    
    // Default empty state
    return "bg-gray-50 text-gray-500 border border-gray-200";
  };

  // Get cell content
  const getCellContent = (ticket: any, round: number) => {
    const selection = selectionsByTicket[ticket.id]?.[round];
    
    // If ticket was eliminated before this round
    if (ticket.eliminatedInRound && ticket.eliminatedInRound < round) {
      return "—";
    }
    
    // If selection exists, show team logo
    if (selection) {
      const team = getTeam(selection.teamId);
      if (team) {
        return <TeamLogo team={team} size="sm" />;
      }
      return teams.find(t => t.id === selection.teamId)?.name || 'N/A';
    }
    
    // If current round and no selection yet
    if (round === game.currentRound && ticket.isActive) {
      return "In attesa";
    }
    
    return "—";
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-xl font-semibold">{game.name}</h3>
        <div className="flex items-center space-x-4 text-sm">
          <span className="text-gray-600">Giornata corrente: {game.currentRound}</span>
          <span className="text-gray-500">Stato: {game.roundStatus}</span>
          <Badge variant={game.status === 'active' ? 'default' : 'secondary'}>
            {game.status}
          </Badge>
        </div>
      </div>

      {userTickets.length === 0 ? (
        <div className="text-center py-4 text-gray-500">
          Nessun ticket per questo gioco
        </div>
      ) : (
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="font-semibold">Ticket</TableHead>
                {gameRounds.map((round, index) => (
                  <TableHead key={round} className="text-center font-semibold min-w-[120px]">
                    Round {index + 1} (G{round})
                  </TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {userTickets
                .sort((a, b) => {
                  // Calculate rounds survived for each ticket
                  const roundsA = a.eliminatedInRound || (game.currentRound + 1);
                  const roundsB = b.eliminatedInRound || (game.currentRound + 1);
                  
                  // Sort by elimination round (later eliminations first), then by ticket ID
                  if (roundsA !== roundsB) {
                    return roundsB - roundsA;
                  }
                  return a.id - b.id;
                })
                .map((ticket) => (
                <TableRow key={ticket.id}>
                  <TableCell>
                    <div className="flex items-center space-x-2">
                      <span className="font-medium">#{ticket.id.toString().padStart(3, '0')}</span>
                      {!ticket.isActive && (
                        <Badge variant="destructive" className="text-xs">
                          Eliminato R{ticket.eliminatedInRound}
                        </Badge>
                      )}
                    </div>
                  </TableCell>
                  {gameRounds.map(round => (
                    <TableCell 
                      key={round} 
                      className={`text-center text-sm ${getCellStyle(ticket, round)}`}
                    >
                      {getCellContent(ticket, round)}
                    </TableCell>
                  ))}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      {/* Legend */}
      <div className="flex flex-wrap gap-4 text-xs mt-4 p-3 bg-gray-50 rounded-lg">
        <div className="flex items-center space-x-2">
          <div className="w-4 h-4 bg-green-100 border border-green-200 rounded"></div>
          <span>Sopravvissuto</span>
        </div>
        <div className="flex items-center space-x-2">
          <div className="w-4 h-4 bg-red-100 border border-red-200 rounded"></div>
          <span>Eliminato</span>
        </div>
        <div className="flex items-center space-x-2">
          <div className="w-4 h-4 bg-yellow-100 border border-yellow-200 rounded"></div>
          <span>Round corrente</span>
        </div>
        <div className="flex items-center space-x-2">
          <div className="w-4 h-4 bg-orange-100 border border-orange-200 rounded"></div>
          <span>In attesa selezione</span>
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

export default function PlayerDashboard() {
  const { user, logoutMutation } = useAuth();

  const { data: games, isLoading: gamesLoading } = useQuery<Game[]>({
    queryKey: ["/api/games"],
  });

  const { data: teams } = useQuery<Team[]>({
    queryKey: ["/api/teams"],
  });

  const { data: userTeamSelections } = useQuery<any[]>({
    queryKey: ["/api/user/team-selections"],
  });

  const handleLogout = () => {
    logoutMutation.mutate();
  };

  if (gamesLoading || !games) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  const activeGames = games.filter(game => game.status === "active");
  const userGames = games.filter(game => {
    // Check if user has tickets in this game
    return Array.isArray(userTeamSelections) && userTeamSelections.some((gameData: any) => gameData.game?.id === game.id);
  });

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
                  <Trophy className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">No Active Games</h3>
                  <p className="text-gray-600">
                    There are no active games at the moment. Check back later for new tournaments!
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

        {/* Player History Tables */}
        <div className="bg-white rounded-xl shadow-sm border p-6">
          <div className="flex items-center gap-2 mb-6">
            <Target className="h-5 w-5" />
            <h3 className="text-lg font-semibold">Storico Partite</h3>
          </div>
          
          {userGames.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              Non hai ancora partecipato a nessun gioco
            </div>
          ) : (
            <div className="space-y-8">
              {userGames.map((game) => {
                // Get user tickets for this game from userTeamSelections
                const gameData = Array.isArray(userTeamSelections) ? 
                  userTeamSelections.find((gd: any) => gd.game?.id === game.id) : null;
                const userTickets = gameData?.ticketSelections?.map((ts: any) => ts.ticket) || [];
                
                return (
                  <PlayerHistoryTable
                    key={game.id}
                    game={game}
                    userTickets={userTickets}
                    allTeamSelections={Array.isArray(userTeamSelections) ? userTeamSelections : []}
                    teams={teams}
                  />
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}