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
  futuro: { r: 248, g: 249, b: 250 },    // Light gray
  noSelection: { r: 255, g: 249, b: 230 } // Yellow for missing selections
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
  
  // Add background gradient effect
  doc.setFillColor(245, 247, 250);
  doc.rect(0, 0, 297, 210, 'F');
  
  // Header section with modern design
  doc.setFillColor(71, 85, 105); // Dark blue header
  doc.rect(0, 0, 297, 25, 'F');
  
  // Title with white text
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(20);
  doc.setFont('helvetica', 'bold');
  doc.text('🏆 HIGHLANDER - Storico Giocatori', 20, 17);
  
  // Game info section with modern card design
  doc.setFillColor(255, 255, 255);
  doc.rect(15, 30, 267, 25, 'F');
  doc.setDrawColor(226, 232, 240);
  doc.rect(15, 30, 267, 25, 'S');
  
  // Game info text in dark color
  doc.setTextColor(51, 65, 85);
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text(`🎮 ${game.name}`, 20, 40);
  
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text(`📊 Stato: ${game.status}`, 20, 46);
  doc.text(`🎯 Giornata corrente: ${game.currentRound}`, 20, 51);
  doc.text(`📅 Giornate: dalla ${game.startRound} alla ${Math.min(game.startRound + 19, 38)}`, 120, 46);
  doc.text(`📆 Generato: ${new Date().toLocaleDateString('it-IT')} alle ${new Date().toLocaleTimeString('it-IT')}`, 120, 51);
  
  // Helper functions
  const getTeamName = (teamId: number) => {
    return teams.find(t => t.id === teamId)?.name || 'N/A';
  };
  
  const getTeamCode = (teamId: number) => {
    return teams.find(t => t.id === teamId)?.code || '???';
  };

  // Function to get team visual representation for PDF
  const getTeamDisplay = (teamId: number) => {
    const team = teams.find(t => t.id === teamId);
    if (!team) return '???';
    
    // Create a visual representation using team code with styling
    return team.code;
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
        row.push(teamCode || '—');
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

  // Add table to PDF with modern styling
  autoTable(doc, {
    head: [tableHeaders],
    body: tableData,
    startY: 65,
    styles: {
      fontSize: gameRounds.length > 15 ? 6 : 7,
      cellPadding: 2,
      halign: 'center',
      valign: 'middle',
      textColor: [51, 65, 85],
      lineColor: [226, 232, 240],
      lineWidth: 0.5
    },
    headStyles: {
      fillColor: [30, 41, 59], // Modern dark blue
      textColor: [255, 255, 255],
      fontSize: gameRounds.length > 15 ? 7 : 8,
      fontStyle: 'bold',
      halign: 'center',
      cellPadding: 3
    },
    alternateRowStyles: {
      fillColor: [248, 250, 252] // Light gray for alternating rows
    },
    columnStyles,
    margin: { left: 15, right: 15 },
    theme: 'grid',
    didParseCell: function(data: any) {
      const rowIndex = data.row.index;
      const colIndex = data.column.index;
      const ticket = sortedTickets[rowIndex];
      const round = gameRounds[colIndex - 3];
      
      // Color coding for status column with modern styling
      if (colIndex === 2) {
        const cellValue = data.cell.text[0];
        if (cellValue === 'Vincitore') {
          data.cell.styles.fillColor = [255, 215, 0]; // Gold
          data.cell.styles.textColor = [0, 0, 0];
          data.cell.styles.fontStyle = 'bold';
        } else if (cellValue === 'Eliminato') {
          data.cell.styles.fillColor = [220, 53, 69]; // Red
          data.cell.styles.textColor = [255, 255, 255];
          data.cell.styles.fontStyle = 'bold';
        } else if (cellValue === 'Attivo') {
          data.cell.styles.fillColor = [40, 167, 69]; // Green
          data.cell.styles.textColor = [255, 255, 255];
          data.cell.styles.fontStyle = 'bold';
        } else if (cellValue === 'Superato') {
          data.cell.styles.fillColor = [108, 117, 125]; // Gray
          data.cell.styles.textColor = [255, 255, 255];
        }
      }
      
      // Color coding for round columns based on ticket status in that round
      if (colIndex >= 3 && round && ticket) {
        const selection = selectionsByTicket[ticket.id]?.[round];
        
        // Winner cell (gold)
        if (selection && game.status === 'completed' && ticket.isActive && round === game.currentRound) {
          data.cell.styles.fillColor = [255, 243, 205]; // Light gold
          data.cell.styles.fontStyle = 'bold';
        }
        // Eliminated cell (light red)
        else if (ticket.eliminatedInRound === round) {
          data.cell.styles.fillColor = [248, 215, 218]; // Light red
        }
        // Completed round with selection (light green)
        else if (selection && round < game.currentRound) {
          data.cell.styles.fillColor = [212, 237, 218]; // Light green
        }
        // Current round with selection (white with border)
        else if (round === game.currentRound && ticket.isActive && selection) {
          data.cell.styles.fillColor = [255, 255, 255];
          data.cell.styles.lineColor = [40, 167, 69];
          data.cell.styles.lineWidth = 1;
        }
        // Current round without selection (yellow)
        else if (round === game.currentRound && ticket.isActive && !selection) {
          data.cell.styles.fillColor = [255, 243, 205]; // Yellow
        }
        // Future rounds or eliminated ticket (light gray)
        else if (round > game.currentRound || !ticket.isActive) {
          data.cell.styles.fillColor = [248, 249, 250]; // Very light gray
        }
        // Default case (white)
        else {
          data.cell.styles.fillColor = [255, 255, 255];
        }
      }
    }
  });

  // Modern legend section
  const finalY = (doc as any).lastAutoTable.finalY + 15;
  
  // Teams legend with modern card design
  doc.setFillColor(255, 255, 255);
  doc.rect(15, finalY, 267, Math.ceil(teams.length / 4) * 6 + 15, 'F');
  doc.setDrawColor(226, 232, 240);
  doc.rect(15, finalY, 267, Math.ceil(teams.length / 4) * 6 + 15, 'S');
  
  doc.setTextColor(30, 41, 59);
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.text('⚽ Legenda Squadre Serie A 2024/25', 20, finalY + 8);
  
  // Show all Serie A teams (all 20 teams) with modern styling
  const allSerieATeams = [...teams].sort((a, b) => a.name.localeCompare(b.name));
  
  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(71, 85, 105);
  allSerieATeams.forEach((team, index) => {
    const x = 20 + (index % 4) * 65;
    const y = finalY + 15 + Math.floor(index / 4) * 6;
    doc.text(`${team.code} - ${team.name}`, x, y);
  });
  
  // Status legend with modern design
  const statusY = finalY + Math.ceil(allSerieATeams.length / 4) * 6 + 25;
  
  doc.setFillColor(255, 255, 255);
  doc.rect(15, statusY, 267, 25, 'F');
  doc.setDrawColor(226, 232, 240);
  doc.rect(15, statusY, 267, 25, 'S');
  
  doc.setTextColor(30, 41, 59);
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.text('📊 Legenda Stati Giocatori', 20, statusY + 8);
  
  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  
  // Status indicators with modern colors
  doc.setFillColor(212, 237, 218); // Light green
  doc.rect(20, statusY + 12, 12, 6, 'F');
  doc.setDrawColor(40, 167, 69);
  doc.rect(20, statusY + 12, 12, 6, 'S');
  doc.setTextColor(30, 41, 59);
  doc.text('Superato', 35, statusY + 16);
  
  doc.setFillColor(255, 243, 205); // Light yellow
  doc.rect(90, statusY + 12, 12, 6, 'F');
  doc.setDrawColor(255, 193, 7);
  doc.rect(90, statusY + 12, 12, 6, 'S');
  doc.text('In Corso', 105, statusY + 16);
  
  doc.setFillColor(248, 215, 218); // Light red
  doc.rect(160, statusY + 12, 12, 6, 'F');
  doc.setDrawColor(220, 53, 69);
  doc.rect(160, statusY + 12, 12, 6, 'S');
  doc.text('Eliminato', 175, statusY + 16);
  
  doc.setFillColor(255, 215, 0); // Gold
  doc.rect(230, statusY + 12, 12, 6, 'F');
  doc.setDrawColor(255, 193, 7);
  doc.rect(230, statusY + 12, 12, 6, 'S');
  doc.text('Vincitore', 245, statusY + 16);
  
  // Modern footer
  const footerY = 200;
  doc.setFillColor(71, 85, 105);
  doc.rect(0, footerY, 297, 10, 'F');
  
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  doc.text('🏆 HIGHLANDER - Fantasy Football Game', 20, footerY + 6);
  doc.text(`Generato il ${new Date().toLocaleDateString('it-IT')} - © 2025`, 200, footerY + 6);
  
  // Save the PDF with enhanced filename
  const fileName = `Highlander_${game.name}_Storico_${new Date().toISOString().split('T')[0]}.pdf`;
  doc.save(fileName);
}