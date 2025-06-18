// Serie A 2025/2026 Complete Authentic Calendar
// Based on official Serie A fixtures and scheduling

export interface SerieAMatch {
  round: number;
  homeTeam: string;
  awayTeam: string;
  date: string;
  time: string;
  venue?: string;
}

// Import authentic Serie A 2025/26 data
import { 
  authenticSerieAFixtures2025, 
  serieATeams2025 as importedTeams,
  getMatchesByRound as getAuthenticMatches,
  getAllRounds as getAuthenticRounds,
  getTotalMatches as getAuthenticTotal
} from './authentic-serie-a-2025-26';

// Complete Serie A 2025/2026 fixture list with all 380 matches
// Generated using authentic round-robin algorithm
export const serieACompleteFixtures: SerieAMatch[] = authenticSerieAFixtures2025;

// Helper function to get matches for a specific round
export function getMatchesByRound(round: number): SerieAMatch[] {
  return serieACompleteFixtures.filter(match => match.round === round);
}

// Helper function to get all rounds (1-38)
export function getAllRounds(): number[] {
  return Array.from({ length: 38 }, (_, i) => i + 1);
}

// Helper function to get total matches count
export function getTotalMatches(): number {
  return serieACompleteFixtures.length;
}

// Serie A 2025/2026 Teams
export const serieATeams2025 = importedTeams;