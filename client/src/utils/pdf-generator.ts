import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import type { Game, Ticket, Team, User } from '@shared/schema';

// Import team logos from attached assets
import atalantaLogo from "@assets/Atalanta_1749734308298.png";
import bolognaLogo from "@assets/Bologna_1749734308287.png";
import cagliariLogo from "@assets/Cagliari_1749734308284.png";
import comoLogo from "@assets/Como_1749734308286.png";
import empoliLogo from "@assets/Empoli_1749734308299.png";
import fiorentinaLogo from "@assets/Fiorentina_1749734308290.png";
import genoaLogo from "@assets/Genoa_1749734308295.png";
import interLogo from "@assets/Inter_1749734308304.png";
import juventusLogo from "@assets/Juventus_1749734308303.png";
import lazioLogo from "@assets/Lazio_1749734308294.png";
import lecceLogo from "@assets/Lecce_1749734308291.png";
import milanLogo from "@assets/Milan_1749734308296.png";
import monzaLogo from "@assets/Monza_1749734308289.png";
import napoliLogo from "@assets/Napoli_1749734308305.png";
import parmaLogo from "@assets/Parma_1749734308292.png";
import romaLogo from "@assets/Roma_1749734308288.png";
import torinoLogo from "@assets/Torino_1749734308302.png";
import udineseLogo from "@assets/Udinese_1749734308301.png";
import veneziaLogo from "@assets/Venezia_1749734308283.png";
import veronaLogo from "@assets/Verona_1749734308300.png";

// Team logo mapping for PDF generation
const teamLogoMap: { [key: string]: string } = {
  "Atalanta": atalantaLogo,
  "Bologna": bolognaLogo,
  "Cagliari": cagliariLogo,
  "Como": comoLogo,
  "Empoli": empoliLogo,
  "Fiorentina": fiorentinaLogo,
  "Genoa": genoaLogo,
  "Hellas Verona": veronaLogo,
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

// Function to load image as base64
const loadImageAsBase64 = (imageSrc: string): Promise<string> => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      canvas.width = img.width;
      canvas.height = img.height;
      ctx?.drawImage(img, 0, 0);
      resolve(canvas.toDataURL('image/png'));
    };
    img.onerror = () => reject(new Error('Failed to load image'));
    img.src = imageSrc;
  });
};

