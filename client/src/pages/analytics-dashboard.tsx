import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { 
  TrendingUp, 
  TrendingDown, 
  Trophy, 
  Target, 
  Users, 
  Calendar,
  BarChart3,
  PieChart,
  Activity,
  Star,
  Award,
  Zap,
  RefreshCw
} from "lucide-react";
import { LineChart, Line, AreaChart, Area, BarChart, Bar, PieChart as RechartsPieChart, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { useAuth } from "@/hooks/use-auth";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";

interface PerformanceMetric {
  period: string;
  gamesPlayed: number;
  winRate: number;
  averageRoundsReached: number;
  predictionAccuracy: number;
}

interface TeamAnalytics {
  teamName: string;
  timesSelected: number;
  wins: number;
  winRate: number;
  riskScore: number;
  averageOdds?: number;
}

interface ComparisonData {
  metric: string;
  userValue: number;
  averageValue: number;
  percentile: number;
}

export default function AnalyticsDashboard() {
  const { user } = useAuth();
  const [selectedPeriod, setSelectedPeriod] = useState<'week' | 'month' | 'season'>('month');

  // Analytics queries
  const { data: userStats, isLoading: statsLoading, refetch: refetchStats } = useQuery({
    queryKey: ['/api/analytics/user-stats', selectedPeriod],
    enabled: !!user,
    staleTime: 2 * 60 * 1000,
  });

  const { data: performanceHistory, isLoading: historyLoading } = useQuery({
    queryKey: ['/api/analytics/performance-history', selectedPeriod],
    enabled: !!user,
    staleTime: 5 * 60 * 1000,
  });

  const { data: teamAnalytics, isLoading: teamLoading } = useQuery({
    queryKey: ['/api/analytics/team-performance'],
    enabled: !!user,
    staleTime: 10 * 60 * 1000,
  });

  const { data: globalComparison, isLoading: comparisonLoading } = useQuery({
    queryKey: ['/api/analytics/global-comparison'],
    enabled: !!user,
    staleTime: 15 * 60 * 1000,
  });

  const isLoading = statsLoading || historyLoading || teamLoading || comparisonLoading;

  const handleRefresh = () => {
    refetchStats();
  };

  // Mock data for demonstration (replace with real data)
  const mockPerformanceData: PerformanceMetric[] = [
    { period: 'Gen', gamesPlayed: 8, winRate: 12.5, averageRoundsReached: 6.2, predictionAccuracy: 68 },
    { period: 'Feb', gamesPlayed: 12, winRate: 25.0, averageRoundsReached: 8.1, predictionAccuracy: 72 },
    { period: 'Mar', gamesPlayed: 15, winRate: 20.0, averageRoundsReached: 7.8, predictionAccuracy: 75 },
    { period: 'Apr', gamesPlayed: 18, winRate: 33.3, averageRoundsReached: 9.2, predictionAccuracy: 78 },
    { period: 'Mag', gamesPlayed: 22, winRate: 27.3, averageRoundsReached: 8.9, predictionAccuracy: 82 }
  ];

  const mockTeamData: TeamAnalytics[] = [
    { teamName: 'Inter', timesSelected: 18, wins: 14, winRate: 77.8, riskScore: 25 },
    { teamName: 'Juventus', timesSelected: 16, wins: 11, winRate: 68.8, riskScore: 35 },
    { teamName: 'Milan', timesSelected: 14, wins: 9, winRate: 64.3, riskScore: 40 },
    { teamName: 'Napoli', timesSelected: 12, wins: 8, winRate: 66.7, riskScore: 38 },
    { teamName: 'Roma', timesSelected: 10, wins: 5, winRate: 50.0, riskScore: 55 }
  ];

  const mockComparisonData: ComparisonData[] = [
    { metric: 'Win Rate', userValue: 28.5, averageValue: 15.2, percentile: 78 },
    { metric: 'Prediction Accuracy', userValue: 76.3, averageValue: 62.1, percentile: 85 },
    { metric: 'Average Rounds', userValue: 8.4, averageValue: 5.8, percentile: 72 },
    { metric: 'Games Played', userValue: 85, averageValue: 45, percentile: 92 }
  ];

  const COLORS = ['#16a34a', '#2563eb', '#dc2626', '#ea580c', '#7c3aed'];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 p-4">
      <div className="container mx-auto max-w-7xl">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
              Analytics Dashboard
            </h1>
            <p className="text-gray-600 dark:text-gray-300 mt-2">
              Analisi dettagliate delle tue performance nel gioco
            </p>
          </div>
          
          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              size="sm"
              onClick={handleRefresh}
              disabled={isLoading}
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
              Aggiorna
            </Button>
            
            <Tabs value={selectedPeriod} onValueChange={(value) => setSelectedPeriod(value as any)}>
              <TabsList>
                <TabsTrigger value="week">Settimana</TabsTrigger>
                <TabsTrigger value="month">Mese</TabsTrigger>
                <TabsTrigger value="season">Stagione</TabsTrigger>
              </TabsList>
            </Tabs>
          </div>
        </div>

        {/* Key Metrics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card className="bg-gradient-to-br from-green-500 to-green-600 text-white">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-green-100 text-sm font-medium">Win Rate</p>
                  <h3 className="text-3xl font-bold">28.5%</h3>
                  <div className="flex items-center mt-2">
                    <TrendingUp className="h-4 w-4 mr-1" />
                    <span className="text-sm">+5.2% vs mese scorso</span>
                  </div>
                </div>
                <Trophy className="h-12 w-12 text-green-200" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-blue-500 to-blue-600 text-white">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-blue-100 text-sm font-medium">Accuratezza Predizioni</p>
                  <h3 className="text-3xl font-bold">76.3%</h3>
                  <div className="flex items-center mt-2">
                    <TrendingUp className="h-4 w-4 mr-1" />
                    <span className="text-sm">+3.1% vs mese scorso</span>
                  </div>
                </div>
                <Target className="h-12 w-12 text-blue-200" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-purple-500 to-purple-600 text-white">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-purple-100 text-sm font-medium">Giornate Medie</p>
                  <h3 className="text-3xl font-bold">8.4</h3>
                  <div className="flex items-center mt-2">
                    <TrendingDown className="h-4 w-4 mr-1" />
                    <span className="text-sm">-0.8 vs mese scorso</span>
                  </div>
                </div>
                <Calendar className="h-12 w-12 text-purple-200" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-orange-500 to-orange-600 text-white">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-orange-100 text-sm font-medium">Rank Globale</p>
                  <h3 className="text-3xl font-bold">#127</h3>
                  <div className="flex items-center mt-2">
                    <TrendingUp className="h-4 w-4 mr-1" />
                    <span className="text-sm">+45 posizioni</span>
                  </div>
                </div>
                <Users className="h-12 w-12 text-orange-200" />
              </div>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="performance" className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="performance">Performance</TabsTrigger>
            <TabsTrigger value="teams">Analisi Squadre</TabsTrigger>
            <TabsTrigger value="comparison">Confronto</TabsTrigger>
            <TabsTrigger value="insights">Insights</TabsTrigger>
          </TabsList>

          {/* Performance Tab */}
          <TabsContent value="performance" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Win Rate Trend */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <BarChart3 className="h-5 w-5" />
                    Trend Win Rate
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <LineChart data={mockPerformanceData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="period" />
                      <YAxis />
                      <Tooltip formatter={(value) => [`${value}%`, 'Win Rate']} />
                      <Line 
                        type="monotone" 
                        dataKey="winRate" 
                        stroke="#16a34a" 
                        strokeWidth={3}
                        dot={{ fill: '#16a34a', strokeWidth: 2, r: 6 }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              {/* Prediction Accuracy */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Activity className="h-5 w-5" />
                    Accuratezza Predizioni
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <AreaChart data={mockPerformanceData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="period" />
                      <YAxis />
                      <Tooltip formatter={(value) => [`${value}%`, 'Accuratezza']} />
                      <Area 
                        type="monotone" 
                        dataKey="predictionAccuracy" 
                        stroke="#2563eb" 
                        fill="#2563eb"
                        fillOpacity={0.3}
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </div>

            {/* Detailed Performance Metrics */}
            <Card>
              <CardHeader>
                <CardTitle>Metriche Dettagliate</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-sm font-medium">Partite Giocate</span>
                      <span className="font-bold">85</span>
                    </div>
                    <Progress value={85} className="h-2" />
                    
                    <div className="flex justify-between">
                      <span className="text-sm font-medium">Partite Vinte</span>
                      <span className="font-bold">24</span>
                    </div>
                    <Progress value={28} className="h-2" />
                  </div>
                  
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-sm font-medium">Miglior Posizione</span>
                      <span className="font-bold">#1</span>
                    </div>
                    <Progress value={100} className="h-2" />
                    
                    <div className="flex justify-between">
                      <span className="text-sm font-medium">Streak Vittorie</span>
                      <span className="font-bold">3</span>
                    </div>
                    <Progress value={60} className="h-2" />
                  </div>
                  
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-sm font-medium">Tempo Medio Gioco</span>
                      <span className="font-bold">12min</span>
                    </div>
                    <Progress value={75} className="h-2" />
                    
                    <div className="flex justify-between">
                      <span className="text-sm font-medium">Sessioni Settimanali</span>
                      <span className="font-bold">4.2</span>
                    </div>
                    <Progress value={84} className="h-2" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Teams Analysis Tab */}
          <TabsContent value="teams" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Team Performance Chart */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <PieChart className="h-5 w-5" />
                    Distribuzione Selezioni Squadre
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <RechartsPieChart>
                      <Pie
                        data={mockTeamData}
                        cx="50%"
                        cy="50%"
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="timesSelected"
                        label={({ teamName, percent }) => `${teamName} ${(percent * 100).toFixed(0)}%`}
                      >
                        {mockTeamData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </RechartsPieChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              {/* Team Win Rates */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Trophy className="h-5 w-5" />
                    Win Rate per Squadra
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={mockTeamData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="teamName" />
                      <YAxis />
                      <Tooltip formatter={(value) => [`${value}%`, 'Win Rate']} />
                      <Bar dataKey="winRate" fill="#16a34a" />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </div>

            {/* Detailed Team Stats */}
            <Card>
              <CardHeader>
                <CardTitle>Statistiche Dettagliate Squadre</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {mockTeamData.map((team, index) => (
                    <div key={team.teamName} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex items-center gap-4">
                        <div className={`w-4 h-4 rounded-full`} style={{ backgroundColor: COLORS[index] }} />
                        <div>
                          <h4 className="font-semibold">{team.teamName}</h4>
                          <p className="text-sm text-gray-500">
                            {team.wins}/{team.timesSelected} vittorie
                          </p>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-6">
                        <div className="text-center">
                          <p className="text-sm text-gray-500">Win Rate</p>
                          <p className="font-bold text-green-600">{team.winRate.toFixed(1)}%</p>
                        </div>
                        
                        <div className="text-center">
                          <p className="text-sm text-gray-500">Risk Score</p>
                          <Badge variant={team.riskScore < 30 ? 'default' : team.riskScore < 50 ? 'secondary' : 'destructive'}>
                            {team.riskScore}
                          </Badge>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Comparison Tab */}
          <TabsContent value="comparison" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5" />
                  Confronto con Altri Giocatori
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  {mockComparisonData.map((comparison) => (
                    <div key={comparison.metric} className="space-y-2">
                      <div className="flex justify-between items-center">
                        <span className="font-medium">{comparison.metric}</span>
                        <div className="flex items-center gap-2">
                          <span className="text-sm text-gray-500">
                            Tu: {comparison.userValue}{comparison.metric.includes('Rate') || comparison.metric.includes('Accuracy') ? '%' : ''}
                          </span>
                          <span className="text-sm text-gray-500">
                            Media: {comparison.averageValue}{comparison.metric.includes('Rate') || comparison.metric.includes('Accuracy') ? '%' : ''}
                          </span>
                          <Badge variant={comparison.percentile > 70 ? 'default' : comparison.percentile > 50 ? 'secondary' : 'outline'}>
                            {comparison.percentile}° percentile
                          </Badge>
                        </div>
                      </div>
                      <Progress value={comparison.percentile} className="h-3" />
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Ranking Card */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Award className="h-5 w-5" />
                  Posizione in Classifica
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center space-y-4">
                  <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-yellow-400 to-yellow-600 rounded-full text-white font-bold text-xl">
                    #127
                  </div>
                  <div>
                    <h3 className="text-2xl font-bold">Top 15%</h3>
                    <p className="text-gray-500">di tutti i giocatori attivi</p>
                  </div>
                  <div className="grid grid-cols-3 gap-4 mt-6">
                    <div className="text-center">
                      <p className="text-sm text-gray-500">Livello</p>
                      <p className="font-bold text-lg">Expert</p>
                    </div>
                    <div className="text-center">
                      <p className="text-sm text-gray-500">XP Totale</p>
                      <p className="font-bold text-lg">2,847</p>
                    </div>
                    <div className="text-center">
                      <p className="text-sm text-gray-500">Achievement</p>
                      <p className="font-bold text-lg">18/25</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Insights Tab */}
          <TabsContent value="insights" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* AI Recommendations */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Zap className="h-5 w-5" />
                    Consigli AI
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
                    <h4 className="font-semibold text-blue-800 dark:text-blue-200 mb-2">
                      Strategia Consigliata
                    </h4>
                    <p className="text-blue-700 dark:text-blue-300 text-sm">
                      Considera di utilizzare squadre di medio livello nelle prossime 2 giornate. 
                      La tua accuratezza con Inter e Juventus è alta, ma conservale per momenti cruciali.
                    </p>
                  </div>
                  
                  <div className="p-4 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800">
                    <h4 className="font-semibold text-green-800 dark:text-green-200 mb-2">
                      Punto di Forza
                    </h4>
                    <p className="text-green-700 dark:text-green-300 text-sm">
                      Eccellente nelle selezioni contro squadre di bassa classifica. 
                      Il tuo tasso di successo è del 89% in questi scenari.
                    </p>
                  </div>
                  
                  <div className="p-4 bg-orange-50 dark:bg-orange-900/20 rounded-lg border border-orange-200 dark:border-orange-800">
                    <h4 className="font-semibold text-orange-800 dark:text-orange-200 mb-2">
                      Area di Miglioramento
                    </h4>
                    <p className="text-orange-700 dark:text-orange-300 text-sm">
                      Evita selezioni nei big match (Inter vs Juventus, Milan vs Napoli). 
                      Il tuo tasso di successo scende al 35% in questi casi.
                    </p>
                  </div>
                </CardContent>
              </Card>

              {/* Personal Records */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Star className="h-5 w-5" />
                    Record Personali
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex justify-between items-center p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                    <span className="font-medium">Più Giornate Raggiunte</span>
                    <span className="font-bold text-green-600">18 giornate</span>
                  </div>
                  
                  <div className="flex justify-between items-center p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                    <span className="font-medium">Streak Vittorie Più Lunga</span>
                    <span className="font-bold text-blue-600">5 partite</span>
                  </div>
                  
                  <div className="flex justify-between items-center p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                    <span className="font-medium">Miglior Accuratezza Mensile</span>
                    <span className="font-bold text-purple-600">84.2%</span>
                  </div>
                  
                  <div className="flex justify-between items-center p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                    <span className="font-medium">Posizione Più Alta</span>
                    <span className="font-bold text-yellow-600">#1</span>
                  </div>
                  
                  <div className="flex justify-between items-center p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                    <span className="font-medium">Partite Consecutive</span>
                    <span className="font-bold text-orange-600">12 giorni</span>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Achievement Progress */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Award className="h-5 w-5" />
                  Progressi Achievement
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="font-medium">🏆 Master Survivor</span>
                      <span className="text-sm text-gray-500">12/15 vittorie</span>
                    </div>
                    <Progress value={80} className="h-2" />
                  </div>
                  
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="font-medium">🎯 Perfect Predictor</span>
                      <span className="text-sm text-gray-500">8/10 perfette</span>
                    </div>
                    <Progress value={80} className="h-2" />
                  </div>
                  
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="font-medium">⚡ Speed Demon</span>
                      <span className="text-sm text-gray-500">18/25 rapide</span>
                    </div>
                    <Progress value={72} className="h-2" />
                  </div>
                  
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="font-medium">🎖️ Veteran Player</span>
                      <span className="text-sm text-gray-500">85/100 partite</span>
                    </div>
                    <Progress value={85} className="h-2" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}