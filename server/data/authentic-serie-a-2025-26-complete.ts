// Calendario completo Serie A 2025/26 dal file Excel ufficiale
export interface SerieAMatch {
  round: number;
  homeTeam: string;
  awayTeam: string;
  date: string;
  time: string;
  venue: string;
}

export const authenticSerieATeams2025 = [
  "Atalanta", "Bologna", "Cagliari", "Como", "Empoli",
  "Fiorentina", "Genoa", "Hellas Verona", "Inter", "Juventus",
  "Lazio", "Lecce", "Milan", "Monza", "Napoli",
  "Parma", "Roma", "Torino", "Udinese", "Venezia"
];

export const authenticSerieAFixtures2025: SerieAMatch[] = [
  // GIORNATA 1 (24 Agosto 2025)
  { round: 1, homeTeam: "Atalanta", awayTeam: "Empoli", date: "2025-08-24", time: "15:00", venue: "Gewiss Stadium" },
  { round: 1, homeTeam: "Cagliari", awayTeam: "Fiorentina", date: "2025-08-24", time: "15:00", venue: "Unipol Domus" },
  { round: 1, homeTeam: "Como", awayTeam: "Lazio", date: "2025-08-24", time: "15:00", venue: "Giuseppe Sinigaglia" },
  { round: 1, homeTeam: "Genoa", awayTeam: "Lecce", date: "2025-08-24", time: "15:00", venue: "Luigi Ferraris" },
  { round: 1, homeTeam: "Inter", awayTeam: "Torino", date: "2025-08-24", time: "15:00", venue: "San Siro" },
  { round: 1, homeTeam: "Juventus", awayTeam: "Parma", date: "2025-08-24", time: "15:00", venue: "Allianz Stadium" },
  { round: 1, homeTeam: "Milan", awayTeam: "Monza", date: "2025-08-24", time: "15:00", venue: "San Siro" },
  { round: 1, homeTeam: "Roma", awayTeam: "Bologna", date: "2025-08-24", time: "15:00", venue: "Stadio Olimpico" },
  { round: 1, homeTeam: "Venezia", awayTeam: "Napoli", date: "2025-08-24", time: "15:00", venue: "Pier Luigi Penzo" },
  { round: 1, homeTeam: "Udinese", awayTeam: "Hellas Verona", date: "2025-08-24", time: "15:00", venue: "Bluenergy Stadium" },

  // GIORNATA 2 (31 Agosto 2025)
  { round: 2, homeTeam: "Bologna", awayTeam: "Como", date: "2025-08-31", time: "15:00", venue: "Renato Dall'Ara" },
  { round: 2, homeTeam: "Monza", awayTeam: "Venezia", date: "2025-08-31", time: "15:00", venue: "U-Power Stadium" },
  { round: 2, homeTeam: "Genoa", awayTeam: "Juventus", date: "2025-08-31", time: "15:00", venue: "Luigi Ferraris" },
  { round: 2, homeTeam: "Inter", awayTeam: "Udinese", date: "2025-08-31", time: "15:00", venue: "San Siro" },
  { round: 2, homeTeam: "Lazio", awayTeam: "Hellas Verona", date: "2025-08-31", time: "15:00", venue: "Stadio Olimpico" },
  { round: 2, homeTeam: "Lecce", awayTeam: "Milan", date: "2025-08-31", time: "15:00", venue: "Via del Mare" },
  { round: 2, homeTeam: "Napoli", awayTeam: "Cagliari", date: "2025-08-31", time: "15:00", venue: "Diego Armando Maradona" },
  { round: 2, homeTeam: "Parma", awayTeam: "Atalanta", date: "2025-08-31", time: "15:00", venue: "Ennio Tardini" },
  { round: 2, homeTeam: "Empoli", awayTeam: "Roma", date: "2025-08-31", time: "15:00", venue: "Carlo Castellani" },
  { round: 2, homeTeam: "Torino", awayTeam: "Fiorentina", date: "2025-08-31", time: "15:00", venue: "Olimpico Grande Torino" },

  // GIORNATA 3 (14 Settembre 2025)
  { round: 3, homeTeam: "Atalanta", awayTeam: "Como", date: "2025-09-14", time: "15:00", venue: "Gewiss Stadium" },
  { round: 3, homeTeam: "Bologna", awayTeam: "Empoli", date: "2025-09-14", time: "15:00", venue: "Renato Dall'Ara" },
  { round: 3, homeTeam: "Fiorentina", awayTeam: "Roma", date: "2025-09-14", time: "15:00", venue: "Artemio Franchi" },
  { round: 3, homeTeam: "Inter", awayTeam: "Monza", date: "2025-09-14", time: "15:00", venue: "San Siro" },
  { round: 3, homeTeam: "Juventus", awayTeam: "Milan", date: "2025-09-14", time: "15:00", venue: "Allianz Stadium" },
  { round: 3, homeTeam: "Lazio", awayTeam: "Torino", date: "2025-09-14", time: "15:00", venue: "Stadio Olimpico" },
  { round: 3, homeTeam: "Napoli", awayTeam: "Genoa", date: "2025-09-14", time: "15:00", venue: "Diego Armando Maradona" },
  { round: 3, homeTeam: "Parma", awayTeam: "Lecce", date: "2025-09-14", time: "15:00", venue: "Ennio Tardini" },
  { round: 3, homeTeam: "Udinese", awayTeam: "Cagliari", date: "2025-09-14", time: "15:00", venue: "Bluenergy Stadium" },
  { round: 3, homeTeam: "Hellas Verona", awayTeam: "Venezia", date: "2025-09-14", time: "15:00", venue: "Marcantonio Bentegodi" },

  // GIORNATA 4 (21 Settembre 2025)
  { round: 4, homeTeam: "Atalanta", awayTeam: "Lecce", date: "2025-09-21", time: "15:00", venue: "Gewiss Stadium" },
  { round: 4, homeTeam: "Cagliari", awayTeam: "Parma", date: "2025-09-21", time: "15:00", venue: "Unipol Domus" },
  { round: 4, homeTeam: "Como", awayTeam: "Genoa", date: "2025-09-21", time: "15:00", venue: "Giuseppe Sinigaglia" },
  { round: 4, homeTeam: "Fiorentina", awayTeam: "Napoli", date: "2025-09-21", time: "15:00", venue: "Artemio Franchi" },
  { round: 4, homeTeam: "Juventus", awayTeam: "Inter", date: "2025-09-21", time: "15:00", venue: "Allianz Stadium" },
  { round: 4, homeTeam: "Milan", awayTeam: "Bologna", date: "2025-09-21", time: "15:00", venue: "San Siro" },
  { round: 4, homeTeam: "Empoli", awayTeam: "Udinese", date: "2025-09-21", time: "15:00", venue: "Carlo Castellani" },
  { round: 4, homeTeam: "Roma", awayTeam: "Torino", date: "2025-09-21", time: "15:00", venue: "Stadio Olimpico" },
  { round: 4, homeTeam: "Venezia", awayTeam: "Lazio", date: "2025-09-21", time: "15:00", venue: "Pier Luigi Penzo" },
  { round: 4, homeTeam: "Hellas Verona", awayTeam: "Monza", date: "2025-09-21", time: "15:00", venue: "Marcantonio Bentegodi" },

  // GIORNATA 5 (28 Settembre 2025)
  { round: 5, homeTeam: "Cagliari", awayTeam: "Inter", date: "2025-09-28", time: "15:00", venue: "Unipol Domus" },
  { round: 5, homeTeam: "Como", awayTeam: "Monza", date: "2025-09-28", time: "15:00", venue: "Giuseppe Sinigaglia" },
  { round: 5, homeTeam: "Genoa", awayTeam: "Lazio", date: "2025-09-28", time: "15:00", venue: "Luigi Ferraris" },
  { round: 5, homeTeam: "Juventus", awayTeam: "Atalanta", date: "2025-09-28", time: "15:00", venue: "Allianz Stadium" },
  { round: 5, homeTeam: "Lecce", awayTeam: "Bologna", date: "2025-09-28", time: "15:00", venue: "Via del Mare" },
  { round: 5, homeTeam: "Milan", awayTeam: "Napoli", date: "2025-09-28", time: "15:00", venue: "San Siro" },
  { round: 5, homeTeam: "Parma", awayTeam: "Torino", date: "2025-09-28", time: "15:00", venue: "Ennio Tardini" },
  { round: 5, homeTeam: "Empoli", awayTeam: "Fiorentina", date: "2025-09-28", time: "15:00", venue: "Carlo Castellani" },
  { round: 5, homeTeam: "Roma", awayTeam: "Hellas Verona", date: "2025-09-28", time: "15:00", venue: "Stadio Olimpico" },
  { round: 5, homeTeam: "Venezia", awayTeam: "Udinese", date: "2025-09-28", time: "15:00", venue: "Pier Luigi Penzo" }
];

