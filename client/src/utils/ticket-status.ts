import type { Ticket, Game } from "@shared/schema";

export type TicketStatus = 'winner' | 'active' | 'passed' | 'eliminated';

export interface TicketWithStatus extends Ticket {
  status: TicketStatus;
  statusLabel: string;
  statusColor: string;
  statusDisplay: string;
}

export function getTicketStatus(ticket: Ticket, game: Game): TicketStatus {
  // Se il ticket è stato eliminato
  if (!ticket.isActive) {
    return 'eliminated';
  }

  // Se il gioco è completato
  if (game.status === 'completed') {
    // Se il ticket è ancora attivo alla fine del gioco, è vincitore
    return 'winner';
  }

  // Se il gioco è ancora attivo
  if (game.status === 'active') {
    // Logica per determinare se un ticket ha "superato" dei round:
    // - È attivo
    // - Siamo oltre il primo round
    // - Il ticket ha effettivamente superato round precedenti
    
    if (ticket.isActive && game.currentRound > 1) {
      // Se siamo nel round corrente con selezioni aperte,
      // significa che i round precedenti sono stati completati e il ticket li ha superati
      if (game.roundStatus === 'selection_open') {
        // Selezioni aperte = round precedenti completati e superati
        return 'passed';
      }
      
      if (game.roundStatus === 'calculated') {
        // Risultati calcolati = anche il round corrente è completato e superato
        return 'passed';
      }
      
      // Se siamo in selection_locked (selezioni chiuse ma risultati non ancora calcolati)
      // del round corrente, il ticket è ancora "attivo" ma ha comunque
      // superato i round precedenti se currentRound > 1
      if (game.roundStatus === 'selection_locked') {
        // Se siamo oltre il primo round, ha comunque superato i precedenti
        return 'passed';
      }
      
      // Fallback per stati non riconosciuti
      return 'active';
    }
    
    // Se siamo nel primo round, il ticket è sempre "attivo"
    return 'active';
  }

  // Default per giochi in registrazione
  return 'active';
}

export function getTicketStatusLabel(status: TicketStatus): string {
  switch (status) {
    case 'winner':
      return 'Vincitore';
    case 'active':
      return 'Attivo';
    case 'passed':
      return 'Superato';
    case 'eliminated':
      return 'Eliminato';
    default:
      return 'Sconosciuto';
  }
}

export function getTicketStatusColor(status: TicketStatus): string {
  switch (status) {
    case 'winner':
      return 'text-yellow-600 bg-yellow-50 border-yellow-200';
    case 'active':
      return 'text-green-600 bg-green-50 border-green-200';
    case 'passed':
      return 'text-blue-600 bg-blue-50 border-blue-200';
    case 'eliminated':
      return 'text-red-600 bg-red-50 border-red-200';
    default:
      return 'text-gray-600 bg-gray-50 border-gray-200';
  }
}

export function enhanceTicketsWithStatus(tickets: Ticket[], game: Game): TicketWithStatus[] {
  return tickets.map(ticket => {
    const status = getTicketStatus(ticket, game);
    const statusLabel = getTicketStatusLabel(status);
    return {
      ...ticket,
      status,
      statusLabel,
      statusColor: getTicketStatusColor(status),
      statusDisplay: statusLabel
    };
  });
}

export function getStatusSortOrder(status: TicketStatus): number {
  // Ordinamento: Vincitore, Attivo, Superato, Eliminato
  switch (status) {
    case 'winner': return 0;
    case 'active': return 1;
    case 'passed': return 2;
    case 'eliminated': return 3;
    default: return 4;
  }
}