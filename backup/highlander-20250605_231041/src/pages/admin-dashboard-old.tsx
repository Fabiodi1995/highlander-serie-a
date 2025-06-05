import { useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { User, LogOut, Plus, Gamepad2, Play, Users, TicketIcon, Calculator, Settings, Trash2, Trophy, Target } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { insertGameSchema } from "@shared/schema";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
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
    const score = parseInt(value) || 0;
    setMatchResults(prev => ({
      ...prev,
      [matchId]: {
        ...prev[matchId],
        [type === 'home' ? 'homeScore' : 'awayScore']: score
      }
    }));
  };

  const handleSubmitResults = async () => {
    if (!matches) return;
    
    try {
      for (const match of matches) {
        const result = matchResults[match.id];
        if (result && (result.homeScore >= 0 && result.awayScore >= 0)) {
          await updateMatchResultMutation.mutateAsync({
            matchId: match.id,
            homeScore: result.homeScore,
            awayScore: result.awayScore
          });
        }
      }
      
      toast({
        title: "Successo",
        description: "Risultati inseriti correttamente",
      });
      
      onComplete();
    } catch (error) {
      console.error("Error submitting results:", error);
    }
  };

  if (!matches) {
    return <div className="text-center py-4">Caricamento partite...</div>;
  }

  return (
    <div className="space-y-4">
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
              </div>
              <div className="flex items-center space-x-2">
                <Input
                  type="number"
                  min="0"
                  max="20"
                  placeholder="0"
                  className="w-16 text-center"
                  value={matchResults[match.id]?.homeScore || ''}
                  onChange={(e) => handleScoreChange(match.id, 'home', e.target.value)}
                />
                <span>-</span>
                <Input
                  type="number"
                  min="0"
                  max="20"
                  placeholder="0"
                  className="w-16 text-center"
                  value={matchResults[match.id]?.awayScore || ''}
                  onChange={(e) => handleScoreChange(match.id, 'away', e.target.value)}
                />
              </div>
            </div>
          </Card>
        ))}
      </div>
      
      <div className="flex justify-end space-x-2 pt-4">
        <Button variant="outline" onClick={onCancel}>
          Annulla
        </Button>
        <Button 
          onClick={handleSubmitResults}
          disabled={updateMatchResultMutation.isPending}
        >
          {updateMatchResultMutation.isPending ? "Salvando..." : "Salva Risultati e Calcola"}
        </Button>
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
  const [ticketCount, setTicketCount] = useState<string>("1");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!gameId || !selectedUserId || !ticketCount) return;

    onAssign({
      gameId,
      userId: parseInt(selectedUserId),
      count: parseInt(ticketCount)
    });
  };

  // Filter out admin users for player assignment
  const playerUsers = users.filter(user => !user.isAdmin);

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="user">Select Player</Label>
        <Select value={selectedUserId} onValueChange={setSelectedUserId}>
          <SelectTrigger>
            <SelectValue placeholder="Choose a player..." />
          </SelectTrigger>
          <SelectContent>
            {playerUsers.map((user) => (
              <SelectItem key={user.id} value={user.id.toString()}>
                {user.username}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label htmlFor="count">Number of Tickets</Label>
        <Input
          id="count"
          type="number"
          min="1"
          max="10"
          value={ticketCount}
          onChange={(e) => setTicketCount(e.target.value)}
          placeholder="Enter number of tickets"
        />
      </div>

      <div className="flex justify-end space-x-2">
        <Button type="button" variant="outline" onClick={onClose}>
          Cancel
        </Button>
        <Button 
          type="submit" 
          disabled={isPending || !selectedUserId || !ticketCount}
        >
          {isPending ? "Assigning..." : "Assign Tickets"}
        </Button>
      </div>
    </form>
  );
}

export default function AdminDashboard() {
  const { user, logoutMutation } = useAuth();
  const { toast } = useToast();
  const [createGameOpen, setCreateGameOpen] = useState(false);
  const [ticketDialogOpen, setTicketDialogOpen] = useState(false);
  const [selectedGameId, setSelectedGameId] = useState<number | null>(null);

  const { data: games, isLoading: gamesLoading } = useQuery<Game[]>({
    queryKey: ["/api/games"],
  });

  const { data: users } = useQuery<UserType[]>({
    queryKey: ["/api/users"],
  });

  const { data: teams } = useQuery<Team[]>({
    queryKey: ["/api/teams"],
  });

  const { data: allTeamSelections } = useQuery<any[]>({
    queryKey: ["/api/admin/all-team-selections"],
  });

  const { data: allTickets } = useQuery<any[]>({
    queryKey: ["/api/admin/all-tickets"],
  });

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
        title: "Success",
        description: "Game created successfully",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
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
        title: "Success",
        description: "Registration closed, game started",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const [selectedGameForCalculation, setSelectedGameForCalculation] = useState<Game | null>(null);
  const [showMatchResults, setShowMatchResults] = useState(false);

  const calculateTurnMutation = useMutation({
    mutationFn: async (gameId: number) => {
      const res = await apiRequest("POST", `/api/games/${gameId}/calculate-turn`);
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/games"] });
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

  const assignTicketMutation = useMutation({
    mutationFn: async ({ gameId, userId, count }: { gameId: number; userId: number; count: number }) => {
      const res = await apiRequest("POST", `/api/games/${gameId}/tickets`, { userId, count });
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/games"] });
      setTicketDialogOpen(false);
      toast({
        title: "Success",
        description: "Tickets assigned successfully",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
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
        title: "Success",
        description: "Game deleted successfully",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
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
    if (confirm("Are you sure you want to delete this game? This action cannot be undone and will remove all associated tickets and selections.")) {
      deleteGameMutation.mutate(gameId);
    }
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
                    Create Game
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-[425px]">
                  <DialogHeader>
                    <DialogTitle>Create New Game</DialogTitle>
                    <DialogDescription>
                      Set up a new Highlander game for players to join.
                    </DialogDescription>
                  </DialogHeader>
                  <Form {...createGameForm}>
                    <form onSubmit={createGameForm.handleSubmit(onCreateGame)} className="space-y-4">
                      <FormField
                        control={createGameForm.control}
                        name="name"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Game Name</FormLabel>
                            <FormControl>
                              <Input placeholder="Enter game name" {...field} />
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
                            <FormLabel>Start Round (Serie A Giornata)</FormLabel>
                            <Select onValueChange={(value) => field.onChange(parseInt(value))} defaultValue={field.value?.toString()}>
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Select starting round" />
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
                            <FormLabel>Description (Optional)</FormLabel>
                            <FormControl>
                              <Textarea 
                                placeholder="Optional game description..." 
                                className="resize-none"
                                {...field} 
                                value={field.value || ""}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <div className="flex justify-end space-x-2">
                        <Button type="button" variant="outline" onClick={() => setCreateGameOpen(false)}>
                          Cancel
                        </Button>
                        <Button type="submit" disabled={createGameMutation.isPending}>
                          {createGameMutation.isPending ? "Creating..." : "Create Game"}
                        </Button>
                      </div>
                    </form>
                  </Form>
                </DialogContent>
              </Dialog>
              
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
                  <div className="text-sm text-gray-600">Total Games</div>
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
                  <div className="text-sm text-gray-600">Active Games</div>
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
                  <div className="text-sm text-gray-600">Registration Open</div>
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
                  <div className="text-sm text-gray-600">Registered Players</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Admin Dashboard with Tabs */}
        <Tabs defaultValue="games" className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="games">Gestione Giochi</TabsTrigger>
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
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Nome Gioco</TableHead>
                          <TableHead>Stato</TableHead>
                          <TableHead>Giornata Corrente</TableHead>
                          <TableHead>Creato</TableHead>
                          <TableHead>Azioni</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {games.map((game) => (
                          <TableRow key={game.id}>
                            <TableCell>
                              <div>
                                <div className="font-medium">{game.name}</div>
                                {game.description && (
                                  <div className="text-sm text-gray-500">{game.description}</div>
                                )}
                              </div>
                            </TableCell>
                            <TableCell>
                              <GameStatusBadge status={game.status} />
                            </TableCell>
                            <TableCell>
                              {game.status === "registration" ? "Non Iniziato" : `Giornata ${game.currentRound}`}
                            </TableCell>
                            <TableCell>
                              {new Date(game.createdAt).toLocaleDateString()}
                            </TableCell>
                            <TableCell>
                              <div className="flex space-x-2">
                                {game.status === "registration" && (
                                  <>
                                    <Button
                                      size="sm"
                                      variant="outline"
                                      onClick={() => handleAssignTickets(game.id)}
                                    >
                                      <TicketIcon className="h-4 w-4 mr-1" />
                                      Assegna Ticket
                                    </Button>
                                    <Button
                                      size="sm"
                                      variant="destructive"
                                      onClick={() => handleCloseRegistration(game.id)}
                                      disabled={closeRegistrationMutation.isPending}
                                    >
                                      Chiudi Registrazioni
                                    </Button>
                                  </>
                                )}
                                {game.status === "active" && (
                                  <Button
                                    size="sm"
                                    onClick={() => handleCalculateTurn(game)}
                                    disabled={calculateTurnMutation.isPending}
                                  >
                                    <Calculator className="h-4 w-4 mr-1" />
                                    Calcola Giornata
                                  </Button>
                                )}
                                <Button 
                                  size="sm" 
                                  variant="outline"
                                  onClick={() => handleDeleteGame(game.id)}
                                  disabled={deleteGameMutation.isPending}
                                >
                                  <Trash2 className="h-4 w-4 mr-1" />
                                  Elimina
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
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
                {allTeamSelections ? (
                  <div className="space-y-6">
                    {allTeamSelections.map((gameData: any) => (
                      <div key={gameData.game.id}>
                        <h3 className="text-lg font-semibold mb-4">
                          {gameData.game.name} - Giornata {gameData.game.currentRound}
                        </h3>
                        <div className="overflow-x-auto">
                          <Table>
                            <TableHeader>
                              <TableRow>
                                <TableHead>Giocatore</TableHead>
                                <TableHead>Ticket</TableHead>
                                <TableHead>Giornata</TableHead>
                                <TableHead>Squadra Scelta</TableHead>
                                <TableHead>Stato Ticket</TableHead>
                              </TableRow>
                            </TableHeader>
                            <TableBody>
                              {gameData.tickets.map((ticketData: any) => 
                                ticketData.selections.map((selection: any) => (
                                  <TableRow key={`${ticketData.ticket.id}-${selection.id}`}>
                                    <TableCell>{ticketData.user?.username}</TableCell>
                                    <TableCell>#{ticketData.ticket.id}</TableCell>
                                    <TableCell>{selection.round}</TableCell>
                                    <TableCell>
                                      {teams?.find(t => t.id === selection.teamId)?.name || `Team ${selection.teamId}`}
                                    </TableCell>
                                    <TableCell>
                                      <Badge variant={ticketData.ticket.isActive ? "default" : "destructive"}>
                                        {ticketData.ticket.isActive ? "Attivo" : "Eliminato"}
                                      </Badge>
                                    </TableCell>
                                  </TableRow>
                                ))
                              )}
                            </TableBody>
                          </Table>
                        </div>
                      </div>
                    ))}
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
              </CardHeader>
              <CardContent>
                {allTickets ? (
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Ticket ID</TableHead>
                          <TableHead>Giocatore</TableHead>
                          <TableHead>Gioco</TableHead>
                          <TableHead>Stato</TableHead>
                          <TableHead>Round Eliminazione</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {allTickets.map((ticket: any) => (
                          <TableRow key={ticket.id}>
                            <TableCell>#{ticket.id}</TableCell>
                            <TableCell>{ticket.user?.username}</TableCell>
                            <TableCell>{ticket.game?.name}</TableCell>
                            <TableCell>
                              <Badge variant={ticket.isActive ? "default" : "destructive"}>
                                {ticket.isActive ? "Attivo" : "Eliminato"}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              {ticket.eliminatedRound || "N/A"}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
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
                
                {users && (
                  <div className="mt-6">
                    <h4 className="text-lg font-medium mb-4">Utenti Registrati</h4>
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Username</TableHead>
                          <TableHead>ID</TableHead>
                          <TableHead>Admin</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {users.map((user) => (
                          <TableRow key={user.id}>
                            <TableCell>{user.username}</TableCell>
                            <TableCell>#{user.id}</TableCell>
                            <TableCell>
                              <Badge variant={user.isAdmin ? "default" : "secondary"}>
                                {user.isAdmin ? "Admin" : "Giocatore"}
                              </Badge>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
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
              <DialogTitle>Assign Tickets</DialogTitle>
              <DialogDescription>
                Assign tickets to players for this game. Players must be registered to receive tickets.
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
      return <Badge className="bg-secondary text-white">Active</Badge>;
    case "completed":
      return <Badge variant="secondary">Completed</Badge>;
    case "registration":
      return <Badge className="bg-warning text-white">Registration Open</Badge>;
    default:
      return <Badge variant="outline">{status}</Badge>;
  }
}