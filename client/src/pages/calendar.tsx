import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Calendar, 
  ChevronLeft, 
  ChevronRight, 
  Clock, 
  MapPin, 
  Trophy,
  Home,
  ArrowLeft,
  ArrowRight
} from "lucide-react";
import { Link } from "wouter";
import { TeamLogo } from "@/components/team-logo";
import type { Team } from "@shared/schema";

interface Match {
  id: number;
  round: number;
  homeTeamId: number;
  awayTeamId: number;
  homeScore: number;
  awayScore: number;
  matchDate: string;
  isCompleted: boolean;
}

interface DisplayMatch extends Match {
  homeTeam: string;
  awayTeam: string;
  stadium: string;
  matchTime: string;
}

export default function CalendarPage() {
  const [currentPage, setCurrentPage] = useState(1);
  const matchdaysPerPage = 5;
  
  const { data: teams } = useQuery<Team[]>({
    queryKey: ["/api/teams"],
  });

  // Load all matches from database
  const { data: allMatches, isLoading, error } = useQuery<Match[]>({
    queryKey: ["/api/matches/all"],
  });

  // Calendar loaded successfully

  // Get available matchdays from database
  const availableMatchdays = allMatches 
    ? Array.from(new Set(allMatches.map(m => m.round))).sort((a, b) => a - b)
    : [];
  
  // Calculate pagination
  const totalPages = Math.ceil(availableMatchdays.length / matchdaysPerPage);
  const startIndex = (currentPage - 1) * matchdaysPerPage;
  const endIndex = startIndex + matchdaysPerPage;
  const currentMatchdays = availableMatchdays.slice(startIndex, endIndex);

  // Get matches for a specific matchday from database
  const getMatchesForMatchday = (matchday: number): DisplayMatch[] => {
    if (!allMatches || !teams) return [];
    
    const matchdayMatches = allMatches.filter(m => m.round === matchday);
    
    return matchdayMatches.map(match => {
      const homeTeam = teams.find(t => t.id === match.homeTeamId);
      const awayTeam = teams.find(t => t.id === match.awayTeamId);
      
      return {
        ...match,
        homeTeam: homeTeam?.name || 'Unknown',
        awayTeam: awayTeam?.name || 'Unknown',
        stadium: getStadiumByTeam(homeTeam?.name || ''),
        matchTime: getMatchTimeFromDate(match.matchDate)
      };
    }).sort((a, b) => a.matchTime.localeCompare(b.matchTime));
  };

  const getMatchTimeFromDate = (dateString: string): string => {
    const date = new Date(dateString);
    return date.toLocaleTimeString('it-IT', { 
      hour: '2-digit', 
      minute: '2-digit',
      timeZone: 'Europe/Rome'
    });
  };

  const getMatchDate = (matchday: number): string => {
    if (!allMatches) return '';
    
    const matchdayMatches = allMatches.filter(m => m.round === matchday);
    if (matchdayMatches.length > 0) {
      const firstMatch = matchdayMatches[0];
      return new Date(firstMatch.matchDate).toISOString().split('T')[0];
    }
    
    // Fallback per giornate non ancora caricate
    const startDate = new Date('2025-08-24');
    const matchDate = new Date(startDate);
    matchDate.setDate(startDate.getDate() + (matchday - 1) * 7);
    return matchDate.toISOString().split('T')[0];
  };

  const getMatchTime = (matchday: number, matchIndex: number): string => {
    const times = ['15:00', '18:00', '20:45'];
    if (matchday % 7 === 0) { // Sunday matches
      return ['12:30', '15:00', '18:00', '20:45'][matchIndex % 4];
    }
    return times[matchIndex % times.length];
  };

  const getStadiumByTeam = (teamName: string): string => {
    const stadiums: Record<string, string> = {
      'Atalanta': 'Gewiss Stadium',
      'Bologna': 'Stadio Renato Dall\'Ara',
      'Cagliari': 'Unipol Domus',
      'Como': 'Stadio Giuseppe Sinigaglia',
      'Cremonese': 'Stadio Giovanni Zini',
      'Fiorentina': 'Stadio Artemio Franchi',
      'Genoa': 'Stadio Luigi Ferraris',
      'Hellas Verona': 'Stadio Marcantonio Bentegodi',
      'Inter': 'San Siro',
      'Juventus': 'Allianz Stadium',
      'Lazio': 'Stadio Olimpico',
      'Lecce': 'Stadio Via del Mare',
      'Milan': 'San Siro',
      'Napoli': 'Stadio Diego Armando Maradona',
      'Parma': 'Stadio Ennio Tardini',
      'Pisa': 'Arena Garibaldi',
      'Roma': 'Stadio Olimpico',
      'Sassuolo': 'Mapei Stadium',
      'Torino': 'Stadio Olimpico Grande Torino',
      'Udinese': 'Bluenergy Stadium'
    };
    return stadiums[teamName] || 'Stadio TBD';
  };

  const formatMatchDate = (dateString: string): string => {
    const date = new Date(dateString);
    return date.toLocaleDateString('it-IT', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const goToPreviousPage = () => {
    setCurrentPage(prev => Math.max(1, prev - 1));
  };

  const goToNextPage = () => {
    setCurrentPage(prev => Math.min(totalPages, prev + 1));
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b">
        <div className="mobile-container">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 py-4 sm:py-6">
            <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4">
              <Link href="/">
                <Button variant="outline" size="sm" className="w-fit">
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Torna alla Dashboard
                </Button>
              </Link>
              <div className="flex items-center space-x-3">
                <Calendar className="h-6 w-6 sm:h-8 sm:w-8 text-blue-600" />
                <div>
                  <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Calendario Serie A 2025/26</h1>
                  <p className="text-sm sm:text-base text-gray-600">Tutte le partite del campionato divise per giornata</p>
                </div>
              </div>
            </div>
            
            <div className="flex items-center gap-2 overflow-x-auto">
              <Badge variant="outline" className="text-green-600 border-green-200 flex-shrink-0">
                <Trophy className="h-3 w-3 mr-1" />
                38 Giornate
              </Badge>
              <Badge variant="outline" className="text-blue-600 border-blue-200 flex-shrink-0">
                <Clock className="h-3 w-3 mr-1" />
                380 Partite
              </Badge>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="mobile-container py-6 sm:py-8">
        {/* Pagination Controls */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mb-6 sm:mb-8">
          <div className="flex items-center gap-2 sm:gap-4">
            <Button 
              onClick={goToPreviousPage} 
              disabled={currentPage === 1}
              variant="outline"
              size="sm"
              className="flex-shrink-0"
            >
              <ChevronLeft className="h-4 w-4 sm:mr-2" />
              <span className="hidden sm:inline">Precedenti</span>
            </Button>
            <div className="text-xs sm:text-sm text-gray-600 text-center">
              Giornate {startIndex + 1}-{Math.min(endIndex, availableMatchdays.length)} di {availableMatchdays.length}
            </div>
            <Button 
              onClick={goToNextPage} 
              disabled={currentPage === totalPages}
              variant="outline"
              size="sm"
              className="flex-shrink-0"
            >
              <span className="hidden sm:inline">Prossime</span>
              <ChevronRight className="h-4 w-4 sm:ml-2" />
            </Button>
          </div>

          <div className="overflow-x-auto scrollbar-hide">
            <div className="flex items-center gap-1 min-w-max px-2">
              {Array.from({ length: totalPages }, (_, i) => (
                <Button
                  key={i + 1}
                  onClick={() => setCurrentPage(i + 1)}
                  variant={currentPage === i + 1 ? "default" : "outline"}
                  size="sm"
                  className="w-8 h-8 p-0 flex-shrink-0"
                >
                  {i + 1}
                </Button>
              ))}
            </div>
          </div>
        </div>

        {/* Matchdays Grid */}
        <div className="space-y-8">
          {currentMatchdays.map(matchday => {
            const matches = getMatchesForMatchday(matchday);
            const matchDate = getMatchDate(matchday);
            
            return (
              <Card key={matchday} className="overflow-hidden">
                <CardHeader className="bg-gradient-to-r from-blue-600 to-blue-700 text-white">
                  <div className="flex items-center justify-between">
                    <CardTitle className="flex items-center space-x-3">
                      <div className="bg-white/20 rounded-lg p-2">
                        <Calendar className="h-5 w-5" />
                      </div>
                      <div>
                        <div className="text-xl font-bold">Giornata {matchday}</div>
                        <div className="text-blue-100 text-sm">
                          {formatMatchDate(matchDate)}
                        </div>
                      </div>
                    </CardTitle>
                    <Badge variant="secondary" className="bg-white/20 text-white border-white/30">
                      {matches.length} partite
                    </Badge>
                  </div>
                </CardHeader>
                
                <CardContent className="p-0">
                  <div className="grid grid-cols-1 gap-0">
                    {matches.map((match: DisplayMatch, index: number) => (
                      <div key={match.id} className="p-3 sm:p-4 border-b last:border-b-0">
                        <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-0 sm:justify-between">
                          {/* Home Team */}
                          <div className="flex items-center space-x-2 sm:space-x-3 flex-1 min-w-0">
                            {teams && (
                              <TeamLogo 
                                team={teams.find(t => t.id === match.homeTeamId)!} 
                                size="sm" 
                              />
                            )}
                            <div className="flex flex-col min-w-0">
                              <span className="font-medium text-gray-900 text-sm sm:text-base truncate">{match.homeTeam}</span>
                              <span className="text-xs text-gray-500">Casa</span>
                            </div>
                          </div>

                          {/* Match Info */}
                          <div className="flex flex-col items-center space-y-1 px-2 sm:px-4 flex-shrink-0">
                            <div className="flex items-center space-x-1 sm:space-x-2 text-xs sm:text-sm text-gray-600">
                              <Clock className="h-3 w-3" />
                              <span>{match.matchTime}</span>
                            </div>
                            <div className="text-lg sm:text-2xl font-bold text-gray-400">VS</div>
                            <div className="flex items-center space-x-1 text-xs text-gray-500">
                              <MapPin className="h-3 w-3" />
                              <span className="truncate max-w-20 sm:max-w-24">{match.stadium}</span>
                            </div>
                          </div>

                          {/* Away Team */}
                          <div className="flex items-center space-x-2 sm:space-x-3 flex-1 justify-end min-w-0">
                            <div className="flex flex-col items-end min-w-0">
                              <span className="font-medium text-gray-900 text-sm sm:text-base truncate">{match.awayTeam}</span>
                              <span className="text-xs text-gray-500">Trasferta</span>
                            </div>
                            {teams && (
                              <TeamLogo 
                                team={teams.find(t => t.id === match.awayTeamId)!} 
                                size="sm" 
                              />
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Bottom Pagination */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mt-6 sm:mt-8">
          <Button 
            onClick={goToPreviousPage} 
            disabled={currentPage === 1}
            variant="outline"
            size="sm"
            className="w-full sm:w-auto"
          >
            <ChevronLeft className="h-4 w-4 mr-2" />
            Precedenti
          </Button>
          <span className="text-xs sm:text-sm text-gray-600 order-first sm:order-none">
            Pagina {currentPage} di {totalPages}
          </span>
          <Button 
            onClick={goToNextPage} 
            disabled={currentPage === totalPages}
            variant="outline"
            size="sm"
            className="w-full sm:w-auto"
          >
            Prossime
            <ChevronRight className="h-4 w-4 ml-2" />
          </Button>
        </div>
      </div>
    </div>
  );
}