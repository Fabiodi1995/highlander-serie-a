import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import type { Game, Ticket, Team, User } from '@shared/schema';

// Import team logos for PDF generation
import atalantaLogo from "../assets/team-logos/atalanta.png";
import bolognaLogo from "../assets/team-logos/bologna.png";
import cagliariLogo from "../assets/team-logos/cagliari.png";
import comoLogo from "../assets/team-logos/como.png";
import empoliLogo from "../assets/team-logos/empoli.png";
import fiorentinaLogo from "../assets/team-logos/fiorentina.png";
import genoaLogo from "../assets/team-logos/genoa.png";
import hellasVeronaLogo from "../assets/team-logos/hellas-verona.png";
import interLogo from "../assets/team-logos/inter.png";
import juventusLogo from "../assets/team-logos/juventus.png";
import lazioLogo from "../assets/team-logos/lazio.png";
import lecceLogo from "../assets/team-logos/lecce.png";
import milanLogo from "../assets/team-logos/milan.png";
import monzaLogo from "../assets/team-logos/monza.png";
import napoliLogo from "../assets/team-logos/napoli.png";
import parmaLogo from "../assets/team-logos/parma.png";
import romaLogo from "../assets/team-logos/roma.png";
import torinoLogo from "../assets/team-logos/torino.png";
import udineseLogo from "../assets/team-logos/udinese.png";
import veneziaLogo from "../assets/team-logos/venezia.png";

// Team logo mapping for PDF generation
const teamLogoMap: { [key: string]: string } = {
  "Atalanta": atalantaLogo,
  "Bologna": bolognaLogo,
  "Cagliari": cagliariLogo,
  "Como": comoLogo,
  "Empoli": empoliLogo,
  "Fiorentina": fiorentinaLogo,
  "Genoa": genoaLogo,
  "Hellas Verona": hellasVeronaLogo,
  "Inter": interLogo,
  "Juventus": juventusLogo,
  "Lazio": lazioLogo,
  "Lecce": lecceLogo,
  "Milan": milanLogo,
  "Monza": monzaLogo,
  "Napoli": napoliLogo,
  "Parma": parmaLogo,
  "Roma": romaLogo,
  "Torino": torinoLogo,
  "Udinese": udineseLogo,
  "Venezia": veneziaLogo,
};

// Colors for different ticket statuses (light colors to not interfere with logos)
const statusColors = {
  superato: { r: 232, g: 245, b: 232 }, // Light green
  attivo: { r: 255, g: 249, b: 230 },   // Light yellow
  eliminato: { r: 255, g: 232, b: 232 }, // Light red
  vincitore: { r: 255, g: 244, b: 204 }, // Light gold
  futuro: { r: 248, g: 249, b: 250 }     // Light gray
};

export interface GameHistoryData {
  game: Game;
  tickets: any[];
  teams: Team[];
  users: User[];
  teamSelections: any[];
}

