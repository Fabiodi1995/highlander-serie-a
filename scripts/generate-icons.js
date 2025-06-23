import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Crea icone SVG per diverse dimensioni
const sizes = [72, 96, 128, 144, 152, 192, 384, 512];

const iconSvg = (size) => `<svg width="${size}" height="${size}" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512">
  <rect width="512" height="512" rx="80" fill="#1a365d"/>
  <circle cx="256" cy="256" r="200" fill="#2b6cb0"/>
  <text x="256" y="320" text-anchor="middle" fill="white" font-size="180" font-family="Arial, sans-serif" font-weight="bold">H</text>
  <rect x="100" y="100" width="312" height="8" fill="#60a5fa" rx="4"/>
  <rect x="100" y="120" width="312" height="8" fill="#60a5fa" rx="4"/>
  <rect x="100" y="384" width="312" height="8" fill="#60a5fa" rx="4"/>
  <rect x="100" y="404" width="312" height="8" fill="#60a5fa" rx="4"/>
</svg>`;

// Crea la cartella icons se non esiste
const iconsDir = path.join(__dirname, '../client/public/icons');
if (!fs.existsSync(iconsDir)) {
  fs.mkdirSync(iconsDir, { recursive: true });
}

// Genera SVG per ogni dimensione
sizes.forEach(size => {
  const svgContent = iconSvg(size);
  const filename = `icon-${size}x${size}.svg`;
  fs.writeFileSync(path.join(iconsDir, filename), svgContent);
  console.log(`Generated ${filename}`);
});

console.log('All icons generated successfully!');