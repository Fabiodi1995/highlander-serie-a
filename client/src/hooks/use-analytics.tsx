import { createContext, ReactNode, useContext, useEffect, useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient } from "../lib/queryClient";
import { useAuth } from "./use-auth";

interface UserStats {
  gamesPlayed: number;
  gamesWon: number;
  gamesLost: number;
  winRate: number;
  averageRoundsReached: number;
  bestRoundReached: number;
  totalRoundsPlayed: number;
  favoriteTeams: Array<{ teamName: string; timesSelected: number; winRate: number }>;
  monthlyStats: Array<{ month: string; gamesPlayed: number; winRate: number }>;
  teamPerformance: Array<{ teamName: string; wins: number; losses: number; winRate: number }>;
  streakData: {
    currentWinStreak: number;
    currentLossStreak: number;
    longestWinStreak: number;
    longestLossStreak: number;
  };
}

interface GameAnalytics {
  gameId: number;
  userPosition: number;
  totalPlayers: number;
  roundsReached: number;
  totalRounds: number;
  eliminationRound?: number;
  teamsSelected: Array<{ round: number; teamName: string; result: 'win' | 'loss' | 'draw' }>;
  riskScore: number; // 0-100, based on team selection difficulty
}

interface GlobalStats {
  totalUsers: number;
  totalGamesCompleted: number;
  averageGameDuration: number;
  mostSelectedTeams: Array<{ teamName: string; selections: number; winRate: number }>;
  hardestRounds: Array<{ round: number; eliminationRate: number }>;
  userRanking: {
    position: number;
    percentile: number;
    category: 'Beginner' | 'Intermediate' | 'Advanced' | 'Expert' | 'Master';
  };
}

interface AnalyticsContextType {
  userStats: UserStats | null;
  gameAnalytics: GameAnalytics[];
  globalStats: GlobalStats | null;
  isLoading: boolean;
  refreshStats: () => void;
  trackEvent: (event: string, properties?: Record<string, any>) => void;
  getPerformanceTrend: (period: 'week' | 'month' | 'season') => Array<{ date: string; winRate: number }>;
  getPredictionAccuracy: () => { correct: number; total: number; accuracy: number };
  getTeamRecommendations: (round: number) => Array<{ teamName: string; confidence: number; reasoning: string }>;
}

const AnalyticsContext = createContext<AnalyticsContextType | null>(null);

