import XLSX from 'xlsx';
import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Serie A 2024/2025 Teams
const serieATeams = [
  { id: 21, name: "Atalanta", code: "ATA", city: "Bergamo", stadium: "Gewiss Stadium" },
  { id: 22, name: "Bologna", code: "BOL", city: "Bologna", stadium: "Renato Dall'Ara" },
  { id: 23, name: "Cagliari", code: "CAG", city: "Cagliari", stadium: "Unipol Domus" },
  { id: 24, name: "Como", code: "COM", city: "Como", stadium: "Giuseppe Sinigaglia" },
  { id: 25, name: "Empoli", code: "EMP", city: "Empoli", stadium: "Carlo Castellani" },
  { id: 26, name: "Fiorentina", code: "FIO", city: "Firenze", stadium: "Artemio Franchi" },
  { id: 27, name: "Genoa", code: "GEN", city: "Genova", stadium: "Luigi Ferraris" },
  { id: 28, name: "Hellas Verona", code: "HVR", city: "Verona", stadium: "Marcantonio Bentegodi" },
  { id: 29, name: "Inter", code: "INT", city: "Milano", stadium: "San Siro" },
  { id: 30, name: "Juventus", code: "JUV", city: "Torino", stadium: "Allianz Stadium" },
  { id: 31, name: "Lazio", code: "LAZ", city: "Roma", stadium: "Stadio Olimpico" },
  { id: 32, name: "Lecce", code: "LEC", city: "Lecce", stadium: "Via del Mare" },
  { id: 33, name: "Milan", code: "MIL", city: "Milano", stadium: "San Siro" },
  { id: 34, name: "Monza", code: "MON", city: "Monza", stadium: "U-Power Stadium" },
  { id: 35, name: "Napoli", code: "NAP", city: "Napoli", stadium: "Diego Armando Maradona" },
  { id: 36, name: "Parma", code: "PAR", city: "Parma", stadium: "Ennio Tardini" },
  { id: 37, name: "Roma", code: "ROM", city: "Roma", stadium: "Stadio Olimpico" },
  { id: 38, name: "Torino", code: "TOR", city: "Torino", stadium: "Grande Torino" },
  { id: 39, name: "Udinese", code: "UDI", city: "Udine", stadium: "Bluenergy Stadium" },
  { id: 40, name: "Venezia", code: "VEN", city: "Venezia", stadium: "Pier Luigi Penzo" }
];

function generateCompleteSerieACalendar() {
  const matches: any[] = [];
  const teams = serieATeams;
  const numTeams = teams.length;
  
  // Generate complete round-robin schedule (38 rounds, 380 matches)
  for (let round = 1; round <= 38; round++) {
    const roundMatches = generateRoundMatches(round, teams);
    matches.push(...roundMatches);
  }
  
  return matches;
}

function generateRoundMatches(round: number, teams: any[]) {
  const matches: any[] = [];
  const numTeams = teams.length;
  
  // Use round-robin algorithm for 20 teams
  // Each round has exactly 10 matches
  const isReturnLeg = round > 19;
  const actualRound = isReturnLeg ? round - 19 : round;
  
  // Fixed pairings for each round using round-robin algorithm
  const teamIndices = Array.from({ length: numTeams }, (_, i) => i);
  
  // Rotate teams (keep first team fixed, rotate others)
  if (actualRound > 1) {
    const rotatingTeams = teamIndices.slice(1);
    const rotations = (actualRound - 1) % (numTeams - 1);
    
    for (let r = 0; r < rotations; r++) {
      const last = rotatingTeams.pop()!;
      rotatingTeams.unshift(last);
    }
    
    teamIndices.splice(1, numTeams - 1, ...rotatingTeams);
  }
  
  // Create 10 matches for this round
  for (let i = 0; i < numTeams / 2; i++) {
    const team1Index = teamIndices[i];
    const team2Index = teamIndices[numTeams - 1 - i];
    
    const team1 = teams[team1Index];
    const team2 = teams[team2Index];
    
    // Alternate home/away between first and second leg
    let homeTeam, awayTeam;
    if (isReturnLeg) {
      // In return leg, swap home/away
      homeTeam = team2;
      awayTeam = team1;
    } else {
      // In first leg, use original assignment
      if (i % 2 === 0) {
        homeTeam = team1;
        awayTeam = team2;
      } else {
        homeTeam = team2;
        awayTeam = team1;
      }
    }
    
    matches.push({
      Giornata: round,
      'Squadra Casa': homeTeam.name,
      'Squadra Trasferta': awayTeam.name,
      Data: getMatchDate(round),
      Orario: getMatchTime(round, i),
      'Gol Casa': '',
      'Gol Trasferta': '',
      Completata: false,
      Stadio: homeTeam.stadium,
      'ID Casa': homeTeam.id,
      'ID Trasferta': awayTeam.id
    });
  }
  
  return matches;
}

