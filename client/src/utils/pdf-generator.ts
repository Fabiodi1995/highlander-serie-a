import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import type { Game, Ticket, Team, User } from '@shared/schema';

// Import team logos from attached assets - Serie A 2025/26
import atalantaLogo from "@assets/Atalanta_1750336764083.png";
import bolognaLogo from "@assets/Bologna_1750336764084.png";
import cagliariLogo from "@assets/Cagliari_1750336764084.png";
import comoLogo from "@assets/Como_1750336764084.png";
import cremoneseLogo from "@assets/Cremonese_1750336764085.png";
import empoliLogo from "@assets/Empoli_current.png";
import fiorentinaLogo from "@assets/Fiorentina_1750336764085.png";
import genoaLogo from "@assets/Genoa_1750336764085.png";
import interLogo from "@assets/Inter_1750336764086.png";
import juventusLogo from "@assets/Juventus_1750336764086.png";
import lazioLogo from "@assets/Lazio_1750336764086.png";
import lecceLogo from "@assets/Lecce_1750336764087.png";
import milanLogo from "@assets/Milan_1750336764087.png";
import monzaLogo from "@assets/Monza_current.png";
import napoliLogo from "@assets/Napoli_1750336764087.png";
import parmaLogo from "@assets/Parma_1750336764087.png";
import pisaLogo from "@assets/Pisa_1750336764088.png";
import romaLogo from "@assets/Roma_1750336764088.png";
import sassuoloLogo from "@assets/Sassuolo_1750336764088.png";
import torinoLogo from "@assets/Torino_1750336764089.png";
import udineseLogo from "@assets/Udinese_1750336764089.png";
import veneziaLogo from "@assets/Venezia_current.png";
import veronaLogo from "@assets/Verona_1750336764089.png";

