import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/use-auth";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowLeft, Clock, Info, Target, Shield } from "lucide-react";
import { Link, useParams, useLocation } from "wouter";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { TeamLogo } from "@/components/team-logo";
import type { Game, Ticket, Team, TeamSelection } from "@shared/schema";

export default function GameInterface() {
  const { id } = useParams<{ id: string }>();
  const gameId = id ? parseInt(id) : null;
  const [location] = useLocation();
  const { user } = useAuth();
  const { toast } = useToast();
  const [selections, setSelections] = useState<Record<number, number>>({});
  const [specificTicketId, setSpecificTicketId] = useState<number | null>(null);

  // Extract ticket parameter from URL
  useEffect(() => {
    const urlSearchParams = new URLSearchParams(window.location.search);
    const ticketParam = urlSearchParams.get('ticket');
    if (ticketParam) {
      setSpecificTicketId(parseInt(ticketParam));
    } else {
      setSpecificTicketId(null);
    }
  }, [location]);



  const { data: game } = useQuery<Game>({
    queryKey: [`/api/games/${gameId}`],
    enabled: !!gameId && !isNaN(gameId),
  });

  const { data: tickets } = useQuery<Ticket[]>({
    queryKey: [`/api/games/${gameId}/tickets`],
    enabled: !!gameId && !isNaN(gameId),
  });

  const { data: teams } = useQuery<Team[]>({
    queryKey: ["/api/teams"],
  });

  // Filter tickets based on URL parameter
  const activeTickets = tickets?.filter(t => t.isActive) || [];
  const ticketsToShow = specificTicketId 
    ? activeTickets.filter(t => t.id === specificTicketId)
    : activeTickets;



  const submitSelectionsMutation = useMutation({
    mutationFn: async (teamSelections: Array<{ ticketId: number; teamId: number; round: number; gameId: number }>) => {
      const res = await apiRequest("POST", "/api/team-selections", teamSelections);
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/games/${gameId}/tickets`] });
      queryClient.invalidateQueries({ queryKey: ["/api/user/team-selections"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/all-team-selections"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/all-tickets"] });
      toast({
        title: "Successo",
        description: "Selezioni squadre inviate con successo",
      });
      setSelections({});
    },
    onError: (error: Error) => {
      let errorMessage = error.message;
      if (error.message.includes("does not belong to user")) {
        errorMessage = "Non hai i permessi per modificare questo ticket";
      } else if (error.message.includes("not active")) {
        errorMessage = "Il ticket non è più attivo";
      }
      toast({
        title: "Errore",
        description: errorMessage,
        variant: "destructive",
      });
    },
  });

  const handleSelectionChange = (ticketId: number, teamId: string) => {
    setSelections(prev => ({
      ...prev,
      [ticketId]: parseInt(teamId)
    }));
  };

  const handleSubmitSelections = () => {
    if (!game || !gameId || isNaN(gameId)) {
      toast({
        title: "Errore",
        description: "Dati di gioco non validi",
        variant: "destructive",
      });
      return;
    }

    const teamSelections = Object.entries(selections).map(([ticketId, teamId]) => ({
      ticketId: parseInt(ticketId),
      teamId,
      round: game.currentRound,
      gameId: gameId,
    }));

    if (teamSelections.length !== ticketsToShow.length) {
      toast({
        title: "Errore",
        description: specificTicketId ? "Seleziona una squadra per il ticket" : "Seleziona una squadra per tutti i ticket attivi",
        variant: "destructive",
      });
      return;
    }

    submitSelectionsMutation.mutate(teamSelections);
  };

  if (!game) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  // CRITICAL FIX: Prevent access during registration phase
  if (game.status === "registration") {
    return (
      <div className="min-h-screen bg-slate-50">
        <nav className="bg-white shadow-sm border-b">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center h-16">
              <div className="flex items-center space-x-4">
                <Link href="/">
                  <Button variant="ghost" size="sm">
                    <ArrowLeft className="h-4 w-4" />
                  </Button>
                </Link>
                <h1 className="text-xl font-bold text-primary">{game.name}</h1>
              </div>
              <span className="text-gray-700">{user?.username}</span>
            </div>
          </div>
        </nav>
        
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <Card className="border-orange-200 bg-orange-50">
            <CardHeader>
              <CardTitle className="text-orange-800">Gioco in Fase di Registrazione</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <p className="text-orange-700">
                  Questo gioco è ancora in fase di registrazione. Le selezioni delle squadre non sono ancora disponibili.
                </p>
                <p className="text-orange-600 text-sm">
                  Attendi che l'amministratore avvii il gioco per iniziare a selezionare le squadre.
                </p>
                <div className="pt-4">
                  <Link href="/">
                    <Button variant="outline" className="border-orange-300 text-orange-700 hover:bg-orange-100">
                      Torna alla Dashboard
                    </Button>
                  </Link>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Navigation Header */}
      <nav className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-4">
              <Link href="/">
                <Button variant="ghost" size="sm">
                  <ArrowLeft className="h-4 w-4" />
                </Button>
              </Link>
              <h1 className="text-xl font-bold text-primary">{game.name}</h1>
            </div>
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2 text-sm">
                <Clock className="h-4 w-4 text-accent" />
                <span className="text-gray-600">Selezione Giornata {game.currentRound}</span>
              </div>
              <span className="text-gray-700">{user?.username}</span>
            </div>
          </div>
        </div>
      </nav>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Game Status */}
        <Card className="mb-6">
          <CardHeader>
            <div className="flex justify-between items-center">
              <CardTitle>Giornata {game.currentRound} - Selezione Squadre</CardTitle>
              {game.roundStatus === "selection_open" ? (
                <Badge className="bg-green-600 text-white">
                  <Clock className="h-3 w-3 mr-1" />
                  Selezioni Aperte
                </Badge>
              ) : (
                <Badge className="bg-red-600 text-white">
                  <Shield className="h-3 w-3 mr-1" />
                  Selezioni Bloccate
                </Badge>
              )}
            </div>
          </CardHeader>
          <CardContent>
            {game.roundStatus === "selection_open" ? (
              <p className="text-gray-600">
                Seleziona una squadra per ognuno dei tuoi ticket attivi. Ricorda: non puoi scegliere una squadra 
                che hai già selezionato con quel ticket nelle giornate precedenti.
              </p>
            ) : (
              <p className="text-red-600 font-medium">
                Le selezioni per questa giornata sono state bloccate dall'amministratore. Non è più possibile modificare le scelte.
              </p>
            )}
          </CardContent>
        </Card>

        {/* Show editing mode indicator if specific ticket */}
        {specificTicketId && (
          <Card className="mb-4 border-blue-200 bg-blue-50">
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                <Info className="h-4 w-4 text-blue-600" />
                <span className="text-blue-700 font-medium">
                  Modalità Modifica - Ticket #{specificTicketId}
                </span>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Tickets Selection */}
        {ticketsToShow.length === 0 ? (
          <Card className="text-center p-8">
            <CardContent>
              <Target className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                {specificTicketId ? "Ticket Non Trovato" : "Nessun Ticket Attivo"}
              </h3>
              <p className="text-gray-500">
                {specificTicketId 
                  ? "Il ticket specificato non è disponibile o non è attivo."
                  : "Non hai ticket attivi in questo gioco."
                }
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {ticketsToShow.map((ticket) => (
              <TicketSelectionCard
                key={ticket.id}
                ticket={ticket}
                teams={teams || []}
                selectedTeamId={selections[ticket.id]}
                onSelectionChange={(teamId) => handleSelectionChange(ticket.id, teamId)}
                currentRound={game.currentRound}
                disabled={game.roundStatus !== "selection_open"}
              />
            ))}

            {/* Submit Button */}
            {game.roundStatus === "selection_open" && (
              <div className="flex justify-center pt-6">
                <Button
                  size="lg"
                  onClick={handleSubmitSelections}
                  disabled={
                    submitSelectionsMutation.isPending || 
                    Object.keys(selections).length !== ticketsToShow.length
                  }
                >
                  {submitSelectionsMutation.isPending 
                    ? "Invio in corso..." 
                    : specificTicketId 
                      ? "Conferma Selezione Ticket" 
                      : "Conferma Tutte le Selezioni"}
                </Button>
              </div>
            )}
            
            {game.roundStatus !== "selection_open" && (
              <div className="flex justify-center pt-6">
                <div className="text-center">
                  <p className="text-gray-500 mb-2">Le selezioni sono bloccate per questa giornata</p>
                  <Button size="lg" disabled variant="outline">
                    Selezioni Non Disponibili
                  </Button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

function TicketSelectionCard({ 
  ticket, 
  teams, 
  selectedTeamId, 
  onSelectionChange,
  currentRound,
  disabled = false
}: { 
  ticket: Ticket;
  teams: Team[];
  selectedTeamId?: number;
  onSelectionChange: (teamId: string) => void;
  currentRound: number;
  disabled?: boolean;
}) {
  const { data: allSelections } = useQuery<TeamSelection[]>({
    queryKey: [`/api/tickets/${ticket.id}/selections`],
  });

  // Solo le selezioni dei round precedenti (completati), non il round corrente
  const previousSelections = allSelections?.filter(s => s.round < currentRound) || [];
  const usedTeamIds = new Set(previousSelections.map(s => s.teamId));
  const availableTeams = teams.filter(team => !usedTeamIds.has(team.id));

  const previousTeamNames = previousSelections.length > 0 
    ? previousSelections
        .map(selection => {
          const team = teams.find(t => t.id === selection.teamId);
          return team?.name;
        })
        .filter(Boolean)
        .join(", ")
    : "Nessuna";

  return (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-center">
          <div>
            <CardTitle className="text-lg">Ticket #{ticket.id.toString().padStart(3, '0')}</CardTitle>
            <p className="text-sm text-gray-500">
              Selezioni precedenti: <span className="font-medium">{previousTeamNames}</span>
            </p>
          </div>
          <Badge className="bg-secondary text-white">Attivo</Badge>
        </div>
      </CardHeader>
      <CardContent>
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Seleziona Squadra
          </label>
          <Select 
            value={selectedTeamId?.toString() || ""} 
            onValueChange={disabled ? undefined : onSelectionChange}
            disabled={disabled}
          >
            <SelectTrigger className={`w-full ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}>
              <SelectValue placeholder={disabled ? "Selezioni bloccate" : "Scegli una squadra..."} />
            </SelectTrigger>
            <SelectContent>
              {availableTeams.map((team) => (
                <SelectItem key={team.id} value={team.id.toString()}>
                  <div className="flex items-center gap-2">
                    <TeamLogo team={team} size="sm" />
                    <span>{team.name}</span>
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
          <div className="flex items-center">
            <Info className="h-4 w-4 text-blue-500 mr-2" />
            <span className="text-sm text-blue-700">
              La squadra selezionata deve vincere perché questo ticket sopravviva alla giornata
            </span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
