import { createContext, ReactNode, useContext, useEffect, useState } from "react";
import { useQuery, useMutation, queryClient } from "@tanstack/react-query";
import { useAuth } from "./use-auth";
import { useNotifications } from "./use-notifications";

interface Achievement {
  id: string;
  name: string;
  description: string;
  icon: string;
  category: 'survival' | 'prediction' | 'social' | 'dedication' | 'special';
  difficulty: 'bronze' | 'silver' | 'gold' | 'platinum' | 'legendary';
  points: number;
  requirement: {
    type: 'games_won' | 'rounds_survived' | 'prediction_accuracy' | 'streak' | 'participation' | 'social';
    target: number;
    timeframe?: 'daily' | 'weekly' | 'monthly' | 'seasonal' | 'all_time';
  };
  unlockedAt?: Date;
  progress?: number;
  isUnlocked: boolean;
  isNew?: boolean;
}

interface UserLevel {
  level: number;
  title: string;
  currentXP: number;
  requiredXP: number;
  totalXP: number;
  nextLevelTitle: string;
  perks: string[];
}

interface LeaderboardEntry {
  userId: number;
  username: string;
  level: number;
  totalXP: number;
  achievementsCount: number;
  winRate: number;
  rank: number;
}

interface AchievementsContextType {
  achievements: Achievement[];
  userLevel: UserLevel | null;
  leaderboard: LeaderboardEntry[];
  unlockedAchievements: Achievement[];
  newAchievements: Achievement[];
  isLoading: boolean;
  checkForNewAchievements: () => void;
  markAchievementAsViewed: (achievementId: string) => void;
  getAchievementsByCategory: (category: Achievement['category']) => Achievement[];
  calculateProgress: (achievement: Achievement) => number;
}

const AchievementsContext = createContext<AchievementsContextType | null>(null);

// Predefined achievements configuration
const ACHIEVEMENTS_CONFIG: Omit<Achievement, 'isUnlocked' | 'progress' | 'unlockedAt'>[] = [
  // Survival Achievements
  {
    id: 'first_blood',
    name: 'First Blood',
    description: 'Sopravvivi alla prima giornata',
    icon: '🎯',
    category: 'survival',
    difficulty: 'bronze',
    points: 10,
    requirement: { type: 'rounds_survived', target: 1 }
  },
  {
    id: 'survivor',
    name: 'Survivor',
    description: 'Sopravvivi a 5 giornate consecutive',
    icon: '🏆',
    category: 'survival',
    difficulty: 'silver',
    points: 25,
    requirement: { type: 'rounds_survived', target: 5 }
  },
  {
    id: 'highlander',
    name: 'Highlander',
    description: 'Vinci un gioco completo',
    icon: '👑',
    category: 'survival',
    difficulty: 'gold',
    points: 100,
    requirement: { type: 'games_won', target: 1 }
  },
  {
    id: 'immortal',
    name: 'Immortal',
    description: 'Sopravvivi a 15 giornate in un singolo gioco',
    icon: '⚡',
    category: 'survival',
    difficulty: 'platinum',
    points: 200,
    requirement: { type: 'rounds_survived', target: 15 }
  },
  {
    id: 'legend',
    name: 'Legend',
    description: 'Vinci 5 giochi',
    icon: '🌟',
    category: 'survival',
    difficulty: 'legendary',
    points: 500,
    requirement: { type: 'games_won', target: 5 }
  },

  // Prediction Achievements
  {
    id: 'oracle',
    name: 'Oracle',
    description: 'Ottieni 90% di accuratezza predizioni in un gioco',
    icon: '🔮',
    category: 'prediction',
    difficulty: 'gold',
    points: 75,
    requirement: { type: 'prediction_accuracy', target: 90 }
  },
  {
    id: 'prophet',
    name: 'Prophet',
    description: 'Predici correttamente 10 risultati consecutivi',
    icon: '📊',
    category: 'prediction',
    difficulty: 'platinum',
    points: 150,
    requirement: { type: 'streak', target: 10 }
  },

  // Social Achievements
  {
    id: 'socialite',
    name: 'Socialite',
    description: 'Invita 3 amici a giocare',
    icon: '👥',
    category: 'social',
    difficulty: 'silver',
    points: 50,
    requirement: { type: 'social', target: 3 }
  },

  // Dedication Achievements
  {
    id: 'dedicated',
    name: 'Dedicated',
    description: 'Gioca per 7 giorni consecutivi',
    icon: '📅',
    category: 'dedication',
    difficulty: 'silver',
    points: 40,
    requirement: { type: 'participation', target: 7, timeframe: 'daily' }
  },
  {
    id: 'veteran',
    name: 'Veteran',
    description: 'Partecipa a 50 giochi',
    icon: '🎖️',
    category: 'dedication',
    difficulty: 'gold',
    points: 100,
    requirement: { type: 'participation', target: 50, timeframe: 'all_time' }
  },

  // Special Achievements
  {
    id: 'dark_horse',
    name: 'Dark Horse',
    description: 'Vinci un gioco dopo essere stato eliminato prima volta',
    icon: '🐎',
    category: 'special',
    difficulty: 'platinum',
    points: 250,
    requirement: { type: 'games_won', target: 1 }
  },
  {
    id: 'comeback_king',
    name: 'Comeback King',
    description: 'Vinci dopo aver perso 3 giochi consecutivi',
    icon: '🔥',
    category: 'special',
    difficulty: 'gold',
    points: 120,
    requirement: { type: 'streak', target: 1 }
  }
];

