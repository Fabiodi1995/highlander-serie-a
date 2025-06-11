import { storage } from "./storage";
import type { Game, Ticket, GameParticipant } from "@shared/schema";

export interface GameEndCondition {
  ended: boolean;
  reason: "single_survivor" | "max_rounds" | "season_end" | "all_eliminated";
  winner?: {
    userId: number;
    username: string;
    ticketsRemaining: number;
  };
  survivors?: Array<{
    userId: number;
    username: string;
    ticketsRemaining: number;
    joinedAt: Date;
  }>;
}

/**
 * Calcola il round corrente del gioco basato sulla giornata di Serie A
 * @param gameStartRound Giornata di Serie A quando è iniziato il gioco
 * @param currentSerieARound Giornata corrente di Serie A
 * @returns Il round del gioco (1-based)
 */
export function calculateGameRound(
  gameStartRound: number,
  currentSerieARound: number,
): number {
  return Math.max(1, currentSerieARound - gameStartRound + 1);
}

/**
 * Calcola il round massimo possibile per un gioco
 * @param gameStartRound Giornata di Serie A quando è iniziato il gioco
 * @returns Il numero massimo di round (max 20 o fino alla 38° giornata)
 */
export function calculateMaxRounds(gameStartRound: number): number {
  const remainingMatches = 38 - gameStartRound + 1;
  return Math.min(20, remainingMatches);
}

/**
 * Controlla se il gioco deve terminare e determina il vincitore
 * @param gameId ID del gioco
 * @param currentSerieARound Giornata corrente di Serie A
 * @returns Condizioni di fine gioco
 */
export async function checkGameEndConditions(
  gameId: number,
  currentSerieARound: number,
): Promise<GameEndCondition> {
  try {
    const game = await storage.getGame(gameId);
    if (!game) {
      throw new Error(`Game ${gameId} not found`);
    }

    // Calcola il round corrente del gioco
    const currentGameRound = calculateGameRound(
      game.startRound,
      currentSerieARound,
    );
    const maxRounds = calculateMaxRounds(game.startRound);

    // Ottieni tutti i ticket attivi del gioco
    const allTickets = await storage.getTicketsByGame(gameId);
    const activeTickets = allTickets.filter((ticket) => ticket.isActive);

    // Ottieni tutti i partecipanti con i loro ticket attivi
    const participants = await storage.getGameParticipants(gameId);
    const survivorsMap = new Map<
      number,
      {
        userId: number;
        username: string;
        ticketsRemaining: number;
        joinedAt: Date;
      }
    >();

    // Raggruppa i ticket per utente
    for (const participant of participants) {
      const userActiveTickets = activeTickets.filter(
        (ticket) => ticket.userId === participant.userId,
      );
      if (userActiveTickets.length > 0) {
        survivorsMap.set(participant.userId, {
          userId: participant.userId,
          username: `User ${participant.userId}`, // Simplified for now
          ticketsRemaining: userActiveTickets.length,
          joinedAt: participant.joinedAt,
        });
      }
    }

    const survivors = Array.from(survivorsMap.values());

    // Condizione 1: Tutti eliminati
    if (survivors.length === 0) {
      return {
        ended: true,
        reason: "all_eliminated",
        survivors: [],
      };
    }

    // Condizione 2: Rimane un solo giocatore (anche con più ticket)
    if (survivors.length === 1) {
      return {
        ended: true,
        reason: "single_survivor",
        winner: survivors[0],
        survivors: [survivors[0]],
      };
    }

    // Condizione 3: Raggiunto il 20° round
    if (currentGameRound >= 20) {
      // Vince chi ha più ticket
      const sortedBySurvivalCount = survivors.sort((a, b) => {
        if (b.ticketsRemaining !== a.ticketsRemaining) {
          return b.ticketsRemaining - a.ticketsRemaining;
        }
        // Pareggio: vince chi si è iscritto prima
        return a.joinedAt.getTime() - b.joinedAt.getTime();
      });

      return {
        ended: true,
        reason: "max_rounds",
        winner: sortedBySurvivalCount[0],
        survivors: sortedBySurvivalCount,
      };
    }

    // Condizione 4: Raggiunta la 38° giornata di Serie A
    if (currentSerieARound >= 38) {
      // Vince chi ha più ticket sopravvissuti
      const sortedBySurvivalCount = survivors.sort((a, b) => {
        if (b.ticketsRemaining !== a.ticketsRemaining) {
          return b.ticketsRemaining - a.ticketsRemaining;
        }
        // Pareggio: vince chi si è iscritto prima
        return a.joinedAt.getTime() - b.joinedAt.getTime();
      });

      return {
        ended: true,
        reason: "season_end",
        winner: sortedBySurvivalCount[0],
        survivors: sortedBySurvivalCount,
      };
    }

    // Il gioco continua
    return {
      ended: false,
      reason: "single_survivor", // placeholder
      survivors: survivors,
    };
  } catch (error) {
    console.error("Error checking game end conditions:", error);
    throw error;
  }
}

/**
 * Finalizza un gioco e imposta il vincitore
 * @param gameId ID del gioco
 * @param endCondition Condizioni di fine gioco
 */
export async function finalizeGame(
  gameId: number,
  endCondition: GameEndCondition,
): Promise<void> {
  if (!endCondition.ended) {
    throw new Error("Cannot finalize a game that hasn't ended");
  }

  try {
    // Aggiorna lo status del gioco a 'completed'
    await storage.updateGameStatus(gameId, "completed");

    // Log della vittoria per debugging
    console.log(`Game ${gameId} ended:`, {
      reason: endCondition.reason,
      winner: endCondition.winner,
      totalSurvivors: endCondition.survivors?.length || 0,
    });
  } catch (error) {
    console.error(`Error finalizing game ${gameId}:`, error);
    throw error;
  }
}

/**
 * Controlla e finalizza automaticamente tutti i giochi attivi
 * @param currentSerieARound Giornata corrente di Serie A
 */
export async function checkAllActiveGames(
  currentSerieARound: number,
): Promise<void> {
  try {
    // Qui dovremmo ottenere tutti i giochi attivi, ma il metodo non esiste ancora
    // Per ora lasciamo questo come placeholder per future implementazioni
    console.log(
      `Checking all active games for Serie A round ${currentSerieARound}`,
    );
  } catch (error) {
    console.error("Error checking all active games:", error);
  }
}