export function AnalyticsProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [events, setEvents] = useState<Array<{ event: string; properties: any; timestamp: Date }>>([]);

  // User Statistics Query
  const { data: userStats, isLoading: statsLoading } = useQuery({
    queryKey: ['/api/analytics/user-stats'],
    enabled: !!user,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  // Game Analytics Query
  const { data: gameAnalytics, isLoading: gameLoading } = useQuery({
    queryKey: ['/api/analytics/game-history'],
    enabled: !!user,
    staleTime: 10 * 60 * 1000, // 10 minutes
  });

  // Global Statistics Query
  const { data: globalStats, isLoading: globalLoading } = useQuery({
    queryKey: ['/api/analytics/global-stats'],
    enabled: !!user,
    staleTime: 15 * 60 * 1000, // 15 minutes
  });

  const isLoading = statsLoading || gameLoading || globalLoading;

  const refreshStats = () => {
    queryClient.invalidateQueries({ queryKey: ['/api/analytics'] });
  };

  const trackEvent = (event: string, properties?: Record<string, any>) => {
    const eventData = {
      event,
      properties: {
        userId: user?.id,
        timestamp: new Date().toISOString(),
        userAgent: navigator.userAgent,
        url: window.location.href,
        ...properties
      },
      timestamp: new Date()
    };

    setEvents(prev => [...prev.slice(-99), eventData]); // Keep last 100 events

    // Send to analytics endpoint
    if (user) {
      fetch('/api/analytics/events', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(eventData)
      }).catch(console.error);
    }

    // Store locally for offline analysis
    const storedEvents = JSON.parse(localStorage.getItem('highlander_events') || '[]');
    storedEvents.push(eventData);
    localStorage.setItem('highlander_events', JSON.stringify(storedEvents.slice(-200)));
  };

  const getPerformanceTrend = (period: 'week' | 'month' | 'season') => {
    if (!gameAnalytics) return [];

    const now = new Date();
    const periodDays = period === 'week' ? 7 : period === 'month' ? 30 : 270; // 9 months for season
    const startDate = new Date(now.getTime() - (periodDays * 24 * 60 * 60 * 1000));

    const relevantGames = gameAnalytics.filter(game => 
      new Date(game.createdAt) >= startDate
    );

    // Group by day/week based on period
    const groupBy = period === 'week' ? 'day' : 'week';
    const trends = relevantGames.reduce((acc, game) => {
      const date = new Date(game.createdAt);
      const key = groupBy === 'day' 
        ? date.toISOString().split('T')[0]
        : `${date.getFullYear()}-W${Math.ceil(date.getDate() / 7)}`;

      if (!acc[key]) {
        acc[key] = { wins: 0, total: 0 };
      }
      
      acc[key].total++;
      if (game.userPosition === 1) acc[key].wins++;
      
      return acc;
    }, {} as Record<string, { wins: number; total: number }>);

    return Object.entries(trends).map(([date, data]) => ({
      date,
      winRate: data.total > 0 ? (data.wins / data.total) * 100 : 0
    })).sort((a, b) => a.date.localeCompare(b.date));
  };

  const getPredictionAccuracy = () => {
    if (!gameAnalytics) return { correct: 0, total: 0, accuracy: 0 };

    let correct = 0;
    let total = 0;

    gameAnalytics.forEach(game => {
      game.teamsSelected?.forEach(selection => {
        total++;
        if (selection.result === 'win') correct++;
      });
    });

    return {
      correct,
      total,
      accuracy: total > 0 ? (correct / total) * 100 : 0
    };
  };

  const getTeamRecommendations = (round: number) => {
    if (!userStats || !globalStats) return [];

    // Simple recommendation algorithm based on:
    // 1. User's historical success with teams
    // 2. Global team performance in similar rounds
    // 3. Current form and difficulty

    const recommendations = globalStats.mostSelectedTeams
      .filter(team => team.winRate > 60) // Only recommend teams with good win rate
      .slice(0, 5)
      .map(team => {
        const userExperience = userStats.favoriteTeams.find(ft => ft.teamName === team.teamName);
        const confidence = Math.min(
          team.winRate + (userExperience ? userExperience.winRate * 0.3 : 0),
          95
        );

        return {
          teamName: team.teamName,
          confidence,
          reasoning: userExperience 
            ? `Hai un buon storico con questa squadra (${userExperience.winRate.toFixed(1)}% di successo)`
            : `Squadra con alto tasso di successo globale (${team.winRate.toFixed(1)}%)`
        };
      })
      .sort((a, b) => b.confidence - a.confidence);

    return recommendations;
  };

  // Track page views automatically
  useEffect(() => {
    trackEvent('page_view', { page: window.location.pathname });
  }, [window.location.pathname]);

  // Track user engagement time
  useEffect(() => {
    const startTime = Date.now();
    
    const handleBeforeUnload = () => {
      const timeSpent = Date.now() - startTime;
      trackEvent('session_duration', { timeSpent, page: window.location.pathname });
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, []);

  return (
    <AnalyticsContext.Provider
      value={{
        userStats,
        gameAnalytics: gameAnalytics || [],
        globalStats,
        isLoading,
        refreshStats,
        trackEvent,
        getPerformanceTrend,
        getPredictionAccuracy,
        getTeamRecommendations
      }}
    >
      {children}
    </AnalyticsContext.Provider>
  );
}

export function useAnalytics() {
  const context = useContext(AnalyticsContext);
  if (!context) {
    throw new Error("useAnalytics must be used within an AnalyticsProvider");
  }
  return context;
}

// Analytics tracking utilities
export const analytics = {
  track: (event: string, properties?: Record<string, any>) => {
    // Global tracking function for use outside React components
    window.dispatchEvent(new CustomEvent('highlander-analytics', {
      detail: { event, properties }
    }));
  },

  identify: (userId: string, traits?: Record<string, any>) => {
    analytics.track('user_identify', { userId, ...traits });
  },

  page: (name: string, properties?: Record<string, any>) => {
    analytics.track('page_view', { page: name, ...properties });
  }
};