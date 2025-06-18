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

interface DisplayMatch {
  id: number;
  round: number;
  homeTeamId: number;
  awayTeamId: number;
  homeTeam: string;
  awayTeam: string;
  stadium: string;
  matchDate: string;
  matchTime: string;
  homeScore: number | null;
  awayScore: number | null;
  isCompleted: boolean;
}

export default function CalendarPage() {
  const [currentPage, setCurrentPage] = useState(1);
  const matchdaysPerPage = 5;
  
  const { data: teams } = useQuery<Team[]>({
    queryKey: ["/api/teams"],
  });

  // Generate matchdays 1-38 for Serie A 2025/26
  const allMatchdays = Array.from({ length: 38 }, (_, i) => i + 1);
  
  // Calculate pagination
  const totalPages = Math.ceil(allMatchdays.length / matchdaysPerPage);
  const startIndex = (currentPage - 1) * matchdaysPerPage;
  const endIndex = startIndex + matchdaysPerPage;
  const currentMatchdays = allMatchdays.slice(startIndex, endIndex);

  // Generate matches for a specific matchday
  const generateMatchesForMatchday = (matchday: number): DisplayMatch[] => {
    if (!teams || teams.length < 20) return [];
    
    const matches: DisplayMatch[] = [];
    const shuffledTeams = [...teams].sort(() => Math.random() - 0.5);
    
    // Create 10 matches per matchday (20 teams = 10 matches)
    for (let i = 0; i < shuffledTeams.length; i += 2) {
      if (i + 1 < shuffledTeams.length) {
        const homeTeam = shuffledTeams[i];
        const awayTeam = shuffledTeams[i + 1];
        
        matches.push({
          id: matchday * 100 + (i / 2) + 1,
          round: matchday,
          homeTeamId: homeTeam.id,
          awayTeamId: awayTeam.id,
          homeTeam: homeTeam.name,
          awayTeam: awayTeam.name,
          stadium: getStadiumByTeam(homeTeam.name),
          matchDate: getMatchDate(matchday),
          matchTime: getMatchTime(matchday, i / 2),
          homeScore: null,
          awayScore: null,
          isCompleted: false
        });
      }
    }
    
    return matches.sort((a, b) => a.matchTime.localeCompare(b.matchTime));
  };

  const getMatchDate = (matchday: number): string => {
    const startDate = new Date('2025-08-16'); // Serie A 2025/26 start date
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
      'Empoli': 'Stadio Carlo Castellani',
      'Fiorentina': 'Stadio Artemio Franchi',
      'Genoa': 'Stadio Luigi Ferraris',
      'Inter': 'San Siro',
      'Juventus': 'Allianz Stadium',
      'Lazio': 'Stadio Olimpico',
      'Lecce': 'Stadio Via del Mare',
      'Milan': 'San Siro',
      'Monza': 'U-Power Stadium',
      'Napoli': 'Stadio Diego Armando Maradona',
      'Parma': 'Stadio Ennio Tardini',
      'Roma': 'Stadio Olimpico',
      'Torino': 'Stadio Olimpico Grande Torino',
      'Udinese': 'Bluenergy Stadium',
      'Venezia': 'Stadio Pier Luigi Penzo',
      'Verona': 'Stadio Marcantonio Bentegodi'
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
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Link href="/">
                <Button variant="outline" size="sm">
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Torna alla Dashboard
                </Button>
              </Link>
              <div className="flex items-center space-x-3">
                <Calendar className="h-8 w-8 text-blue-600" />
                <div>
                  <h1 className="text-2xl font-bold text-gray-900">Calendario Serie A 2025/26</h1>
                  <p className="text-gray-600">Tutte le partite del campionato divise per giornata</p>
                </div>
              </div>
            </div>
            
            <div className="flex items-center space-x-2">
              <Badge variant="outline" className="text-green-600 border-green-200">
                <Trophy className="h-3 w-3 mr-1" />
                38 Giornate
              </Badge>
              <Badge variant="outline" className="text-blue-600 border-blue-200">
                <Clock className="h-3 w-3 mr-1" />
                380 Partite
              </Badge>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Pagination Controls */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center space-x-4">
            <Button 
              onClick={goToPreviousPage} 
              disabled={currentPage === 1}
              variant="outline"
            >
              <ChevronLeft className="h-4 w-4 mr-2" />
              Precedenti
            </Button>
            <div className="text-sm text-gray-600">
              Giornate {startIndex + 1}-{Math.min(endIndex, allMatchdays.length)} di {allMatchdays.length}
            </div>
            <Button 
              onClick={goToNextPage} 
              disabled={currentPage === totalPages}
              variant="outline"
            >
              Prossime
              <ChevronRight className="h-4 w-4 ml-2" />
            </Button>
          </div>

          <div className="flex items-center space-x-2">
            {Array.from({ length: totalPages }, (_, i) => (
              <Button
                key={i + 1}
                onClick={() => setCurrentPage(i + 1)}
                variant={currentPage === i + 1 ? "default" : "outline"}
                size="sm"
                className="w-8 h-8 p-0"
              >
                {i + 1}
              </Button>
            ))}
          </div>
        </div>

        {/* Matchdays Grid */}
        <div className="space-y-8">
          {currentMatchdays.map(matchday => {
            const matches = generateMatchesForMatchday(matchday);
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
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-0">
                    {matches.map((match, index) => (
                      <div key={match.id} className={`p-4 border-b ${index % 2 === 0 ? 'lg:border-r' : ''} last:border-b-0`}>
                        <div className="flex items-center justify-between">
                          {/* Home Team */}
                          <div className="flex items-center space-x-3 flex-1">
                            {teams && (
                              <TeamLogo 
                                team={teams.find(t => t.id === match.homeTeamId)!} 
                                size="sm" 
                              />
                            )}
                            <div className="flex flex-col">
                              <span className="font-medium text-gray-900">{match.homeTeam}</span>
                              <span className="text-xs text-gray-500">Casa</span>
                            </div>
                          </div>

                          {/* Match Info */}
                          <div className="flex flex-col items-center space-y-1 px-4">
                            <div className="flex items-center space-x-2 text-sm text-gray-600">
                              <Clock className="h-3 w-3" />
                              <span>{match.matchTime}</span>
                            </div>
                            <div className="text-2xl font-bold text-gray-400">VS</div>
                            <div className="flex items-center space-x-1 text-xs text-gray-500">
                              <MapPin className="h-3 w-3" />
                              <span className="truncate max-w-24">{match.stadium}</span>
                            </div>
                          </div>

                          {/* Away Team */}
                          <div className="flex items-center space-x-3 flex-1 justify-end">
                            <div className="flex flex-col items-end">
                              <span className="font-medium text-gray-900">{match.awayTeam}</span>
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
        <div className="flex items-center justify-center mt-8 space-x-4">
          <Button 
            onClick={goToPreviousPage} 
            disabled={currentPage === 1}
            variant="outline"
          >
            <ChevronLeft className="h-4 w-4 mr-2" />
            Precedenti
          </Button>
          <span className="text-sm text-gray-600">
            Pagina {currentPage} di {totalPages}
          </span>
          <Button 
            onClick={goToNextPage} 
            disabled={currentPage === totalPages}
            variant="outline"
          >
            Prossime
            <ChevronRight className="h-4 w-4 ml-2" />
          </Button>
        </div>
      </div>
    </div>
  );
}