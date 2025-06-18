import React, { useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { User, LogOut, Plus, Gamepad2, Play, Users, TicketIcon, Calculator, Settings, Trash2, Trophy, Target, CheckCircle, Shield, Download, Clock } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { insertGameSchema } from "@shared/schema";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { TeamLogo } from "@/components/team-logo";
import { ModernTable, StatusBadge } from "@/components/ui/modern-table";
import { enhanceTicketsWithStatus, getStatusSortOrder, type TicketWithStatus } from "@/utils/ticket-status";
import { generateGameHistoryPDF, type GameHistoryData } from "@/utils/pdf-generator";
import { CountdownTimer } from "@/components/ui/countdown-timer";
import { CountdownDisplay } from "@/components/ui/countdown-display";
import { DeadlineSetter } from "@/components/ui/deadline-setter";
import type { Game, User as UserType, Team, TeamSelection, Ticket, Match } from "@shared/schema";
import { z } from "zod";

type CreateGameData = z.infer<typeof insertGameSchema>;

function MatchResultsForm({ 
  game, 
  onComplete, 
  onCancel 
}: { 
  game: Game | null; 
  onComplete: () => void; 
  onCancel: () => void; 
}) {
  const [matchResults, setMatchResults] = useState<Record<number, { homeScore: number; awayScore: number }>>({});
  
  const { data: matches } = useQuery<Match[]>({
    queryKey: ["/api/matches", game?.currentRound],
    queryFn: async () => {
      if (!game?.currentRound) return [];
      const res = await apiRequest("GET", `/api/matches/${game.currentRound}`);
      return await res.json();
    },
    enabled: !!game?.currentRound,
  });

  const { data: teams } = useQuery<Team[]>({
    queryKey: ["/api/teams"],
  });

  const updateMatchResultMutation = useMutation({
    mutationFn: async ({ matchId, homeScore, awayScore }: { matchId: number; homeScore: number; awayScore: number }) => {
      const res = await apiRequest("POST", `/api/matches/${matchId}/result`, { homeScore, awayScore });
      return await res.json();
    },
    onError: (error: Error) => {
      toast({
        title: "Errore",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const { toast } = useToast();

  const handleScoreChange = (matchId: number, type: 'home' | 'away', value: string) => {
    const score = value === '' ? 0 : parseInt(value);
    if (isNaN(score) || score < 0) return; // Only allow valid non-negative numbers
    
    setMatchResults(prev => {
      const current = prev[matchId] || { homeScore: 0, awayScore: 0 };
      return {
        ...prev,
        [matchId]: {
          ...current,
          [type === 'home' ? 'homeScore' : 'awayScore']: score
        }
      };
    });
  };

  const handleSaveAllResults = async () => {
    if (!matches) return;
    
    try {
      // Only save matches that have been modified or are not completed yet
      const promises = matches.map(match => {
        const result = matchResults[match.id];
        
        // If match has modifications in the form, use those values
        if (result && (result.homeScore !== undefined || result.awayScore !== undefined)) {
          return updateMatchResultMutation.mutateAsync({
            matchId: match.id,
            homeScore: result.homeScore ?? 0,
            awayScore: result.awayScore ?? 0
          });
        }
        
        // If match is not completed yet, save with default 0-0
        if (!match.isCompleted) {
          return updateMatchResultMutation.mutateAsync({
            matchId: match.id,
            homeScore: 0,
            awayScore: 0
          });
        }
        
        // If match is already completed and no modifications, skip (return resolved promise)
        return Promise.resolve();
      });
      
      await Promise.all(promises);
      
      toast({
        title: "Successo",
        description: "Risultati salvati correttamente",
      });
      
      // Refresh matches to check completion status
      queryClient.invalidateQueries({ queryKey: ["/api/matches", game?.currentRound] });
      
    } catch (error) {
      console.error("Error submitting results:", error);
      toast({
        title: "Errore",
        description: "Errore nel salvataggio dei risultati",
        variant: "destructive",
      });
    }
  };

  // Check if all matches are completed
  const allMatchesCompleted = matches ? matches.every(match => match.isCompleted) : false;

  if (!matches) {
    return <div className="text-center py-4">Caricamento partite...</div>;
  }

  return (
    <div className="space-y-4">
      {/* Giornata Header */}
      <div className="bg-blue-600 text-white rounded-lg p-4 text-center">
        <h2 className="text-xl font-bold">GIORNATA {game?.currentRound}</h2>
        <p className="text-blue-100 mt-1">Inserimento Risultati Serie A</p>
      </div>

      {allMatchesCompleted ? (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <div className="flex items-center space-x-2">
            <CheckCircle className="w-5 h-5 text-green-500" />
            <span className="text-green-700 font-medium">
              Tutte le {matches.length} partite sono state salvate. Ora puoi confermare il calcolo del round.
            </span>
          </div>
        </div>
      ) : (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-center space-x-2">
            <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
            <span className="text-blue-700 font-medium">
              {matches.filter(m => m.isCompleted).length} di {matches.length} partite salvate. 
              Risultati precedenti vengono mantenuti se non modificati.
            </span>
          </div>
        </div>
      )}
      
      <div className="grid gap-4">
        {matches.map((match) => (
          <Card key={match.id} className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <span className="font-medium">
                  {teams?.find(t => t.id === match.homeTeamId)?.name || `Team ${match.homeTeamId}`}
                </span>
                <span className="text-muted-foreground">vs</span>
                <span className="font-medium">
                  {teams?.find(t => t.id === match.awayTeamId)?.name || `Team ${match.awayTeamId}`}
                </span>
                {match.isCompleted && (
                  <Badge variant="outline" className="ml-2 text-green-600 border-green-200">
                    Ultimo salvato: {match.homeScore}-{match.awayScore}
                  </Badge>
                )}
              </div>
              <div className="flex items-center space-x-2">
                <Input
                  type="number"
                  min="0"
                  max="20"
                  placeholder="0"
                  className="w-16 text-center"
                  value={matchResults[match.id]?.homeScore ?? (match.isCompleted ? match.homeScore : '')}
                  onChange={(e) => handleScoreChange(match.id, 'home', e.target.value)}
                />
                <span>-</span>
                <Input
                  type="number"
                  min="0"
                  max="20"
                  placeholder="0"
                  className="w-16 text-center"
                  value={matchResults[match.id]?.awayScore ?? (match.isCompleted ? match.awayScore : '')}
                  onChange={(e) => handleScoreChange(match.id, 'away', e.target.value)}
                />
              </div>
            </div>
          </Card>
        ))}
      </div>
      
      <div className="flex justify-between items-center pt-4">
        <Button 
          variant="secondary" 
          onClick={() => {
            const sampleResults: Record<number, { homeScore: number; awayScore: number }> = {};
            matches.forEach((match) => {
              sampleResults[match.id] = {
                homeScore: Math.floor(Math.random() * 4),
                awayScore: Math.floor(Math.random() * 4)
              };
            });
            setMatchResults(sampleResults);
          }}
        >
          Risultati di Esempio
        </Button>
        
        <div className="flex space-x-2">
          <Button variant="outline" onClick={onCancel}>
            Annulla
          </Button>
          <Button 
            onClick={handleSaveAllResults}
            disabled={updateMatchResultMutation.isPending}
          >
            {updateMatchResultMutation.isPending ? "Salvando..." : "Salva Risultati"}
          </Button>
          <Button 
            onClick={onComplete}
            disabled={!allMatchesCompleted}
            className="bg-green-600 hover:bg-green-700 text-white"
          >
            <CheckCircle className="w-4 h-4 mr-2" />
            Conferma e Calcola Round
          </Button>
        </div>
      </div>
    </div>
  );
}

function TicketAssignmentForm({ 
  gameId, 
  users, 
  onAssign, 
  isPending, 
  onClose 
}: { 
  gameId: number | null; 
  users: UserType[]; 
  onAssign: (data: { gameId: number; userId: number; count: number }) => void; 
  isPending: boolean; 
  onClose: () => void;
}) {
  const [selectedUserId, setSelectedUserId] = useState<string>("");
  const [ticketCount, setTicketCount] = useState<number>(1);

  // Filtriamo gli utenti in modo sicuro
  const availableUsers = React.useMemo(() => {
    if (!users || !Array.isArray(users)) return [];
    return users.filter(user => {
      return user && 
             typeof user === 'object' && 
             user.id && 
             user.username && 
             user.isAdmin !== true;
    });
  }, [users]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const userIdNum = parseInt(selectedUserId, 10);
      if (gameId && selectedUserId && !isNaN(userIdNum) && ticketCount > 0) {
        console.log(`Submitting ticket assignment: gameId=${gameId}, userId=${userIdNum}, count=${ticketCount}`);
        onAssign({ gameId, userId: userIdNum, count: ticketCount });
        setSelectedUserId("");
        setTicketCount(1);
        onClose();
      }
    } catch (error) {
      console.error("Error in ticket assignment form submission:", error);
    }
  };

  const handleUserChange = (value: string) => {
    try {
      console.log(`User selection changed: ${value}`);
      setSelectedUserId(value || "");
    } catch (error) {
      console.error("Error handling user selection:", error);
      setSelectedUserId("");
    }
  };

  const handleTicketCountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    try {
      const value = e.target.value;
      const parsed = parseInt(value, 10);
      if (!isNaN(parsed) && parsed > 0 && parsed <= 10) {
        setTicketCount(parsed);
      } else if (value === "") {
        setTicketCount(1);
      }
    } catch (error) {
      console.error("Error handling ticket count change:", error);
      setTicketCount(1);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <Label htmlFor="user-select">Seleziona Giocatore</Label>
        <select 
          value={selectedUserId}
          onChange={(e) => handleUserChange(e.target.value)}
          className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
        >
          <option value="">Scegli un giocatore</option>
          {availableUsers.map((user) => (
            <option key={user.id} value={user.id.toString()}>
              {user.username}
            </option>
          ))}
        </select>
      </div>
      
      <div>
        <Label htmlFor="ticket-count">Numero Ticket</Label>
        <Input
          id="ticket-count"
          type="number"
          min="1"
          max="10"
          value={ticketCount}
          onChange={handleTicketCountChange}
        />
      </div>
      
      <div className="flex justify-end space-x-2">
        <Button type="button" variant="outline" onClick={onClose}>
          Annulla
        </Button>
        <Button type="submit" disabled={!selectedUserId || selectedUserId === "" || isPending}>
          {isPending ? "Assegnando..." : "Assegna Ticket"}
        </Button>
      </div>
    </form>
  );
}

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
  
  if (!allTickets || !allTeamSelections || !teams || !users) {
    return <div className="text-center py-4">Caricamento dati...</div>;
  }

  // Filter tickets for this game - show ALL tickets, not just specific player's
  const gameTickets = allTickets.filter(ticket => ticket.gameId === game.id);
  
  // Filter team selections for this game
  const gameSelections = allTeamSelections.find(gameData => gameData.game.id === game.id)?.selections || [];
  
  // Create rounds array (startRound to currentRound)
  const gameRounds: number[] = [];
  for (let round = game.startRound; round <= game.currentRound; round++) {
    gameRounds.push(round);
  }
  
  // Debug log - remove in production
  // console.log('=== TABELLA STORICO DEBUG ===');
  // console.log('Game:', game.name, 'Current Round:', game.currentRound, 'Start Round:', game.startRound);
  
  // Group selections by ticket and round
  const selectionsByTicket = gameSelections.reduce((acc: any, selection: any) => {
    if (!acc[selection.ticketId]) {
      acc[selection.ticketId] = {};
    }
    acc[selection.ticketId][selection.round] = selection;
    return acc;
  }, {});

  // Get team name helper
  const getTeamName = (teamId: number) => {
    return teams.find(t => t.id === teamId)?.name || 'N/A';
  };

  // Get team helper
  const getTeam = (teamId: number) => {
    return teams.find(t => t.id === teamId);
  };

  // Get user name helper
  const getUserName = (userId: number) => {
    return users.find(u => u.id === userId)?.username || 'N/A';
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
    
    // Check if this is the final round and the game is completed with this ticket still active (WINNER)
    if (selection && game.status === 'completed' && ticket.isActive && round === game.currentRound) {
      return "bg-yellow-100 text-yellow-800 border border-yellow-200";
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

  // Get cell content with status label
  const getCellContent = (ticket: any, round: number, currentUserId?: number) => {
    const selection = selectionsByTicket[ticket.id]?.[round];
    
    // If ticket was eliminated before this round
    if (ticket.eliminatedInRound && ticket.eliminatedInRound < round) {
      return (
        <div className="text-center">
          <div className="text-xs text-gray-500">—</div>
        </div>
      );
    }
    
    // If ticket was eliminated in this round
    if (ticket.eliminatedInRound === round) {
      const team = selection ? getTeam(selection.teamId) : null;
      return (
        <div className="text-center">
          {team && <TeamLogo team={team} size="sm" />}
          <div className="text-xs font-semibold text-red-800 mt-1">ELIMINATO</div>
        </div>
      );
    }
    
    // Check if this is the final round and the game is completed with this ticket still active (WINNER)
    if (selection && game.status === 'completed' && ticket.isActive && round === game.currentRound) {
      const team = getTeam(selection.teamId);
      return (
        <div className="text-center">
          {team && <TeamLogo team={team} size="sm" />}
          <div className="text-xs font-semibold text-yellow-800 mt-1">VINCITORE</div>
        </div>
      );
    }
    
    // If round is completed (superato)
    if (selection && (round < game.currentRound || (round === game.currentRound && game.roundStatus === "calculated"))) {
      const team = getTeam(selection.teamId);
      return (
        <div className="text-center">
          {team && <TeamLogo team={team} size="sm" />}
          <div className="text-xs font-semibold text-green-800 mt-1">SUPERATO</div>
        </div>
      );
    }
    
    // Check if this is current round being played
    const isCurrentRound = round === game.currentRound && game.roundStatus !== "calculated";
    
    // If this is current round and ticket is active
    if (isCurrentRound && ticket.isActive) {
      const team = selection ? getTeam(selection.teamId) : null;
      return (
        <div className="text-center">
          {team ? <TeamLogo team={team} size="sm" /> : <div className="text-xs text-gray-600">In attesa</div>}
          <div className="text-xs font-semibold text-yellow-800 mt-1">ATTIVO</div>
        </div>
      );
    }
    
    return (
      <div className="text-center">
        <div className="text-xs text-gray-500">—</div>
      </div>
    );
  };

  // Handle PDF download
  const handleDownloadPDF = async () => {
    const gameSelections = allTeamSelections.find(gameData => gameData.game.id === game.id)?.selections || [];
    const pdfData: GameHistoryData = {
      game,
      tickets: gameTickets,
      teams,
      users,
      teamSelections: gameSelections
    };
    try {
      await generateGameHistoryPDF(pdfData);
    } catch (error) {
      console.error('Error generating PDF:', error);
    }
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
          <span className="text-xs text-gray-400">
            Aggiornato: {new Date().toLocaleTimeString()}
          </span>
          <Button
            variant="outline"
            size="sm"
            onClick={handleDownloadPDF}
            className="flex items-center gap-2"
          >
            <Download className="h-4 w-4" />
            PDF
          </Button>
        </div>
      </div>

      {gameTickets.length === 0 ? (
        <div className="text-center py-4 text-gray-500">
          Nessun ticket per questo gioco
        </div>
      ) : (
        <ModernTable
          data={gameTickets.map((ticket) => {
            const roundsSurvived = ticket.eliminatedInRound ? ticket.eliminatedInRound - 1 : game.currentRound;
            const rowData: any = {
              ticketId: ticket.id,
              player: getUserName(ticket.userId),
              ticketName: `#${ticket.id.toString().padStart(3, '0')}`,
              status: !ticket.isActive ? 'Eliminato' : (game.status === 'completed' ? 'Vincitore' : 'Attivo'),
              roundsSurvived,
              eliminatedInRound: ticket.eliminatedInRound,
              ...gameRounds.reduce((acc, round, index) => {
                acc[`round_${round}`] = {
                  round,
                  roundDisplay: `Giornata ${round}`,
                  cellStyle: getCellStyle(ticket, round),
                  cellContent: getCellContent(ticket, round, currentUser?.id)
                };
                return acc;
              }, {} as any)
            };
            return rowData;
          })}
          columns={[
            { key: 'player', label: 'Giocatore', sortable: true },
            { key: 'ticketName', label: 'Ticket', sortable: true },
            { key: 'status', label: 'Stato', sortable: true, align: 'center' as const },
            ...gameRounds.map((round, index) => ({
              key: `round_${round}`,
              label: `Giornata ${round}`,
              sortable: false,
              align: 'center' as const,
              width: '120px'
            }))
          ]}
          renderCell={(item, columnKey) => {
            switch (columnKey) {
              case 'player':
                return <span className="font-medium">{item.player}</span>;
              case 'ticketName':
                return (
                  <div className="flex items-center space-x-2">
                    <span>{item.ticketName}</span>
                    {!item.status || item.status === 'Eliminato' ? (
                      <Badge variant="destructive" className="text-xs">
                        Eliminato G{item.eliminatedInRound}
                      </Badge>
                    ) : null}
                  </div>
                );
              case 'status':
                return <StatusBadge status={item.status} />;
              default:
                if (columnKey.startsWith('round_')) {
                  const roundData = item[columnKey];
                  return (
                    <div className={`text-center text-sm ${roundData.cellStyle}`}>
                      {roundData.cellContent}
                    </div>
                  );
                }
                return '';
            }
          }}
          searchFields={['player', 'ticketName']}
          searchPlaceholder="Cerca giocatore o ticket..."
          defaultSortKey="roundsSurvived"
          defaultSortDirection="desc"
          tabKey={`admin-history-${game.id}`}
          emptyMessage="Nessun ticket trovato"
        />
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

export default function AdminDashboard() {
  const { user, logoutMutation } = useAuth();
  const [createGameOpen, setCreateGameOpen] = useState(false);
  const [ticketDialogOpen, setTicketDialogOpen] = useState(false);
  const [selectedGameId, setSelectedGameId] = useState<number | null>(null);
  const { toast } = useToast();

  const { data: games, isLoading: gamesLoading } = useQuery<Game[]>({
    queryKey: ["/api/games"],
    refetchInterval: 3000, // Aggiorna ogni 3 secondi
    refetchIntervalInBackground: true,
  });

  const { data: users } = useQuery<UserType[]>({
    queryKey: ["/api/users"],
  });

  const { data: teams } = useQuery<Team[]>({
    queryKey: ["/api/teams"],
  });

  const { data: allTeamSelections } = useQuery<any[]>({
    queryKey: ["/api/admin/all-team-selections"],
    refetchInterval: 3000, // Aggiorna ogni 3 secondi
    refetchIntervalInBackground: true,
  });

  const { data: allTickets } = useQuery<any[]>({
    queryKey: ["/api/admin/all-tickets"],
    refetchInterval: 3000,
    refetchIntervalInBackground: true,
  });

  const [selectedGameForCalculation, setSelectedGameForCalculation] = useState<Game | null>(null);
  const [showMatchResults, setShowMatchResults] = useState(false);
  const [deadlineDialogOpen, setDeadlineDialogOpen] = useState(false);
  const [selectedGameForDeadline, setSelectedGameForDeadline] = useState<Game | null>(null);
  const [newRoundWithDeadline, setNewRoundWithDeadline] = useState(false);

  const createGameForm = useForm<CreateGameData>({
    resolver: zodResolver(insertGameSchema),
    defaultValues: {
      name: "",
      description: "",
      startRound: 1,
    },
  });

  const createGameMutation = useMutation({
    mutationFn: async (data: CreateGameData) => {
      const res = await apiRequest("POST", "/api/games", data);
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/games"] });
      setCreateGameOpen(false);
      createGameForm.reset();
      toast({
        title: "Successo",
        description: "Gioco creato con successo",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Errore",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const closeRegistrationMutation = useMutation({
    mutationFn: async (gameId: number) => {
      const res = await apiRequest("POST", `/api/games/${gameId}/close-registration`);
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/games"] });
      toast({
        title: "Successo",
        description: "Registrazioni chiuse, gioco iniziato",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Errore",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const calculateTurnMutation = useMutation({
    mutationFn: async (gameId: number) => {
      const res = await apiRequest("POST", `/api/games/${gameId}/calculate-turn`);
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/games"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/all-team-selections"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/all-tickets"] });
      setShowMatchResults(false);
      setSelectedGameForCalculation(null);
      toast({
        title: "Successo",
        description: "Giornata calcolata con successo",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Errore",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const setDeadlineMutation = useMutation({
    mutationFn: async ({ gameId, deadline }: { gameId: number; deadline: string }) => {
      const res = await apiRequest("POST", `/api/games/${gameId}/set-deadline`, { deadline });
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/games"] });
      setDeadlineDialogOpen(false);
      setSelectedGameForDeadline(null);
      setNewRoundWithDeadline(false);
      toast({
        title: "Successo",
        description: "Deadline impostata con successo",
      });
    },
    onError: (error: Error) => {
      // Non chiudere la finestra quando c'è un errore
      toast({
        title: "Errore",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const startNewRoundMutation = useMutation({
    mutationFn: async (gameId: number) => {
      const res = await apiRequest("POST", `/api/games/${gameId}/start-new-round`);
      return await res.json();
    },
    onSuccess: (data, gameId) => {
      queryClient.invalidateQueries({ queryKey: ["/api/games"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/all-team-selections"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/all-tickets"] });
      
      // Se stiamo impostando una deadline per il nuovo round, non chiudere il dialog
      if (newRoundWithDeadline && selectedGameForDeadline) {
        toast({
          title: "Successo",
          description: "Nuovo round iniziato - ora imposta la deadline",
        });
        return;
      }
      
      toast({
        title: "Successo",
        description: "Nuovo round iniziato",
      });
    },
    onError: (error: Error) => {
      setNewRoundWithDeadline(false);
      setSelectedGameForDeadline(null);
      setDeadlineDialogOpen(false);
      toast({
        title: "Errore",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const assignTicketMutation = useMutation({
    mutationFn: async ({ gameId, userId, count }: { gameId: number; userId: number; count: number }) => {
      console.log(`Attempting to assign ${count} tickets to user ${userId} for game ${gameId}`);
      const res = await apiRequest("POST", `/api/games/${gameId}/tickets`, { userId, count });
      if (!res.ok) {
        const errorData = await res.text();
        console.error(`Ticket assignment failed: ${res.status} - ${errorData}`);
        throw new Error(`Errore ${res.status}: ${errorData}`);
      }
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/games"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/all-tickets"] });
      toast({
        title: "Successo",
        description: "Ticket assegnati con successo",
      });
    },
    onError: (error: Error) => {
      console.error("Ticket assignment error:", error);
      toast({
        title: "Errore nell'assegnazione ticket",
        description: error.message || "Errore sconosciuto",
        variant: "destructive",
      });
    },
  });

  const deleteTicketMutation = useMutation({
    mutationFn: async (ticketId: number) => {
      const res = await apiRequest("DELETE", `/api/tickets/${ticketId}`);
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/games"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/all-tickets"] });
      toast({
        title: "Successo",
        description: "Ticket eliminato con successo",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Errore",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const lockRoundMutation = useMutation({
    mutationFn: async ({ gameId, forceConfirm }: { gameId: number; forceConfirm?: boolean }) => {
      const res = await apiRequest("POST", `/api/games/${gameId}/lock-round`, { forceConfirm });
      return await res.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["/api/games"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/all-team-selections"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/all-tickets"] });
      
      toast({
        title: "Round Bloccato",
        description: data.autoAssigned > 0 ? 
          `Round bloccato. ${data.autoAssigned} selezioni assegnate automaticamente.` :
          "Round bloccato con successo",
      });
    },
    onError: (error: Error, variables) => {
      if (error.message.includes("requiresConfirmation")) {
        const confirmResult = window.confirm(
          "Alcuni giocatori non hanno fatto le selezioni. Vuoi continuare? Le squadre mancanti verranno assegnate automaticamente."
        );
        if (confirmResult) {
          lockRoundMutation.mutate({ gameId: variables.gameId, forceConfirm: true });
        }
      } else {
        toast({
          title: "Errore",
          description: error.message,
          variant: "destructive",
        });
      }
    },
  });



  const deleteGameMutation = useMutation({
    mutationFn: async (gameId: number) => {
      const res = await apiRequest("DELETE", `/api/games/${gameId}`);
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/games"] });
      toast({
        title: "Successo",
        description: "Gioco eliminato con successo",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Errore",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleLogout = () => {
    logoutMutation.mutate();
  };

  const onCreateGame = (data: CreateGameData) => {
    createGameMutation.mutate(data);
  };

  const handleCloseRegistration = (gameId: number) => {
    closeRegistrationMutation.mutate(gameId);
  };

  const handleCalculateTurn = (game: Game) => {
    setSelectedGameForCalculation(game);
    setShowMatchResults(true);
  };

  const handleAssignTickets = (gameId: number) => {
    setSelectedGameId(gameId);
    setTicketDialogOpen(true);
  };

  const handleDeleteGame = (gameId: number) => {
    if (confirm("Sei sicuro di voler eliminare questo gioco? Questa azione non può essere annullata e rimuoverà tutti i ticket e le selezioni associate.")) {
      deleteGameMutation.mutate(gameId);
    }
  };

  const handleExcelUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const formData = new FormData();
    formData.append('calendar', file);

    try {
      const res = await fetch("/api/admin/excel-calendar", {
        method: "POST",
        body: formData,
        credentials: 'include'
      });

      if (res.ok) {
        toast({
          title: "Successo",
          description: "Calendario Excel aggiornato con successo",
        });
        
        // Refresh data
        queryClient.invalidateQueries({ queryKey: ["/api/games"] });
      } else {
        throw new Error("Upload failed");
      }
    } catch (error) {
      toast({
        title: "Errore",
        description: "Errore durante l'upload del file Excel",
        variant: "destructive",
      });
    }

    // Reset input
    event.target.value = '';
  };

  if (gamesLoading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  const totalGames = games?.length || 0;
  const activeGames = games?.filter(g => g.status === "active").length || 0;
  const registrationGames = games?.filter(g => g.status === "registration").length || 0;

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Deadline Setting Dialog */}
      <DeadlineSetter
        isOpen={deadlineDialogOpen}
        onClose={() => {
          setDeadlineDialogOpen(false);
          setSelectedGameForDeadline(null);
          setNewRoundWithDeadline(false);
        }}
        onSetDeadline={(deadline) => {
          if (selectedGameForDeadline) {
            if (newRoundWithDeadline) {
              // Per il nuovo round, prima avvia il round poi imposta la deadline
              startNewRoundMutation.mutate(selectedGameForDeadline.id, {
                onSuccess: () => {
                  // Dopo aver avviato il nuovo round, imposta la deadline
                  setDeadlineMutation.mutate({
                    gameId: selectedGameForDeadline.id,
                    deadline
                  });
                }
              });
            } else {
              // Solo imposta la deadline
              setDeadlineMutation.mutate({
                gameId: selectedGameForDeadline.id,
                deadline
              });
            }
          }
        }}
        currentDeadline={selectedGameForDeadline?.selectionDeadline ? new Date(selectedGameForDeadline.selectionDeadline).toISOString() : null}
        isLoading={setDeadlineMutation.isPending}
      />

      {/* Match Results Dialog */}
      <Dialog open={showMatchResults} onOpenChange={setShowMatchResults}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Risultati Serie A - Giornata {selectedGameForCalculation?.currentRound}</DialogTitle>
            <DialogDescription>
              Inserisci i risultati delle partite per calcolare la giornata del gioco "{selectedGameForCalculation?.name}"
            </DialogDescription>
          </DialogHeader>
          <MatchResultsForm 
            game={selectedGameForCalculation} 
            onComplete={() => {
              if (selectedGameForCalculation) {
                calculateTurnMutation.mutate(selectedGameForCalculation.id);
              }
            }}
            onCancel={() => setShowMatchResults(false)}
          />
        </DialogContent>
      </Dialog>

      {/* Navigation Header */}
      <nav className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <h1 className="text-xl font-bold text-primary">Highlander Admin</h1>
            </div>
            <div className="flex items-center space-x-4">
              <Dialog open={createGameOpen} onOpenChange={setCreateGameOpen}>
                <DialogTrigger asChild>
                  <Button>
                    <Plus className="h-4 w-4 mr-2" />
                    Crea Gioco
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-[425px]">
                  <DialogHeader>
                    <DialogTitle>Crea Nuovo Gioco</DialogTitle>
                    <DialogDescription>
                      Imposta un nuovo gioco Highlander per i giocatori.
                    </DialogDescription>
                  </DialogHeader>
                  <Form {...createGameForm}>
                    <form onSubmit={createGameForm.handleSubmit(onCreateGame)} className="space-y-4">
                      <FormField
                        control={createGameForm.control}
                        name="name"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Nome Gioco</FormLabel>
                            <FormControl>
                              <Input placeholder="Inserisci nome gioco" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={createGameForm.control}
                        name="startRound"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Giornata Iniziale (Serie A)</FormLabel>
                            <Select onValueChange={(value) => field.onChange(parseInt(value))} defaultValue={field.value?.toString()}>
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Seleziona giornata iniziale" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                {Array.from({ length: 38 }, (_, i) => i + 1).map((round) => (
                                  <SelectItem key={round} value={round.toString()}>
                                    Giornata {round}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={createGameForm.control}
                        name="description"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Descrizione (opzionale)</FormLabel>
                            <FormControl>
                              <Textarea placeholder="Aggiungi una descrizione..." {...field} value={field.value || ''} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <div className="flex justify-end space-x-2">
                        <Button type="button" variant="outline" onClick={() => setCreateGameOpen(false)}>
                          Annulla
                        </Button>
                        <Button type="submit" disabled={createGameMutation.isPending}>
                          {createGameMutation.isPending ? "Creando..." : "Crea Gioco"}
                        </Button>
                      </div>
                    </form>
                  </Form>
                </DialogContent>
              </Dialog>
              
              <div className="flex items-center space-x-2">
                <User className="h-4 w-4" />
                <span className="text-sm font-medium">{user?.username}</span>
              </div>
              
              <Button variant="outline" size="sm" onClick={handleLogout}>
                <LogOut className="h-4 w-4 mr-2" />
                Logout
              </Button>
            </div>
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <div className="p-3 rounded-full bg-primary/10">
                  <Gamepad2 className="h-6 w-6 text-primary" />
                </div>
                <div className="ml-4">
                  <div className="text-2xl font-bold text-gray-900">{totalGames}</div>
                  <div className="text-sm text-gray-600">Giochi Totali</div>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <div className="p-3 rounded-full bg-secondary/10">
                  <Play className="h-6 w-6 text-secondary" />
                </div>
                <div className="ml-4">
                  <div className="text-2xl font-bold text-gray-900">{activeGames}</div>
                  <div className="text-sm text-gray-600">Giochi Attivi</div>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <div className="p-3 rounded-full bg-warning/10">
                  <Users className="h-6 w-6 text-warning" />
                </div>
                <div className="ml-4">
                  <div className="text-2xl font-bold text-gray-900">{registrationGames}</div>
                  <div className="text-sm text-gray-600">In Registrazione</div>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <div className="p-3 rounded-full bg-accent/10">
                  <TicketIcon className="h-6 w-6 text-accent" />
                </div>
                <div className="ml-4">
                  <div className="text-2xl font-bold text-gray-900">{users?.filter(u => !u.isAdmin).length || 0}</div>
                  <div className="text-sm text-gray-600">Giocatori Registrati</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Admin Dashboard with Tabs */}
        <Tabs defaultValue="games" className="w-full">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="games">Gestione Giochi</TabsTrigger>
            <TabsTrigger value="history">Storico Giocatori</TabsTrigger>
            <TabsTrigger value="selections">Scelte Squadre</TabsTrigger>
            <TabsTrigger value="tickets">Ticket Giocatori</TabsTrigger>
            <TabsTrigger value="overview">Panoramica</TabsTrigger>
          </TabsList>

          <TabsContent value="games" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Gestione Giochi</CardTitle>
              </CardHeader>
              <CardContent>
                {!games || games.length === 0 ? (
                  <div className="text-center py-8">
                    <Gamepad2 className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">Nessun Gioco Creato</h3>
                    <p className="text-gray-500 mb-4">Crea il tuo primo gioco Highlander per iniziare.</p>
                    <Button onClick={() => setCreateGameOpen(true)}>
                      <Plus className="h-4 w-4 mr-2" />
                      Crea Gioco
                    </Button>
                  </div>
                ) : (
                  <ModernTable
                    data={games}
                    columns={[
                      { key: 'name', label: 'Nome Gioco', sortable: true },
                      { key: 'status', label: 'Stato', sortable: true, align: 'center' },
                      { key: 'currentRound', label: 'Giornata', sortable: true, align: 'center' },
                      { key: 'createdAt', label: 'Creato', sortable: true, align: 'center' },
                      { key: 'actions', label: 'Azioni', sortable: false }
                    ]}
                    renderCell={(game, columnKey) => {
                      switch (columnKey) {
                        case 'name':
                          return (
                            <div>
                              <div className="font-medium">{game.name}</div>
                              {game.description && (
                                <div className="text-sm text-gray-500">{game.description}</div>
                              )}
                            </div>
                          );
                        case 'status':
                          return <StatusBadge status={game.status} />;
                        case 'currentRound':
                          return game.status === "registration" ? 
                            <span className="text-gray-500">Non Iniziato</span> : 
                            <span className="font-mono">Giornata {game.currentRound}</span>;
                        case 'createdAt':
                          return <span className="text-sm">{new Date(game.createdAt).toLocaleDateString('it-IT')}</span>;
                        case 'actions':
                          return (
                            <div className="flex gap-1 flex-wrap">
                              {game.status === "registration" && (
                                <>
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => handleAssignTickets(game.id)}
                                    className="text-xs"
                                  >
                                    <TicketIcon className="h-3 w-3 mr-1" />
                                    Ticket
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant="destructive"
                                    onClick={() => handleCloseRegistration(game.id)}
                                    disabled={closeRegistrationMutation.isPending}
                                    className="text-xs"
                                  >
                                    Chiudi
                                  </Button>
                                </>
                              )}
                              {game.status === "active" && (
                                <>
                                  {game.roundStatus === "selection_open" && (
                                    <>
                                      <Button
                                        size="sm"
                                        variant="outline"
                                        onClick={() => {
                                          setSelectedGameForDeadline(game);
                                          setDeadlineDialogOpen(true);
                                        }}
                                        className="text-xs"
                                      >
                                        <Clock className="h-3 w-3 mr-1" />
                                        Deadline
                                      </Button>
                                      <Button
                                        size="sm"
                                        variant="outline"
                                        onClick={() => lockRoundMutation.mutate({ gameId: game.id })}
                                        disabled={lockRoundMutation.isPending}
                                        className="text-xs"
                                      >
                                        <Shield className="h-3 w-3 mr-1" />
                                        Blocca
                                      </Button>
                                    </>
                                  )}
                                  {game.roundStatus === "selection_locked" && (
                                    <Button
                                      size="sm"
                                      onClick={() => handleCalculateTurn(game)}
                                      disabled={calculateTurnMutation.isPending}
                                      className="text-xs"
                                    >
                                      <Calculator className="h-3 w-3 mr-1" />
                                      Calcola
                                    </Button>
                                  )}
                                  {game.roundStatus === "calculated" && (
                                    <Button
                                      size="sm"
                                      variant="default"
                                      onClick={() => {
                                        setSelectedGameForDeadline(game);
                                        setNewRoundWithDeadline(true);
                                        setDeadlineDialogOpen(true);
                                      }}
                                      disabled={startNewRoundMutation.isPending}
                                      className="text-xs"
                                    >
                                      <Play className="h-3 w-3 mr-1" />
                                      Nuovo Round
                                    </Button>
                                  )}
                                </>
                              )}
                              <Button 
                                size="sm" 
                                variant="outline"
                                onClick={() => handleDeleteGame(game.id)}
                                disabled={deleteGameMutation.isPending}
                                className="text-xs text-red-600 hover:text-red-700"
                              >
                                <Trash2 className="h-3 w-3" />
                              </Button>
                            </div>
                          );
                        default:
                          return '';
                      }
                    }}
                    searchFields={['name', 'description']}
                    searchPlaceholder="Cerca gioco..."
                    defaultSortKey="createdAt"
                    defaultSortDirection="desc"
                    tabKey="games"
                  />
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="history" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Storico Completo Giocatori</CardTitle>
                <p className="text-sm text-gray-600 mt-2">
                  Visualizzazione dettagliata dello storico di ogni giocatore per ogni ticket in tutti i giochi
                </p>
              </CardHeader>
              <CardContent>
                {games && games.length > 0 && allTickets && allTeamSelections && teams && users ? (
                  <div className="space-y-8">
                    {games.map((game) => (
                      <PlayerHistoryTable 
                        key={`${game.id}-${game.currentRound}-${game.roundStatus}`} 
                        game={game} 
                        allTickets={allTickets} 
                        allTeamSelections={allTeamSelections} 
                        teams={teams}
                        users={users}
                      />
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <Trophy className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">Nessun Gioco</h3>
                    <p className="text-gray-500">Crea un gioco per visualizzare lo storico dei giocatori.</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="selections" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Tutte le Scelte delle Squadre</CardTitle>
              </CardHeader>
              <CardContent>
                {allTeamSelections && Array.isArray(allTeamSelections) ? (
                  <div className="space-y-6">
                    {allTeamSelections.map((gameData: any) => {
                      // Prepare data for ModernTable with round-specific status
                      const tableData = gameData.selections ? gameData.selections.map((selection: any) => {
                        const ticket = allTickets?.find(t => t.id === selection.ticketId);
                        const user = users?.find(u => u.id === ticket?.userId);
                        const game = games?.find(g => g.id === gameData.game.id);
                        
                        // Calculate round-specific status with winner support
                        let roundStatus: "Vincitore" | "Attivo" | "Superato" | "Eliminato" = "Attivo";
                        if (!ticket || !game) {
                          roundStatus = "Eliminato";
                        } else {
                          // Check if ticket was eliminated
                          if (!ticket.isActive) {
                            roundStatus = "Eliminato";
                          }
                          // Check if ticket was eliminated in this specific round
                          else if (ticket.eliminatedInRound && ticket.eliminatedInRound <= selection.round) {
                            roundStatus = "Eliminato";
                          }
                          // Check if game is completed, ticket is active, and this is the final round
                          else if (game.status === 'completed' && ticket.isActive && selection.round === game.currentRound) {
                            roundStatus = "Vincitore";
                          }
                          // Check if this is current round and not calculated yet
                          else if (selection.round === game.currentRound && game.roundStatus !== "calculated") {
                            roundStatus = "Attivo";
                          }
                          // If round is completed (passed)
                          else if (selection.round < game.currentRound || (selection.round === game.currentRound && game.roundStatus === "calculated")) {
                            roundStatus = "Superato";
                          }
                        }
                        
                        return {
                          selectionId: selection.id,
                          ticketId: selection.ticketId,
                          username: user?.username || 'N/A',
                          ticketDisplay: `#${selection.ticketId}`,
                          round: selection.round,
                          teamName: teams?.find(t => t.id === selection.teamId)?.name || `Team ${selection.teamId}`,
                          teamId: selection.teamId,
                          status: roundStatus,
                          statusSortOrder: roundStatus === "Vincitore" ? 0 : roundStatus === "Attivo" ? 1 : roundStatus === "Superato" ? 2 : 3,
                          isActive: ticket?.isActive || false
                        };
                      }) : [];

                      return (
                        <div key={gameData.game.id}>
                          <h3 className="text-lg font-semibold mb-4">
                            {gameData.game.name} - Giornata {gameData.game.currentRound}
                          </h3>
                          <ModernTable
                            data={tableData}
                            columns={[
                              { key: 'username', label: 'Giocatore', sortable: true },
                              { key: 'ticketDisplay', label: 'Ticket', sortable: true },
                              { key: 'round', label: 'Giornata', sortable: true, align: 'center' as const },
                              { key: 'teamName', label: 'Squadra Scelta', sortable: true },
                              { key: 'status', label: 'Stato Ticket', sortable: true, align: 'center' as const }
                            ]}
                            renderCell={(item, columnKey) => {
                              switch (columnKey) {
                                case 'username':
                                  return <span className="font-medium">{item.username}</span>;
                                case 'ticketDisplay':
                                  return <span className="font-mono text-blue-600">{item.ticketDisplay}</span>;
                                case 'round':
                                  return <span className="font-mono">Giornata {item.round}</span>;
                                case 'teamName':
                                  return (
                                    <div className="flex items-center space-x-2">
                                      {teams?.find(t => t.id === item.teamId) && (
                                        <TeamLogo team={teams.find(t => t.id === item.teamId)!} size="sm" />
                                      )}
                                      <span>{item.teamName}</span>
                                    </div>
                                  );
                                case 'status':
                                  return <StatusBadge status={item.status} />;
                                default:
                                  return '';
                              }
                            }}
                            searchFields={['username', 'teamName']}
                            searchPlaceholder="Cerca giocatore o squadra..."
                            defaultSortKey="statusSortOrder"
                            defaultSortDirection="asc"
                            tabKey={`admin-selections-${gameData.game.id}`}
                            emptyMessage="Nessuna selezione trovata"
                          />
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <p className="text-gray-500">Caricamento scelte squadre...</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="tickets" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Tutti i Ticket dei Giocatori</CardTitle>
                <CardDescription>
                  Visualizza e ordina tutti i ticket per stato, giocatore e gioco. 
                  Stati: Vincitore, Attivo, Superato, Eliminato
                </CardDescription>
              </CardHeader>
              <CardContent>
                {allTickets && games ? (
                  <ModernTable
                    data={allTickets.map((ticket: any) => {
                      const game = games.find(g => g.id === ticket.gameId);
                      const enhancedTickets = game ? enhanceTicketsWithStatus([ticket], game) : [];
                      const enhancedTicket = enhancedTickets[0] || ticket;
                      
                      return {
                        ...ticket,
                        ...enhancedTicket,
                        gameName: ticket.game?.name || 'N/A',
                        username: ticket.user?.username || 'N/A',
                        statusSortOrder: enhancedTicket.status ? getStatusSortOrder(enhancedTicket.status) : 99
                      };
                    })}
                    columns={[
                      { key: 'id', label: 'ID Ticket', sortable: true, width: '100px' },
                      { key: 'username', label: 'Giocatore', sortable: true },
                      { key: 'gameName', label: 'Gioco', sortable: true },
                      { key: 'status', label: 'Stato', sortable: true, align: 'center' },
                      { key: 'eliminatedInRound', label: 'Giornata Eliminazione', sortable: true, align: 'center' },
                      { key: 'actions', label: 'Azioni', sortable: false, align: 'center', width: '100px' }
                    ]}
                    renderCell={(ticket, columnKey) => {
                      switch (columnKey) {
                        case 'id':
                          return <span className="font-mono text-blue-600">#{ticket.id}</span>;
                        case 'username':
                          return <span className="font-medium">{ticket.username}</span>;
                        case 'gameName':
                          return ticket.gameName;
                        case 'status':
                          return <StatusBadge status={ticket.status || 'active'} />;
                        case 'eliminatedInRound':
                          return ticket.eliminatedInRound ? 
                            <span className="font-mono">Giornata {ticket.eliminatedInRound}</span> : 
                            <span className="text-gray-400">—</span>;
                        case 'actions':
                          const game = games.find(g => g.id === ticket.gameId);
                          const canDelete = game && game.status === 'registration';
                          return canDelete ? (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                if (window.confirm(`Vuoi eliminare il ticket #${ticket.id} di ${ticket.username}?`)) {
                                  deleteTicketMutation.mutate(ticket.id);
                                }
                              }}
                              disabled={deleteTicketMutation.isPending}
                              className="text-red-600 hover:bg-red-50 border-red-200"
                            >
                              {deleteTicketMutation.isPending ? "..." : "Elimina"}
                            </Button>
                          ) : (
                            <span className="text-gray-400 text-xs">Non eliminabile</span>
                          );
                        default:
                          return '';
                      }
                    }}
                    defaultSortKey="status"
                    defaultSortDirection="asc"
                    customSortFn={(a, b, key, direction) => {
                      if (key === 'status') {
                        const aOrder = a.statusSortOrder || 99;
                        const bOrder = b.statusSortOrder || 99;
                        return direction === 'asc' ? aOrder - bOrder : bOrder - aOrder;
                      }
                      return 0;
                    }}
                    searchFields={['username', 'gameName']}
                    searchPlaceholder="Cerca per giocatore o gioco..."
                    emptyMessage="Nessun ticket trovato"
                    tabKey="tickets"
                  />
                ) : (
                  <div className="text-center py-8">
                    <p className="text-gray-500">Caricamento ticket...</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="overview" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Panoramica Generale</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="text-center p-4 bg-blue-50 rounded-lg">
                    <div className="text-2xl font-bold text-blue-600">{totalGames}</div>
                    <div className="text-sm text-blue-700">Giochi Totali</div>
                  </div>
                  <div className="text-center p-4 bg-green-50 rounded-lg">
                    <div className="text-2xl font-bold text-green-600">{activeGames}</div>
                    <div className="text-sm text-green-700">Giochi Attivi</div>
                  </div>
                  <div className="text-center p-4 bg-yellow-50 rounded-lg">
                    <div className="text-2xl font-bold text-yellow-600">{registrationGames}</div>
                    <div className="text-sm text-yellow-700">In Registrazione</div>
                  </div>
                </div>

                {/* Serie A Calendar Management */}
                <div className="mt-6">
                  <h4 className="text-lg font-medium mb-4">Gestione Calendario Serie A</h4>
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <p className="text-sm text-gray-600 mb-4">
                      Scarica il file Excel del calendario Serie A 2024/2025 per modificarlo manualmente.
                      Puoi aggiornare date, orari e risultati delle partite.
                    </p>
                    <div className="flex space-x-2">
                      <Button 
                        variant="outline" 
                        onClick={() => window.open('/api/admin/excel-calendar', '_blank')}
                      >
                        <Trophy className="h-4 w-4 mr-2" />
                        Scarica Calendario Excel
                      </Button>
                      <Button 
                        variant="outline"
                        onClick={() => document.getElementById('excel-upload')?.click()}
                      >
                        <Target className="h-4 w-4 mr-2" />
                        Carica Calendario Modificato
                      </Button>
                    </div>
                    <input
                      id="excel-upload"
                      type="file"
                      accept=".xlsx,.xls"
                      style={{ display: 'none' }}
                      onChange={handleExcelUpload}
                    />
                  </div>
                </div>
                
                {users && (
                  <div className="mt-6">
                    <h4 className="text-lg font-medium mb-4">Utenti Registrati</h4>
                    <ModernTable
                      data={users}
                      columns={[
                        { key: 'username', label: 'Username', sortable: true },
                        { key: 'id', label: 'ID', sortable: true, width: '80px', align: 'center' },
                        { key: 'isAdmin', label: 'Ruolo', sortable: true, align: 'center' }
                      ]}
                      renderCell={(user, columnKey) => {
                        switch (columnKey) {
                          case 'username':
                            return <span className="font-medium">{user.username}</span>;
                          case 'id':
                            return <span className="font-mono text-blue-600">#{user.id}</span>;
                          case 'isAdmin':
                            return (
                              <Badge variant={user.isAdmin ? "default" : "secondary"}>
                                {user.isAdmin ? "Admin" : "Giocatore"}
                              </Badge>
                            );
                          default:
                            return '';
                        }
                      }}
                      searchFields={['username']}
                      searchPlaceholder="Cerca utente..."
                      defaultSortKey="username"
                      compact={true}
                      tabKey="overview-users"
                    />
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Ticket Assignment Dialog */}
        <Dialog open={ticketDialogOpen} onOpenChange={setTicketDialogOpen}>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>Assegna Ticket</DialogTitle>
              <DialogDescription>
                Assegna ticket ai giocatori per questo gioco. I giocatori devono essere registrati per ricevere ticket.
              </DialogDescription>
            </DialogHeader>
            <TicketAssignmentForm 
              gameId={selectedGameId}
              users={users || []}
              onAssign={assignTicketMutation.mutate}
              isPending={assignTicketMutation.isPending}
              onClose={() => setTicketDialogOpen(false)}
            />
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}

function GameStatusBadge({ status }: { status: string }) {
  switch (status) {
    case "active":
      return <Badge className="bg-green-600 text-white">Attivo</Badge>;
    case "completed":
      return <Badge variant="secondary">Completato</Badge>;
    case "registration":
      return <Badge className="bg-yellow-600 text-white">Registrazione Aperta</Badge>;
    default:
      return <Badge variant="outline">{status}</Badge>;
  }
}