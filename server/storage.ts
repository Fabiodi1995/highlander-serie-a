import { 
  users, games, teams, tickets, matches, teamSelections, gameParticipants,
  type User, type InsertUser, type Game, type InsertGame, type Team, 
  type Ticket, type Match, type TeamSelection, type InsertTeamSelection,
  type GameParticipant
} from "@shared/schema";
import { db } from "./db";
import { eq, and, desc, asc, sql, inArray } from "drizzle-orm";
import session from "express-session";
import connectPg from "connect-pg-simple";
import { pool } from "./db";

const PostgresSessionStore = connectPg(session);

export interface IStorage {
  // User management
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  getAllUsers(): Promise<User[]>;
  
  // Game management
  createGame(game: InsertGame & { createdBy: number }): Promise<Game>;
  getGamesByCreator(creatorId: number): Promise<Game[]>;
  getGamesByParticipant(userId: number): Promise<Game[]>;
  getGame(id: number): Promise<Game | undefined>;
  updateGameStatus(gameId: number, status: string): Promise<void>;
  updateGameRound(gameId: number, round: number): Promise<void>;
  updateGameRoundStatus(gameId: number, roundStatus: string): Promise<void>;
  deleteGame(gameId: number): Promise<void>;
  
  // Game participants
  addGameParticipant(gameId: number, userId: number): Promise<GameParticipant>;
  getGameParticipants(gameId: number): Promise<GameParticipant[]>;
  
  // Ticket management
  createTicket(gameId: number, userId: number): Promise<Ticket>;
  getTicketsByGame(gameId: number): Promise<Ticket[]>;
  getTicketsByUser(userId: number, gameId?: number): Promise<Ticket[]>;
  eliminateTicket(ticketId: number, round: number): Promise<void>;
  
  // Team management
  getAllTeams(): Promise<Team[]>;
  seedTeams(): Promise<void>;
  
  // Match management
  getMatchesByRound(round: number): Promise<Match[]>;
  seedMatches(): Promise<void>;
  updateMatchResult(matchId: number, homeScore: number, awayScore: number): Promise<void>;
  resetMatchResults(round: number): Promise<void>;
  
  // Team selections
  createTeamSelection(selection: InsertTeamSelection): Promise<TeamSelection>;
  updateTeamSelection(selectionId: number, teamId: number): Promise<TeamSelection>;
  getTeamSelectionsByTicket(ticketId: number): Promise<TeamSelection[]>;
  getTeamSelectionsByRound(gameId: number, round: number): Promise<TeamSelection[]>;
  hasTeamBeenSelected(ticketId: number, teamId: number): Promise<boolean>;
  
  sessionStore: any;
}

export class DatabaseStorage implements IStorage {
  sessionStore: any;

  constructor() {
    this.sessionStore = new PostgresSessionStore({ 
      pool, 
      createTableIfMissing: true 
    });
  }

