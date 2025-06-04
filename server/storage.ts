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
  
  // Game management
  createGame(game: InsertGame & { createdBy: number }): Promise<Game>;
  getGamesByCreator(creatorId: number): Promise<Game[]>;
  getGamesByParticipant(userId: number): Promise<Game[]>;
  getGame(id: number): Promise<Game | undefined>;
  updateGameStatus(gameId: number, status: string): Promise<void>;
  updateGameRound(gameId: number, round: number): Promise<void>;
  
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
  
  // Team selections
  createTeamSelection(selection: InsertTeamSelection): Promise<TeamSelection>;
  getTeamSelectionsByTicket(ticketId: number): Promise<TeamSelection[]>;
  getTeamSelectionsByRound(gameId: number, round: number): Promise<TeamSelection[]>;
  hasTeamBeenSelected(ticketId: number, teamId: number): Promise<boolean>;
  
  sessionStore: session.Store;
}

export class DatabaseStorage implements IStorage {
  sessionStore: session.Store;

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
      .values(insertUser)
      .returning();
    return user;
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
      .values({ gameId, userId })
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
    const serieATeams = [
      { name: "Atalanta", code: "ATA" },
      { name: "Bologna", code: "BOL" },
      { name: "Cagliari", code: "CAG" },
      { name: "Empoli", code: "EMP" },
      { name: "Fiorentina", code: "FIO" },
      { name: "Frosinone", code: "FRO" },
      { name: "Genoa", code: "GEN" },
      { name: "Inter", code: "INT" },
      { name: "Juventus", code: "JUV" },
      { name: "Lazio", code: "LAZ" },
      { name: "Lecce", code: "LEC" },
      { name: "Milan", code: "MIL" },
      { name: "Monza", code: "MON" },
      { name: "Napoli", code: "NAP" },
      { name: "Roma", code: "ROM" },
      { name: "Salernitana", code: "SAL" },
      { name: "Sassuolo", code: "SAS" },
      { name: "Torino", code: "TOR" },
      { name: "Udinese", code: "UDI" },
      { name: "Verona", code: "VER" }
    ];

    const existingTeams = await this.getAllTeams();
    if (existingTeams.length === 0) {
      await db.insert(teams).values(serieATeams);
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
    // This would typically be populated from an external API
    // For now, we'll create some sample matches for testing
    const existingMatches = await db.select().from(matches).limit(1);
    if (existingMatches.length === 0) {
      // Create sample matches for rounds 8-12
      const sampleMatches = [
        // Round 8
        { round: 8, homeTeamId: 1, awayTeamId: 2, matchDate: new Date('2024-11-02T15:00:00Z') },
        { round: 8, homeTeamId: 3, awayTeamId: 4, matchDate: new Date('2024-11-02T18:00:00Z') },
        { round: 8, homeTeamId: 5, awayTeamId: 6, matchDate: new Date('2024-11-03T15:00:00Z') },
        // Round 9
        { round: 9, homeTeamId: 2, awayTeamId: 3, matchDate: new Date('2024-11-09T15:00:00Z') },
        { round: 9, homeTeamId: 4, awayTeamId: 5, matchDate: new Date('2024-11-09T18:00:00Z') },
        { round: 9, homeTeamId: 6, awayTeamId: 1, matchDate: new Date('2024-11-10T15:00:00Z') },
      ];
      
      await db.insert(matches).values(sampleMatches);
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
    return await db
      .select()
      .from(teamSelections)
      .where(and(
        eq(teamSelections.gameId, gameId),
        eq(teamSelections.round, round)
      ));
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
