const XLSX = require('xlsx');
const { db } = require('./server/db');
const { matches } = require('./shared/schema');

async function loadAllMatchesFromExcel() {
  try {
    console.log('Loading all 380 Serie A 2025/26 matches from Excel...');
    
    const workbook = XLSX.readFile('attached_assets/Calendario-serie-A-XLS-2025-2026-da-stampare-e-scaricare-download_1750286996913.xlsx');
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    const data = XLSX.utils.sheet_to_json(worksheet);

    // Funzione per convertire data Excel in formato ISO
    function excelDateToISO(excelDate) {
      const date = new Date((excelDate - 25569) * 86400 * 1000);
      return date.toISOString().split('T')[0];
    }

    // Mapping squadre con ID database
    const teamMapping = {
      'ATALANTA': 21, 'BOLOGNA': 22, 'CAGLIARI': 23, 'COMO': 24, 'CREMONESE': 34,
      'FIORENTINA': 26, 'GENOA': 27, 'VERONA': 28, 'INTER': 29, 'JUVENTUS': 30,
      'LAZIO': 31, 'LECCE': 32, 'MILAN': 33, 'NAPOLI': 35, 'PARMA': 36,
      'PISA': 25, 'ROMA': 37, 'SASSUOLO': 40, 'TORINO': 38, 'UDINESE': 39
    };

    const matchesToInsert = data.map((match, index) => {
      const homeTeamId = teamMapping[match['Squadra Casa']];
      const awayTeamId = teamMapping[match['Squadra Ospite']];
      const matchDate = new Date(excelDateToISO(match.Data));
      
      if (!homeTeamId || !awayTeamId) {
        console.error('Team mapping error:', match['Squadra Casa'], match['Squadra Ospite']);
        return null;
      }
      
      return {
        round: match.Giornata,
        homeTeamId: homeTeamId,
        awayTeamId: awayTeamId,
        matchDate: matchDate,
        homeScore: 0,
        awayScore: 0,
        isCompleted: false
      };
    }).filter(Boolean);

    // Inserimento in batch di 50 partite per volta
    const batchSize = 50;
    let totalInserted = 0;
    
    for (let i = 0; i < matchesToInsert.length; i += batchSize) {
      const batch = matchesToInsert.slice(i, i + batchSize);
      await db.insert(matches).values(batch);
      totalInserted += batch.length;
      console.log(`Inserted batch ${Math.floor(i/batchSize) + 1}: ${totalInserted}/${matchesToInsert.length} matches`);
    }

    console.log(`Successfully loaded ${totalInserted} Serie A 2025/26 matches from Excel`);
    return totalInserted;
    
  } catch (error) {
    console.error('Error loading matches from Excel:', error);
    throw error;
  }
}

// Esegui se chiamato direttamente
if (require.main === module) {
  loadAllMatchesFromExcel()
    .then(() => process.exit(0))
    .catch(() => process.exit(1));
}

module.exports = { loadAllMatchesFromExcel };