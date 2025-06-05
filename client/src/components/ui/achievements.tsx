import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Trophy,
  Star,
  Target,
  Users,
  Crown,
  Shield,
  Zap,
  Award,
  TrendingUp,
  Calendar,
  Lock
} from "lucide-react";

interface Achievement {
  id: number;
  name: string;
  description: string;
  icon: string;
  type: "survival" | "participation" | "performance";
  rarity: "common" | "rare" | "epic" | "legendary";
  points: number;
  unlocked: boolean;
  progress?: number;
  maxProgress?: number;
  unlockedAt?: Date;
}

interface UserStats {
  currentLevel: number;
  experiencePoints: number;
  totalGamesPlayed: number;
  totalRoundsSurvived: number;
  longestSurvivalStreak: number;
  totalWins: number;
}

interface AchievementSystemProps {
  achievements: Achievement[];
  userStats: UserStats;
}

export function AchievementSystem({ achievements, userStats }: AchievementSystemProps) {
  const [selectedCategory, setSelectedCategory] = useState<string>("all");

  const getRarityColor = (rarity: string) => {
    switch (rarity) {
      case "common":
        return "bg-gray-100 text-gray-800 border-gray-300";
      case "rare":
        return "bg-blue-100 text-blue-800 border-blue-300";
      case "epic":
        return "bg-purple-100 text-purple-800 border-purple-300";
      case "legendary":
        return "bg-yellow-100 text-yellow-800 border-yellow-300";
      default:
        return "bg-gray-100 text-gray-800 border-gray-300";
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case "survival":
        return <Shield className="h-4 w-4" />;
      case "participation":
        return <Users className="h-4 w-4" />;
      case "performance":
        return <TrendingUp className="h-4 w-4" />;
      default:
        return <Trophy className="h-4 w-4" />;
    }
  };

  const getAchievementIcon = (iconName: string) => {
    const iconMap: { [key: string]: React.ReactNode } = {
      trophy: <Trophy className="h-8 w-8" />,
      star: <Star className="h-8 w-8" />,
      target: <Target className="h-8 w-8" />,
      crown: <Crown className="h-8 w-8" />,
      shield: <Shield className="h-8 w-8" />,
      zap: <Zap className="h-8 w-8" />,
      award: <Award className="h-8 w-8" />,
    };
    return iconMap[iconName] || <Trophy className="h-8 w-8" />;
  };

  const getLevelFromXP = (xp: number) => {
    return Math.floor(xp / 1000) + 1;
  };

  const getXPForNextLevel = (currentLevel: number) => {
    return currentLevel * 1000;
  };

  const getXPProgress = (xp: number, level: number) => {
    const currentLevelXP = (level - 1) * 1000;
    const nextLevelXP = level * 1000;
    const progress = xp - currentLevelXP;
    const total = nextLevelXP - currentLevelXP;
    return (progress / total) * 100;
  };

  const filteredAchievements = achievements.filter(achievement => {
    if (selectedCategory === "all") return true;
    if (selectedCategory === "unlocked") return achievement.unlocked;
    if (selectedCategory === "locked") return !achievement.unlocked;
    return achievement.type === selectedCategory;
  });

  const unlockedCount = achievements.filter(a => a.unlocked).length;
  const totalPoints = achievements.filter(a => a.unlocked).reduce((sum, a) => sum + a.points, 0);

  return (
    <div className="space-y-6">
      {/* Player Level & Stats */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Crown className="h-5 w-5 text-yellow-500" />
                Livello {userStats.currentLevel}
              </CardTitle>
              <CardDescription>
                {userStats.experiencePoints} XP totali
              </CardDescription>
            </div>
            <Badge variant="secondary" className="text-lg px-3 py-1">
              {totalPoints} punti
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {/* XP Progress Bar */}
            <div>
              <div className="flex justify-between text-sm mb-2">
                <span>Progressi verso Livello {userStats.currentLevel + 1}</span>
                <span>
                  {userStats.experiencePoints % 1000} / 1000 XP
                </span>
              </div>
              <Progress 
                value={getXPProgress(userStats.experiencePoints, userStats.currentLevel)} 
                className="h-3"
              />
            </div>

            {/* Quick Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center p-3 bg-blue-50 rounded-lg">
                <div className="text-2xl font-bold text-blue-600">{userStats.totalGamesPlayed}</div>
                <div className="text-xs text-gray-600">Giochi</div>
              </div>
              <div className="text-center p-3 bg-green-50 rounded-lg">
                <div className="text-2xl font-bold text-green-600">{userStats.totalRoundsSurvived}</div>
                <div className="text-xs text-gray-600">Round</div>
              </div>
              <div className="text-center p-3 bg-yellow-50 rounded-lg">
                <div className="text-2xl font-bold text-yellow-600">{userStats.longestSurvivalStreak}</div>
                <div className="text-xs text-gray-600">Max Streak</div>
              </div>
              <div className="text-center p-3 bg-purple-50 rounded-lg">
                <div className="text-2xl font-bold text-purple-600">{userStats.totalWins}</div>
                <div className="text-xs text-gray-600">Vittorie</div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Achievements Overview */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Trophy className="h-5 w-5 text-yellow-500" />
            Achievements
          </CardTitle>
          <CardDescription>
            {unlockedCount} di {achievements.length} sbloccati
          </CardDescription>
        </CardHeader>
        <CardContent>
          {/* Achievement Filters */}
          <Tabs value={selectedCategory} onValueChange={setSelectedCategory} className="mb-6">
            <TabsList className="grid w-full grid-cols-6">
              <TabsTrigger value="all">Tutti</TabsTrigger>
              <TabsTrigger value="unlocked">Sbloccati</TabsTrigger>
              <TabsTrigger value="locked">Bloccati</TabsTrigger>
              <TabsTrigger value="survival">Sopravvivenza</TabsTrigger>
              <TabsTrigger value="participation">Partecipazione</TabsTrigger>
              <TabsTrigger value="performance">Performance</TabsTrigger>
            </TabsList>
          </Tabs>

          {/* Achievements Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredAchievements.map((achievement) => (
              <Card
                key={achievement.id}
                className={`transition-all duration-200 ${
                  achievement.unlocked
                    ? "border-yellow-200 bg-yellow-50/50 hover:shadow-md"
                    : "border-gray-200 bg-gray-50/50 opacity-75"
                }`}
              >
                <CardContent className="p-4">
                  <div className="flex items-start space-x-3">
                    <div className={`p-2 rounded-lg ${
                      achievement.unlocked 
                        ? "bg-yellow-100 text-yellow-600" 
                        : "bg-gray-100 text-gray-400"
                    }`}>
                      {achievement.unlocked ? getAchievementIcon(achievement.icon) : <Lock className="h-8 w-8" />}
                    </div>
                    <div className="flex-1 space-y-2">
                      <div className="flex items-center justify-between">
                        <h4 className={`font-semibold ${achievement.unlocked ? "text-gray-900" : "text-gray-500"}`}>
                          {achievement.name}
                        </h4>
                        <div className="flex items-center space-x-1">
                          {getTypeIcon(achievement.type)}
                          <Badge className={`text-xs ${getRarityColor(achievement.rarity)}`}>
                            {achievement.rarity}
                          </Badge>
                        </div>
                      </div>
                      
                      <p className={`text-sm ${achievement.unlocked ? "text-gray-600" : "text-gray-400"}`}>
                        {achievement.description}
                      </p>
                      
                      {achievement.progress !== undefined && achievement.maxProgress && (
                        <div className="space-y-1">
                          <div className="flex justify-between text-xs">
                            <span>Progresso</span>
                            <span>{achievement.progress}/{achievement.maxProgress}</span>
                          </div>
                          <Progress 
                            value={(achievement.progress / achievement.maxProgress) * 100} 
                            className="h-2"
                          />
                        </div>
                      )}
                      
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium text-blue-600">
                          +{achievement.points} XP
                        </span>
                        {achievement.unlocked && achievement.unlockedAt && (
                          <span className="text-xs text-gray-500">
                            {achievement.unlockedAt.toLocaleDateString()}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {filteredAchievements.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              Nessun achievement trovato per questa categoria
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}