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

  // Se il gioco è attivo
  if (game.status === 'active') {
    const currentRound = game.currentRound;
    const roundStatus = game.roundStatus;
    
    // LOGICA CORRETTA DEGLI STATI:
    // - ATTIVO: Ticket nel round corrente non ancora calcolato (round 1 o round corrente con selection_open/selection_locked)
    // - SUPERATO: Ticket che ha completato round precedenti O il round corrente è stato calcolato
    
    // Se siamo nel round 1
    if (currentRound === 1) {
      // Round 1 non ancora calcolato = ATTIVO
      if (roundStatus === 'selection_open' || roundStatus === 'selection_locked') {
        return 'active';
      }
      // Round 1 calcolato = SUPERATO
      if (roundStatus === 'calculated') {
        return 'passed';
      }
    }
    
    // Se siamo in round 2+
    if (currentRound > 1) {
      // Round corrente con selezioni aperte o chiuse (non calcolato) = ATTIVO nel round corrente
      if (roundStatus === 'selection_open' || roundStatus === 'selection_locked') {
        return 'active'; // È attivo nel round corrente, non importa quanti round ha superato prima
      }
      
      // Round corrente calcolato = SUPERATO questo round
      if (roundStatus === 'calculated') {
        return 'passed'; // Ha completato con successo il round corrente
      }
    }
    
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