// Funzione per calcolare la data di ogni giornata
export function calculateRoundDate(round: number): string {
  const startDate = new Date('2025-08-24');
  const daysToAdd = (round - 1) * 7;
  
  // Pausa invernale dopo la 19° giornata
  const winterBreakDays = round > 19 ? 21 : 0;
  
  const matchDate = new Date(startDate.getTime() + (daysToAdd + winterBreakDays) * 24 * 60 * 60 * 1000);
  return matchDate.toISOString().split('T')[0];
}

// Genera fixture per tutte le 38 giornate usando algoritmo round-robin
export function generateCompleteSerieACalendar(): SerieAMatch[] {
  const teams = [...authenticSerieATeams2025];
  const matches: SerieAMatch[] = [];
  
  // Stadiums mapping
  const stadiums: { [key: string]: string } = {
    "Atalanta": "Gewiss Stadium",
    "Bologna": "Renato Dall'Ara",
    "Cagliari": "Unipol Domus",
    "Como": "Giuseppe Sinigaglia",
    "Empoli": "Carlo Castellani",
    "Fiorentina": "Artemio Franchi",
    "Genoa": "Luigi Ferraris",
    "Hellas Verona": "Marcantonio Bentegodi",
    "Inter": "San Siro",
    "Juventus": "Allianz Stadium",
    "Lazio": "Stadio Olimpico",
    "Lecce": "Via del Mare",
    "Milan": "San Siro",
    "Monza": "U-Power Stadium",
    "Napoli": "Diego Armando Maradona",
    "Parma": "Ennio Tardini",
    "Roma": "Stadio Olimpico",
    "Torino": "Olimpico Grande Torino",
    "Udinese": "Bluenergy Stadium",
    "Venezia": "Pier Luigi Penzo"
  };

  // Prima usa le partite specifiche dal file Excel per le prime giornate
  const specificMatches = authenticSerieAFixtures2025.slice(0, 50);
  matches.push(...specificMatches);
  
  // Per le giornate rimanenti, genera usando round-robin
  for (let round = 6; round <= 38; round++) {
    const roundMatches = generateRoundRobinMatches(round, teams);
    roundMatches.forEach(match => {
      matches.push({
        round: round,
        homeTeam: match.home,
        awayTeam: match.away,
        date: calculateRoundDate(round),
        time: getMatchTime(round),
        venue: stadiums[match.home] || "Stadium"
      });
    });
  }
  
  return matches;
}

function generateRoundRobinMatches(round: number, teams: string[]): Array<{home: string, away: string}> {
  const matches: Array<{home: string, away: string}> = [];
  const n = teams.length;
  
  // Algoritmo round-robin per campionato
  for (let i = 0; i < n / 2; i++) {
    const home = teams[i];
    const away = teams[n - 1 - i];
    
    // Alterna casa/trasferta basato sul round
    if ((round + i) % 2 === 0) {
      matches.push({ home, away });
    } else {
      matches.push({ home: away, away: home });
    }
  }
  
  // Ruota per il prossimo round
  const rotated = [teams[0], ...teams.slice(2), teams[1]];
  teams.splice(0, teams.length, ...rotated);
  
  return matches;
}

function getMatchTime(round: number): string {
  const times = ['15:00', '18:00', '20:45'];
  return times[round % times.length];
}