  // User management
  async getUser(id: number): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user || undefined;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user || undefined;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values({
        ...insertUser,
        emailVerified: false,
        isAdmin: false
      })
      .returning();
    return user;
  }

  async getAllUsers(): Promise<User[]> {
    return await db.select().from(users).orderBy(asc(users.username));
  }

  // Game management
  async createGame(game: InsertGame & { createdBy: number }): Promise<Game> {
    const [newGame] = await db
      .insert(games)
      .values({
        ...game,
        currentRound: game.startRound,
      })
      .returning();
    return newGame;
  }

  async getGamesByCreator(creatorId: number): Promise<Game[]> {
    return await db
      .select()
      .from(games)
      .where(eq(games.createdBy, creatorId))
      .orderBy(desc(games.createdAt));
  }

  async getGamesByParticipant(userId: number): Promise<Game[]> {
    return await db
      .select({
        id: games.id,
        name: games.name,
        description: games.description,
        startRound: games.startRound,
        currentRound: games.currentRound,
        status: games.status,
        roundStatus: games.roundStatus,
        createdBy: games.createdBy,
        createdAt: games.createdAt,
      })
      .from(games)
      .innerJoin(gameParticipants, eq(games.id, gameParticipants.gameId))
      .where(eq(gameParticipants.userId, userId))
      .orderBy(desc(games.createdAt));
  }

  async getGame(id: number): Promise<Game | undefined> {
    const [game] = await db.select().from(games).where(eq(games.id, id));
    return game || undefined;
  }

  async updateGameStatus(gameId: number, status: string): Promise<void> {
    await db
      .update(games)
      .set({ status })
      .where(eq(games.id, gameId));
  }

  async updateGameRound(gameId: number, round: number): Promise<void> {
    await db
      .update(games)
      .set({ currentRound: round })
      .where(eq(games.id, gameId));
  }

  async updateGameRoundStatus(gameId: number, roundStatus: string): Promise<void> {
    await db
      .update(games)
      .set({ roundStatus })
      .where(eq(games.id, gameId));
  }

  async deleteGame(gameId: number): Promise<void> {
    // Delete in correct order due to foreign key constraints
    await db.delete(teamSelections).where(eq(teamSelections.gameId, gameId));
    await db.delete(tickets).where(eq(tickets.gameId, gameId));
    await db.delete(gameParticipants).where(eq(gameParticipants.gameId, gameId));
    await db.delete(games).where(eq(games.id, gameId));
  }

  // Game participants
  async addGameParticipant(gameId: number, userId: number): Promise<GameParticipant> {
    const [participant] = await db
      .insert(gameParticipants)
      .values({ gameId, userId })
      .returning();
    return participant;
  }

  async getGameParticipants(gameId: number): Promise<GameParticipant[]> {
    return await db
      .select()
      .from(gameParticipants)
      .where(eq(gameParticipants.gameId, gameId));
  }

  // Ticket management
  async createTicket(gameId: number, userId: number): Promise<Ticket> {
    const [ticket] = await db
      .insert(tickets)
      .values({ 
        gameId, 
        userId, 
        isActive: true 
      })
      .returning();
    return ticket;
  }

  async getTicketsByGame(gameId: number): Promise<Ticket[]> {
    return await db
      .select()
      .from(tickets)
      .where(eq(tickets.gameId, gameId))
      .orderBy(asc(tickets.id));
  }

  async getTicketsByUser(userId: number, gameId?: number): Promise<Ticket[]> {
    if (gameId) {
      return await db.select().from(tickets).where(and(eq(tickets.userId, userId), eq(tickets.gameId, gameId)));
    }
    
    return await db.select().from(tickets).where(eq(tickets.userId, userId));
  }

  async eliminateTicket(ticketId: number, round: number): Promise<void> {
    await db
      .update(tickets)
      .set({ 
        isActive: false, 
        eliminatedInRound: round 
      })
      .where(eq(tickets.id, ticketId));
  }

  // Team management
  async getAllTeams(): Promise<Team[]> {
    return await db.select().from(teams).orderBy(asc(teams.name));
  }

  async seedTeams(): Promise<void> {
    const serieATeams2024_25 = [
      { name: "Atalanta", code: "ATA" },
      { name: "Bologna", code: "BOL" },
      { name: "Cagliari", code: "CAG" },
      { name: "Como", code: "COM" },
      { name: "Empoli", code: "EMP" },
      { name: "Fiorentina", code: "FIO" },
      { name: "Genoa", code: "GEN" },
      { name: "Hellas Verona", code: "VER" },
      { name: "Inter", code: "INT" },
      { name: "Juventus", code: "JUV" },
      { name: "Lazio", code: "LAZ" },
      { name: "Lecce", code: "LEC" },
      { name: "Milan", code: "MIL" },
      { name: "Monza", code: "MON" },
      { name: "Napoli", code: "NAP" },
      { name: "Parma", code: "PAR" },
      { name: "Roma", code: "ROM" },
      { name: "Torino", code: "TOR" },
      { name: "Udinese", code: "UDI" },
      { name: "Venezia", code: "VEN" }
    ];

    const existingTeams = await this.getAllTeams();
    if (existingTeams.length === 0) {
      await db.insert(teams).values(serieATeams2024_25);
    }
  }

  // Match management
  async getMatchesByRound(round: number): Promise<Match[]> {
    return await db
      .select()
      .from(matches)
      .where(eq(matches.round, round))
      .orderBy(asc(matches.matchDate));
  }

  async seedMatches(): Promise<void> {
    // Matches will be populated from external Serie A API
    // This method is prepared for integration with authentic data sources
    const existingMatches = await db.select().from(matches).limit(1);
    if (existingMatches.length === 0) {
      // System is ready for external API integration
      // Administrator must configure Serie A data source for authentic match data
      console.log("Match data seeding prepared - requires Serie A API integration");
    }
  }

  async updateMatchResult(matchId: number, homeScore: number, awayScore: number): Promise<void> {
    let result: string;
    if (homeScore > awayScore) result = 'H';
    else if (awayScore > homeScore) result = 'A';
    else result = 'D';

    await db
      .update(matches)
      .set({ 
        homeScore, 
        awayScore, 
        result, 
        isCompleted: true 
      })
      .where(eq(matches.id, matchId));
  }

  async resetMatchResults(round: number): Promise<void> {
    await db
      .update(matches)
      .set({ 
        homeScore: null, 
        awayScore: null, 
        result: null, 
        isCompleted: false 
      })
      .where(eq(matches.round, round));
  }

  // Team selections
  async createTeamSelection(selection: InsertTeamSelection): Promise<TeamSelection> {
    const [teamSelection] = await db
      .insert(teamSelections)
      .values(selection)
      .returning();
    return teamSelection;
  }

  async getTeamSelectionsByTicket(ticketId: number): Promise<TeamSelection[]> {
    return await db
      .select()
      .from(teamSelections)
      .where(eq(teamSelections.ticketId, ticketId))
      .orderBy(asc(teamSelections.round));
  }

  async getTeamSelectionsByRound(gameId: number, round: number): Promise<TeamSelection[]> {
    // If round is 0, get all rounds; otherwise filter by specific round
    const whereConditions = round === 0 
      ? eq(teamSelections.gameId, gameId)
      : and(eq(teamSelections.gameId, gameId), eq(teamSelections.round, round));
    
    return await db
      .select()
      .from(teamSelections)
      .where(whereConditions)
      .orderBy(asc(teamSelections.round));
  }

  async updateTeamSelection(selectionId: number, teamId: number): Promise<TeamSelection> {
    const [selection] = await db
      .update(teamSelections)
      .set({ teamId })
      .where(eq(teamSelections.id, selectionId))
      .returning();
    return selection;
  }

  async hasTeamBeenSelected(ticketId: number, teamId: number): Promise<boolean> {
    const [selection] = await db
      .select()
      .from(teamSelections)
      .where(and(
        eq(teamSelections.ticketId, ticketId),
        eq(teamSelections.teamId, teamId)
      ))
      .limit(1);
    
    return !!selection;
  }
}

export const storage = new DatabaseStorage();
