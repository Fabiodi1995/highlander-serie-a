import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import type { Game, Ticket, Team, User } from '@shared/schema';

export interface GameHistoryData {
  game: Game;
  tickets: any[];
  teams: Team[];
  users: User[];
}

export function generateGameHistoryPDF(data: GameHistoryData) {
  const { game, tickets, teams, users } = data;
  
  // Create new PDF document
  const doc = new jsPDF();
  
  // Set font
  doc.setFont('helvetica');
  
  // Title
  doc.setFontSize(20);
  doc.text('Storico Giocatori - Highlander', 20, 20);
  
  // Game info
  doc.setFontSize(14);
  doc.text(`Gioco: ${game.name}`, 20, 35);
  doc.setFontSize(10);
  doc.text(`Stato: ${game.status}`, 20, 45);
  doc.text(`Giornata corrente: ${game.currentRound}`, 20, 52);
  doc.text(`Giornate: dalla ${game.startRound} alla ${game.currentRound}`, 20, 59);
  doc.text(`Data generazione: ${new Date().toLocaleDateString('it-IT')}`, 20, 66);
  
  // Helper functions
  const getTeamName = (teamId: number) => {
    return teams.find(t => t.id === teamId)?.name || 'N/A';
  };
  
  const getUserName = (userId: number) => {
    return users.find(u => u.id === userId)?.username || 'N/A';
  };
  
  const getTicketStatus = (ticket: any) => {
    if (!ticket.isActive) return 'Eliminato';
    if (game.status === 'completed') return 'Vincitore';
    return 'Attivo';
  };
  
  // Create rounds array
  const gameRounds: number[] = [];
  for (let round = game.startRound; round <= game.currentRound; round++) {
    gameRounds.push(round);
  }
  
  // Prepare table data
  const tableHeaders = [
    'Giocatore',
    'Ticket',
    'Stato',
    ...gameRounds.map(round => `G${round}`)
  ];
  
  const tableData = tickets.map(ticket => {
    const row = [
      getUserName(ticket.userId),
      `#${ticket.id}`,
      getTicketStatus(ticket)
    ];
    
    // Add team selections for each round
    gameRounds.forEach(round => {
      const selection = ticket.selections?.[round.toString()];
      if (selection?.hidden) {
        row.push('🔒');
      } else if (selection && selection.teamId) {
        row.push(getTeamName(selection.teamId));
      } else if (ticket.eliminatedInRound && ticket.eliminatedInRound < round) {
        row.push('—');
      } else {
        row.push('—');
      }
    });
    
    return row;
  });
  
  // Add table to PDF
  autoTable(doc, {
    head: [tableHeaders],
    body: tableData,
    startY: 75,
    styles: {
      fontSize: 8,
      cellPadding: 2,
    },
    headStyles: {
      fillColor: [71, 85, 105], // slate-600
      textColor: 255,
      fontSize: 9,
      fontStyle: 'bold'
    },
    alternateRowStyles: {
      fillColor: [248, 250, 252] // slate-50
    },
    columnStyles: {
      0: { cellWidth: 25 }, // Giocatore
      1: { cellWidth: 15 }, // Ticket
      2: { cellWidth: 20 }, // Stato
    },
    margin: { left: 20, right: 20 },
    didParseCell: function(data) {
      // Color coding for status column
      if (data.column.index === 2) {
        const cellValue = data.cell.text[0];
        if (cellValue === 'Vincitore') {
          data.cell.styles.fillColor = [251, 191, 36]; // yellow-400
          data.cell.styles.textColor = [146, 64, 14]; // yellow-900
        } else if (cellValue === 'Eliminato') {
          data.cell.styles.fillColor = [248, 113, 113]; // red-400
          data.cell.styles.textColor = [127, 29, 29]; // red-900
        } else if (cellValue === 'Attivo') {
          data.cell.styles.fillColor = [74, 222, 128]; // green-400
          data.cell.styles.textColor = [20, 83, 45]; // green-900
        }
      }
    }
  });
  
  // Add footer
  const pageCount = doc.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.text(
      `Pagina ${i} di ${pageCount} - Highlander Game Management System`,
      doc.internal.pageSize.width / 2,
      doc.internal.pageSize.height - 10,
      { align: 'center' }
    );
  }
  
  // Save the PDF
  const fileName = `highlander_storico_${game.name.replace(/[^a-zA-Z0-9]/g, '_')}_${new Date().toISOString().split('T')[0]}.pdf`;
  doc.save(fileName);
}