export function AchievementsProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const { sendNotification } = useNotifications();
  const [newAchievements, setNewAchievements] = useState<Achievement[]>([]);

  // User achievements query
  const { data: userAchievements, isLoading } = useQuery({
    queryKey: ['/api/achievements/user'],
    enabled: !!user,
    staleTime: 2 * 60 * 1000, // 2 minutes
  });

  // User level query
  const { data: userLevel } = useQuery({
    queryKey: ['/api/achievements/level'],
    enabled: !!user,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  // Leaderboard query
  const { data: leaderboard } = useQuery({
    queryKey: ['/api/achievements/leaderboard'],
    enabled: !!user,
    staleTime: 10 * 60 * 1000, // 10 minutes
  });

  // Process achievements with user data
  const achievements: Achievement[] = ACHIEVEMENTS_CONFIG.map(config => {
    const userAchievement = userAchievements?.find((ua: any) => ua.achievementId === config.id);
    return {
      ...config,
      isUnlocked: !!userAchievement,
      unlockedAt: userAchievement?.unlockedAt ? new Date(userAchievement.unlockedAt) : undefined,
      progress: userAchievement?.progress || 0,
      isNew: userAchievement?.isNew || false
    };
  });

  const unlockedAchievements = achievements.filter(a => a.isUnlocked);

  const checkForNewAchievements = async () => {
    try {
      const response = await fetch('/api/achievements/check', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });
      
      if (response.ok) {
        const newlyUnlocked = await response.json();
        
        if (newlyUnlocked.length > 0) {
          setNewAchievements(newlyUnlocked);
          queryClient.invalidateQueries({ queryKey: ['/api/achievements'] });
          
          // Send notifications for new achievements
          newlyUnlocked.forEach((achievement: Achievement) => {
            sendNotification(
              `Achievement Unlocked: ${achievement.name}!`,
              {
                body: achievement.description,
                icon: achievement.icon,
                tag: `achievement-${achievement.id}`,
                requireInteraction: true,
                data: { url: '/profile?tab=achievements' }
              }
            );
          });
        }
      }
    } catch (error) {
      console.error('Error checking for new achievements:', error);
    }
  };

  const markAchievementAsViewed = async (achievementId: string) => {
    try {
      await fetch(`/api/achievements/${achievementId}/viewed`, {
        method: 'POST'
      });
      
      setNewAchievements(prev => prev.filter(a => a.id !== achievementId));
      queryClient.invalidateQueries({ queryKey: ['/api/achievements'] });
    } catch (error) {
      console.error('Error marking achievement as viewed:', error);
    }
  };

  const getAchievementsByCategory = (category: Achievement['category']) => {
    return achievements.filter(a => a.category === category);
  };

  const calculateProgress = (achievement: Achievement): number => {
    if (achievement.isUnlocked) return 100;
    return Math.min((achievement.progress || 0) / achievement.requirement.target * 100, 100);
  };

  // Auto-check for achievements on user stats change
  useEffect(() => {
    if (user) {
      checkForNewAchievements();
    }
  }, [user?.id]);

  return (
    <AchievementsContext.Provider
      value={{
        achievements,
        userLevel,
        leaderboard: leaderboard || [],
        unlockedAchievements,
        newAchievements,
        isLoading,
        checkForNewAchievements,
        markAchievementAsViewed,
        getAchievementsByCategory,
        calculateProgress
      }}
    >
      {children}
    </AchievementsContext.Provider>
  );
}

export function useAchievements() {
  const context = useContext(AchievementsContext);
  if (!context) {
    throw new Error("useAchievements must be used within an AchievementsProvider");
  }
  return context;
}

// Level calculation utilities
export const levelUtils = {
  calculateLevel: (totalXP: number): number => {
    // Progressive XP requirements: 100, 250, 450, 700, 1000, 1350, 1750, etc.
    let level = 1;
    let requiredXP = 100;
    let cumulativeXP = 0;

    while (totalXP >= cumulativeXP + requiredXP) {
      cumulativeXP += requiredXP;
      level++;
      requiredXP = Math.floor(requiredXP * 1.4); // 40% increase each level
    }

    return level;
  },

  getXPForLevel: (level: number): number => {
    let totalXP = 0;
    let requiredXP = 100;

    for (let i = 1; i < level; i++) {
      totalXP += requiredXP;
      requiredXP = Math.floor(requiredXP * 1.4);
    }

    return totalXP;
  },

  getLevelTitle: (level: number): string => {
    if (level < 5) return 'Rookie';
    if (level < 10) return 'Player';
    if (level < 15) return 'Competitor';
    if (level < 20) return 'Expert';
    if (level < 25) return 'Master';
    if (level < 30) return 'Champion';
    if (level < 40) return 'Legend';
    return 'Grandmaster';
  },

  getLevelPerks: (level: number): string[] => {
    const perks = [];
    if (level >= 5) perks.push('Accesso statistiche avanzate');
    if (level >= 10) perks.push('Badge personalizzati');
    if (level >= 15) perks.push('Priorità nelle notifiche');
    if (level >= 20) perks.push('Accesso beta nuove funzionalità');
    if (level >= 25) perks.push('Consigli AI personalizzati');
    if (level >= 30) perks.push('Status VIP nelle classifiche');
    return perks;
  }
};