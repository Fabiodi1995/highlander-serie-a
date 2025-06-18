import { storage } from './storage';
import { withTransaction, batchOperation } from './db';

interface TimerCheckResult {
  gameId: number;
  action: 'locked' | 'no_action';
  autoAssignedCount?: number;
  details?: any;
}

/**
 * Controlla tutti i giochi attivi con deadline scadute e applica auto-lock
 */
export async function checkExpiredDeadlines(): Promise<TimerCheckResult[]> {
  try {
    const activeGames = await storage.getActiveGamesWithDeadlines();
    const now = new Date();
    const results: TimerCheckResult[] = [];

    for (const game of activeGames) {
      if (!game.selectionDeadline || game.selectionDeadline > now) {
        results.push({ gameId: game.id, action: 'no_action' });
        continue;
      }

      // Deadline scaduta - procedi con auto-lock
      const result = await autoLockGame(game.id);
      results.push(result);
    }

    return results;
  } catch (error) {
    console.error('Error checking expired deadlines:', error);
    throw error;
  }
}

/**
 * Blocca automaticamente un gioco e assegna squadre mancanti
 */
async function autoLockGame(gameId: number): Promise<TimerCheckResult> {
  return await withTransaction(async () => {
    const game = await storage.getGame(gameId);
    if (!game) {
      throw new Error(`Game ${gameId} not found`);
    }

    // Verifica che il gioco sia ancora in stato valido per l'auto-lock
    if (game.status !== 'active' || game.roundStatus !== 'selection_open') {
      return { gameId, action: 'no_action', details: 'Game already locked or inactive' };
    }

    // Ottieni tutti i ticket attivi per questo gioco
    const allTickets = await storage.getTicketsByGame(gameId);
    const activeTickets = allTickets.filter(t => t.isActive);

    // Ottieni le selezioni già effettuate per il round corrente
    const existingSelections = await storage.getTeamSelectionsByRound(gameId, game.currentRound);
    const ticketsWithSelections = new Set(existingSelections.map(s => s.ticketId));

    // Trova i ticket che non hanno ancora fatto una selezione
    const ticketsNeedingSelection = activeTickets.filter(t => !ticketsWithSelections.has(t.id));

    let autoAssignedCount = 0;

    if (ticketsNeedingSelection.length > 0) {
      // Ottieni tutte le squadre disponibili
      const allTeams = await storage.getAllTeams();

      // Operazioni di assegnazione automatica
      const assignmentOperations = [];

      for (const ticket of ticketsNeedingSelection) {
        // Trova squadre già usate da questo ticket in round precedenti
        const usedSelections = await storage.getTeamSelectionsByTicket(ticket.id);
        const usedTeamIds = new Set(usedSelections.map(s => s.teamId));

        // Filtra squadre disponibili (non ancora usate da questo ticket)
        const availableTeams = allTeams.filter(team => !usedTeamIds.has(team.id));

        if (availableTeams.length === 0) {
          // Caso edge: non ci sono squadre disponibili (teoricamente impossibile)
          console.warn(`No available teams for ticket ${ticket.id} in game ${gameId}`);
          continue;
        }

        // Selezione intelligente: evita squadre già scelte da altri in questo round
        const alreadySelectedInRound = new Set(existingSelections.map(s => s.teamId));
        let smartAvailableTeams = availableTeams.filter(team => !alreadySelectedInRound.has(team.id));

        // Se tutte le squadre disponibili sono già state scelte, usa qualsiasi squadra disponibile
        if (smartAvailableTeams.length === 0) {
          smartAvailableTeams = availableTeams;
        }

        // Selezione casuale dalla lista intelligente
        const randomTeam = smartAvailableTeams[Math.floor(Math.random() * smartAvailableTeams.length)];

        // Aggiungi operazione di assegnazione
        assignmentOperations.push(async () => {
          await storage.createTeamSelection({
            ticketId: ticket.id,
            teamId: randomTeam.id,
            round: game.currentRound,
            gameId: gameId
          });
        });

        autoAssignedCount++;
      }

      // Esegui tutte le assegnazioni in batch
      if (assignmentOperations.length > 0) {
        await batchOperation(assignmentOperations, { maxRetries: 2, delayMs: 50 });
      }
    }

    // Blocca le selezioni per il round corrente
    await storage.updateGameRoundStatus(gameId, 'selection_locked');

    // Crea log audit per l'auto-lock
    await storage.createTimerLog(
      gameId,
      'auto_lock',
      game.selectionDeadline,
      null,
      null,
      {
        roundNumber: game.currentRound,
        autoAssignedCount,
        totalActiveTickets: activeTickets.length,
        ticketsWithManualSelections: existingSelections.length,
        lockTimestamp: new Date().toISOString()
      }
    );

    console.log(`Auto-locked game ${gameId}:`, {
      gameId,
      roundNumber: game.currentRound,
      deadline: game.selectionDeadline?.toISOString(),
      autoAssignedCount,
      totalActiveTickets: activeTickets.length,
      manualSelections: existingSelections.length
    });

    return {
      gameId,
      action: 'locked',
      autoAssignedCount,
      details: {
        roundNumber: game.currentRound,
        totalActiveTickets: activeTickets.length,
        manualSelections: existingSelections.length
      }
    };
  });
}

/**
 * Validazione per prevenire selezioni dopo deadline scaduta
 */
export async function validateSelectionDeadline(gameId: number): Promise<{ valid: boolean; reason?: string }> {
  const game = await storage.getGame(gameId);
  
  if (!game) {
    return { valid: false, reason: 'Game not found' };
  }

  if (!game.selectionDeadline) {
    return { valid: true }; // Nessuna deadline impostata
  }

  const now = new Date();
  if (game.selectionDeadline <= now) {
    return { 
      valid: false, 
      reason: 'Deadline expired - selections are locked' 
    };
  }

  return { valid: true };
}

/**
 * Avvia il servizio di controllo timer periodico
 */
export function startTimerService() {
  console.log('Starting timer service for deadline monitoring...');
  
  // Controlla ogni 30 secondi per deadline scadute
  const checkInterval = setInterval(async () => {
    try {
      const results = await checkExpiredDeadlines();
      const lockedGames = results.filter(r => r.action === 'locked');
      
      if (lockedGames.length > 0) {
        console.log(`Timer service: Auto-locked ${lockedGames.length} games:`, 
          lockedGames.map(g => ({ 
            gameId: g.gameId, 
            autoAssigned: g.autoAssignedCount 
          }))
        );
      }
    } catch (error) {
      console.error('Timer service error:', error);
    }
  }, 30000); // 30 secondi

  // Graceful shutdown
  process.on('SIGTERM', () => {
    console.log('Stopping timer service...');
    clearInterval(checkInterval);
  });

  return checkInterval;
}