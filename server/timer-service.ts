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
    // Usa il timezone italiano corretto (UTC+1 in inverno, UTC+2 in estate)
    const now = new Date();
    // Giugno è estate, quindi UTC+2
    const italianTime = new Date(now.getTime() + (2 * 60 * 60 * 1000));
    const results: TimerCheckResult[] = [];

    console.log(`Checking ${activeGames.length} active games at Italian time:`, italianTime.toISOString());

    for (const game of activeGames) {
      if (!game.selectionDeadline) {
        results.push({ gameId: game.id, action: 'no_action', details: 'No deadline set' });
        continue;
      }

      const deadlineTime = new Date(game.selectionDeadline);
      console.log(`Game ${game.id} deadline: ${deadlineTime.toISOString()}, Current Italian time: ${italianTime.toISOString()}`);

      if (deadlineTime > italianTime) {
        results.push({ gameId: game.id, action: 'no_action', details: 'Deadline not yet expired' });
        continue;
      }

      // Deadline scaduta - procedi con auto-lock
      console.log(`Auto-locking game ${game.id} due to expired deadline`);
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
  try {
    console.log(`Starting auto-lock for game ${gameId}`);
    
    const game = await storage.getGame(gameId);
    if (!game) {
      console.error(`Game ${gameId} not found during auto-lock`);
      return { gameId, action: 'no_action', details: 'Game not found' };
    }

    console.log(`Game ${gameId} current state: status=${game.status}, roundStatus=${game.roundStatus}, round=${game.currentRound}`);

    // Verifica che il gioco sia ancora in stato valido per l'auto-lock
    if (game.status !== 'active' || game.roundStatus !== 'selection_open') {
      console.log(`Game ${gameId} not eligible for auto-lock: status=${game.status}, roundStatus=${game.roundStatus}`);
      return { gameId, action: 'no_action', details: 'Game already locked or inactive' };
    }

    // Esegui l'auto-lock in una transazione
    const result = await withTransaction(async () => {
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

        for (const ticket of ticketsNeedingSelection) {
          // Trova squadre già usate da questo ticket in round precedenti
          const usedSelections = await storage.getTeamSelectionsByTicket(ticket.id);
          const usedTeamIds = new Set(usedSelections.map(s => s.teamId));

          // Squadre disponibili per questo ticket
          const availableTeams = allTeams.filter(team => !usedTeamIds.has(team.id));

          if (availableTeams.length === 0) {
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

          // Crea la selezione automatica
          await storage.createTeamSelection({
            ticketId: ticket.id,
            teamId: randomTeam.id,
            round: game.currentRound,
            gameId: gameId
          });

          autoAssignedCount++;
        }
      }

      // Blocca le selezioni per il round corrente
      console.log(`Updating game ${gameId} roundStatus to selection_locked`);
      await storage.updateGameRoundStatus(gameId, 'selection_locked');
      
      // Rimuovi la deadline dopo aver bloccato il gioco
      console.log(`Clearing deadline for game ${gameId}`);
      await storage.updateGameDeadline(gameId, null);

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

      return {
        autoAssignedCount,
        totalActiveTickets: activeTickets.length,
        manualSelections: existingSelections.length
      };
    });

    console.log(`Successfully auto-locked game ${gameId}:`, {
      gameId,
      roundNumber: game.currentRound,
      deadline: game.selectionDeadline?.toISOString(),
      ...result
    });

    return {
      gameId,
      action: 'locked',
      autoAssignedCount: result.autoAssignedCount,
      details: {
        roundNumber: game.currentRound,
        totalActiveTickets: result.totalActiveTickets,
        manualSelections: result.manualSelections
      }
    };
  } catch (error) {
    console.error(`Error auto-locking game ${gameId}:`, error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return { gameId, action: 'no_action', details: `Error: ${errorMessage}` };
  }
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
  const italianTime = new Date(now.getTime() + (2 * 60 * 60 * 1000));
  const deadlineTime = new Date(game.selectionDeadline);
  
  if (deadlineTime <= italianTime) {
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

  // Cleanup function per fermare il timer se necessario
  return () => {
    clearInterval(checkInterval);
    console.log('Timer service stopped');
  };
}