// Team logo mapping for PDF generation - Complete Serie A 2025/26
const teamLogoMap: { [key: string]: string } = {
  "Atalanta": atalantaLogo,
  "Bologna": bolognaLogo,
  "Cagliari": cagliariLogo,
  "Como": comoLogo,
  "Cremonese": cremoneseLogo,
  "Fiorentina": fiorentinaLogo,
  "Genoa": genoaLogo,
  "Hellas Verona": veronaLogo,
  "Inter": interLogo,
  "Juventus": juventusLogo,
  "Lazio": lazioLogo,
  "Lecce": lecceLogo,
  "Milan": milanLogo,
  "Napoli": napoliLogo,
  "Parma": parmaLogo,
  "Pisa": pisaLogo,
  "Roma": romaLogo,
  "Sassuolo": sassuoloLogo,
  "Torino": torinoLogo,
  "Udinese": udineseLogo,
  // Additional mappings for database variations
  "Verona": veronaLogo,
  "Hellas": veronaLogo,
  "AC Milan": milanLogo,
  "FC Inter": interLogo,
  "Internazionale": interLogo,
  "AS Roma": romaLogo,
  "SS Lazio": lazioLogo,
  "Juventus FC": juventusLogo,
  "SSC Napoli": napoliLogo,
  "ACF Fiorentina": fiorentinaLogo,
  "Atalanta BC": atalantaLogo,
  "Bologna FC": bolognaLogo,
  "Cagliari Calcio": cagliariLogo,
  "Como 1907": comoLogo,
  "Empoli FC": empoliLogo,
  "Genoa CFC": genoaLogo,
  "US Lecce": lecceLogo,
  "AC Monza": monzaLogo,
  "Parma Calcio": parmaLogo,
  "Torino FC": torinoLogo,
  "Udinese Calcio": udineseLogo,
  "Venezia FC": veneziaLogo
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
  
  // Pre-load all team logos and Highlander logo as base64
  const teamLogosBase64: { [key: string]: string } = {};
  console.log('Loading team logos...');
  
  // Load logos for all Serie A 2025/26 teams (nuove squadre promosse: Pisa, Cremonese, Sassuolo)
  const teamSet = new Set(teams.map(t => t.name));
  const allTeamNames = ["Atalanta", "Bologna", "Cagliari", "Como", "Cremonese", "Fiorentina", 
                       "Genoa", "Hellas Verona", "Inter", "Juventus", "Lazio", "Lecce", 
                       "Milan", "Napoli", "Parma", "Pisa", "Roma", "Sassuolo", "Torino", "Udinese"];
  
  allTeamNames.forEach(name => teamSet.add(name));

  // Load logos for all teams
  await Promise.all(Array.from(teamSet).map(async (teamName) => {
    const logoPath = teamLogoMap[teamName];
    if (logoPath) {
      try {
        teamLogosBase64[teamName] = await loadImageAsBase64(logoPath);
        console.log(`Loaded logo for ${teamName}`);
      } catch (error) {
        console.warn(`Failed to load logo for ${teamName}:`, error);
      }
    }
  }));
  
  // Embed the exact Highlander logo PNG as base64
  const highlanderLogoBase64 = 'data:image/png;base64,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';
  
  teamLogosBase64['HIGHLANDER'] = highlanderLogoBase64;
  console.log('Embedded exact Highlander PNG logo as base64');
  
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
  
  // Draw Highlander logo
  if (teamLogosBase64['HIGHLANDER']) {
    doc.addImage(teamLogosBase64['HIGHLANDER'], 'PNG', 15, 8, 12, 12);
  } else {
    // Fallback crown design if logo couldn't be loaded
    doc.setFillColor(255, 193, 7);
    doc.rect(15, 12, 12, 4, 'F');
    doc.rect(16, 8, 2, 4, 'F');
    doc.rect(19, 6, 2, 6, 'F');
    doc.rect(22, 8, 2, 4, 'F');
    doc.rect(25, 10, 2, 2, 'F');
  }
  
  doc.text('HIGHLANDER - Storico Giocatori', 35, 17);
  
  // Game info section with modern card design
  doc.setFillColor(255, 255, 255);
  doc.rect(15, 30, 267, 25, 'F');
  doc.setDrawColor(226, 232, 240);
  doc.rect(15, 30, 267, 25, 'S');
  
  // Game info text in dark color
  doc.setTextColor(51, 65, 85);
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text(`Gioco: ${game.name}`, 20, 42);
  
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  // Calculate the actual number of rounds played based on team selections
  const roundsPlayed = Math.max(1, Object.keys(teamSelections.reduce((acc: any, sel: any) => {
    acc[sel.round] = true;
    return acc;
  }, {})).length);
  
  const currentSerieARound = game.startRound + roundsPlayed - 1;
  doc.text(`Round di gioco corrente: ${roundsPlayed}`, 20, 48);
  doc.text(`Giornata Serie A corrente: ${currentSerieARound}`, 20, 53);
  doc.text(`Giornate: dalla ${game.startRound} alla ${Math.min(game.startRound + 19, 38)}`, 150, 48);
  
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

  // Fallback function for team display - mostra codice a 3 lettere quando logo non disponibile
  const drawTeamFallback = (team: any, x: number, y: number, size: number) => {
    const color = getTeamColor(team.name);
    (doc as any).setFillColor(color[0], color[1], color[2]);
    (doc as any).circle(x + size/2, y + size/2, size/2, 'F');
    
    // Codice squadra a 3 lettere in bianco
    (doc as any).setTextColor(255, 255, 255);
    (doc as any).setFontSize(size > 4 ? 4 : 3);
    (doc as any).setFont('helvetica', 'bold');
    
    // Genera codice a 3 lettere se non presente
    const teamCode = team.code || team.name.substring(0, 3).toUpperCase();
    const textWidth = (doc as any).getTextWidth(teamCode);
    (doc as any).text(teamCode, x + size/2 - textWidth/2, y + size/2 + 1);
  };

  // Function to get team colors for visual representation - Serie A 2025/26
  const getTeamColor = (teamName: string) => {
    const colorMap: { [key: string]: [number, number, number] } = {
      "Atalanta": [0, 70, 135],
      "Bologna": [150, 30, 45],
      "Cagliari": [200, 16, 46],
      "Como": [0, 85, 164],
      "Cremonese": [170, 30, 30],     // Nuova promossa
      "Fiorentina": [103, 58, 183],
      "Genoa": [220, 20, 60],
      "Hellas Verona": [255, 235, 59],
      "Inter": [0, 0, 0],
      "Juventus": [0, 0, 0],
      "Lazio": [135, 206, 250],
      "Lecce": [255, 235, 59],
      "Milan": [172, 30, 45],
      "Napoli": [135, 206, 250],
      "Parma": [255, 193, 7],
      "Pisa": [0, 40, 120],            // Nuova promossa
      "Roma": [134, 24, 56],
      "Sassuolo": [0, 120, 40],        // Nuova promossa
      "Torino": [140, 20, 75],
      "Udinese": [0, 0, 0],
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
  
  // Calculate rounds played for each ticket
  const getTicketRoundsPlayed = (ticket: any) => {
    let roundsPlayed = 0;
    gameRounds.forEach(round => {
      const selection = selectionsByTicket[ticket.id]?.[round];
      if (selection && round <= game.currentRound) {
        roundsPlayed++;
      }
    });
    return roundsPlayed;
  };

  // Sort tickets by rounds played (descending), then by status priority
  const sortedTickets = tickets.sort((a, b) => {
    const roundsA = getTicketRoundsPlayed(a);
    const roundsB = getTicketRoundsPlayed(b);
    
    // First sort by rounds played (more rounds first)
    if (roundsA !== roundsB) {
      return roundsB - roundsA;
    }
    
    // Then by status priority
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
        if (selection) {
          row.push(`LOGO:${selection.teamId}`); // Show logo for eliminated team
        } else {
          row.push('X'); // Show X if no selection
        }
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
          // Round corrente con selezione - sfondo giallo
          data.cell.styles.fillColor = [255, 243, 205];
        } else if (round === game.currentRound && ticket.isActive && !selection) {
          // Round corrente senza selezione - sfondo giallo chiaro
          data.cell.styles.fillColor = [255, 250, 230];
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
  doc.text('Legenda Squadre Serie A 2025/26', 20, finalY + 8);
  
  // Show all Serie A 2025/26 teams (nuove squadre promosse: Pisa, Cremonese, Sassuolo)
  const allSerieATeamsForLegend = [
    { name: "Atalanta", code: "ATA" },
    { name: "Bologna", code: "BOL" },
    { name: "Cagliari", code: "CAG" },
    { name: "Como", code: "COM" },
    { name: "Cremonese", code: "CRE" },
    { name: "Fiorentina", code: "FIO" },
    { name: "Genoa", code: "GEN" },
    { name: "Hellas Verona", code: "VER" },
    { name: "Inter", code: "INT" },
    { name: "Juventus", code: "JUV" },
    { name: "Lazio", code: "LAZ" },
    { name: "Lecce", code: "LEC" },
    { name: "Milan", code: "MIL" },
    { name: "Napoli", code: "NAP" },
    { name: "Parma", code: "PAR" },
    { name: "Pisa", code: "PIS" },
    { name: "Roma", code: "ROM" },
    { name: "Sassuolo", code: "SAS" },
    { name: "Torino", code: "TOR" },
    { name: "Udinese", code: "UDI" }
  ].sort((a, b) => a.name.localeCompare(b.name));
  
  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(71, 85, 105);
  allSerieATeamsForLegend.forEach((team, index) => {
    const x = 20 + (index % 4) * 65;
    const y = finalY + 12 + Math.floor(index / 4) * 5;
    
    // Draw team logo using PNG image or fallback - smaller size for legend
    drawTeamLogo(team, x, y - 2, 4);
    
    // Always add team name next to logo, aligned with logo center
    doc.setTextColor(71, 85, 105);
    doc.setFontSize(8);
    doc.setFont('helvetica', 'normal');
    doc.text(`${team.code} - ${team.name}`, x + 6, y + 1);
  });
  
  // Status legend with modern design
  const statusY = finalY + Math.ceil(allSerieATeamsForLegend.length / 4) * 5 + 20;
  
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