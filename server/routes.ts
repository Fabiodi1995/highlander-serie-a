import type { Express } from "express";
import { createServer, type Server } from "http";
import { setupAuth } from "./auth";
import { storage } from "./storage";
import { insertGameSchema, insertTeamSelectionSchema, tickets, users } from "@shared/schema";
import { checkGameEndConditions, finalizeGame } from "./game-logic";
import { checkExpiredDeadlines, validateSelectionDeadline } from "./timer-service";
import { emailService } from "./unified-email-service";
import { EMAIL_CONFIG } from "./email-config";
import { z } from "zod";
import { db, withTransaction, batchOperation } from "./db";
import { eq } from "drizzle-orm";
import { serieAManager } from "./serieAManager";
import bcrypt from "bcryptjs";

export async function registerRoutes(app: Express): Promise<Server> {
  // Setup authentication routes
  setupAuth(app);

  // Initialize data
  await storage.seedTeams();
  await storage.seedMatches();

  // Users API (admin only)
  app.get("/api/users", async (req, res) => {
    if (!req.isAuthenticated() || !req.user!.isAdmin) return res.sendStatus(403);
    
    try {
      const users = await storage.getAllUsers();
      res.json(users);
    } catch (error) {
      console.error("Error fetching users:", error);
      res.status(500).json({ message: "Failed to fetch users" });
    }
  });

  // Games API
  app.get("/api/games", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    
    try {
      if (req.user!.isAdmin) {
        const games = await storage.getGamesByCreator(req.user!.id);
        res.json(games);
      } else {
        const games = await storage.getGamesByParticipant(req.user!.id);
        res.json(games);
      }
    } catch (error) {
      console.error("Error fetching games:", error);
      res.status(500).json({ message: "Failed to fetch games" });
    }
  });

  app.post("/api/games", async (req, res) => {
    if (!req.isAuthenticated() || !req.user!.isAdmin) return res.sendStatus(403);
    
    try {
      const gameData = insertGameSchema.parse(req.body);
      const game = await storage.createGame({
        ...gameData,
        createdBy: req.user!.id
      });
      res.status(201).json(game);
    } catch (error) {
      console.error("Error creating game:", error);
      res.status(400).json({ message: "Invalid game data" });
    }
  });

  app.get("/api/games/:id", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    
    try {
      const gameId = parseInt(req.params.id);
      const game = await storage.getGame(gameId);
      
      if (!game) {
        return res.status(404).json({ message: "Game not found" });
      }
      
      res.json(game);
    } catch (error) {
      console.error("Error fetching game:", error);
      res.status(500).json({ message: "Failed to fetch game" });
    }
  });

  app.delete("/api/games/:id", async (req, res) => {
    console.log("DELETE GAME - Game ID:", req.params.id);
    
    try {
      const gameId = parseInt(req.params.id);
      const game = await storage.getGame(gameId);
      
      if (!game) {
        return res.status(404).json({ message: "Game not found" });
      }
      
      await storage.deleteGame(gameId);
      res.json({ message: "Game deleted successfully" });
    } catch (error) {
      console.error("Error deleting game:", error);
      res.status(500).json({ message: "Failed to delete game" });
    }
  });

  app.post("/api/games/:id/close-registration", async (req, res) => {
    if (!req.isAuthenticated() || !req.user!.isAdmin) return res.sendStatus(403);
    
    try {
      const gameId = parseInt(req.params.id);
      const game = await storage.getGame(gameId);
      
      if (!game) {
        return res.status(404).json({ message: "Game not found" });
      }
      
      // Verify admin owns this game
      if (game.createdBy !== req.user!.id) {
        return res.status(403).json({ message: "Access denied - not your game" });
      }
      
      if (game.status !== "registration") {
        return res.status(400).json({ message: "Registration is not open for this game" });
      }
      
      await storage.updateGameStatus(gameId, "active");
      res.json({ message: "Registration closed, game started" });
    } catch (error) {
      console.error("Error closing registration:", error);
      res.status(500).json({ message: "Failed to close registration" });
    }
  });

  app.post("/api/games/:id/calculate-turn", async (req, res) => {
    console.log("CALCULATE TURN - Game ID:", req.params.id);
    
    try {
      const gameId = parseInt(req.params.id);
      const game = await storage.getGame(gameId);
      
      if (!game) {
        return res.status(404).json({ message: "Game not found" });
      }

      if (game.status !== "active") {
        return res.status(400).json({ message: "Game is not active" });
      }

      // Get all team selections for current round
      const selections = await storage.getTeamSelectionsByRound(gameId, game.currentRound);
      
      // Get matches for current round
      const matches = await storage.getMatchesByRound(game.currentRound);
      
      // Validate all matches are completed before calculating
      const incompleteMatches = matches.filter(m => !m.isCompleted);
      if (incompleteMatches.length > 0) {
        return res.status(400).json({ 
          message: "Cannot calculate turn - some matches are not completed yet" 
        });
      }
      
      // Process eliminations based on match results
      for (const selection of selections) {
        const match = matches.find(m => 
          (m.homeTeamId === selection.teamId || m.awayTeamId === selection.teamId) && 
          m.isCompleted
        );
        
        if (match && match.result) {
          // Eliminate tickets for teams that did NOT win (lost or drew)
          const teamWon = (match.homeTeamId === selection.teamId && match.result === 'H') ||
                         (match.awayTeamId === selection.teamId && match.result === 'A');
          
          if (!teamWon) {
            await storage.eliminateTicket(selection.ticketId, game.currentRound);
          }
        }
      }
      
      // Check for winner determination
      const activeTickets = await storage.getTicketsByGame(gameId);
      const remainingActiveTickets = activeTickets.filter(t => t.isActive);
      
      if (remainingActiveTickets.length === 0) {
        // No survivors - game ends in draw
        await storage.updateGameStatus(gameId, "completed");
        return res.json({ 
          message: "Turn calculated - No survivors, game ended", 
          gameStatus: "completed",
          winner: null 
        });
      }
      
      // Check if only one player has active tickets
      const playersWithActiveTickets = new Set(remainingActiveTickets.map(t => t.userId));
      if (playersWithActiveTickets.size === 1) {
        // Single winner
        const winnerId = Array.from(playersWithActiveTickets)[0];
        await storage.updateGameStatus(gameId, "completed");
        return res.json({ 
          message: "Turn calculated - Winner determined!", 
          gameStatus: "completed",
          winnerId 
        });
      }
      
      // Check if this is the final round of Serie A (round 38)
      if (game.currentRound >= 38) {
        // Multiple survivors at season end - all are winners
        await storage.updateGameStatus(gameId, "completed");
        return res.json({ 
          message: "Season ended - Multiple winners!", 
          gameStatus: "completed",
          multipleWinners: true,
          survivors: remainingActiveTickets 
        });
      }
      
      // Mark round as calculated
      await storage.updateGameRoundStatus(gameId, "calculated");
      
      res.json({ 
        message: "Turn calculated successfully",
        currentRound: game.currentRound,
        remainingTickets: remainingActiveTickets.length
      });
    } catch (error) {
      console.error("Error calculating turn:", error);
      res.status(500).json({ message: "Failed to calculate turn" });
    }
  });

  // Tickets API
  app.get("/api/games/:id/tickets", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    
    try {
      const gameId = parseInt(req.params.id);
      const tickets = await storage.getTicketsByUser(req.user!.id, gameId);
      res.json(tickets);
    } catch (error) {
      console.error("Error fetching tickets:", error);
      res.status(500).json({ message: "Failed to fetch tickets" });
    }
  });

  // Get player history for a specific game (for player dashboard)
  app.get("/api/games/:id/player-history", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    
    try {
      const gameId = parseInt(req.params.id);
      
      // Verify game exists
      const game = await storage.getGame(gameId);
      if (!game) {
        return res.status(404).json({ message: "Game not found" });
      }
      
      // Check if user is participant or admin
      const participants = await storage.getGameParticipants(gameId);
      const isParticipant = participants.some(p => p.userId === req.user!.id);
      const isAdmin = req.user!.isAdmin;
      
      if (!isParticipant && !isAdmin) {
        return res.status(403).json({ message: "Access denied - not a participant" });
      }
      
      // Get all tickets for this game
      const gameTickets = await storage.getTicketsByGame(gameId);
      
      // Get all users who have tickets in this game
      const userIds = Array.from(new Set(gameTickets.map(ticket => ticket.userId)));
      const users = await Promise.all(userIds.map(id => storage.getUser(id)));
      const usersMap = users.reduce((acc: any, user) => {
        if (user) acc[user.id] = user;
        return acc;
      }, {});
      
      // Enhance tickets with user data
      const ticketsWithUsers = gameTickets.map(ticket => ({
        ...ticket,
        user: usersMap[ticket.userId]
      }));
      
      // Get all team selections for this game
      const allSelections = [];
      for (const ticket of gameTickets) {
        const selections = await storage.getTeamSelectionsByTicket(ticket.id);
        allSelections.push(...selections);
      }
      
      // Group selections by ticket and round for easy access
      const selectionsByTicket = allSelections.reduce((acc: any, selection: any) => {
        if (!acc[selection.ticketId]) {
          acc[selection.ticketId] = {};
        }
        acc[selection.ticketId][selection.round] = selection;
        return acc;
      }, {});
      
      res.json({
        game,
        tickets: ticketsWithUsers,
        selections: selectionsByTicket
      });
    } catch (error) {
      console.error("Error fetching player history:", error);
      res.status(500).json({ message: "Server error" });
    }
  });

  // Get all tickets for a game (for detailed view)
  app.get("/api/games/:id/all-tickets", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    
    try {
      const gameId = parseInt(req.params.id);
      
      // Verify user has access to this game (is participant or admin)
      const game = await storage.getGame(gameId);
      if (!game) {
        return res.status(404).json({ message: "Game not found" });
      }
      
      // Check if user is admin or participant
      const participants = await storage.getGameParticipants(gameId);
      const isParticipant = participants.some(p => p.userId === req.user!.id);
      const isAdmin = req.user!.isAdmin && game.createdBy === req.user!.id;
      
      if (!isParticipant && !isAdmin) {
        return res.status(403).json({ message: "Access denied - not a participant" });
      }
      
      // Get all tickets for this game
      const allTickets = await storage.getTicketsByGame(gameId);
      
      // Get all users who have tickets in this game
      const userIds = Array.from(new Set(allTickets.map(ticket => ticket.userId)));
      const users = await Promise.all(userIds.map(id => storage.getUser(id)));
      const usersMap = users.reduce((acc: any, user) => {
        if (user) acc[user.id] = user;
        return acc;
      }, {});
      
      // Get all team selections for this game
      const allSelections = await storage.getTeamSelectionsByRound(gameId, 0); // 0 means all rounds
      
      // Group selections by ticket
      const selectionsByTicket = allSelections.reduce((acc: any, selection: any) => {
        if (!acc[selection.ticketId]) {
          acc[selection.ticketId] = [];
        }
        acc[selection.ticketId].push(selection);
        return acc;
      }, {});
      
      // Combine tickets with their selections and user info
      const ticketsWithSelections = allTickets.map(ticket => ({
        ticket: {
          ...ticket,
          user: usersMap[ticket.userId]
        },
        selections: selectionsByTicket[ticket.id] || []
      }));
      
      res.json({
        game,
        ticketSelections: ticketsWithSelections
      });
    } catch (error) {
      console.error("Error fetching all tickets:", error);
      res.status(500).json({ message: "Failed to fetch all tickets" });
    }
  });

  app.post("/api/games/:id/tickets", async (req, res) => {
    if (!req.isAuthenticated() || !req.user!.isAdmin) return res.sendStatus(403);
    
    try {
      const gameId = parseInt(req.params.id);
      const { userId, count = 1 } = req.body;
      
      const game = await storage.getGame(gameId);
      if (!game) {
        return res.status(404).json({ message: "Game not found" });
      }
      
      // Verify admin owns this game
      if (game.createdBy !== req.user!.id) {
        return res.status(403).json({ message: "Access denied - not your game" });
      }
      
      if (game.status !== "registration") {
        return res.status(400).json({ message: "Cannot assign tickets - registration is closed" });
      }
      
      // Validate user exists and is not admin
      const targetUser = await storage.getUser(userId);
      if (!targetUser) {
        return res.status(404).json({ message: "User not found" });
      }
      
      if (targetUser.isAdmin) {
        return res.status(400).json({ message: "Cannot assign tickets to admin users" });
      }
      
      // Validate ticket count
      if (count < 1 || count > 10) {
        return res.status(400).json({ message: "Ticket count must be between 1 and 10" });
      }
      
      const tickets = [];
      for (let i = 0; i < count; i++) {
        const ticket = await storage.createTicket(gameId, userId);
        tickets.push(ticket);
      }
      
      // Add user as participant if not already
      try {
        await storage.addGameParticipant(gameId, userId);
      } catch (error) {
        // User might already be a participant, ignore error
      }
      
      res.status(201).json(tickets);
    } catch (error) {
      console.error("Error creating tickets:", error);
      res.status(500).json({ message: "Failed to create tickets" });
    }
  });

  // Teams API
  app.get("/api/teams", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    
    try {
      const teams = await storage.getAllTeams();
      res.json(teams);
    } catch (error) {
      console.error("Error fetching teams:", error);
      res.status(500).json({ message: "Failed to fetch teams" });
    }
  });

  // Team selections API
  app.post("/api/team-selections", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    
    try {
      const selections = z.array(insertTeamSelectionSchema).parse(req.body);
      
      // Validate game status for team selections
      if (selections.length > 0) {
        const gameId = selections[0].gameId;
        
        const game = await storage.getGame(gameId);
        if (!game || game.status !== "active") {
          return res.status(400).json({ message: "Game is not active" });
        }
        
        if (game.roundStatus !== "selection_open") {
          return res.status(400).json({ message: "Selections are locked for this round" });
        }
      }
      
      const results = [];
      for (const selection of selections) {
        // Verify ticket belongs to user
        const tickets = await storage.getTicketsByUser(req.user!.id, selection.gameId);
        const ticket = tickets.find(t => t.id === selection.ticketId);
        
        if (!ticket) {
          return res.status(403).json({ message: "Ticket not found or does not belong to user" });
        }
        
        if (!ticket.isActive) {
          return res.status(400).json({ message: "Ticket is not active" });
        }
        
        // Check if team was already selected by this ticket in the current round
        const existingSelections = await storage.getTeamSelectionsByTicket(selection.ticketId);
        const currentRoundSelection = existingSelections.find(s => s.round === selection.round);
        
        // If there's already a selection for this round, update it instead of creating new
        let teamSelection;
        if (currentRoundSelection) {
          teamSelection = await storage.updateTeamSelection(currentRoundSelection.id, selection.teamId);
        } else {
          // Check if team was already selected by this ticket in previous rounds
          const alreadySelected = await storage.hasTeamBeenSelected(selection.ticketId, selection.teamId);
          if (alreadySelected) {
            return res.status(400).json({ message: "Team already selected by this ticket in a previous round" });
          }
          teamSelection = await storage.createTeamSelection(selection);
        }
        results.push(teamSelection);
      }
      
      res.status(201).json(results);
    } catch (error) {
      console.error("Error creating team selections:", error);
      res.status(400).json({ message: "Invalid selection data" });
    }
  });

  app.get("/api/tickets/:id/selections", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    
    try {
      const ticketId = parseInt(req.params.id);
      
      // Verify ticket belongs to user
      const tickets = await storage.getTicketsByUser(req.user!.id);
      const ticket = tickets.find(t => t.id === ticketId);
      
      if (!ticket) {
        return res.status(403).json({ message: "Access denied" });
      }
      
      const selections = await storage.getTeamSelectionsByTicket(ticketId);
      res.json(selections);
    } catch (error) {
      console.error("Error fetching selections:", error);
      res.status(500).json({ message: "Failed to fetch selections" });
    }
  });

  // Get all team selections for user's tickets grouped by game
  app.get("/api/user/team-selections", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    
    try {
      const userTickets = await storage.getTicketsByUser(req.user!.id);
      const gamesData = [];
      
      // Group tickets by game
      const ticketsByGame = userTickets.reduce((acc, ticket) => {
        if (!acc[ticket.gameId]) {
          acc[ticket.gameId] = [];
        }
        acc[ticket.gameId].push(ticket);
        return acc;
      }, {} as Record<number, any[]>);
      
      for (const [gameId, tickets] of Object.entries(ticketsByGame)) {
        const game = await storage.getGame(parseInt(gameId));
        const gameSelections = [];
        
        for (const ticket of tickets) {
          const selections = await storage.getTeamSelectionsByTicket(ticket.id);
          gameSelections.push({
            ticket,
            selections
          });
        }
        
        gamesData.push({
          game,
          ticketSelections: gameSelections
        });
      }
      
      res.json(gamesData);
    } catch (error) {
      console.error("Error fetching user team selections:", error);
      res.status(500).json({ message: "Server error" });
    }
  });

  // Round control endpoints
  app.post("/api/games/:id/lock-round", async (req, res) => {
    if (!req.isAuthenticated() || !req.user!.isAdmin) return res.sendStatus(403);
    
    try {
      const gameId = parseInt(req.params.id);
      const game = await storage.getGame(gameId);
      
      if (!game) {
        return res.status(404).json({ message: "Game not found" });
      }
      
      if (game.createdBy !== req.user!.id) {
        return res.status(403).json({ message: "Access denied - not your game" });
      }
      
      if (game.roundStatus !== "selection_open") {
        return res.status(400).json({ message: "Round is not in selection phase" });
      }
      
      // Check for missing selections
      const activeTickets = await storage.getTicketsByGame(gameId);
      const activeTicketIds = activeTickets.filter(t => t.isActive).map(t => t.id);
      const existingSelections = await storage.getTeamSelectionsByRound(gameId, game.currentRound);
      const ticketsWithSelections = new Set(existingSelections.map(s => s.ticketId));
      
      const missingSelections = activeTicketIds.filter(id => !ticketsWithSelections.has(id));
      
      if (missingSelections.length > 0 && !req.body.forceConfirm) {
        return res.status(400).json({ 
          message: "Some tickets have not made selections",
          missingSelections,
          requiresConfirmation: true
        });
      }
      
      // Auto-assign first available team for tickets without selections
      if (missingSelections.length > 0) {
        const teams = await storage.getAllTeams();
        const sortedTeams = teams.sort((a, b) => a.name.localeCompare(b.name));
        
        for (const ticketId of missingSelections) {
          const existingTicketSelections = await storage.getTeamSelectionsByTicket(ticketId);
          const usedTeamIds = new Set(existingTicketSelections.map(s => s.teamId));
          const availableTeam = sortedTeams.find(team => !usedTeamIds.has(team.id));
          
          if (availableTeam) {
            await storage.createTeamSelection({
              ticketId,
              teamId: availableTeam.id,
              round: game.currentRound,
              gameId: gameId
            });
          }
        }
      }
      
      await storage.updateGameRoundStatus(gameId, "selection_locked");
      
      res.json({ 
        message: "Round locked successfully",
        autoAssigned: missingSelections.length
      });
    } catch (error) {
      console.error("Error locking round:", error);
      res.status(500).json({ message: "Failed to lock round" });
    }
  });

  app.post("/api/games/:id/start-new-round", async (req, res) => {
    if (!req.isAuthenticated() || !req.user!.isAdmin) return res.sendStatus(403);
    
    try {
      const gameId = parseInt(req.params.id);
      const game = await storage.getGame(gameId);
      
      if (!game) {
        return res.status(404).json({ message: "Game not found" });
      }
      
      if (game.createdBy !== req.user!.id) {
        return res.status(403).json({ message: "Access denied - not your game" });
      }
      
      if (game.roundStatus !== "calculated") {
        return res.status(400).json({ message: "Previous round must be calculated first" });
      }
      
      // Check round limits
      const newRound = game.currentRound + 1;
      const serieARound = game.startRound + newRound - 1;
      
      if (newRound > 20) {
        return res.status(400).json({ message: "Maximum 20 rounds reached" });
      }
      
      if (serieARound > 38) {
        return res.status(400).json({ message: "Serie A season ended (38 rounds maximum)" });
      }
      
      // Check if game should end due to Serie A season completion
      if (serieARound === 38) {
        const activeTickets = await storage.getTicketsByGame(gameId);
        const remainingTickets = activeTickets.filter(t => t.isActive);
        
        if (remainingTickets.length > 1) {
          await storage.updateGameStatus(gameId, "completed");
          return res.json({ 
            message: "Game completed - Serie A season ended with multiple winners",
            multipleWinners: true,
            survivors: remainingTickets.length
          });
        }
      }
      
      await storage.updateGameRound(gameId, newRound);
      await storage.updateGameRoundStatus(gameId, "selection_open");
      
      // Reset match results for the new round to start clean
      await storage.resetMatchResults(serieARound);
      
      res.json({ 
        message: "New round started successfully",
        newRound,
        serieARound
      });
    } catch (error) {
      console.error("Error starting new round:", error);
      res.status(500).json({ message: "Failed to start new round" });
    }
  });

  // Set game deadline
  app.post("/api/games/:id/set-deadline", async (req, res) => {
    console.log("SET DEADLINE - Game ID:", req.params.id, "Body:", req.body);
    
    try {
      const gameId = parseInt(req.params.id);
      const { deadline } = req.body;
      
      if (!gameId || isNaN(gameId)) {
        return res.status(400).json({ message: "Invalid game ID" });
      }
      
      const deadlineDate = deadline ? new Date(deadline) : null;
      await storage.updateGameDeadline(gameId, deadlineDate);
      
      console.log(`Deadline set for game ${gameId}:`, deadlineDate?.toISOString() || 'removed');
      res.json({ message: "Deadline updated successfully" });
    } catch (error) {
      console.error("Error setting deadline:", error);
      res.status(500).json({ message: "Failed to set deadline" });
    }
  });

  // Admin-only endpoints for comprehensive data access
  app.get("/api/admin/all-team-selections", async (req, res) => {
    if (!req.isAuthenticated() || !req.user!.isAdmin) return res.sendStatus(403);
    
    try {
      const games = await storage.getGamesByCreator(req.user!.id);
      const allData = [];
      
      for (const game of games) {
        const gameTickets = await storage.getTicketsByGame(game.id);
        const allSelections = [];
        
        for (const ticket of gameTickets) {
          const selections = await storage.getTeamSelectionsByTicket(ticket.id);
          allSelections.push(...selections);
        }
        
        allData.push({ game, selections: allSelections });
      }
      
      res.json(allData);
    } catch (error) {
      console.error("Error fetching all team selections:", error);
      res.status(500).json({ message: "Server error" });
    }
  });

  app.get("/api/admin/all-tickets", async (req, res) => {
    if (!req.isAuthenticated() || !req.user!.isAdmin) return res.sendStatus(403);
    
    try {
      const games = await storage.getGamesByCreator(req.user!.id);
      const allTickets = [];
      
      for (const game of games) {
        const tickets = await storage.getTicketsByGame(game.id);
        for (const ticket of tickets) {
          const user = await storage.getUser(ticket.userId);
          allTickets.push({ ...ticket, game, user });
        }
      }
      
      res.json(allTickets);
    } catch (error) {
      console.error("Error fetching all tickets:", error);
      res.status(500).json({ message: "Server error" });
    }
  });

  // Matches API - Get all matches for all rounds (for calendar)
  app.get("/api/matches/all", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    
    try {
      const { db } = await import('./db');
      const { matches } = await import('../shared/schema');
      
      // Get all matches from database
      const allMatches = await db.select().from(matches).orderBy(matches.round, matches.id);
      
      // If no matches in database, load some initial rounds
      if (!allMatches || allMatches.length === 0) {
        console.log('No matches found in database, loading initial rounds...');
        // Load first 5 rounds as a starting point
        for (let round = 1; round <= 5; round++) {
          await loadSerieAMatchesForRound(round);
        }
        
        // Fetch matches again
        const updatedMatches = await db.select().from(matches).orderBy(matches.round, matches.id);
        res.json(updatedMatches || []);
      } else {
        res.json(allMatches);
      }
    } catch (error) {
      console.error("Error fetching all matches:", error);
      res.status(500).json({ message: "Failed to fetch all matches" });
    }
  });

  // Matches API - Get matches for a specific round
  app.get("/api/matches/:round", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    
    try {
      const round = parseInt(req.params.round);
      if (isNaN(round) || round < 1 || round > 38) {
        return res.status(400).json({ message: "Invalid round number" });
      }
      
      let matches = await storage.getMatchesByRound(round);
      
      // If no matches found in database, load from Serie A calendar
      if (!matches || matches.length === 0) {
        console.log(`Loading Serie A matches for round ${round}`);
        await loadSerieAMatchesForRound(round);
        matches = await storage.getMatchesByRound(round);
      }
      
      // Debug log to see what's being returned
      console.log(`API returning ${matches.length} matches for round ${round}`);
      
      res.json(matches || []);
    } catch (error) {
      console.error("Error fetching matches:", error);
      res.status(500).json({ message: "Failed to fetch matches" });
    }
  });

  // Load authentic Serie A matches for a specific round from Excel calendar
  async function loadSerieAMatchesForRound(round: number) {
    try {
      const XLSX = await import('xlsx');
      const path = await import('path');
      const fs = await import('fs');
      
      const excelPath = path.join(__dirname, 'data', 'serie-a-calendar.xlsx');
      
      if (!fs.existsSync(excelPath)) {
        console.log('Serie A calendar not found, generating...');
        const { createCompleteSerieAExcel } = await import('./generateSerieACalendar');
        await createCompleteSerieAExcel();
      }
      
      const workbook = XLSX.readFile(excelPath);
      const calendarSheet = workbook.Sheets['Calendario'];
      const matchesData = XLSX.utils.sheet_to_json(calendarSheet);
      
      // Filter matches for the specific round
      const roundMatches = matchesData.filter((match: any) => match.Giornata === round);
      
      if (roundMatches.length > 0) {
        const { db } = await import('./db');
        const { matches, teams } = await import('../shared/schema');
        
        // Get team mappings
        const allTeams = await db.select().from(teams);
        const teamByName = new Map(allTeams.map(t => [t.name, t]));
        
        const dbMatches = [];
        for (const match of roundMatches.slice(0, 10)) { // Ensure exactly 10 matches
          const homeTeam = teamByName.get(match['Squadra Casa']);
          const awayTeam = teamByName.get(match['Squadra Trasferta']);
          
          if (homeTeam && awayTeam) {
            dbMatches.push({
              round,
              homeTeamId: homeTeam.id,
              awayTeamId: awayTeam.id,
              homeScore: null,
              awayScore: null,
              result: null,
              matchDate: new Date(match.Data || new Date()),
              isCompleted: false
            });
          }
        }
        
        if (dbMatches.length > 0) {
          await db.insert(matches).values(dbMatches).onConflictDoNothing();
          console.log(`Loaded ${dbMatches.length} authentic Serie A matches for round ${round}`);
        }
      }
    } catch (error) {
      console.error('Error loading Serie A matches:', error);
      // Fallback to creating representative matches
      await createFallbackMatches(round);
    }
  }

  // Fallback function for creating representative matches
  async function createFallbackMatches(round: number) {
    try {
      const { db } = await import('./db');
      const { matches, teams } = await import('../shared/schema');
      const { serieAFixtures, getTeamIdByName } = await import('./data/serie-a-schedule');
      
      // Get authentic Serie A fixtures for this round
      const roundFixtures = serieAFixtures.filter(fixture => fixture.round === round);
      
      if (roundFixtures.length === 0) {
        // If no authentic fixtures for this round, create representative matches
        const allTeams = await db.select().from(teams).limit(20);
        
        if (allTeams.length < 10) {
          console.log('Not enough teams to create matches');
          return;
        }
        
        // Create exactly 10 Serie A matches for this round using round-robin logic
        const serieATeams = allTeams.slice(0, 20); // Ensure exactly 20 teams
        const roundMatches = [];
        
        // Generate pairings for this specific round using round-robin algorithm
        // Each round has 10 matches (20 teams / 2)
        for (let i = 0; i < 10; i++) {
          const homeIndex = (round - 1 + i) % 20;
          const awayIndex = (round - 1 + i + 10) % 20;
          
          const homeTeam = serieATeams[homeIndex];
          const awayTeam = serieATeams[awayIndex];
          
          if (homeTeam && awayTeam && homeTeam.id !== awayTeam.id) {
            roundMatches.push({
              round,
              homeTeamId: homeTeam.id,
              awayTeamId: awayTeam.id,
              homeScore: null,
              awayScore: null,
              result: null,
              matchDate: new Date(),
              isCompleted: false
            });
          }
        }
        
        const representativeMatches = roundMatches;
        
        if (representativeMatches.length > 0) {
          await db.insert(matches).values(representativeMatches).onConflictDoNothing();
          console.log(`Created ${representativeMatches.length} Serie A matches for round ${round}`);
        }
      } else {
        // Use authentic Serie A fixtures
        const authenticMatches = [];
        for (const fixture of roundFixtures) {
          const homeTeamId = getTeamIdByName(fixture.homeTeam);
          const awayTeamId = getTeamIdByName(fixture.awayTeam);
          
          if (homeTeamId && awayTeamId) {
            authenticMatches.push({
              round,
              homeTeamId,
              awayTeamId,
              homeScore: null,
              awayScore: null,
              result: null,
              matchDate: new Date(fixture.date),
              isCompleted: false
            });
          }
        }
        
        if (authenticMatches.length > 0) {
          await db.insert(matches).values(authenticMatches).onConflictDoNothing();
          console.log(`Created ${authenticMatches.length} authentic Serie A matches for round ${round}`);
        }
      }
    } catch (error) {
      console.error('Error creating Serie A matches:', error);
    }
  }

  app.post("/api/matches/:id/result", async (req, res) => {
    if (!req.isAuthenticated() || !req.user!.isAdmin) return res.sendStatus(403);
    
    try {
      const matchId = parseInt(req.params.id);
      const { homeScore, awayScore } = req.body;
      
      await storage.updateMatchResult(matchId, homeScore, awayScore);
      res.json({ message: "Match result updated" });
    } catch (error) {
      console.error("Error updating match result:", error);
      res.status(500).json({ message: "Failed to update match result" });
    }
  });

  // Excel file management for Serie A calendar
  app.get("/api/admin/excel-calendar", async (req, res) => {
    if (!req.isAuthenticated() || !req.user!.isAdmin) return res.sendStatus(403);
    
    try {
      const { serieAManager } = await import('./serieAManager');
      const filePath = serieAManager.getExcelFilePath();
      
      // Check if file exists, if not create it
      const fs = await import('fs');
      if (!fs.existsSync(filePath)) {
        await serieAManager.initializeSerieAData();
      }
      
      res.download(filePath, 'Serie_A_2025-2026_Calendario_Completo.xlsx');
    } catch (error) {
      console.error("Error downloading Excel calendar:", error);
      res.status(500).json({ message: "Failed to download calendar" });
    }
  });

  // Download Excel calendar with all Serie A 2025/26 matches
  app.get("/api/admin/excel-calendar", async (req, res) => {
    if (!req.isAuthenticated() || !req.user!.isAdmin) return res.sendStatus(403);
    
    try {
      const XLSX = await import('xlsx');
      const path = await import('path');
      const fs = await import('fs');
      
      // Get teams from database
      const teams = await storage.getAllTeams();
      
      // Use database data directly (already contains correct Serie A 2025/26 data)
      console.log('Using database matches for Serie A 2025/26 calendar');
      const dbMatches = await storage.getAllMatches();
      
      // Filter matches to only include teams from Serie A 2025/26 (exclude relegated teams)
      const validMatches = dbMatches.filter(match => {
        const homeTeam = teams.find(t => t.id === match.homeTeamId);
        const awayTeam = teams.find(t => t.id === match.awayTeamId);
        
        const relegatedTeams = ['Empoli', 'Venezia', 'Monza'];
        return homeTeam && awayTeam && 
               !relegatedTeams.includes(homeTeam.name) && 
               !relegatedTeams.includes(awayTeam.name);
      });
      
      const calendarData = validMatches.map(match => {
        const homeTeam = teams.find(t => t.id === match.homeTeamId);
        const awayTeam = teams.find(t => t.id === match.awayTeamId);
        
        // Force correct Serie A 2025/26 dates
        const matchDate = new Date(match.matchDate);
        const formattedDate = matchDate.toISOString().split('T')[0];
        
        return {
          Giornata: match.round,
          'Squadra Casa': homeTeam?.name || `Team ${match.homeTeamId}`,
          'Squadra Ospite': awayTeam?.name || `Team ${match.awayTeamId}`,
          Data: formattedDate, // This should be 2025-08-24, etc.
          Orario: '15:00',
          'Gol Casa': match.homeScore || '',
          'Gol Ospite': match.awayScore || '',
          Risultato: match.result || '',
          Completata: match.isCompleted ? 'FALSO' : 'FALSO', // Force FALSO for new season
          Stadio: homeTeam?.name ? `${homeTeam.name} Stadium` : '',
          'ID Casa': match.homeTeamId,
          'ID Trasferta': match.awayTeamId
        };
      });
      
      console.log(`Excel Calendar: ${calendarData.length} valid matches (Serie A 2025/26 only)`);
      
      console.log(`Creating Excel with ${teams.length} teams and ${calendarData.length} matches from authentic Serie A 2025/26`);
      
      // Create workbook
      const workbook = XLSX.utils.book_new();
      
      // Teams sheet - SOLO squadre Serie A 2025/26 (no Empoli, Venezia, Monza)
      const validTeams = teams.filter(team => 
        !['Empoli', 'Venezia', 'Monza'].includes(team.name)
      );
      
      const teamsData = validTeams.map(team => ({
        ID: team.id,
        Nome: team.name,
        Codice: team.code,
        Citta: team.name, // Placeholder
        Stadio: `Stadio ${team.name}` // Placeholder
      }));
      
      console.log(`Excel Teams: ${teamsData.length} teams (filtered out relegated teams)`);
      
      const teamsSheet = XLSX.utils.json_to_sheet(teamsData);
      XLSX.utils.book_append_sheet(workbook, teamsSheet, 'Squadre');
      
      // Use authentic calendar data for matches sheet
      const matchesData = calendarData.map((match, index) => ({
        ID: index + 1,
        Giornata: match.Giornata || match.round,
        'Squadra Casa': match['Squadra Casa'] || match.homeTeam,
        'Squadra Ospite': match['Squadra Ospite'] || match.awayTeam,
        Data: match.Data || match.date,
        Orario: match.Orario || match.time || '15:00',
        'Gol Casa': match['Gol Casa'] || '',
        'Gol Ospite': match['Gol Ospite'] || '',
        Risultato: match.Risultato || match.result || '',
        Completata: match.Completata || (match.isCompleted ? 'Sì' : 'No') || 'No',
        Stadio: match.Stadio || match.venue || ''
      }));
      
      const matchesSheet = XLSX.utils.json_to_sheet(matchesData);
      XLSX.utils.book_append_sheet(workbook, matchesSheet, 'Calendario');
      
      // Calculate season info from authentic calendar data
      const roundNumbers = calendarData.map(m => m.Giornata || m.round).filter(Boolean);
      const maxRound = roundNumbers.length > 0 ? Math.max(...roundNumbers) : 38;
      const dates = calendarData.map(m => m.Data || m.date).filter(Boolean);
      const firstDate = dates.length > 0 ? dates[0] : '2025-08-24';
      const lastDate = dates.length > 0 ? dates[dates.length - 1] : '2026-05-24';
      
      // Summary sheet with correct Serie A 2025/26 data
      const summaryData = [
        { Statistica: 'Stagione', Valore: '2025/2026' },
        { Statistica: 'Squadre', Valore: validTeams.length },
        { Statistica: 'Giornate', Valore: 38 },
        { Statistica: 'Partite Totali', Valore: calendarData.length },
        { Statistica: 'Partite per Giornata', Valore: 10 },
        { Statistica: 'Data Inizio', Valore: '24 Agosto 2025' },
        { Statistica: 'Data Fine', Valore: 'Maggio 2026' }
      ];
      
      const summarySheet = XLSX.utils.json_to_sheet(summaryData);
      XLSX.utils.book_append_sheet(workbook, summarySheet, 'Info');
      
      // Generate Excel buffer
      const buffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });
      
      // Set headers for download with correct 2025/26 filename
      const filename = `Serie_A_2025-2026_Calendario_Completo_${new Date().toISOString().split('T')[0]}.xlsx`;
      res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      res.setHeader('Content-Length', buffer.length);
      
      console.log(`Download Excel: ${filename} with ${calendarData.length} matches Serie A 2025/26`);
      
      res.send(buffer);
    } catch (error) {
      console.error("Error generating Excel calendar:", error);
      res.status(500).json({ message: "Failed to generate calendar" });
    }
  });

  // Upload Excel file for Serie A calendar
  const multer = await import('multer');
  const upload = multer.default({ dest: 'uploads/' });
  
  app.post("/api/admin/excel-calendar", upload.single('calendar'), async (req, res) => {
    if (!req.isAuthenticated() || !req.user!.isAdmin) return res.sendStatus(403);
    
    try {
      if (!req.file) {
        return res.status(400).json({ message: "No file uploaded" });
      }

      const { serieAManager } = await import('./serieAManager');
      const fs = await import('fs');
      const path = await import('path');
      
      // Move uploaded file to replace the existing calendar
      const targetPath = serieAManager.getExcelFilePath();
      fs.copyFileSync(req.file.path, targetPath);
      
      // Clean up temporary file
      fs.unlinkSync(req.file.path);
      
      // Reload matches from the new Excel file
      await serieAManager.loadMatchesFromExcel();
      
      res.json({ message: "Calendar updated successfully" });
    } catch (error) {
      console.error("Error uploading Excel calendar:", error);
      res.status(500).json({ message: "Failed to update calendar" });
    }
  });

  // Team selection management with deadline validation
  app.post("/api/team-selections", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    
    try {
      const { gameId, ticketId, teamId, round } = req.body;
      
      // Validate deadline before allowing selection
      const deadlineCheck = await validateSelectionDeadline(gameId);
      if (!deadlineCheck.valid) {
        return res.status(400).json({ 
          message: deadlineCheck.reason || "Selection deadline has expired" 
        });
      }
      
      const selectionData = insertTeamSelectionSchema.parse(req.body);
      const selection = await storage.createTeamSelection(selectionData);
      res.status(201).json(selection);
    } catch (error) {
      console.error("Error creating team selection:", error);
      res.status(400).json({ message: "Invalid selection data" });
    }
  });

  // Get team selections for a ticket
  app.get("/api/tickets/:id/selections", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    
    try {
      const ticketId = parseInt(req.params.id);
      const selections = await storage.getTeamSelectionsByTicket(ticketId);
      res.json(selections);
    } catch (error) {
      console.error("Error fetching selections:", error);
      res.status(500).json({ message: "Failed to fetch selections" });
    }
  });

  // Lock round with auto-assignment of missing teams
  app.post("/api/games/:id/lock-round", async (req, res) => {
    console.log("LOCK ROUND - Game ID:", req.params.id);
    
    try {
      const gameId = parseInt(req.params.id);
      const game = await storage.getGame(gameId);
      
      if (!game || game.status !== "active") {
        return res.status(400).json({ message: "Game not found or not active" });
      }

      // Get all active tickets for this game
      const tickets = await storage.getTicketsByGame(gameId);
      const activeTickets = tickets.filter(t => t.isActive);
      
      // Check which tickets need team assignments for current round
      let assignmentCount = 0;
      const matches = await storage.getMatchesByRound(game.currentRound);
      const availableTeams = matches.flatMap(m => [m.homeTeamId, m.awayTeamId]);
      
      for (const ticket of activeTickets) {
        const selections = await storage.getTeamSelectionsByTicket(ticket.id);
        const hasSelectionForRound = selections.some(s => s.round === game.currentRound);
        
        if (!hasSelectionForRound) {
          // Auto-assign a random available team
          const randomTeamId = availableTeams[Math.floor(Math.random() * availableTeams.length)];
          await storage.createTeamSelection({
            gameId: game.id,
            ticketId: ticket.id,
            teamId: randomTeamId,
            round: game.currentRound
          });
          assignmentCount++;
        }
      }

      // Update game round status to locked and remove deadline
      await storage.updateGameRoundStatus(gameId, "locked");
      await storage.updateGameDeadline(gameId, null);
      
      res.json({ 
        message: "Round locked successfully",
        autoAssignedCount: assignmentCount
      });
    } catch (error) {
      console.error("Error locking round:", error);
      res.status(500).json({ message: "Failed to lock round" });
    }
  });

  // Timer management endpoints
  app.get("/api/timer/check", async (req, res) => {
    try {
      const results = await checkExpiredDeadlines();
      res.json({ 
        message: "Timer check completed",
        results: results,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      console.error("Error checking timers:", error);
      res.status(500).json({ message: "Failed to check timers" });
    }
  });

  // Social features
  app.get("/api/social/friends", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    res.json([]);
  });

  app.get("/api/social/friend-requests", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    res.json([]);
  });

  // Achievement system
  app.get("/api/achievements/user", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    res.json([]);
  });

  app.post("/api/achievements/check", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    res.json({ newAchievements: [] });
  });

  app.get("/api/achievements/level", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    res.json({ level: 1, xp: 0 });
  });

  app.get("/api/achievements/leaderboard", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    res.json([]);
  });

  // Analytics endpoints
  app.get("/api/analytics/user-stats", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    res.json({ gamesPlayed: 0, wins: 0, winRate: 0 });
  });

  app.get("/api/analytics/game-history", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    res.json([]);
  });

  app.get("/api/analytics/global-stats", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    res.json({ totalGames: 0, totalPlayers: 0 });
  });

  app.post("/api/analytics/events", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    res.json({ success: true });
  });

  // Validation endpoints
  app.get("/api/validate/username/:username", async (req, res) => {
    try {
      const { username } = req.params;
      
      if (!username || username.length < 3) {
        return res.json({ available: false, message: "Username deve essere almeno 3 caratteri" });
      }
      
      const existingUser = await storage.getUserByUsername(username);
      const available = !existingUser;
      
      res.json({ 
        available, 
        message: available ? "Username disponibile" : "Username già utilizzato" 
      });
    } catch (error) {
      console.error("Error validating username:", error);
      res.status(500).json({ available: false, message: "Errore durante la validazione" });
    }
  });

  app.get("/api/validate/email/:email", async (req, res) => {
    try {
      const { email } = req.params;
      const decodedEmail = decodeURIComponent(email);
      
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(decodedEmail)) {
        return res.json({ available: false, message: "Email non valida" });
      }
      
      const existingUser = await storage.getUserByEmail(decodedEmail);
      const available = !existingUser;
      
      res.json({ 
        available, 
        message: available ? "Email disponibile" : "Email già utilizzata" 
      });
    } catch (error) {
      console.error("Error validating email:", error);
      res.status(500).json({ available: false, message: "Errore durante la validazione" });
    }
  });

  // Email verification and password reset endpoints
  
  // Send password reset email
  app.post("/api/forgot-password", async (req, res) => {
    try {
      const { email } = req.body;
      
      if (!email) {
        return res.status(400).json({ message: "Email è richiesta" });
      }

      const user = await storage.getUserByEmail(email);
      if (!user) {
        // Don't reveal if email exists or not for security
        return res.json({ message: "Se l'email esiste, riceverai un link per il reset" });
      }

      // Generate reset token
      const resetToken = emailService.generateVerificationToken();
      const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

      // Store reset token
      await storage.createPasswordResetToken({
        userId: user.id,
        token: resetToken,
        expiresAt
      });

      // Send email
      const emailSent = await emailService.sendPasswordResetEmail({
        email: user.email,
        username: user.username,
        token: resetToken
      });

      if (emailSent) {
        res.json({ message: "Se l'email esiste, riceverai un link per il reset" });
      } else {
        res.status(500).json({ message: "Errore nell'invio dell'email" });
      }
    } catch (error) {
      console.error("Error in forgot password:", error);
      res.status(500).json({ message: "Errore del server" });
    }
  });

  // Send username recovery email
  app.post("/api/forgot-username", async (req, res) => {
    console.log("🎯 Richiesta forgot-username ricevuta:", req.body);
    
    try {
      const { email } = req.body;
      
      if (!email) {
        console.log("❌ Email mancante nella richiesta");
        return res.status(400).json({ message: "Email è richiesta" });
      }

      console.log("🔍 Ricerca utente con email:", email);
      const user = await storage.getUserByEmail(email);
      
      if (!user) {
        console.log("👤 Utente non trovato per email:", email);
        // Don't reveal if email exists or not for security
        return res.json({ message: "Se l'email esiste, riceverai il tuo username" });
      }

      console.log("📧 Invio email di recupero username a:", user.email);
      // Send email with username
      const emailSent = await emailService.sendUsernameRecoveryEmail({
        email: user.email,
        username: user.username
      });

      if (emailSent) {
        console.log("✅ Email inviata con successo");
        res.json({ message: "Se l'email esiste, riceverai il tuo username" });
      } else {
        console.log("❌ Errore invio email");
        res.status(500).json({ message: "Errore nell'invio dell'email" });
      }
    } catch (error) {
      console.error("💥 Errore in forgot username:", error);
      res.status(500).json({ message: "Errore del server" });
    }
  });

  // Reset password with token
  app.post("/api/reset-password", async (req, res) => {
    try {
      const { token, newPassword } = req.body;
      
      if (!token || !newPassword) {
        return res.status(400).json({ message: "Token e nuova password sono richiesti" });
      }

      if (newPassword.length < 6) {
        return res.status(400).json({ message: "La password deve avere almeno 6 caratteri" });
      }

      // Verify token
      const resetToken = await storage.getPasswordResetToken(token);
      if (!resetToken) {
        return res.status(400).json({ message: "Token non valido o scaduto" });
      }

      // Hash new password
      const hashedPassword = await bcrypt.hash(newPassword, 10);

      // Update user password
      await storage.updateUser(resetToken.userId, { password: hashedPassword });

      // Mark token as used
      await storage.markPasswordResetTokenAsUsed(token);

      res.json({ message: "Password aggiornata con successo" });
    } catch (error) {
      console.error("Error in reset password:", error);
      res.status(500).json({ message: "Errore del server" });
    }
  });

  // Verify email endpoint
  app.get("/api/verify-email", async (req, res) => {
    try {
      const { token } = req.query;
      
      if (!token || typeof token !== 'string') {
        return res.status(400).json({ message: "Token non valido" });
      }

      const verificationToken = await storage.getEmailVerificationToken(token);
      if (!verificationToken) {
        return res.status(400).json({ message: "Token non valido o scaduto" });
      }

      // Update user as verified
      await db.update(users)
        .set({ emailVerified: true })
        .where(eq(users.id, verificationToken.userId));

      // Delete token
      await storage.deleteEmailVerificationToken(token);

      res.json({ message: "Email verificata con successo" });
    } catch (error) {
      console.error("Error in verify email:", error);
      res.status(500).json({ message: "Errore del server" });
    }
  });

  // Resend verification email
  app.post("/api/resend-verification", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    
    try {
      const user = req.user!;
      
      if (user.emailVerified) {
        return res.status(400).json({ message: "Email già verificata" });
      }

      // Generate new verification token
      const verificationToken = emailService.generateVerificationToken();
      const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

      // Remove old tokens
      await storage.deleteExpiredEmailVerificationTokens();

      // Store new token
      await storage.createEmailVerificationToken({
        userId: user.id,
        token: verificationToken,
        email: user.email,
        expiresAt
      });

      // Send email
      const emailSent = await emailService.sendVerificationEmail({
        userId: user.id,
        email: user.email,
        username: user.username,
        token: verificationToken
      });

      if (emailSent) {
        res.json({ message: "Email di verifica inviata" });
      } else {
        res.status(500).json({ message: "Errore nell'invio dell'email" });
      }
    } catch (error) {
      console.error("Error in resend verification:", error);
      res.status(500).json({ message: "Errore del server" });
    }
  });

  // PWA sync endpoint for offline actions
  app.post("/api/sync", async (req, res) => {
    try {
      const { actions } = req.body;
      if (!actions || !Array.isArray(actions)) {
        return res.json({ success: true, message: 'No actions to sync' });
      }

      console.log(`Syncing ${actions.length} offline actions`);
      res.json({ success: true, synced: actions.length });
    } catch (error) {
      console.error('Sync error:', error);
      res.status(500).json({ error: 'Sync failed' });
    }
  });

  // Push notifications subscription management
  app.post("/api/push/subscribe", async (req, res) => {
    try {
      const subscription = req.body;
      console.log('Push subscription received:', subscription.endpoint);
      res.json({ success: true });
    } catch (error) {
      console.error('Push subscription error:', error);
      res.status(500).json({ error: 'Subscription failed' });
    }
  });

  app.post("/api/push/unsubscribe", async (req, res) => {
    try {
      const { endpoint } = req.body;
      console.log('Push unsubscription received:', endpoint);
      res.json({ success: true });
    } catch (error) {
      console.error('Push unsubscription error:', error);
      res.status(500).json({ error: 'Unsubscription failed' });
    }
  });

  // Debug endpoint per verificare configurazione URL (solo in sviluppo)
  if (process.env.NODE_ENV !== 'production') {
    app.get("/api/debug/config", (req, res) => {
      const config = {
        environment: process.env.NODE_ENV || 'development',
        baseUrl: EMAIL_CONFIG.getBaseUrl(),
        replitDomain: process.env.REPLIT_DEV_DOMAIN || 'not set',
        hasCustomBaseUrl: !!process.env.BASE_URL,
        emailProvider: emailService.getProvider(),
        timestamp: new Date().toISOString()
      };
      res.json(config);
    });
  }

  // NEW: Correct Serie A 2025/26 calendar download
  app.get("/api/admin/new-calendar", async (req, res) => {
    if (!req.isAuthenticated() || !req.user!.isAdmin) return res.sendStatus(403);
    
    try {
      const XLSX = await import('xlsx');
      
      // Create Serie A 2025/26 teams manually (correct ones only)
      const correctTeams = [
        { id: 21, name: 'Atalanta', code: 'ATA' },
        { id: 22, name: 'Bologna', code: 'BOL' },
        { id: 23, name: 'Cagliari', code: 'CAG' },
        { id: 24, name: 'Como', code: 'COM' },
        { id: 34, name: 'Cremonese', code: 'CRE' },
        { id: 26, name: 'Fiorentina', code: 'FIO' },
        { id: 27, name: 'Genoa', code: 'GEN' },
        { id: 28, name: 'Hellas Verona', code: 'VER' },
        { id: 29, name: 'Inter', code: 'INT' },
        { id: 30, name: 'Juventus', code: 'JUV' },
        { id: 31, name: 'Lazio', code: 'LAZ' },
        { id: 32, name: 'Lecce', code: 'LEC' },
        { id: 33, name: 'Milan', code: 'MIL' },
        { id: 35, name: 'Napoli', code: 'NAP' },
        { id: 36, name: 'Parma', code: 'PAR' },
        { id: 25, name: 'Pisa', code: 'PIS' },
        { id: 37, name: 'Roma', code: 'ROM' },
        { id: 40, name: 'Sassuolo', code: 'SAS' },
        { id: 38, name: 'Torino', code: 'TOR' },
        { id: 39, name: 'Udinese', code: 'UDI' }
      ];

      // Get authentic matches from database
      const { db } = await import('./db');
      const { matches } = await import('../shared/schema');
      const dbMatches = await db.select().from(matches).orderBy(matches.round, matches.id);
      
      // Filter only matches between correct teams
      const validMatches = dbMatches.filter(match => {
        const homeTeam = correctTeams.find(t => t.id === match.homeTeamId);
        const awayTeam = correctTeams.find(t => t.id === match.awayTeamId);
        return homeTeam && awayTeam;
      });

      console.log(`New Calendar: ${correctTeams.length} teams, ${validMatches.length} matches`);

      // Create workbook
      const workbook = XLSX.utils.book_new();
      
      // Teams sheet
      const teamsData = correctTeams.map(team => ({
        ID: team.id,
        Nome: team.name,
        Codice: team.code,
        Citta: team.name,
        Stadio: `Stadio ${team.name}`
      }));
      
      const teamsSheet = XLSX.utils.json_to_sheet(teamsData);
      XLSX.utils.book_append_sheet(workbook, teamsSheet, 'Squadre');
      
      // Calendar sheet
      const calendarData = validMatches.map((match, index) => {
        const homeTeam = correctTeams.find(t => t.id === match.homeTeamId);
        const awayTeam = correctTeams.find(t => t.id === match.awayTeamId);
        
        return {
          Giornata: match.round,
          'Squadra Casa': homeTeam?.name || '',
          'Squadra Trasferta': awayTeam?.name || '',
          Data: match.matchDate.toISOString().split('T')[0],
          Orario: '15:00',
          'Gol Casa': '',
          'Gol Trasferta': '',
          Completata: 'FALSO',
          Stadio: `${homeTeam?.name} Stadium`,
          'ID Casa': match.homeTeamId,
          'ID Trasferta': match.awayTeamId
        };
      });
      
      const calendarSheet = XLSX.utils.json_to_sheet(calendarData);
      XLSX.utils.book_append_sheet(workbook, calendarSheet, 'Calendario');
      
      // Statistics sheet
      const statsData = [
        { Statistica: 'Stagione', Valore: '2025/2026' },
        { Statistica: 'Squadre', Valore: 20 },
        { Statistica: 'Giornate', Valore: 38 },
        { Statistica: 'Partite Totali', Valore: calendarData.length },
        { Statistica: 'Partite per Giornata', Valore: 10 },
        { Statistica: 'Data Inizio', Valore: '24 Agosto 2025' },
        { Statistica: 'Data Fine', Valore: 'Maggio 2026' }
      ];
      
      const statsSheet = XLSX.utils.json_to_sheet(statsData);
      XLSX.utils.book_append_sheet(workbook, statsSheet, 'Statistica');
      
      // Generate and send file
      const buffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });
      const filename = `Serie_A_2025-2026_Calendario_Autentico_${new Date().toISOString().split('T')[0]}.xlsx`;
      
      res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      res.setHeader('Content-Length', buffer.length);
      
      console.log(`New Calendar Download: ${filename} - ${correctTeams.length} teams, ${calendarData.length} matches`);
      res.send(buffer);
      
    } catch (error) {
      console.error("Error generating new calendar:", error);
      res.status(500).json({ message: "Failed to generate calendar" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