export function generateTeamSelectionsPDF(data: GameHistoryData, selections: any[]) {
  const { game, teams, users } = data;
  
  // Create new PDF document
  const doc = new jsPDF();
  
  // Set font
  doc.setFont('helvetica');
  
  // Title
  doc.setFontSize(20);
  doc.text('Scelte Squadre - Highlander', 20, 20);
  
  // Game info
  doc.setFontSize(14);
  doc.text(`Gioco: ${game.name}`, 20, 35);
  doc.setFontSize(10);
  doc.text(`Stato: ${game.status}`, 20, 45);
  doc.text(`Giornata corrente: ${game.currentRound}`, 20, 52);
  doc.text(`Data generazione: ${new Date().toLocaleDateString('it-IT')}`, 20, 59);
  
  // Helper functions
  const getTeamName = (teamId: number) => {
    return teams.find(t => t.id === teamId)?.name || 'N/A';
  };
  
  const getUserName = (username: string) => {
    return username || 'N/A';
  };
  
  // Prepare table data
  const tableHeaders = [
    'Giocatore',
    'Ticket',
    'Giornata',
    'Squadra Scelta',
    'Stato'
  ];
  
  const tableData = selections.map(selection => [
    getUserName(selection.username),
    `#${selection.ticketId}`,
    `Giornata ${selection.round}`,
    getTeamName(selection.teamId),
    selection.status
  ]);
  
  // Add table to PDF
  autoTable(doc, {
    head: [tableHeaders],
    body: tableData,
    startY: 70,
    styles: {
      fontSize: 10,
      cellPadding: 3,
    },
    headStyles: {
      fillColor: [71, 85, 105], // slate-600
      textColor: 255,
      fontSize: 11,
      fontStyle: 'bold'
    },
    alternateRowStyles: {
      fillColor: [248, 250, 252] // slate-50
    },
    columnStyles: {
      0: { cellWidth: 35 }, // Giocatore
      1: { cellWidth: 25 }, // Ticket
      2: { cellWidth: 30 }, // Giornata
      3: { cellWidth: 40 }, // Squadra
      4: { cellWidth: 30 }, // Stato
    },
    margin: { left: 20, right: 20 },
    didParseCell: function(data) {
      // Color coding for status column
      if (data.column.index === 4) {
        const cellValue = data.cell.text[0];
        if (cellValue === 'Vincitore') {
          data.cell.styles.fillColor = [251, 191, 36]; // yellow-400
          data.cell.styles.textColor = [146, 64, 14]; // yellow-900
        } else if (cellValue === 'Eliminato') {
          data.cell.styles.fillColor = [248, 113, 113]; // red-400
          data.cell.styles.textColor = [127, 29, 29]; // red-900
        } else if (cellValue === 'Superato') {
          data.cell.styles.fillColor = [147, 197, 253]; // blue-300
          data.cell.styles.textColor = [30, 58, 138]; // blue-900
        } else if (cellValue === 'Attivo') {
          data.cell.styles.fillColor = [74, 222, 128]; // green-400
          data.cell.styles.textColor = [20, 83, 45]; // green-900
        }
      }
    }
  });
  
  // Add footer
  const pageCount = doc.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.text(
      `Pagina ${i} di ${pageCount} - Highlander Game Management System`,
      doc.internal.pageSize.width / 2,
      doc.internal.pageSize.height - 10,
      { align: 'center' }
    );
  }
  
  // Save the PDF
  const fileName = `highlander_scelte_${game.name.replace(/[^a-zA-Z0-9]/g, '_')}_${new Date().toISOString().split('T')[0]}.pdf`;
  doc.save(fileName);
}