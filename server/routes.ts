import type { Express } from "express";
import { createServer, type Server } from "http";
import { setupAuth } from "./auth";
import { storage } from "./storage";
import { insertGameSchema, insertTeamSelectionSchema, tickets } from "@shared/schema";
import { checkGameEndConditions, finalizeGame } from "./game-logic";
import { checkExpiredDeadlines, validateSelectionDeadline } from "./timer-service";
import { z } from "zod";
import { db, withTransaction, batchOperation } from "./db";
import { eq } from "drizzle-orm";

export async function registerRoutes(app: Express): Promise<Server> {
  // Setup authentication routes
  setupAuth(app);

  // Skip database seeding to prevent connection issues
  console.log("Skipping database seeding for faster startup");

  // Validation endpoints for registration
  app.get("/api/validate/username/:username", async (req, res) => {
    try {
      const { username } = req.params;
      const existingUser = await storage.getUserByUsername(username);
      res.json({ available: !existingUser });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.get("/api/validate/email/:email", async (req, res) => {
    try {
      const { email } = req.params;
      const existingUser = await storage.getUserByEmail(email);
      res.json({ available: !existingUser });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

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
      await storage.updateGameRound(gameId, 1);
      await storage.updateGameRoundStatus(gameId, "selection_open");
      res.json({ message: "Registration closed, game started" });
    } catch (error) {
      console.error("Error closing registration:", error);
      res.status(500).json({ message: "Failed to close registration" });
    }
  });

  // Set deadline for game
  app.post("/api/games/:id/set-deadline", async (req, res) => {
    if (!req.isAuthenticated() || !req.user!.isAdmin) return res.sendStatus(403);
    
    try {
      const gameId = parseInt(req.params.id);
      const { deadline } = req.body;
      
      if (!deadline) {
        return res.status(400).json({ message: "Deadline is required" });
      }
      
      const game = await storage.getGame(gameId);
      if (!game) {
        return res.status(404).json({ message: "Game not found" });
      }
      
      // Verify admin owns this game
      if (game.createdBy !== req.user!.id) {
        return res.status(403).json({ message: "Access denied - not your game" });
      }
      
      // Validate deadline is in the future with 1 minute buffer
      const deadlineDate = new Date(deadline);
      const now = new Date();
      const nowPlusBuffer = new Date(now.getTime() + 60000); // +1 minuto buffer
      
      if (deadlineDate <= nowPlusBuffer) {
        return res.status(400).json({ message: "Deadline must be in the future (Italian time)" });
      }
      
      await storage.updateGameDeadline(gameId, deadlineDate);
      
      // Log the deadline setting
      await storage.createTimerLog(
        gameId,
        'deadline_set',
        game.selectionDeadline,
        deadlineDate,
        req.user!.id,
        { timezone: 'Europe/Rome' }
      );
      
      res.json({ 
        message: "Deadline set successfully",
        deadline: deadlineDate.toISOString()
      });
    } catch (error) {
      console.error("Error setting deadline:", error);
      res.status(500).json({ message: "Failed to set deadline" });
    }
  });

  // Test endpoint for timer system (admin only)
  app.post("/api/admin/test-timer", async (req, res) => {
    if (!req.isAuthenticated() || !req.user!.isAdmin) return res.sendStatus(403);
    
    try {
      const results = await checkExpiredDeadlines();
      res.json({
        message: "Timer check completed",
        results,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      console.error("Error testing timer:", error);
      res.status(500).json({ message: "Failed to test timer system" });
    }
  });

  app.post("/api/games/:id/calculate-turn", async (req, res) => {
    if (!req.isAuthenticated() || !req.user!.isAdmin) return res.sendStatus(403);
    
    try {
      const gameId = parseInt(req.params.id);
      
      // Execute turn calculation atomically
      const result = await withTransaction(async (tx) => {
        const game = await storage.getGame(gameId);
        
        if (!game) {
          throw new Error("Game not found");
        }

        // Verify admin owns this game
        if (game.createdBy !== req.user!.id) {
          throw new Error("Access denied - not your game");
        }

        if (game.status !== "active") {
          throw new Error("Game is not active");
        }

        if (game.roundStatus !== "selection_locked") {
          throw new Error("Round selections must be locked before calculation");
        }

        // Get all team selections for current round
        const selections = await storage.getTeamSelectionsByRound(gameId, game.currentRound);
        
        // Get matches for current round
        const matches = await storage.getMatchesByRound(game.currentRound);
        
        // Validate all matches are completed before calculating
        const incompleteMatches = matches.filter(m => !m.isCompleted);
        if (incompleteMatches.length > 0) {
          throw new Error(`Cannot calculate turn - ${incompleteMatches.length} matches incomplete`);
        }
        
        // Collect elimination operations
        const eliminationOperations = [];
        const eliminatedTickets = [];
        
        // Process eliminations based on match results
        for (const selection of selections) {
          const match = matches.find(m => 
            (m.homeTeamId === selection.teamId || m.awayTeamId === selection.teamId) && 
            m.isCompleted
          );
          
          if (match && match.result) {
            // Team lost or drew - eliminate ticket
            const teamWon = (match.homeTeamId === selection.teamId && match.result === 'H') ||
                           (match.awayTeamId === selection.teamId && match.result === 'A');
            
            if (!teamWon) {
              eliminationOperations.push(() => 
                storage.eliminateTicket(selection.ticketId, game.currentRound)
              );
              eliminatedTickets.push({
                ticketId: selection.ticketId,
                teamId: selection.teamId,
                reason: match.result === 'D' ? 'draw' : 'loss'
              });
            }
          }
        }
        
        // Execute eliminations atomically
        if (eliminationOperations.length > 0) {
          await batchOperation(eliminationOperations, { maxRetries: 2, delayMs: 50 });
        }
        
        // Check for winner determination
        const activeTickets = await storage.getTicketsByGame(gameId);
        const remainingActiveTickets = activeTickets.filter(t => t.isActive);
        
        let gameResult;
        
        if (remainingActiveTickets.length === 0) {
          // No survivors - game ends in draw
          await storage.updateGameStatus(gameId, "completed");
          gameResult = {
            type: "no_survivors",
            message: "Turn calculated - No survivors, game ended",
            gameStatus: "completed",
            winner: null,
            eliminatedCount: eliminatedTickets.length
          };
        } else {
          // Check if only one player has active tickets
          const playersWithActiveTickets = new Set(remainingActiveTickets.map(t => t.userId));
          
          if (playersWithActiveTickets.size === 1) {
            // Single winner
            const winnerId = Array.from(playersWithActiveTickets)[0];
            await storage.updateGameStatus(gameId, "completed");
            gameResult = {
              type: "single_winner",
              message: "Turn calculated - Winner determined!",
              gameStatus: "completed",
              winnerId,
              remainingTickets: remainingActiveTickets.length,
              eliminatedCount: eliminatedTickets.length
            };
          } else if (game.currentRound >= 38) {
            // Multiple survivors at season end - all are winners
            await storage.updateGameStatus(gameId, "completed");
            gameResult = {
              type: "season_end",
              message: "Season ended - Multiple winners!",
              gameStatus: "completed",
              multipleWinners: true,
              survivors: remainingActiveTickets.map(t => t.userId),
              eliminatedCount: eliminatedTickets.length
            };
          } else {
            // Game continues to next round
            await storage.updateGameRoundStatus(gameId, "calculated");
            gameResult = {
              type: "round_complete",
              message: "Turn calculated successfully",
              currentRound: game.currentRound,
              remainingTickets: remainingActiveTickets.length,
              eliminatedCount: eliminatedTickets.length,
              eliminatedDetails: eliminatedTickets
            };
          }
        }
        
        return gameResult;
      });
      
      res.json({
        ...result,
        timestamp: new Date().toISOString(),
        processedBy: req.user!.username
      });
      
    } catch (error) {
      console.error("Error calculating turn:", error);
      
      // Granular error handling
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      
      if (errorMessage.includes("not found")) {
        return res.status(404).json({ 
          message: "Game not found",
          code: "GAME_NOT_FOUND",
          timestamp: new Date().toISOString()
        });
      }
      
      if (errorMessage.includes("Access denied")) {
        return res.status(403).json({ 
          message: "Access denied - not your game",
          code: "ACCESS_DENIED",
          timestamp: new Date().toISOString()
        });
      }
      
      if (errorMessage.includes("not active")) {
        return res.status(400).json({ 
          message: "Game is not in active state",
          code: "GAME_INACTIVE",
          timestamp: new Date().toISOString()
        });
      }
      
      if (errorMessage.includes("locked")) {
        return res.status(400).json({ 
          message: "Round selections must be locked before calculation",
          code: "SELECTIONS_NOT_LOCKED",
          timestamp: new Date().toISOString()
        });
      }
      
      if (errorMessage.includes("incomplete")) {
        return res.status(400).json({ 
          message: errorMessage,
          code: "MATCHES_INCOMPLETE",
          timestamp: new Date().toISOString()
        });
      }
      
      // Generic server error
      res.status(500).json({ 
        message: "Failed to calculate turn",
        code: "CALCULATION_ERROR",
        error: process.env.NODE_ENV === 'development' ? errorMessage : 'Internal server error',
        timestamp: new Date().toISOString()
      });
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
    console.log(`Ticket assignment request - Authenticated: ${req.isAuthenticated()}, User: ${req.user?.username}, IsAdmin: ${req.user?.isAdmin}`);
    
    if (!req.isAuthenticated()) {
      console.log("User not authenticated for ticket assignment");
      return res.status(401).json({ message: "Not authenticated" });
    }
    
    if (!req.user!.isAdmin) {
      console.log(`User ${req.user!.username} is not admin - cannot assign tickets`);
      return res.status(403).json({ message: "Admin access required" });
    }
    
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
      
      // FIXED: Proper ticket replacement logic
      console.log(`Assigning ${count} tickets to user ${userId} for game ${gameId}`);
      
      // Step 1: Get existing tickets for this user in this game
      const existingTickets = await storage.getTicketsByUser(userId, gameId);
      console.log(`Found ${existingTickets.length} existing tickets for user ${userId} in game ${gameId}`);
      
      // Step 2: Clean up existing tickets and their selections
      if (existingTickets.length > 0) {
        console.log(`Removing ${existingTickets.length} existing tickets...`);
        for (const existingTicket of existingTickets) {
          // Delete team selections first (foreign key constraint)
          const selections = await storage.getTeamSelectionsByTicket(existingTicket.id);
          console.log(`Deleting ${selections.length} selections for ticket ${existingTicket.id}`);
          for (const selection of selections) {
            await storage.deleteTeamSelection(selection.id);
          }
          // Delete the ticket
          await storage.deleteTicket(existingTicket.id);
          console.log(`Deleted ticket ${existingTicket.id}`);
        }
      }
      
      // Step 3: Create new tickets
      console.log(`Creating ${count} new tickets...`);
      const newTickets = [];
      for (let i = 0; i < count; i++) {
        const ticket = await storage.createTicket(gameId, userId);
        newTickets.push(ticket);
        console.log(`Created new ticket ${ticket.id}`);
      }
      
      console.log(`Successfully assigned ${newTickets.length} tickets to user ${userId}`);
      const tickets = newTickets;
      
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

  // Delete ticket endpoint for admin
  app.delete("/api/tickets/:id", async (req, res) => {
    if (!req.isAuthenticated() || !req.user!.isAdmin) return res.sendStatus(403);
    
    try {
      const ticketId = parseInt(req.params.id);
      
      // Get ticket to verify game ownership - admin can delete any ticket
      let ticket;
      const allUsers = await storage.getAllUsers();
      for (const user of allUsers) {
        const userTickets = await storage.getTicketsByUser(user.id);
        ticket = userTickets.find(t => t.id === ticketId);
        if (ticket) break;
      }
      
      if (!ticket) {
        return res.status(404).json({ message: "Ticket not found" });
      }
      
      const game = await storage.getGame(ticket.gameId);
      if (!game || game.createdBy !== req.user!.id) {
        return res.status(403).json({ message: "Access denied - not your game" });
      }
      
      if (game.status !== "registration") {
        return res.status(400).json({ message: "Cannot delete tickets - registration is closed" });
      }
      
      // Delete team selections for this ticket first
      const selections = await storage.getTeamSelectionsByTicket(ticketId);
      for (const selection of selections) {
        await storage.deleteTeamSelection(selection.id);
      }
      
      // Delete the ticket
      await storage.deleteTicket(ticketId);
      
      res.status(200).json({ message: "Ticket deleted successfully" });
    } catch (error) {
      console.error("Error deleting ticket:", error);
      res.status(500).json({ message: "Failed to delete ticket" });
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

  // Team selections API with robust validation and atomic processing
  app.post("/api/team-selections", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    
    try {
      const selections = z.array(insertTeamSelectionSchema.extend({
        gameId: z.number()
      })).parse(req.body);
      
      // Pre-validation: collect all validation errors before processing
      const validationErrors = [];
      const ticketValidations = new Map();
      
      for (const selection of selections) {
        const validationKey = `${selection.ticketId}-${selection.round}`;
        
        // Check for duplicate selections in request
        if (ticketValidations.has(validationKey)) {
          validationErrors.push({
            ticketId: selection.ticketId,
            round: selection.round,
            error: "Duplicate selection in request for same ticket and round",
            code: "DUPLICATE_SELECTION"
          });
          continue;
        }
        ticketValidations.set(validationKey, selection);
        
        // Validate ticket ownership and status
        const tickets = await storage.getTicketsByUser(req.user!.id, selection.gameId);
        const ticket = tickets.find(t => t.id === selection.ticketId);
        
        if (!ticket) {
          validationErrors.push({
            ticketId: selection.ticketId,
            error: `Ticket ${selection.ticketId} does not belong to user`,
            code: "INVALID_OWNERSHIP"
          });
          continue;
        }
        
        if (!ticket.isActive) {
          validationErrors.push({
            ticketId: selection.ticketId,
            error: `Ticket ${selection.ticketId} is not active`,
            code: "TICKET_INACTIVE"
          });
          continue;
        }
        
        // Validate game status
        const game = await storage.getGame(selection.gameId);
        if (!game) {
          validationErrors.push({
            ticketId: selection.ticketId,
            error: `Game ${selection.gameId} not found`,
            code: "GAME_NOT_FOUND"
          });
          continue;
        }
        
        if (game.status !== "active") {
          validationErrors.push({
            ticketId: selection.ticketId,
            error: "Game is not active",
            code: "GAME_INACTIVE"
          });
          continue;
        }
        
        if (game.roundStatus !== "selection_open") {
          validationErrors.push({
            ticketId: selection.ticketId,
            error: "Selections are locked for this round",
            code: "SELECTIONS_LOCKED"
          });
          continue;
        }

        // Validate deadline hasn't expired
        const deadlineCheck = await validateSelectionDeadline(selection.gameId);
        if (!deadlineCheck.valid) {
          validationErrors.push({
            ticketId: selection.ticketId,
            error: deadlineCheck.reason || "Deadline expired",
            code: "DEADLINE_EXPIRED"
          });
          continue;
        }
        
        if (selection.round !== game.currentRound) {
          validationErrors.push({
            ticketId: selection.ticketId,
            error: `Invalid round: expected ${game.currentRound}, got ${selection.round}`,
            code: "INVALID_ROUND"
          });
          continue;
        }
        
        // Validate team hasn't been used before by this ticket
        const existingSelections = await storage.getTeamSelectionsByTicket(selection.ticketId);
        const previousTeamIds = new Set(
          existingSelections
            .filter(s => s.round < selection.round)
            .map(s => s.teamId)
        );
        
        if (previousTeamIds.has(selection.teamId)) {
          const teams = await storage.getAllTeams();
          const teamName = teams.find(t => t.id === selection.teamId)?.name || `Team ${selection.teamId}`;
          validationErrors.push({
            ticketId: selection.ticketId,
            error: `Team ${teamName} has already been selected by this ticket in a previous round`,
            code: "TEAM_ALREADY_SELECTED"
          });
          continue;
        }
        
        // Validate team exists
        const teams = await storage.getAllTeams();
        const team = teams.find(t => t.id === selection.teamId);
        if (!team) {
          validationErrors.push({
            ticketId: selection.ticketId,
            error: `Team ${selection.teamId} does not exist`,
            code: "TEAM_NOT_FOUND"
          });
          continue;
        }
      }
      
      // Return validation errors if any found
      if (validationErrors.length > 0) {
        return res.status(400).json({ 
          message: "Validation failed", 
          errors: validationErrors,
          totalErrors: validationErrors.length
        });
      }
      
      // Process all valid selections atomically
      const results = [];
      
      for (const selection of selections) {
        // Check if selection already exists for this round
        const existingSelections = await storage.getTeamSelectionsByTicket(selection.ticketId);
        const existingSelection = existingSelections.find(s => s.round === selection.round);
        
        if (existingSelection) {
          // Update existing selection
          const updated = await storage.updateTeamSelection(existingSelection.id, selection.teamId);
          results.push({ 
            ticketId: selection.ticketId, 
            action: 'updated', 
            selectionId: existingSelection.id,
            teamId: selection.teamId
          });
        } else {
          // Create new selection
          const newSelection = await storage.createTeamSelection(selection);
          results.push({ 
            ticketId: selection.ticketId, 
            action: 'created', 
            selectionId: newSelection.id,
            teamId: selection.teamId
          });
        }
      }
      
      res.status(201).json({ 
        message: "Team selections processed successfully", 
        results,
        processedCount: results.length,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      console.error("Error processing team selections:", error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ 
          message: "Invalid request data", 
          errors: error.errors.map(e => ({
            field: e.path.join('.'),
            message: e.message,
            code: e.code
          }))
        });
      }
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      res.status(500).json({ 
        message: "Failed to process team selections",
        error: process.env.NODE_ENV === 'development' ? errorMessage : 'Internal server error',
        timestamp: new Date().toISOString()
      });
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

  // Get all team selections for user's tickets grouped by game (FIXED: prevents duplication)
  app.get("/api/user/team-selections", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    
    try {
      console.log(`Fetching team selections for user ${req.user!.id}`);
      const userTickets = await storage.getTicketsByUser(req.user!.id);
      console.log(`Found ${userTickets.length} tickets for user ${req.user!.id}`);
      
      const gamesData = [];
      const processedGames = new Set<number>(); // CRITICAL FIX: prevent duplicates
      
      // Group tickets by game
      const ticketsByGame = userTickets.reduce((acc, ticket) => {
        if (!acc[ticket.gameId]) {
          acc[ticket.gameId] = [];
        }
        acc[ticket.gameId].push(ticket);
        return acc;
      }, {} as Record<number, any[]>);
      
      console.log(`Tickets grouped into ${Object.keys(ticketsByGame).length} games`);
      
      for (const [gameId, tickets] of Object.entries(ticketsByGame)) {
        const gameIdNum = parseInt(gameId);
        
        // CRITICAL FIX: Skip if already processed
        if (processedGames.has(gameIdNum)) {
          console.log(`Skipping duplicate game ${gameIdNum}`);
          continue;
        }
        processedGames.add(gameIdNum);
        
        const game = await storage.getGame(gameIdNum);
        if (!game) {
          console.log(`Game ${gameIdNum} not found, skipping`);
          continue;
        }
        
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
        
        console.log(`Added game ${game.name} with ${tickets.length} tickets`);
      }
      
      console.log(`Returning ${gamesData.length} unique games for user ${req.user!.id}`);
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
      const roundsPlayed = game.currentRound - game.startRound + 1;
      const nextRoundNumber = roundsPlayed + 1;
      const serieARound = game.startRound + nextRoundNumber - 1;
      
      // Primary condition: Maximum 20 rounds per game
      if (nextRoundNumber > 20) {
        return res.status(400).json({ message: "Maximum 20 rounds reached" });
      }
      
      // Secondary condition: Serie A season cannot exceed round 38
      if (serieARound > 38) {
        return res.status(400).json({ message: "Serie A season ended (38 rounds maximum)" });
      }
      
      // Allow starting round 38 - the game will end when round 38 is calculated
      
      await storage.updateGameRound(gameId, serieARound);
      await storage.updateGameRoundStatus(gameId, "selection_open");
      
      // Reset match results for the new round to start clean
      await storage.resetMatchResults(serieARound);
      
      res.json({ 
        message: "New round started successfully",
        roundNumber: nextRoundNumber,
        serieARound
      });
    } catch (error) {
      console.error("Error starting new round:", error);
      res.status(500).json({ message: "Failed to start new round" });
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
        for (const matchItem of roundMatches.slice(0, 10)) { // Ensure exactly 10 matches
          const matchData = matchItem as any; // Type assertion for Excel data
          const homeTeam = teamByName.get(matchData['Squadra Casa']);
          const awayTeam = teamByName.get(matchData['Squadra Trasferta']);
          
          if (homeTeam && awayTeam) {
            dbMatches.push({
              round,
              homeTeamId: homeTeam.id,
              awayTeamId: awayTeam.id,
              homeScore: null,
              awayScore: null,
              result: null,
              matchDate: new Date(matchData.Data || new Date()),
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
      
      res.download(filePath, 'serie-a-calendar-2024-2025.xlsx');
    } catch (error) {
      console.error("Error downloading Excel calendar:", error);
      res.status(500).json({ message: "Failed to download calendar" });
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

  // Get game history with privacy logic for all players
  app.get("/api/games/:gameId/player-history", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    
    const gameId = parseInt(req.params.gameId);
    const currentUserId = req.user!.id;
    
    try {
      // Get game info
      const game = await storage.getGame(gameId);
      if (!game) {
        return res.status(404).json({ error: 'Game not found' });
      }
      
      // Get all tickets for this game
      const allTickets = await storage.getTicketsByGame(gameId);
      
      // Get all users who have tickets in this game
      const userIds = Array.from(new Set(allTickets.map(ticket => ticket.userId)));
      const users = await Promise.all(
        userIds.map(async (userId) => await storage.getUser(userId))
      );
      const usersMap = users.reduce((acc: any, user) => {
        if (user) acc[user.id] = user;
        return acc;
      }, {});
      
      // Get all team selections for each ticket
      const processedTickets = [];
      for (const ticket of allTickets) {
        const ticketSelections = await storage.getTeamSelectionsByTicket(ticket.id);
        
        // Group selections by round
        const selectionsByRound = ticketSelections.reduce((acc: any, selection) => {
          acc[selection.round] = selection;
          return acc;
        }, {});
        
        // Apply privacy logic: only admin users can see all selections at any time
        const isCurrentRoundOpen = game.roundStatus === "selection_open";
        const isCurrentUserAdmin = req.user!.isAdmin;
        const processedSelections: any = {};
        
        for (const [roundStr, selection] of Object.entries(selectionsByRound)) {
          const round = parseInt(roundStr);
          const sel = selection as any;
          
          // Privacy check: hide other players' selections for open rounds unless user is admin
          if (isCurrentRoundOpen && round === game.currentRound && ticket.userId !== currentUserId && !isCurrentUserAdmin) {
            processedSelections[round] = { ...sel, teamId: null, hidden: true };
          } else {
            processedSelections[round] = sel;
          }
        }
        
        processedTickets.push({
          ...ticket,
          user: usersMap[ticket.userId],
          selections: processedSelections
        });
      }
      
      res.json({
        game,
        tickets: processedTickets
      });
    } catch (error) {
      console.error('Error fetching game player history:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  });

  // User profile routes
  app.patch("/api/user/profile", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.sendStatus(401);
    }
    
    try {
      const { firstName, lastName, email, phoneNumber, city, country, dateOfBirth } = req.body;
      
      // Check if email is being changed and if it's already in use by another user
      if (email !== req.user.email) {
        const existingUser = await storage.getUserByEmail(email);
        if (existingUser && existingUser.id !== req.user.id) {
          return res.status(400).json({ error: "Email già in uso da un altro utente" });
        }
      }
      
      const updateData = {
        firstName,
        lastName,
        email,
        phoneNumber,
        city,
        country,
        dateOfBirth: dateOfBirth ? new Date(dateOfBirth) : undefined,
      };
      
      const updatedUser = await storage.updateUser(req.user.id, updateData);
      
      // Update the session user
      req.user = updatedUser;
      
      res.json(updatedUser);
    } catch (error) {
      console.error("Error updating profile:", error);
      res.status(500).json({ error: "Errore durante l'aggiornamento del profilo" });
    }
  });

  app.get("/api/user/stats", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.sendStatus(401);
    }
    
    try {
      const stats = await storage.getUserStats(req.user.id);
      res.json(stats);
    } catch (error) {
      console.error("Error fetching user stats:", error);
      res.status(500).json({ error: "Failed to fetch user stats" });
    }
  });

  app.get("/api/user/games", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.sendStatus(401);
    }
    
    try {
      const games = await storage.getUserGames(req.user.id);
      res.json(games);
    } catch (error) {
      console.error("Error fetching user games:", error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      res.status(500).json({ error: "Failed to fetch user games", details: errorMessage });
    }
  });

  // Timer and deadline management APIs
  app.post("/api/games/:id/set-deadline", async (req, res) => {
    if (!req.isAuthenticated() || !req.user!.isAdmin) return res.sendStatus(403);
    
    try {
      const gameId = parseInt(req.params.id);
      const { deadline } = req.body;
      
      if (!deadline) {
        return res.status(400).json({ message: "Deadline is required" });
      }
      
      const game = await storage.getGame(gameId);
      if (!game) {
        return res.status(404).json({ message: "Game not found" });
      }
      
      if (game.createdBy !== req.user!.id) {
        return res.status(403).json({ message: "Access denied - not your game" });
      }
      
      if (game.status !== "active") {
        return res.status(400).json({ message: "Game is not active" });
      }
      
      // Validate deadline is in the future
      const deadlineDate = new Date(deadline);
      const now = new Date();
      
      if (deadlineDate <= now) {
        return res.status(400).json({ message: "Deadline must be in the future" });
      }
      
      // Check if previous round is completed
      if (game.roundStatus === "calculated") {
        return res.status(400).json({ 
          message: "Previous round must be completed before setting new deadline" 
        });
      }
      
      const previousDeadline = game.selectionDeadline;
      
      // Update deadline in database
      await storage.updateGameDeadline(gameId, deadlineDate);
      
      // Create audit log
      await storage.createTimerLog(
        gameId,
        previousDeadline ? 'deadline_updated' : 'deadline_set',
        previousDeadline,
        deadlineDate,
        req.user!.id,
        {
          roundNumber: game.currentRound,
          previousStatus: game.roundStatus
        }
      );
      
      console.log(`Timer deadline ${previousDeadline ? 'updated' : 'set'} for game ${gameId}:`, {
        gameId,
        adminId: req.user!.id,
        previousDeadline: previousDeadline?.toISOString(),
        newDeadline: deadlineDate.toISOString(),
        roundNumber: game.currentRound
      });
      
      res.json({
        message: `Deadline ${previousDeadline ? 'updated' : 'set'} successfully`,
        deadline: deadlineDate.toISOString(),
        timeRemaining: deadlineDate.getTime() - now.getTime()
      });
      
    } catch (error) {
      console.error("Error setting deadline:", error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      res.status(500).json({ 
        message: "Failed to set deadline",
        error: process.env.NODE_ENV === 'development' ? errorMessage : 'Internal server error'
      });
    }
  });

  // Client error reporting endpoint for monitoring
  app.post("/api/client-errors", async (req, res) => {
    try {
      const errorData = req.body;
      
      // Log client-side errors for monitoring
      console.error("Client Error Report:", {
        errorId: errorData.errorId,
        message: errorData.message,
        stack: errorData.stack,
        url: errorData.url,
        userAgent: errorData.userAgent,
        timestamp: errorData.timestamp,
        userId: req.isAuthenticated() ? req.user!.id : 'anonymous'
      });
      
      // In production, you would send this to an error monitoring service
      // like Sentry, LogRocket, Bugsnag, etc.
      
      res.status(200).json({ 
        message: "Error reported successfully",
        errorId: errorData.errorId 
      });
    } catch (error) {
      console.error("Failed to process client error report:", error);
      res.status(500).json({ message: "Failed to process error report" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