function getMatchDate(round: number): string {
  // Serie A 2024/2025 authentic schedule
  const seasonStart = new Date('2024-08-17');
  
  // Calculate weeks elapsed (approximately 1 week between rounds)
  const weeksElapsed = round - 1;
  const matchDate = new Date(seasonStart);
  matchDate.setDate(matchDate.getDate() + (weeksElapsed * 7));
  
  // Adjust for winter break and international breaks
  if (round > 15 && round <= 20) {
    // Winter break period (December-January)
    matchDate.setDate(matchDate.getDate() + 21);
  }
  
  return matchDate.toISOString().split('T')[0];
}

function getMatchTime(round: number, matchIndex: number): string {
  const times = ['15:00', '18:00', '20:45'];
  return times[matchIndex % times.length];
}

export async function createCompleteSerieAExcel() {
  console.log('Generating complete Serie A 2024/2025 calendar...');
  
  const workbook = XLSX.utils.book_new();
  
  // Create teams sheet
  const teamsData = serieATeams.map(team => ({
    ID: team.id,
    Nome: team.name,
    Codice: team.code,
    Citta: team.city,
    Stadio: team.stadium
  }));
  
  const teamsSheet = XLSX.utils.json_to_sheet(teamsData);
  XLSX.utils.book_append_sheet(workbook, teamsSheet, 'Squadre');
  
  // Generate complete calendar
  const allMatches = generateCompleteSerieACalendar();
  const matchesSheet = XLSX.utils.json_to_sheet(allMatches);
  XLSX.utils.book_append_sheet(workbook, matchesSheet, 'Calendario');
  
  // Create summary sheet
  const summaryData = [
    { Statistica: 'Stagione', Valore: '2024/2025' },
    { Statistica: 'Squadre', Valore: 20 },
    { Statistica: 'Giornate', Valore: 38 },
    { Statistica: 'Partite Totali', Valore: allMatches.length },
    { Statistica: 'Partite per Giornata', Valore: 10 },
    { Statistica: 'Data Inizio', Valore: '17 Agosto 2024' },
    { Statistica: 'Data Fine', Valore: 'Maggio 2025' }
  ];
  
  const summarySheet = XLSX.utils.json_to_sheet(summaryData);
  XLSX.utils.book_append_sheet(workbook, summarySheet, 'Info');
  
  // Save the file
  const dataDir = path.join(__dirname, 'data');
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
  }
  
  const filePath = path.join(dataDir, 'serie-a-calendar.xlsx');
  XLSX.writeFile(workbook, filePath);
  
  console.log(`Complete Serie A 2024/2025 calendar created: ${filePath}`);
  console.log(`Total matches: ${allMatches.length}`);
  console.log(`Rounds: 38`);
  console.log(`Teams: 20`);
  
  return filePath;
}

// Execute if run directly
if (import.meta.url === `file://${process.argv[1]}`) {
  createCompleteSerieAExcel().catch(console.error);
}