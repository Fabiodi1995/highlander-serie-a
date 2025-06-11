import type { Ticket, Game } from "@shared/schema";

export type TicketStatus = 'winner' | 'active' | 'passed' | 'eliminated';

export interface TicketWithStatus extends Ticket {
  status: TicketStatus;
  statusLabel: string;
  statusColor: string;
  statusDisplay: string;
}

export function getTicketStatus(ticket: Ticket, game: Game): TicketStatus {
  // Se il ticket è stato eliminato (isActive = false)
  if (!ticket.isActive) {
    return 'eliminated';
  }

  // Se il gioco è completato e il ticket è ancora attivo, è vincitore
  if (game.status === 'completed') {
    return 'winner';
  }

  // Se il gioco è ancora attivo
  if (game.status === 'active') {
    // Logica basata su currentRound e roundStatus:
    
    // CASO 1: Primo round - sempre ATTIVO
    if (game.currentRound === 1) {
      return 'active';
    }
    
    // CASO 2: Round successivi al primo
    if (game.currentRound > 1) {
      // Se le selezioni sono aperte per il round corrente,
      // significa che i round precedenti sono stati calcolati e questo ticket li ha superati
      if (game.roundStatus === 'selection_open') {
        return 'passed';
      }
      
      // Se le selezioni sono chiuse ma i risultati non ancora calcolati,
      // il ticket è ancora "attivo" per il round corrente
      if (game.roundStatus === 'selection_locked') {
        return 'active';
      }
      
      // Se i risultati sono stati calcolati per il round corrente,
      // il ticket ha superato anche questo round
      if (game.roundStatus === 'calculated') {
        return 'passed';
      }
    }
    
    // Fallback
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