export async function generateGameHistoryPDF(data: GameHistoryData) {
  const { game, tickets, teams, users, teamSelections } = data;
  
  // Pre-load all team logos as base64
  const teamLogosBase64: { [key: string]: string } = {};
  console.log('Loading team logos...');
  
  await Promise.all(teams.map(async (team) => {
    const logoPath = teamLogoMap[team.name];
    if (logoPath) {
      try {
        teamLogosBase64[team.name] = await loadImageAsBase64(logoPath);
        console.log(`Loaded logo for ${team.name}`);
      } catch (error) {
        console.warn(`Failed to load logo for ${team.name}:`, error);
      }
    }
  }));
  
  console.log('All logos loaded, generating PDF...');
  
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
  
  // Add Highlander logo and title
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(20);
  doc.setFont('helvetica', 'bold');
  
  // Draw Highlander crown logo
  doc.setFillColor(255, 193, 7); // Golden yellow to match frontend
  // Crown base
  doc.rect(15, 12, 12, 4, 'F');
  // Crown peaks
  doc.rect(16, 8, 2, 4, 'F');
  doc.rect(19, 6, 2, 6, 'F'); // Taller middle peak
  doc.rect(22, 8, 2, 4, 'F');
  doc.rect(25, 10, 2, 2, 'F'); // Small end peak
  
  doc.text('HIGHLANDER - Storico Giocatori', 35, 17);
  
  // Game info section with modern card design
  doc.setFillColor(255, 255, 255);
  doc.rect(15, 30, 267, 28, 'F');
  doc.setDrawColor(226, 232, 240);
  doc.rect(15, 30, 267, 28, 'S');
  
  // Game info text in dark color
  doc.setTextColor(51, 65, 85);
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text(`Gioco: ${game.name}`, 20, 42);
  
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text(`Stato: ${game.status}`, 20, 48);
  doc.text(`Giornata corrente: ${game.currentRound}`, 20, 53);
  doc.text(`Giornate: dalla ${game.startRound} alla ${Math.min(game.startRound + 19, 38)}`, 150, 48);
  doc.text(`Generato: ${new Date().toLocaleDateString('it-IT')} alle ${new Date().toLocaleTimeString('it-IT')}`, 150, 53);
  
  // Helper functions
  const getTeamName = (teamId: number) => {
    return teams.find(t => t.id === teamId)?.name || 'N/A';
  };
  
  const getTeamCode = (teamId: number) => {
    return teams.find(t => t.id === teamId)?.code || '???';
  };

  // Function to draw team logo using pre-loaded base64 image
  const drawTeamLogo = (team: any, x: number, y: number, size: number = 6) => {
    if (!team) return;
    
    const base64Image = teamLogosBase64[team.name];
    if (base64Image) {
      try {
        (doc as any).addImage(base64Image, 'PNG', x, y, size, size);
      } catch (error) {
        // Fallback to colored circle with team code
        drawTeamFallback(team, x, y, size);
      }
    } else {
      // Fallback if no logo loaded
      drawTeamFallback(team, x, y, size);
    }
  };

  // Fallback function for team display
  const drawTeamFallback = (team: any, x: number, y: number, size: number) => {
    const color = getTeamColor(team.name);
    (doc as any).setFillColor(color[0], color[1], color[2]);
    (doc as any).circle(x + size/2, y + size/2, size/2, 'F');
    
    (doc as any).setTextColor(255, 255, 255);
    (doc as any).setFontSize(4);
    (doc as any).setFont('helvetica', 'bold');
    const textWidth = (doc as any).getTextWidth(team.code);
    (doc as any).text(team.code, x + size/2 - textWidth/2, y + size/2 + 1);
  };

  // Function to get team colors for visual representation
  const getTeamColor = (teamName: string) => {
    const colorMap: { [key: string]: [number, number, number] } = {
      "Atalanta": [0, 70, 135],
      "Bologna": [150, 30, 45],
      "Cagliari": [200, 16, 46],
      "Como": [0, 85, 164],
      "Empoli": [0, 100, 200],
      "Fiorentina": [103, 58, 183],
      "Genoa": [220, 20, 60],
      "Hellas Verona": [255, 235, 59],
      "Inter": [0, 0, 0],
      "Juventus": [0, 0, 0],
      "Lazio": [135, 206, 250],
      "Lecce": [255, 235, 59],
      "Milan": [172, 30, 45],
      "Monza": [255, 0, 0],
      "Napoli": [135, 206, 250],
      "Parma": [255, 193, 7],
      "Roma": [134, 24, 56],
      "Torino": [140, 20, 75],
      "Udinese": [0, 0, 0],
      "Venezia": [255, 152, 0],
    };
    return colorMap[teamName] || [128, 128, 128];
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
    ...gameRounds.map((round, index) => (index + 1).toString())
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
        row.push(`LOGO:${selection.teamId}`); // Special marker for logo drawing
        return;
      }
      
      // If round is completed (superato)
      if (selection && (round < game.currentRound || (round === game.currentRound && game.roundStatus === "calculated"))) {
        row.push(`LOGO:${selection.teamId}`); // Special marker for logo drawing
        return;
      }
      
      // Check if this is current round being played
      const isCurrentRound = round === game.currentRound && game.roundStatus !== "calculated";
      
      // If this is current round and ticket is active
      if (isCurrentRound && ticket.isActive) {
        if (selection) {
          row.push(`LOGO:${selection.teamId}`); // Special marker for logo drawing
        } else {
          row.push('—'); // Dash for no selection
        }
        return;
      }
      
      row.push('—');
    });
    
    return row;
  });
  
  // Calculate optimal column widths to fit within page margins
  const pageWidth = 210; // A4 width in mm (portrait)
  const margins = 30; // 15mm on each side
  const availableWidth = pageWidth - margins;
  
  // Fixed column widths (reduced for better fit)
  const playerWidth = 20;
  const ticketWidth = 12;
  const statusWidth = 18;
  const fixedColumnsWidth = playerWidth + ticketWidth + statusWidth;
  
  // Calculate remaining width for round columns
  const remainingWidth = availableWidth - fixedColumnsWidth;
  const roundColumnWidth = Math.max(5, Math.floor(remainingWidth / gameRounds.length));
  
  const columnStyles: any = {
    0: { cellWidth: playerWidth }, // Giocatore
    1: { cellWidth: ticketWidth }, // Ticket
    2: { cellWidth: statusWidth }, // Stato
  };
  
  // Set width for round columns
  gameRounds.forEach((_, index) => {
    columnStyles[3 + index] = { cellWidth: roundColumnWidth };
  });

  // Add table to PDF with modern styling
  autoTable(doc, {
    head: [tableHeaders],
    body: tableData,
    startY: 68,
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
      fontSize: gameRounds.length > 15 ? 6 : 7,
      fontStyle: 'bold',
      halign: 'center',
      cellPadding: 2,
      minCellHeight: 8,
      overflow: 'linebreak'
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
      
      // Skip header row processing
      if (data.row.section === 'head') {
        return;
      }
      
      const ticket = sortedTickets[rowIndex];
      const round = gameRounds[colIndex - 3];
      
      // Clear text for logo cells in body rows only
      if (colIndex >= 3 && data.cell.text[0] && data.cell.text[0].startsWith('LOGO:')) {
        data.cell.text = [''];
      }
      
      // Color coding for status column
      if (colIndex === 2) {
        const cellValue = data.cell.text[0];
        if (cellValue === 'Vincitore') {
          data.cell.styles.fillColor = [255, 215, 0];
          data.cell.styles.textColor = [0, 0, 0];
          data.cell.styles.fontStyle = 'bold';
        } else if (cellValue === 'Eliminato') {
          data.cell.styles.fillColor = [220, 53, 69];
          data.cell.styles.textColor = [255, 255, 255];
          data.cell.styles.fontStyle = 'bold';
        } else if (cellValue === 'Attivo') {
          data.cell.styles.fillColor = [40, 167, 69];
          data.cell.styles.textColor = [255, 255, 255];
          data.cell.styles.fontStyle = 'bold';
        } else if (cellValue === 'Superato') {
          data.cell.styles.fillColor = [108, 117, 125];
          data.cell.styles.textColor = [255, 255, 255];
        }
      }
      
      // Color coding for round columns
      if (colIndex >= 3 && round && ticket) {
        const selection = selectionsByTicket[ticket.id]?.[round];
        
        if (selection && game.status === 'completed' && ticket.isActive && round === game.currentRound) {
          data.cell.styles.fillColor = [255, 243, 205];
          data.cell.styles.fontStyle = 'bold';
        } else if (ticket.eliminatedInRound === round) {
          data.cell.styles.fillColor = [248, 215, 218];
        } else if (selection && round < game.currentRound) {
          data.cell.styles.fillColor = [212, 237, 218];
        } else if (round === game.currentRound && ticket.isActive && selection) {
          data.cell.styles.fillColor = [255, 255, 255];
          data.cell.styles.lineColor = [40, 167, 69];
          data.cell.styles.lineWidth = 1;
        } else if (round === game.currentRound && ticket.isActive && !selection) {
          data.cell.styles.fillColor = [255, 243, 205];
        } else if (round > game.currentRound || !ticket.isActive) {
          data.cell.styles.fillColor = [248, 249, 250];
        } else {
          data.cell.styles.fillColor = [255, 255, 255];
        }
      }
    },
    didDrawCell: function(data: any) {
      const rowIndex = data.row.index;
      const colIndex = data.column.index;
      
      // Skip header row processing
      if (data.row.section === 'head') {
        return;
      }
      
      // Handle team logo drawing for round columns in body rows only
      if (colIndex >= 3 && rowIndex < sortedTickets.length) {
        const ticket = sortedTickets[rowIndex];
        const round = gameRounds[colIndex - 3];
        const selection = selectionsByTicket[ticket.id]?.[round];
        
        if (selection) {
          const team = teams.find(t => t.id === selection.teamId);
          if (team) {
            const cellCenterX = data.cell.x + data.cell.width / 2;
            const cellCenterY = data.cell.y + data.cell.height / 2;
            const logoSize = Math.min(data.cell.width - 2, data.cell.height - 2, 5);
            
            drawTeamLogo(team, cellCenterX - logoSize/2, cellCenterY - logoSize/2, logoSize);
          }
        }
      }
    }
  });

  // Modern legend section
  const finalY = (doc as any).lastAutoTable.finalY + 15;
  
  // Teams legend with modern card design - more compact
  const legendHeight = Math.ceil(teams.length / 4) * 5 + 12;
  doc.setFillColor(255, 255, 255);
  doc.rect(15, finalY, 267, legendHeight, 'F');
  doc.setDrawColor(226, 232, 240);
  doc.rect(15, finalY, 267, legendHeight, 'S');
  
  doc.setTextColor(30, 41, 59);
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.text('Legenda Squadre Serie A 2024/25', 20, finalY + 8);
  
  // Show all Serie A teams (all 20 teams) with modern styling
  const allSerieATeams = [...teams].sort((a, b) => a.name.localeCompare(b.name));
  
  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(71, 85, 105);
  allSerieATeams.forEach((team, index) => {
    const x = 20 + (index % 4) * 65;
    const y = finalY + 12 + Math.floor(index / 4) * 5;
    
    // Draw team logo using PNG image - smaller size for legend
    drawTeamLogo(team, x, y - 2, 4);
    
    // Add team name next to logo, aligned with logo center
    doc.text(`${team.code} - ${team.name}`, x + 6, y + 1);
  });
  
  // Status legend with modern design
  const statusY = finalY + Math.ceil(allSerieATeams.length / 4) * 5 + 20;
  
  doc.setFillColor(255, 255, 255);
  doc.rect(15, statusY, 267, 25, 'F');
  doc.setDrawColor(226, 232, 240);
  doc.rect(15, statusY, 267, 25, 'S');
  
  doc.setTextColor(30, 41, 59);
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.text('Legenda Stati Giocatori', 20, statusY + 8);
  
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
  
  // Check if we need a new page for footer
  const footerY = statusY + 35;
  const pageHeight = 210; // A4 landscape height
  
  if (footerY + 10 > pageHeight) {
    doc.addPage();
    // Add content on new page if needed
  }
  
  // Modern footer - positioned at bottom of current page
  const finalFooterY = Math.min(footerY, pageHeight - 10);
  doc.setFillColor(71, 85, 105);
  doc.rect(0, finalFooterY, 297, 10, 'F');
  
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  doc.text('HIGHLANDER - Fantasy Football Game', 20, finalFooterY + 6);
  doc.text(`Generato il ${new Date().toLocaleDateString('it-IT')} - © 2025`, 200, finalFooterY + 6);
  
  // Save the PDF with enhanced filename
  const fileName = `Highlander_${game.name}_Storico_${new Date().toISOString().split('T')[0]}.pdf`;
  doc.save(fileName);
}