export function generateGameHistoryPDF(data: GameHistoryData) {
  const { game, tickets, teams, users, teamSelections } = data;
  
  // Create new PDF document in landscape mode for better table display
  const doc = new jsPDF({
    orientation: 'landscape',
    unit: 'mm',
    format: 'a4'
  });
  
  // Set font
  doc.setFont('helvetica');
  
  // Title
  doc.setFontSize(18);
  doc.text('Storico Giocatori - Highlander', 20, 20);
  
  // Game info
  doc.setFontSize(12);
  doc.text(`Gioco: ${game.name}`, 20, 32);
  doc.setFontSize(9);
  doc.text(`Stato: ${game.status}`, 20, 40);
  doc.text(`Giornata corrente: ${game.currentRound}`, 20, 46);
  doc.text(`Giornate: dalla ${game.startRound} alla ${Math.min(game.startRound + 19, 38)}`, 20, 52);
  doc.text(`Data generazione: ${new Date().toLocaleDateString('it-IT')}`, 20, 58);
  
  // Helper functions
  const getTeamName = (teamId: number) => {
    return teams.find(t => t.id === teamId)?.name || 'N/A';
  };
  
  const getTeamCode = (teamId: number) => {
    return teams.find(t => t.id === teamId)?.code || '???';
  };
  
  const getUserName = (userId: number) => {
    return users.find(u => u.id === userId)?.username || 'N/A';
  };
  
  const getTicketStatus = (ticket: any) => {
    if (!ticket.isActive) return 'Eliminato';
    if (game.status === 'completed' && ticket.isActive) return 'Vincitore';
    if (ticket.isActive && game.status === 'active') return 'Attivo';
    return 'Superato';
  };

  const getStatusSortOrder = (status: string) => {
    switch (status) {
      case 'Vincitore': return 1;
      case 'Attivo': return 2;
      case 'Superato': return 3;
      case 'Eliminato': return 4;
      default: return 5;
    }
  };
  
  // Create complete rounds array (up to 20 rounds max)
  const maxRounds = Math.min(20, 38 - game.startRound + 1);
  const gameRounds: number[] = [];
  for (let i = 0; i < maxRounds; i++) {
    gameRounds.push(game.startRound + i);
  }
  
  // Create selections mapping by ticket and round
  const selectionsByTicket = teamSelections.reduce((acc: any, selection: any) => {
    if (!acc[selection.ticketId]) {
      acc[selection.ticketId] = {};
    }
    acc[selection.ticketId][selection.round] = selection;
    return acc;
  }, {});
  
  // Prepare table headers with smaller font for 20 columns
  const tableHeaders = [
    'Giocatore',
    'Ticket',
    'Stato',
    ...gameRounds.map((round, index) => `R${index + 1}`)
  ];
  
  // Sort tickets by status priority
  const sortedTickets = tickets.sort((a, b) => {
    const statusA = getTicketStatus(a);
    const statusB = getTicketStatus(b);
    const orderA = getStatusSortOrder(statusA);
    const orderB = getStatusSortOrder(statusB);
    
    if (orderA !== orderB) {
      return orderA - orderB;
    }
    return a.id - b.id;
  });
  
  const tableData = sortedTickets.map(ticket => {
    const row = [
      getUserName(ticket.userId),
      `#${ticket.id}`,
      getTicketStatus(ticket)
    ];
    
    // Add team selections for each round with proper status
    gameRounds.forEach(round => {
      const selection = selectionsByTicket[ticket.id]?.[round];
      
      // If ticket was eliminated before this round
      if (ticket.eliminatedInRound && ticket.eliminatedInRound < round) {
        row.push('—');
        return;
      }
      
      // If ticket was eliminated in this round
      if (ticket.eliminatedInRound === round) {
        const teamCode = selection ? getTeamCode(selection.teamId) : '';
        row.push(teamCode || 'X');
        return;
      }
      
      // Check if this is the final round and the game is completed with this ticket still active (WINNER)
      if (selection && game.status === 'completed' && ticket.isActive && round === game.currentRound) {
        const teamCode = getTeamCode(selection.teamId);
        row.push(teamCode || '★');
        return;
      }
      
      // If round is completed (superato)
      if (selection && (round < game.currentRound || (round === game.currentRound && game.roundStatus === "calculated"))) {
        const teamCode = getTeamCode(selection.teamId);
        row.push(teamCode || '✓');
        return;
      }
      
      // Check if this is current round being played
      const isCurrentRound = round === game.currentRound && game.roundStatus !== "calculated";
      
      // If this is current round and ticket is active
      if (isCurrentRound && ticket.isActive) {
        const teamCode = selection ? getTeamCode(selection.teamId) : '';
        row.push(teamCode || '?');
        return;
      }
      
      row.push('—');
    });
    
    return row;
  });
  
  // Calculate column widths for 20+ columns
  const roundColumnWidth = (297 - 70) / gameRounds.length; // A4 landscape width minus fixed columns
  const columnStyles: any = {
    0: { cellWidth: 25 }, // Giocatore
    1: { cellWidth: 15 }, // Ticket
    2: { cellWidth: 20 }, // Stato
  };
  
  // Set width for round columns
  gameRounds.forEach((_, index) => {
    columnStyles[3 + index] = { cellWidth: Math.max(roundColumnWidth, 8) };
  });

  // Add table to PDF
  autoTable(doc, {
    head: [tableHeaders],
    body: tableData,
    startY: 65,
    styles: {
      fontSize: gameRounds.length > 15 ? 6 : 7,
      cellPadding: 1,
      halign: 'center',
      valign: 'middle'
    },
    headStyles: {
      fillColor: [71, 85, 105], // slate-600
      textColor: 255,
      fontSize: gameRounds.length > 15 ? 7 : 8,
      fontStyle: 'bold',
      halign: 'center'
    },
    alternateRowStyles: {
      fillColor: [248, 250, 252] // slate-50
    },
    columnStyles,
    margin: { left: 10, right: 10 },
    didParseCell: function(data: any) {
      const rowIndex = data.row.index;
      const colIndex = data.column.index;
      const ticket = sortedTickets[rowIndex];
      const round = gameRounds[colIndex - 3];
      
      // Color coding for status column
      if (colIndex === 2) {
        const cellValue = data.cell.text[0];
        if (cellValue === 'Vincitore') {
          data.cell.styles.fillColor = [statusColors.vincitore.r, statusColors.vincitore.g, statusColors.vincitore.b];
          data.cell.styles.textColor = [146, 64, 14];
        } else if (cellValue === 'Eliminato') {
          data.cell.styles.fillColor = [statusColors.eliminato.r, statusColors.eliminato.g, statusColors.eliminato.b];
          data.cell.styles.textColor = [153, 27, 27];
        } else if (cellValue === 'Attivo') {
          data.cell.styles.fillColor = [statusColors.attivo.r, statusColors.attivo.g, statusColors.attivo.b];
          data.cell.styles.textColor = [146, 64, 14];
        }
      }
      
      // Color coding for round columns based on ticket status in that round
      if (colIndex >= 3 && round && ticket) {
        const selection = selectionsByTicket[ticket.id]?.[round];
        
        // Winner cell
        if (selection && game.status === 'completed' && ticket.isActive && round === game.currentRound) {
          data.cell.styles.fillColor = [statusColors.vincitore.r, statusColors.vincitore.g, statusColors.vincitore.b];
        }
        // Eliminated cell
        else if (ticket.eliminatedInRound === round) {
          data.cell.styles.fillColor = [statusColors.eliminato.r, statusColors.eliminato.g, statusColors.eliminato.b];
        }
        // Completed round (superato)
        else if (selection && (round < game.currentRound || (round === game.currentRound && game.roundStatus === "calculated"))) {
          data.cell.styles.fillColor = [statusColors.superato.r, statusColors.superato.g, statusColors.superato.b];
        }
        // Active round
        else if (round === game.currentRound && game.roundStatus !== "calculated" && ticket.isActive && selection) {
          data.cell.styles.fillColor = [statusColors.attivo.r, statusColors.attivo.g, statusColors.attivo.b];
        }
        // Future rounds or inactive
        else if (round > game.currentRound || (!ticket.isActive && ticket.eliminatedInRound && ticket.eliminatedInRound < round)) {
          data.cell.styles.fillColor = [statusColors.futuro.r, statusColors.futuro.g, statusColors.futuro.b];
        }
      }
    }
  });

  // Add legend with team logos and colors explanation
  const finalY = (doc as any).lastAutoTable.finalY + 10;
  
  // Teams legend
  doc.setFontSize(12);
  doc.text('Legenda Squadre:', 20, finalY);
  
  // Get unique teams used in this game
  const usedTeams = Array.from(new Set(
    teamSelections.map((s: any) => s.teamId)
  )).map(teamId => teams.find(t => t.id === teamId)).filter(Boolean);
  
  // Sort teams alphabetically
  usedTeams.sort((a: any, b: any) => a.name.localeCompare(b.name));
  
  doc.setFontSize(8);
  usedTeams.forEach((team: any, index: number) => {
    const x = 20 + (index % 4) * 70;
    const y = finalY + 8 + Math.floor(index / 4) * 8;
    doc.text(`${team.code} - ${team.name}`, x, y);
  });
  
  // Status legend
  const statusY = finalY + 8 + Math.ceil(usedTeams.length / 4) * 8 + 10;
  doc.setFontSize(12);
  doc.text('Legenda Stati:', 20, statusY);
  
  doc.setFontSize(8);
  doc.setFillColor(statusColors.superato.r, statusColors.superato.g, statusColors.superato.b);
  doc.rect(20, statusY + 5, 8, 4, 'F');
  doc.text('Superato', 30, statusY + 8);
  
  doc.setFillColor(statusColors.attivo.r, statusColors.attivo.g, statusColors.attivo.b);
  doc.rect(70, statusY + 5, 8, 4, 'F');
  doc.text('Attivo', 80, statusY + 8);
  
  doc.setFillColor(statusColors.eliminato.r, statusColors.eliminato.g, statusColors.eliminato.b);
  doc.rect(120, statusY + 5, 8, 4, 'F');
  doc.text('Eliminato', 130, statusY + 8);
  
  doc.setFillColor(statusColors.vincitore.r, statusColors.vincitore.g, statusColors.vincitore.b);
  doc.rect(180, statusY + 5, 8, 4, 'F');
  doc.text('Vincitore', 190, statusY + 8);
  
  // Save the PDF
  const fileName = `highlander_storico_${game.name.replace(/[^a-zA-Z0-9]/g, '_')}_${new Date().toISOString().split('T')[0]}.pdf`;
  doc.save(fileName);
}