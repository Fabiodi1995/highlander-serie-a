import { pgTable, text, serial, integer, boolean, timestamp, varchar, json } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  email: text("email").notNull().unique(),
  password: text("password").notNull(),
  firstName: text("first_name").notNull(),
  lastName: text("last_name").notNull(),
  dateOfBirth: timestamp("date_of_birth"),
  phoneNumber: text("phone_number"),
  city: text("city"),
  country: text("country").default("Italia"),
  isAdmin: boolean("is_admin").default(false).notNull(),
  emailVerified: boolean("email_verified").default(false).notNull(),
  emailVerificationToken: text("email_verification_token"),
  emailVerificationSentAt: timestamp("email_verification_sent_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const teams = pgTable("teams", {
  id: serial("id").primaryKey(),
  name: text("name").notNull().unique(),
  code: varchar("code", { length: 3 }).notNull().unique(),
});

export const games = pgTable("games", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description"),
  startRound: integer("start_round").notNull(),
  currentRound: integer("current_round").notNull(),
  status: varchar("status", { length: 20 }).notNull().default("registration"), // registration, active, completed
  roundStatus: varchar("round_status", { length: 20 }).notNull().default("selection_open"), // selection_open, selection_locked, calculated
  createdBy: integer("created_by").notNull().references(() => users.id),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const gameParticipants = pgTable("game_participants", {
  id: serial("id").primaryKey(),
  gameId: integer("game_id").notNull().references(() => games.id),
  userId: integer("user_id").notNull().references(() => users.id),
  joinedAt: timestamp("joined_at").defaultNow().notNull(),
});

export const tickets = pgTable("tickets", {
  id: serial("id").primaryKey(),
  gameId: integer("game_id").notNull().references(() => games.id),
  userId: integer("user_id").notNull().references(() => users.id),
  isActive: boolean("is_active").default(true).notNull(),
  eliminatedInRound: integer("eliminated_in_round"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const matches = pgTable("matches", {
  id: serial("id").primaryKey(),
  round: integer("round").notNull(),
  homeTeamId: integer("home_team_id").notNull().references(() => teams.id),
  awayTeamId: integer("away_team_id").notNull().references(() => teams.id),
  homeScore: integer("home_score"),
  awayScore: integer("away_score"),
  result: varchar("result", { length: 1 }), // H, A, D (home win, away win, draw)
  matchDate: timestamp("match_date").notNull(),
  isCompleted: boolean("is_completed").default(false).notNull(),
});

export const teamSelections = pgTable("team_selections", {
  id: serial("id").primaryKey(),
  ticketId: integer("ticket_id").notNull().references(() => tickets.id),
  teamId: integer("team_id").notNull().references(() => teams.id),
  round: integer("round").notNull(),
  gameId: integer("game_id").notNull().references(() => games.id),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const achievements = pgTable("achievements", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description").notNull(),
  icon: text("icon").notNull(),
  type: text("type").notNull(), // survival, participation, performance
  criteria: json("criteria").notNull(), // flexible criteria object
  rarity: text("rarity").notNull(), // common, rare, epic, legendary
  points: integer("points").notNull().default(0),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const userAchievements = pgTable("user_achievements", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  achievementId: integer("achievement_id").notNull().references(() => achievements.id, { onDelete: "cascade" }),
  unlockedAt: timestamp("unlocked_at").defaultNow().notNull(),
  gameId: integer("game_id").references(() => games.id), // optional, for game-specific achievements
  progress: json("progress"), // track progress towards achievement
});

export const userStats = pgTable("user_stats", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  totalGamesPlayed: integer("total_games_played").notNull().default(0),
  totalRoundsSurvived: integer("total_rounds_survived").notNull().default(0),
  longestSurvivalStreak: integer("longest_survival_streak").notNull().default(0),
  totalWins: integer("total_wins").notNull().default(0),
  experiencePoints: integer("experience_points").notNull().default(0),
  currentLevel: integer("current_level").notNull().default(1),
  favoriteTeam: integer("favorite_team").references(() => teams.id),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Relations
export const usersRelations = relations(users, ({ one, many }) => ({
  createdGames: many(games),
  gameParticipants: many(gameParticipants),
  tickets: many(tickets),
  achievements: many(userAchievements),
  stats: one(userStats),
}));

export const gamesRelations = relations(games, ({ one, many }) => ({
  creator: one(users, {
    fields: [games.createdBy],
    references: [users.id],
  }),
  participants: many(gameParticipants),
  tickets: many(tickets),
  teamSelections: many(teamSelections),
}));

export const gameParticipantsRelations = relations(gameParticipants, ({ one }) => ({
  game: one(games, {
    fields: [gameParticipants.gameId],
    references: [games.id],
  }),
  user: one(users, {
    fields: [gameParticipants.userId],
    references: [users.id],
  }),
}));

export const ticketsRelations = relations(tickets, ({ one, many }) => ({
  game: one(games, {
    fields: [tickets.gameId],
    references: [games.id],
  }),
  user: one(users, {
    fields: [tickets.userId],
    references: [users.id],
  }),
  teamSelections: many(teamSelections),
}));

export const teamsRelations = relations(teams, ({ many }) => ({
  homeMatches: many(matches, { relationName: "homeTeam" }),
  awayMatches: many(matches, { relationName: "awayTeam" }),
  teamSelections: many(teamSelections),
}));

export const matchesRelations = relations(matches, ({ one }) => ({
  homeTeam: one(teams, {
    fields: [matches.homeTeamId],
    references: [teams.id],
    relationName: "homeTeam",
  }),
  awayTeam: one(teams, {
    fields: [matches.awayTeamId],
    references: [teams.id],
    relationName: "awayTeam",
  }),
}));

export const teamSelectionsRelations = relations(teamSelections, ({ one }) => ({
  ticket: one(tickets, {
    fields: [teamSelections.ticketId],
    references: [tickets.id],
  }),
  team: one(teams, {
    fields: [teamSelections.teamId],
    references: [teams.id],
  }),
  game: one(games, {
    fields: [teamSelections.gameId],
    references: [games.id],
  }),
}));

export const achievementsRelations = relations(achievements, ({ many }) => ({
  userAchievements: many(userAchievements),
}));

export const userAchievementsRelations = relations(userAchievements, ({ one }) => ({
  user: one(users, {
    fields: [userAchievements.userId],
    references: [users.id],
  }),
  achievement: one(achievements, {
    fields: [userAchievements.achievementId],
    references: [achievements.id],
  }),
  game: one(games, {
    fields: [userAchievements.gameId],
    references: [games.id],
  }),
}));

export const userStatsRelations = relations(userStats, ({ one }) => ({
  user: one(users, {
    fields: [userStats.userId],
    references: [users.id],
  }),
  favoriteTeamRef: one(teams, {
    fields: [userStats.favoriteTeam],
    references: [teams.id],
  }),
}));

// Insert schemas
export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  email: true,
  password: true,
  firstName: true,
  lastName: true,
  dateOfBirth: true,
  phoneNumber: true,
  city: true,
  country: true,
}).extend({
  email: z.string().email("Email non valida"),
  firstName: z.string().min(2, "Nome deve avere almeno 2 caratteri"),
  lastName: z.string().min(2, "Cognome deve avere almeno 2 caratteri"),
  username: z.string().min(3, "Username deve avere almeno 3 caratteri"),
  password: z.string().min(6, "Password deve avere almeno 6 caratteri"),
  phoneNumber: z.string().optional(),
  city: z.string().optional(),
  country: z.string().optional(),
  dateOfBirth: z.string().optional().transform((val) => val ? new Date(val) : undefined),
});

export const insertGameSchema = createInsertSchema(games).pick({
  name: true,
  description: true,
  startRound: true,
});

export const insertTeamSelectionSchema = createInsertSchema(teamSelections).pick({
  ticketId: true,
  teamId: true,
  round: true,
  gameId: true,
});

// Types
export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;
export type Game = typeof games.$inferSelect;
export type InsertGame = z.infer<typeof insertGameSchema>;
export type Team = typeof teams.$inferSelect;
export type Ticket = typeof tickets.$inferSelect;
export type Match = typeof matches.$inferSelect;
export type TeamSelection = typeof teamSelections.$inferSelect;
export type InsertTeamSelection = z.infer<typeof insertTeamSelectionSchema>;
export type GameParticipant = typeof gameParticipants.$inferSelect;
export type Achievement = typeof achievements.$inferSelect;
export type UserAchievement = typeof userAchievements.$inferSelect;
export type UserStats = typeof userStats.$inferSelect;
