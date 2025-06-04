import * as XLSX from 'xlsx';
import * as fs from 'fs';
import * as path from 'path';
import { storage } from './storage';
import { serieATeams, serieAFixtures, getTeamIdByName } from './data/serie-a-schedule';

export class SerieAManager {
  private excelFilePath = path.join(__dirname, 'data', 'serie-a-calendar.xlsx');

  async initializeSerieAData() {
    console.log('Initializing Serie A 2024/2025 data...');
    
    try {
      // Ensure teams are seeded
      await storage.seedTeams();
      
      // Create Excel file if it doesn't exist
      if (!fs.existsSync(this.excelFilePath)) {
        await this.createExcelCalendar();
      }
      
      // Load matches from Excel or fallback to hardcoded data
      await this.loadMatchesFromExcel();
      
      console.log('Serie A data initialization completed');
    } catch (error) {
      console.error('Error initializing Serie A data:', error);
      // Fallback to hardcoded data
      await this.loadHardcodedMatches();
    }
  }

  private async createExcelCalendar() {
    console.log('Creating Serie A Excel calendar...');
    
    const workbook = XLSX.utils.book_new();
    
    // Create teams sheet
    const teamsData = serieATeams.map(team => ({
      ID: team.id,
      Nome: team.name,
      Codice: team.code
    }));
    
    const teamsSheet = XLSX.utils.json_to_sheet(teamsData);
    XLSX.utils.book_append_sheet(workbook, teamsSheet, 'Squadre');
    
    // Create matches sheet with all fixtures
    const matchesData = [];
    
    // Generate all 38 rounds of Serie A (each team plays every other team twice)
    for (let round = 1; round <= 38; round++) {
      const roundMatches = this.generateRoundMatches(round);
      matchesData.push(...roundMatches);
    }
    
    const matchesSheet = XLSX.utils.json_to_sheet(matchesData);
    XLSX.utils.book_append_sheet(workbook, matchesSheet, 'Calendario');
    
    // Ensure directory exists
    const dir = path.dirname(this.excelFilePath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    
    // Write the Excel file
    XLSX.writeFile(workbook, this.excelFilePath);
    console.log(`Excel calendar created at: ${this.excelFilePath}`);
  }

  private generateRoundMatches(round: number) {
    // This is a simplified round-robin generator
    // In a real implementation, you'd use the actual Serie A fixtures
    const teams = serieATeams;
    const matches = [];
    
    // For demonstration, create 10 matches per round (20 teams = 10 matches)
    const teamsPerRound = teams.slice(0, 20); // Ensure we have exactly 20 teams
    
    for (let i = 0; i < teamsPerRound.length; i += 2) {
      if (i + 1 < teamsPerRound.length) {
        // Alternate home/away based on round number
        const isHomeFirst = (round + i) % 2 === 0;
        const homeTeam = isHomeFirst ? teamsPerRound[i] : teamsPerRound[i + 1];
        const awayTeam = isHomeFirst ? teamsPerRound[i + 1] : teamsPerRound[i];
        
        matches.push({
          Giornata: round,
          'Squadra Casa': homeTeam.name,
          'Squadra Trasferta': awayTeam.name,
          'Gol Casa': '',
          'Gol Trasferta': '',
          Data: this.getMatchDate(round),
          Completata: false
        });
      }
    }
    
    return matches;
  }

  private getMatchDate(round: number): string {
    // Calculate date based on Serie A 2024/2025 schedule
    const startDate = new Date('2024-08-17');
    const daysToAdd = (round - 1) * 7; // Roughly one week between rounds
    const matchDate = new Date(startDate.getTime() + daysToAdd * 24 * 60 * 60 * 1000);
    return matchDate.toISOString().split('T')[0];
  }

  async loadMatchesFromExcel() {
    try {
      if (!fs.existsSync(this.excelFilePath)) {
        throw new Error('Excel file not found');
      }

      console.log('Loading matches from Excel file...');
      const workbook = XLSX.readFile(this.excelFilePath);
      const matchesSheet = workbook.Sheets['Calendario'];
      
      if (!matchesSheet) {
        throw new Error('Calendario sheet not found in Excel file');
      }

      const matchesData = XLSX.utils.sheet_to_json(matchesSheet);
      
      // Clear existing matches and load from Excel
      await this.clearAndLoadMatches(matchesData);
      
      console.log(`Loaded ${matchesData.length} matches from Excel file`);
    } catch (error) {
      console.error('Error loading from Excel:', error);
      throw error;
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
        const homeTeamId = getTeamIdByName(matchData['Squadra Casa']);
        const awayTeamId = getTeamIdByName(matchData['Squadra Trasferta']);
        
        if (homeTeamId && awayTeamId && matchData['Gol Casa'] !== '' && matchData['Gol Trasferta'] !== '') {
          // Update match result in database
          const existingMatches = await storage.getMatchesByRound(round);
          const matchToUpdate = existingMatches.find(m => 
            m.homeTeamId === homeTeamId && m.awayTeamId === awayTeamId
          );
          
          if (matchToUpdate) {
            await storage.updateMatchResult(
              matchToUpdate.id, 
              parseInt(matchData['Gol Casa']), 
              parseInt(matchData['Gol Trasferta'])
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