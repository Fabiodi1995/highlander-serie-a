const fs = require('fs');
const path = require('path');

const teams = [
  { name: 'atalanta', code: 'ATA', color: '#003B7B' },
  { name: 'bologna', code: 'BOL', color: '#D2001F' },
  { name: 'cagliari', code: 'CAG', color: '#C8102E' },
  { name: 'como', code: 'COM', color: '#0066CC' },
  { name: 'empoli', code: 'EMP', color: '#0066CC' },
  { name: 'fiorentina', code: 'FIO', color: '#6B2C91' },
  { name: 'genoa', code: 'GEN', color: '#C8102E' },
  { name: 'hellas-verona', code: 'VER', color: '#FFDE00' },
  { name: 'inter', code: 'INT', color: '#0068B3' },
  { name: 'juventus', code: 'JUV', color: '#000000' },
  { name: 'lazio', code: 'LAZ', color: '#87CEEB' },
  { name: 'lecce', code: 'LEC', color: '#FFD700' },
  { name: 'milan', code: 'MIL', color: '#AC1E2D' },
  { name: 'monza', code: 'MON', color: '#E30613' },
  { name: 'napoli', code: 'NAP', color: '#0067B1' },
  { name: 'parma', code: 'PAR', color: '#FFDE00' },
  { name: 'roma', code: 'ROM', color: '#C8102E' },
  { name: 'torino', code: 'TOR', color: '#8B0000' },
  { name: 'udinese', code: 'UDI', color: '#000000' },
  { name: 'venezia', code: 'VEN', color: '#FF6600' }
];

teams.forEach(team => {
  const textColor = team.name === 'juventus' || team.name === 'udinese' ? '#ffffff' : 
                   team.name === 'hellas-verona' || team.name === 'lecce' || team.name === 'parma' ? '#000000' : '#ffffff';
  
  const svg = `<svg width="40" height="40" viewBox="0 0 40 40" xmlns="http://www.w3.org/2000/svg">
  <circle cx="20" cy="20" r="19" fill="${team.color}" stroke="#ffffff" stroke-width="2"/>
  <text x="20" y="26" font-family="Arial, sans-serif" font-size="11" font-weight="bold" text-anchor="middle" fill="${textColor}">${team.code}</text>
</svg>`;

  fs.writeFileSync(path.join(__dirname, `${team.name}.svg`), svg);
});

console.log('Creati tutti i loghi delle squadre Serie A');