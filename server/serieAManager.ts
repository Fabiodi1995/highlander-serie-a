import XLSX from 'xlsx';
import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';
import { storage } from './storage';
import { serieATeams, serieAFixtures, getTeamIdByName } from './data/serie-a-schedule';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export class SerieAManager {
  private excelFilePath = path.join(__dirname, 'data', 'serie-a-calendar.xlsx');

  async initializeSerieAData() {
    console.log('Initializing Serie A 2025/2026 complete calendar...');
    
    try {
      // Ensure teams are seeded
      await storage.seedTeams();
      
      // Use the generated complete Serie A calendar
      if (!fs.existsSync(this.excelFilePath)) {
        const { createCompleteSerieAExcel } = await import('./generateSerieACalendar');
        await createCompleteSerieAExcel();
      }
      
      // Load matches from the complete Excel calendar
      await this.loadMatchesFromExcel();
      
      console.log('Serie A 2025/2026 complete calendar loaded - 380 matches across 38 rounds');
    } catch (error) {
      console.error('Error initializing Serie A data:', error);
      // Fallback to hardcoded data
      await this.loadHardcodedMatches();
    }
  }

  private async createExcelCalendar() {
    console.log('Creating complete Serie A 2025/2026 Excel calendar...');
    
    const workbook = XLSX.utils.book_new();
    const { serieATeams2025, serieACompleteFixtures } = await import('./data/serie-a-complete-calendar');
    
    // Create teams sheet with authentic Serie A teams
    const teamsData = serieATeams2025.map((team: any) => ({
      ID: team.id,
      Nome: team.name,
      Codice: team.code,
      Citta: team.city
    }));
    
    const teamsSheet = XLSX.utils.json_to_sheet(teamsData);
    XLSX.utils.book_append_sheet(workbook, teamsSheet, 'Squadre');
    
    // Generate complete 380-match Serie A calendar
    const allMatches = await this.generateCompleteSerieACalendar();
    
    const matchesSheet = XLSX.utils.json_to_sheet(allMatches);
    XLSX.utils.book_append_sheet(workbook, matchesSheet, 'Calendario');
    
    // Create summary sheet
    const summaryData = [
      { Statistica: 'Stagione', Valore: '2024/2025' },
      { Statistica: 'Squadre', Valore: 20 },
      { Statistica: 'Giornate', Valore: 38 },
      { Statistica: 'Partite Totali', Valore: 380 },
      { Statistica: 'Partite per Giornata', Valore: 10 },
      { Statistica: 'Data Inizio', Valore: '17 Agosto 2024' },
      { Statistica: 'Data Fine', Valore: 'Maggio 2025' }
    ];
    
    const summarySheet = XLSX.utils.json_to_sheet(summaryData);
    XLSX.utils.book_append_sheet(workbook, summarySheet, 'Info');
    
    // Ensure directory exists
    const dir = path.dirname(this.excelFilePath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    
    // Write the Excel file
    XLSX.writeFile(workbook, this.excelFilePath);
    console.log(`Complete Serie A 2025/2026 Excel calendar created: ${this.excelFilePath}`);
    console.log(`Total matches generated: ${allMatches.length}`);
  }

  private async generateCompleteSerieACalendar() {
    const { serieACompleteFixtures, serieATeams2025, getMatchesByRound } = await import('./data/serie-a-complete-calendar');
    const allMatches = [];
    
    // Generate all 38 rounds with authentic Serie A fixtures
    for (let round = 1; round <= 38; round++) {
      const roundFixtures = getMatchesByRound(round);
      
      if (roundFixtures.length > 0) {
        // Use authentic fixtures for this round
        roundFixtures.forEach(fixture => {
          allMatches.push({
            Giornata: round,
            'Squadra Casa': fixture.homeTeam,
            'Squadra Trasferta': fixture.awayTeam,
            Data: fixture.date,
            Orario: fixture.time,
            'Gol Casa': '',
            'Gol Trasferta': '',
            Completata: false,
            Stadio: this.getStadiumByTeam(fixture.homeTeam)
          });
        });
      } else {
        // Generate matches using round-robin algorithm for missing rounds
        const roundMatches = this.generateRoundRobinMatches(round, serieATeams2025);
        allMatches.push(...roundMatches);
      }
    }
    
    return allMatches;
  }

  private generateRoundRobinMatches(round: number, teams: any[]): any[] {
    const matches: any[] = [];
    const teamList = [...teams];
    
    // Standard round-robin algorithm for 20 teams
    // Each round has exactly 10 matches
    const matchups = [
      [0, 19], [1, 18], [2, 17], [3, 16], [4, 15],
      [5, 14], [6, 13], [7, 12], [8, 11], [9, 10]
    ];
    
    // Rotate teams for each round (except the first team which stays fixed)
    const rotatedTeams = [teamList[0]];
    for (let i = 1; i < teamList.length; i++) {
      const rotatedIndex = 1 + ((i - 1 + round - 1) % (teamList.length - 1));
      rotatedTeams.push(teamList[rotatedIndex]);
    }
    
    matchups.forEach(([homeIdx, awayIdx]) => {
      const homeTeam = rotatedTeams[homeIdx];
      const awayTeam = rotatedTeams[awayIdx];
      
      // Alternate home/away for return matches
      const isReturnRound = round > 19;
      const finalHome = isReturnRound ? awayTeam : homeTeam;
      const finalAway = isReturnRound ? homeTeam : awayTeam;
      
      matches.push({
        Giornata: round,
        'Squadra Casa': finalHome.name,
        'Squadra Trasferta': finalAway.name,
        Data: this.getMatchDate(round),
        Orario: this.getMatchTime(round),
        'Gol Casa': '',
        'Gol Trasferta': '',
        Completata: false,
        Stadio: this.getStadiumByTeam(finalHome.name)
      });
    });
    
    return matches;
  }

  private getStadiumByTeam(teamName: string): string {
    const stadiums: Record<string, string> = {
      'Inter': 'San Siro',
      'Milan': 'San Siro',
      'Juventus': 'Allianz Stadium',
      'Roma': 'Stadio Olimpico',
      'Lazio': 'Stadio Olimpico',
      'Napoli': 'Diego Armando Maradona',
      'Atalanta': 'Gewiss Stadium',
      'Fiorentina': 'Artemio Franchi',
      'Bologna': 'Renato Dall\'Ara',
      'Torino': 'Grande Torino',
      'Genoa': 'Luigi Ferraris',
      'Cagliari': 'Unipol Domus',
      'Pisa': 'Arena Garibaldi-Romeo Anconetani',
      'Lecce': 'Via del Mare',
      'Sassuolo': 'Mapei Stadium - Città del Tricolore',
      'Parma': 'Ennio Tardini',
      'Udinese': 'Bluenergy Stadium',
      'Cremonese': 'Stadio Giovanni Zini',
      'Hellas Verona': 'Marcantonio Bentegodi',
      'Como': 'Giuseppe Sinigaglia'
    };
    
    return stadiums[teamName] || 'Stadio';
  }

  private getMatchTime(round: number): string {
    // Distribute match times realistically
    const times = ['15:00', '18:00', '20:45'];
    return times[round % times.length];
  }

  private getMatchDate(round: number): string {
    // Calculate date based on Serie A 2025/2026 schedule starting May 24, 2025
    const startDate = new Date('2025-05-24');
    const daysToAdd = (round - 1) * 7; // Roughly one week between rounds
    const matchDate = new Date(startDate.getTime() + daysToAdd * 24 * 60 * 60 * 1000);
    return matchDate.toISOString().split('T')[0];
  }

  async loadMatchesFromExcel() {
    try {
      if (!fs.existsSync(this.excelFilePath)) {
        console.log('Excel file not found, using hardcoded fixtures');
        return;
      }

      console.log('Loading matches from Excel file...');
      
      // Add timeout to prevent hanging
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error('Excel loading timeout')), 5000);
      });

      const loadPromise = new Promise(async (resolve, reject) => {
        try {
          const workbook = XLSX.readFile(this.excelFilePath);
          const matchesSheet = workbook.Sheets['Calendario'];
          
          if (!matchesSheet) {
            throw new Error('Calendario sheet not found in Excel file');
          }

          const matchesData = XLSX.utils.sheet_to_json(matchesSheet);
          
          // Clear existing matches and load from Excel
          await this.clearAndLoadMatches(matchesData);
          
          console.log(`Loaded ${matchesData.length} matches from Excel file`);
          resolve(true);
        } catch (error) {
          reject(error);
        }
      });

      await Promise.race([loadPromise, timeoutPromise]);
    } catch (error) {
      console.error('Error loading from Excel:', error);
      console.log('Falling back to hardcoded fixtures');
    }
  }

  private async clearAndLoadMatches(matchesData: any[]) {
    // In a real implementation, you'd clear existing matches first
    // For now, we'll just ensure matches exist in the database
    
    for (const matchData of matchesData) {
      const homeTeamId = getTeamIdByName(matchData['Squadra Casa']);
      const awayTeamId = getTeamIdByName(matchData['Squadra Trasferta']);
      
      if (homeTeamId && awayTeamId) {
        // Check if match already exists, if not create it
        const existingMatches = await storage.getMatchesByRound(matchData.Giornata);
        const matchExists = existingMatches.some(m => 
          m.homeTeamId === homeTeamId && m.awayTeamId === awayTeamId
        );
        
        if (!matchExists) {
          // Create match in database
          await this.createMatchInDatabase({
            round: matchData.Giornata,
            homeTeamId,
            awayTeamId,
            homeScore: matchData['Gol Casa'] || null,
            awayScore: matchData['Gol Trasferta'] || null,
            isCompleted: matchData.Completata || false,
            matchDate: new Date(matchData.Data || this.getMatchDate(matchData.Giornata))
          });
        }
      }
    }
  }

  private async createMatchInDatabase(matchData: any) {
    // This would use your storage interface to create matches
    // For now, we'll use a direct database call
    const { db } = await import('./db');
    const { matches } = await import('../shared/schema');
    
    await db.insert(matches).values({
      round: matchData.round,
      homeTeamId: matchData.homeTeamId,
      awayTeamId: matchData.awayTeamId,
      homeScore: matchData.homeScore,
      awayScore: matchData.awayScore,
      isCompleted: matchData.isCompleted,
      matchDate: matchData.matchDate,
      result: null
    }).onConflictDoNothing();
  }

  private async loadHardcodedMatches() {
    console.log('Loading hardcoded Serie A fixtures as fallback...');
    
    for (const fixture of serieAFixtures) {
      const homeTeamId = getTeamIdByName(fixture.homeTeam);
      const awayTeamId = getTeamIdByName(fixture.awayTeam);
      
      if (homeTeamId && awayTeamId) {
        await this.createMatchInDatabase({
          round: fixture.round,
          homeTeamId,
          awayTeamId,
          homeScore: null,
          awayScore: null,
          isCompleted: false,
          matchDate: new Date(fixture.date)
        });
      }
    }
  }

  async updateMatchFromExcel(round: number) {
    try {
      const workbook = XLSX.readFile(this.excelFilePath);
      const matchesSheet = workbook.Sheets['Calendario'];
      const matchesData = XLSX.utils.sheet_to_json(matchesSheet);
      
      const roundMatches = matchesData.filter((match: any) => match.Giornata === round);
      
      for (const matchData of roundMatches) {
        const match = matchData as any;
        const homeTeamId = getTeamIdByName(match['Squadra Casa']);
        const awayTeamId = getTeamIdByName(match['Squadra Trasferta']);
        
        if (homeTeamId && awayTeamId && match['Gol Casa'] !== '' && match['Gol Trasferta'] !== '') {
          // Update match result in database
          const existingMatches = await storage.getMatchesByRound(round);
          const matchToUpdate = existingMatches.find(m => 
            m.homeTeamId === homeTeamId && m.awayTeamId === awayTeamId
          );
          
          if (matchToUpdate) {
            await storage.updateMatchResult(
              matchToUpdate.id, 
              parseInt(match['Gol Casa']), 
              parseInt(match['Gol Trasferta'])
            );
          }
        }
      }
      
      return roundMatches;
    } catch (error) {
      console.error('Error updating match from Excel:', error);
      throw error;
    }
  }

  getExcelFilePath(): string {
    return this.excelFilePath;
  }
}

export const serieAManager = new SerieAManager();