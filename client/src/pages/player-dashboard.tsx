import { useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { User, LogOut, Calendar, Trophy, Target, ArrowLeft, Eye } from "lucide-react";
import { Link } from "wouter";
import { TeamLogo } from "@/components/team-logo";
import { ModernTable, StatusBadge } from "@/components/ui/modern-table";
import { enhanceTicketsWithStatus } from "@/utils/ticket-status";
import type { Game, Ticket, Team, TeamSelection, User as UserType } from "@shared/schema";

// Player History Table Wrapper - uses new API with privacy logic
function PlayerHistoryTableWrapper({ 
  game, 
  teams 
}: { 
  game: Game; 
  teams: Team[] | undefined; 
}) {
  const { user: currentUser } = useAuth();
  const { data: gameHistory, isLoading } = useQuery<any>({
    queryKey: [`/api/games/${game.id}/player-history`],
  });

  if (isLoading) {
    return <div className="text-center py-4">Caricamento storico giocatori...</div>;
  }

  if (!gameHistory) {
    return <div className="text-center py-4">Impossibile caricare i dati dello storico</div>;
  }

  // Safety checks for data integrity
  if (!gameHistory.tickets || !Array.isArray(gameHistory.tickets)) {
    console.error('Invalid tickets data:', gameHistory);
    return <div className="text-center py-4">Dati dello storico non validi</div>;
  }

  // Extract users safely (all users for complete game history view)
  const users = gameHistory.tickets
    .map((t: any) => t.user)
    .filter((user: any) => user != null);

  return (
    <PlayerHistoryTable
      game={gameHistory.game}
      allTickets={gameHistory.tickets}
      allTeamSelections={[]}
      teams={teams}
      users={users}
    />
  );
}

// User Team Selections Table Wrapper - shows ONLY user's tickets for team selections view
function UserSelectionsTableWrapper({ 
  game, 
  teams 
}: { 
  game: Game; 
  teams: Team[] | undefined; 
}) {
  const { user: currentUser } = useAuth();
  const { data: gameHistory, isLoading } = useQuery<any>({
    queryKey: [`/api/games/${game.id}/player-history`],
  });

  if (isLoading) {
    return <div className="text-center py-4">Caricamento selezioni...</div>;
  }

  if (!gameHistory) {
    return <div className="text-center py-4">Impossibile caricare i dati delle selezioni</div>;
  }

  // Safety checks for data integrity
  if (!gameHistory.tickets || !Array.isArray(gameHistory.tickets)) {
    console.error('Invalid tickets data:', gameHistory);
    return <div className="text-center py-4">Dati delle selezioni non validi</div>;
  }

  // Filter tickets to show only current user's tickets
  const userTickets = gameHistory.tickets.filter((ticket: any) => 
    ticket.userId === currentUser?.id
  );

  // Extract users safely (only current user)
  const users = userTickets
    .map((t: any) => t.user)
    .filter((user: any) => user != null);

  return (
    <PlayerHistoryTable
      game={gameHistory.game}
      allTickets={userTickets}
      allTeamSelections={[]}
      teams={teams}
      users={users}
    />
  );
}

// Player History Table Component - adapted for ModernTable
function PlayerHistoryTable({ 
  game, 
  allTickets, 
  allTeamSelections, 
  teams,
  users 
}: { 
  game: Game; 
  allTickets: any[] | undefined; 
  allTeamSelections: any[] | undefined; 
  teams: Team[] | undefined; 
  users: UserType[] | undefined;
}) {
  const { user: currentUser } = useAuth();
  
  if (!allTickets || !teams || !users) {
    return <div className="text-center py-4">Caricamento dati...</div>;
  }

  // Use all tickets directly - they're already filtered for this game by the API
  const gameTickets = allTickets;

  // Create rounds array (startRound to currentRound)
  const gameRounds: number[] = [];
  for (let round = game.startRound; round <= game.currentRound; round++) {
    gameRounds.push(round);
  }

  // Get team helper with safety check
  const getTeam = (teamId: number) => {
    if (!teams || !Array.isArray(teams)) return null;
    return teams.find(t => t.id === teamId);
  };

  // Get user name helper - tickets now include user data directly
  const getUserName = (ticket: any) => {
    return ticket.user?.username || 'N/A';
  };

  // Get cell style based on ticket status and round
  const getCellStyle = (ticket: any, round: number) => {
    const selection = ticket.selections?.[round.toString()];
    
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

  // Get cell content with privacy logic
  const getCellContent = (ticket: any, round: number) => {
    const selection = ticket.selections?.[round.toString()];
    
    // If ticket was eliminated before this round
    if (ticket.eliminatedInRound && ticket.eliminatedInRound < round) {
      return "—";
    }
    
    // If selection is hidden due to privacy
    if (selection?.hidden) {
      return "🔒";
    }
    
    // If selection exists and has a team, show team logo
    if (selection && selection.teamId) {
      const team = getTeam(selection.teamId);
      if (team) {
        return <TeamLogo team={team} size="sm" />;
      }
      // Fallback to team name if logo fails
      if (teams && Array.isArray(teams)) {
        const fallbackTeam = teams.find(t => t.id === selection.teamId);
        return fallbackTeam?.name || 'N/A';
      }
      return 'N/A';
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

      {gameTickets.length === 0 ? (
        <div className="text-center py-4 text-gray-500">
          Nessun ticket per questo gioco
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr className="border-b">
                <th className="text-left p-3 font-semibold">Giocatore</th>
                <th className="text-left p-3 font-semibold">Ticket</th>
                {gameRounds.map((round, index) => (
                  <th key={round} className="text-center p-3 font-semibold min-w-[120px]">
                    Round {index + 1} (G{round})
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {gameTickets
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
                <tr key={ticket.id} className="border-b hover:bg-gray-50">
                  <td className="p-3 font-medium">
                    {getUserName(ticket)}
                  </td>
                  <td className="p-3">
                    <div className="flex items-center space-x-2">
                      <span>#{ticket.id.toString().padStart(3, '0')}</span>
                      {!ticket.isActive && (
                        <Badge variant="destructive" className="text-xs">
                          Eliminato R{ticket.eliminatedInRound}
                        </Badge>
                      )}
                    </div>
                  </td>
                  {gameRounds.map(round => (
                    <td 
                      key={round} 
                      className={`text-center text-sm p-2 ${getCellStyle(ticket, round)}`}
                    >
                      {getCellContent(ticket, round)}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
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
        <div className="flex items-center space-x-2">
          <span className="text-lg">🔒</span>
          <span>Selezione nascosta (round aperto)</span>
        </div>
      </div>
    </div>
  );
}

// Detailed Game View Component - converted to ModernTable
function DetailedGameView({ 
  gameData, 
  teams, 
  onBack 
}: { 
  gameData: any; 
  teams: Team[] | undefined; 
  onBack: () => void; 
}) {
  const { user } = useAuth();
  const game = gameData.game;
  
  // Fetch all tickets for this game (all players)
  const { data: allGameData, isLoading } = useQuery<any>({
    queryKey: [`/api/games/${game.id}/all-tickets`],
    enabled: !!game.id
  });

  if (isLoading || !teams) {
    return <div className="text-center py-4">Caricamento dati completi del gioco...</div>;
  }

  if (!allGameData) {
    return <div className="text-center py-4 text-red-500">Errore nel caricamento dei dati del gioco</div>;
  }

  // Filter to show only current user's tickets in the team selections view
  const userTickets = allGameData.ticketSelections
    ?.filter((ts: any) => ts.ticket.userId === user?.id)
    ?.map((ts: any) => ts.ticket) || [];
  
  // Create rounds array (startRound to currentRound)
  const gameRounds: number[] = [];
  for (let round = game.startRound; round <= game.currentRound; round++) {
    gameRounds.push(round);
  }

  const getTeam = (teamId: number) => {
    return teams.find(t => t.id === teamId);
  };

  // Get team selections grouped by ticket and round - filter only user's tickets
  const selectionsByTicket = allGameData.ticketSelections
    ?.filter((ts: any) => ts.ticket.userId === user?.id)
    ?.reduce((acc: any, ts: any) => {
      acc[ts.ticket.id] = {};
      ts.selections?.forEach((selection: any) => {
        acc[ts.ticket.id][selection.round] = selection;
      });
      return acc;
    }, {}) || {};

  const getCellContent = (ticket: any, round: number) => {
    const selection = selectionsByTicket[ticket.id]?.[round];
    
    if (ticket.eliminatedInRound && ticket.eliminatedInRound < round) {
      return "—";
    }
    
    if (selection) {
      const team = getTeam(selection.teamId);
      if (team) {
        return <TeamLogo team={team} size="sm" />;
      }
      return teams.find(t => t.id === selection.teamId)?.name || 'N/A';
    }
    
    if (round === game.currentRound && ticket.isActive) {
      return "In attesa";
    }
    
    return "—";
  };

  const getCellStyle = (ticket: any, round: number) => {
    const selection = selectionsByTicket[ticket.id]?.[round];
    
    if (ticket.eliminatedInRound && ticket.eliminatedInRound < round) {
      return "bg-red-100 text-red-800 border border-red-200";
    }
    
    if (ticket.eliminatedInRound === round) {
      return "bg-red-200 text-red-900 font-semibold border border-red-300";
    }
    
    const isCurrentRound = round === game.currentRound && game.roundStatus !== "calculated";
    
    if (isCurrentRound && ticket.isActive) {
      return selection 
        ? "bg-yellow-100 text-yellow-800 border border-yellow-200" 
        : "bg-orange-100 text-orange-800 border border-orange-200";
    }
    
    if (selection && (round < game.currentRound || (round === game.currentRound && game.roundStatus === "calculated"))) {
      return "bg-green-100 text-green-800 border border-green-200";
    }
    
    if (selection) {
      return "bg-green-100 text-green-800 border border-green-200";
    }
    
    return "bg-gray-50 text-gray-500 border border-gray-200";
  };

  // Prepare data for ModernTable - show only user's tickets in team selections view
  const tableData = userTickets.map((ticket: any) => {
    const roundsSurvived = ticket.eliminatedInRound ? ticket.eliminatedInRound - 1 : game.currentRound;
    const rowData: any = {
      ticketId: ticket.id,
      player: ticket.user?.username || 'N/A',
      ticketName: `#${ticket.id.toString().padStart(3, '0')}`,
      status: ticket.isActive ? 'Attivo' : 'Eliminato',
      roundsSurvived,
      isCurrentUser: ticket.userId === user?.id,
      eliminatedInRound: ticket.eliminatedInRound,
      ...gameRounds.reduce((acc, round, index) => {
        acc[`round_${round}`] = {
          round,
          roundDisplay: `R${index + 1} (G${round})`,
          selection: selectionsByTicket[ticket.id]?.[round],
          cellStyle: getCellStyle(ticket, round),
          cellContent: getCellContent(ticket, round)
        };
        return acc;
      }, {} as any)
    };
    return rowData;
  });

  const columns = [
    { key: 'player', label: 'Giocatore', sortable: true },
    { key: 'ticketName', label: 'Ticket', sortable: true },
    { key: 'status', label: 'Stato', sortable: true, align: 'center' as const },
    ...gameRounds.map((round, index) => ({
      key: `round_${round}`,
      label: `R${index + 1} (G${round})`,
      sortable: false,
      align: 'center' as const,
      width: '120px'
    }))
  ];

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Button variant="outline" onClick={onBack} size="sm">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Torna alla panoramica
          </Button>
          <h3 className="text-xl font-semibold">{game.name} - Vista Dettagliata</h3>
        </div>
        <Badge variant={game.status === 'active' ? 'default' : 'secondary'}>
          {game.status}
        </Badge>
      </div>

      {/* Game Stats */}
      <div className="grid grid-cols-4 gap-4 text-center">
        <div className="bg-blue-50 p-3 rounded-lg">
          <div className="text-lg font-semibold text-blue-600">
            {userTickets.filter((t: any) => t.isActive).length}
          </div>
          <div className="text-sm text-gray-600">Ticket Attivi</div>
        </div>
        <div className="bg-red-50 p-3 rounded-lg">
          <div className="text-lg font-semibold text-red-600">
            {userTickets.filter((t: any) => !t.isActive).length}
          </div>
          <div className="text-sm text-gray-600">Ticket Eliminati</div>
        </div>
        <div className="bg-green-50 p-3 rounded-lg">
          <div className="text-lg font-semibold text-green-600">
            {game.currentRound}
          </div>
          <div className="text-sm text-gray-600">Giornata Corrente</div>
        </div>
        <div className="bg-purple-50 p-3 rounded-lg">
          <div className="text-lg font-semibold text-purple-600">
            {game.currentRound - game.startRound + 1}
          </div>
          <div className="text-sm text-gray-600">Round Giocati</div>
        </div>
      </div>

      {/* Detailed Table */}
      <ModernTable
        data={tableData}
        columns={columns}
        renderCell={(item, columnKey) => {
          if (columnKey === 'player') {
            return (
              <div className="flex items-center space-x-2">
                <span className="text-sm font-medium">{item.player}</span>
                {item.isCurrentUser && (
                  <Badge className="bg-blue-500 text-white text-xs">Tu</Badge>
                )}
              </div>
            );
          }
          if (columnKey === 'ticketName') {
            return (
              <div className="flex flex-col">
                <span className="font-medium">{item.ticketName}</span>
                <span className="text-xs text-gray-500">{item.roundsSurvived} round</span>
              </div>
            );
          }
          if (columnKey === 'status') {
            return item.status === 'Attivo' ? (
              <Badge className="bg-green-600 text-white">Attivo</Badge>
            ) : (
              <Badge variant="destructive">
                Eliminato R{item.eliminatedInRound}
              </Badge>
            );
          }
          if (columnKey.startsWith('round_')) {
            const roundData = item[columnKey];
            return (
              <div className={`p-2 rounded text-center text-xs ${roundData.cellStyle}`}>
                {roundData.cellContent}
              </div>
            );
          }
          return '';
        }}
        searchFields={['player', 'ticketName']}
        searchPlaceholder="Cerca giocatore o ticket..."
        defaultSortKey="roundsSurvived"
        defaultSortDirection="desc"
        tabKey={`detailed-game-${game.id}`}
        emptyMessage="Nessun ticket trovato"
      />

      {/* Legend */}
      <div className="flex flex-wrap gap-4 text-xs p-3 bg-gray-50 rounded-lg">
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

// Game Overview Table Component - converted to ModernTable
function GameOverviewTable({ 
  userTeamSelections, 
  teams,
  onGameClick
}: { 
  userTeamSelections: any[] | undefined; 
  teams: Team[] | undefined; 
  onGameClick: (gameData: any) => void;
}) {
  if (!userTeamSelections || !teams) {
    return <div className="text-center py-4">Caricamento dati...</div>;
  }

  if (userTeamSelections.length === 0) {
    return (
      <div className="text-center py-8">
        <Trophy className="h-12 w-12 text-gray-400 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-gray-600 mb-2">
          Non hai ancora partecipato a nessun gioco
        </h3>
        <p className="text-gray-500">
          Quando parteciperai ai giochi, qui vedrai il tuo storico
        </p>
      </div>
    );
  }

  // Prepare data for ModernTable
  const tableData = userTeamSelections.map(gameData => {
    const game = gameData.game;
    const userTickets = gameData.ticketSelections?.map((ts: any) => ts.ticket) || [];
    const activeTickets = userTickets.filter((t: any) => t.isActive);
    const eliminatedTickets = userTickets.filter((t: any) => !t.isActive);
    
    // Calculate best performance (longest surviving ticket)
    const bestRound = userTickets.reduce((max: number, ticket: any) => {
      const rounds = ticket.eliminatedInRound ? ticket.eliminatedInRound - 1 : game.currentRound;
      return Math.max(max, rounds);
    }, 0);

    return {
      gameId: game.id,
      gameName: game.name,
      status: game.status,
      currentRound: game.currentRound,
      totalTickets: userTickets.length,
      activeTickets: activeTickets.length,
      eliminatedTickets: eliminatedTickets.length,
      bestPerformance: bestRound,
      gameData
    };
  });

  const columns = [
    { key: 'gameName', label: 'Gioco', sortable: true },
    { key: 'status', label: 'Stato', sortable: true, align: 'center' as const },
    { key: 'currentRound', label: 'Giornata', sortable: true, align: 'center' as const },
    { key: 'totalTickets', label: 'Ticket Totali', sortable: true, align: 'center' as const },
    { key: 'activeTickets', label: 'Ticket Attivi', sortable: true, align: 'center' as const },
    { key: 'bestPerformance', label: 'Miglior Performance', sortable: true, align: 'center' as const },
    { key: 'actions', label: 'Azioni', sortable: false, align: 'center' as const }
  ];

  return (
    <ModernTable
      data={tableData}
      columns={columns}
      renderCell={(item, columnKey) => {
        switch (columnKey) {
          case 'gameName':
            return <span className="font-medium">{item.gameName}</span>;
          case 'status':
            return <StatusBadge status={item.status} />;
          case 'currentRound':
            return <span className="font-mono">Giornata {item.currentRound}</span>;
          case 'totalTickets':
            return <span className="font-semibold">{item.totalTickets}</span>;
          case 'activeTickets':
            return (
              <div className="flex items-center justify-center">
                <Badge variant={item.activeTickets > 0 ? 'default' : 'secondary'}>
                  {item.activeTickets}
                </Badge>
              </div>
            );
          case 'bestPerformance':
            return (
              <div className="flex items-center justify-center">
                <Badge variant="outline" className="font-mono">
                  {item.bestPerformance} round
                </Badge>
              </div>
            );
          case 'actions':
            return (
              <Button
                size="sm"
                variant="outline"
                onClick={() => onGameClick(item.gameData)}
                className="text-xs"
              >
                <Eye className="h-3 w-3 mr-1" />
                Dettagli
              </Button>
            );
          default:
            return '';
        }
      }}
      searchFields={['gameName']}
      searchPlaceholder="Cerca gioco..."
      defaultSortKey="currentRound"
      defaultSortDirection="desc"
      tabKey="game-overview"
      emptyMessage="Nessun gioco trovato"
    />
  );
}

// Game Card Component
function GameCard({ game }: { game: Game }) {
  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardHeader className="pb-3">
        <div className="flex justify-between items-start">
          <div>
            <CardTitle className="text-lg">{game.name}</CardTitle>
            {game.description && (
              <CardDescription className="mt-1">{game.description}</CardDescription>
            )}
          </div>
          <Badge variant={game.status === 'active' ? 'default' : 'secondary'}>
            {game.status}
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <span className="text-gray-600">Giornata:</span>
            <span className="ml-2 font-medium">{game.currentRound}</span>
          </div>
          <div>
            <span className="text-gray-600">Stato round:</span>
            <span className="ml-2 font-medium">{game.roundStatus}</span>
          </div>
        </div>
        <div className="mt-3">
          <Link href={`/game/${game.id}`}>
            <Button size="sm" className="w-full">
              <Target className="h-4 w-4 mr-2" />
              Gioca
            </Button>
          </Link>
        </div>
      </CardContent>
    </Card>
  );
}

export default function PlayerDashboard() {
  const { user, logoutMutation } = useAuth();
  const [selectedGameData, setSelectedGameData] = useState<any>(null);

  // Fetch user's games and team selections
  const { data: userTeamSelections, isLoading: selectionsLoading } = useQuery<any[]>({
    queryKey: ["/api/user/team-selections"],
  });

  // Fetch teams
  const { data: teams, isLoading: teamsLoading } = useQuery<Team[]>({
    queryKey: ["/api/teams"],
  });

  const isLoading = selectionsLoading || teamsLoading;

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Caricamento dashboard...</p>
        </div>
      </div>
    );
  }

  // FIXED: Extract unique games from user selections only (no duplicates)
  const userGames = userTeamSelections?.map(selection => selection.game) || [];
  const uniqueGamesMap = new Map();
  
  userGames.forEach(game => {
    if (game && !uniqueGamesMap.has(game.id)) {
      uniqueGamesMap.set(game.id, game);
    }
  });
  
  const uniqueGames = Array.from(uniqueGamesMap.values());
  const activeGames = uniqueGames.filter(game => game.status === 'active');
  const registrationGames = uniqueGames.filter(game => game.status === 'registration');

  if (selectedGameData) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="container mx-auto px-4 py-8">
          <DetailedGameView
            gameData={selectedGameData}
            teams={teams}
            onBack={() => setSelectedGameData(null)}
          />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="p-2 bg-blue-100 rounded-full">
                <User className="h-6 w-6 text-blue-600" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Dashboard Giocatore</h1>
                <p className="text-gray-600">Benvenuto, {user?.username}!</p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <Link href="/profile">
                <Button variant="outline" size="sm">
                  <User className="h-4 w-4 mr-2" />
                  Profilo
                </Button>
              </Link>
              <Button
                variant="outline"
                size="sm"
                onClick={() => logoutMutation.mutate()}
                disabled={logoutMutation.isPending}
              >
                <LogOut className="h-4 w-4 mr-2" />
                Logout
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-8">
        <Tabs defaultValue="overview" className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="overview">Panoramica</TabsTrigger>
            <TabsTrigger value="history">Storico Giocatori</TabsTrigger>
            <TabsTrigger value="selections">Scelte Squadre</TabsTrigger>
            <TabsTrigger value="games">Giochi Disponibili</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Trophy className="h-5 w-5 mr-2" />
                  Panoramica Giochi
                </CardTitle>
                <CardDescription>
                  Vista generale delle tue partecipazioni ai giochi
                </CardDescription>
              </CardHeader>
              <CardContent>
                <GameOverviewTable
                  userTeamSelections={userTeamSelections}
                  teams={teams}
                  onGameClick={setSelectedGameData}
                />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="history" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Calendar className="h-5 w-5 mr-2" />
                  Storico Giocatori
                </CardTitle>
                <CardDescription>
                  Cronologia dettagliata delle tue partecipazioni
                </CardDescription>
              </CardHeader>
              <CardContent>
                {userTeamSelections?.map((gameData) => (
                  <PlayerHistoryTableWrapper
                    key={gameData.game.id}
                    game={gameData.game}
                    teams={teams}
                  />
                ))}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="selections" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Target className="h-5 w-5 mr-2" />
                  Scelte Squadre
                </CardTitle>
                <CardDescription>
                  Le tue selezioni di squadre per ogni gioco e round
                </CardDescription>
              </CardHeader>
              <CardContent>
                {userTeamSelections?.map((gameData) => (
                  <div key={gameData.game.id} className="mb-8">
                    <UserSelectionsTableWrapper
                      game={gameData.game}
                      teams={teams}
                    />
                  </div>
                ))}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="games" className="space-y-6">
            {/* Active Games */}
            {activeGames.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-green-600">Giochi Attivi</CardTitle>
                  <CardDescription>
                    Giochi in corso a cui puoi partecipare
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                    {activeGames.map((game) => (
                      <GameCard key={game.id} game={game} />
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Registration Games */}
            {registrationGames.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-blue-600">Registrazioni Aperte</CardTitle>
                  <CardDescription>
                    Giochi in fase di registrazione
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                    {registrationGames.map((game) => (
                      <GameCard key={game.id} game={game} />
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* No Games Available */}
            {activeGames.length === 0 && registrationGames.length === 0 && (
              <Card>
                <CardContent className="text-center py-8">
                  <Calendar className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-600 mb-2">
                    Nessun gioco disponibile
                  </h3>
                  <p className="text-gray-500">
                    Al momento non ci sono giochi attivi o in registrazione
                  </p>
                </CardContent>
              </Card>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}