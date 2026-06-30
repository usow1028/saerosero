import { writeFileSync, mkdirSync, readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const catalog = JSON.parse(readFileSync(path.join(ROOT, 'public/data/catalog.json'), 'utf8'));
const outDir = path.join(ROOT, 'public/assets/posters');
mkdirSync(outDir, { recursive: true });

const genreMotifs = {
  sf: (h) => `<circle cx="170" cy="95" r="42" fill="hsla(${h},70%,55%,0.25)"/><rect x="40" y="200" width="280" height="4" rx="2" fill="hsla(${h},60%,70%,0.5)"/><circle cx="280" cy="60" r="3" fill="white" opacity="0.8"/><circle cx="50" cy="80" r="2" fill="white" opacity="0.6"/>`,
  fantasy: (h) => `<polygon points="170,50 200,140 140,140" fill="hsla(${h},55%,45%,0.5)"/><ellipse cx="170" cy="280" rx="90" ry="25" fill="hsla(${h},40%,30%,0.35)"/>`,
  romance: (h) => `<ellipse cx="170" cy="200" rx="70" ry="50" fill="hsla(${h},50%,55%,0.2)"/><circle cx="140" cy="120" r="18" fill="hsla(${h},60%,65%,0.4)"/><circle cx="200" cy="130" r="14" fill="hsla(${h},55%,60%,0.35)"/>`,
  thriller: (h) => `<rect x="60" y="80" width="220" height="160" rx="8" fill="none" stroke="hsla(${h},50%,40%,0.5)" stroke-width="3"/><line x1="80" y1="220" x2="260" y2="100" stroke="hsla(${h},70%,50%,0.6)" stroke-width="2"/>`,
  drama: (h) => `<rect x="90" y="100" width="160" height="120" rx="4" fill="hsla(${h},35%,25%,0.4)"/><line x1="110" y1="140" x2="230" y2="140" stroke="hsla(${h},50%,60%,0.3)" stroke-width="2"/>`,
  mystery: (h) => `<circle cx="170" cy="170" r="60" fill="none" stroke="hsla(${h},45%,50%,0.45)" stroke-width="2" stroke-dasharray="8 6"/><text x="170" y="178" text-anchor="middle" fill="hsla(${h},30%,85%,0.5)" font-size="48" font-family="serif">?</text>`,
  action: (h) => `<polygon points="170,70 220,250 120,250" fill="hsla(${h},65%,45%,0.35)"/><line x1="50" y1="180" x2="290" y2="120" stroke="hsla(${h},80%,55%,0.5)" stroke-width="4"/>`,
};

function hash(id) {
  let n = 0;
  for (const c of id) n = (n * 31 + c.charCodeAt(0)) % 9973;
  return n;
}

function svgFor(title) {
  if (title.id === 'starlight-station') return null;
  const h = title.hue ?? (hash(title.id) % 360);
  const h2 = (h + 40) % 360;
  const motif = (genreMotifs[title.genre] ?? genreMotifs.drama)(h);
  const seed = hash(title.id);
  const titleKo = title.titles?.ko ?? title.id;
  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 340 510" width="340" height="510">
  <defs>
    <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="hsl(${h} 42% 16%)"/>
      <stop offset="55%" stop-color="hsl(${h2} 48% 28%)"/>
      <stop offset="100%" stop-color="hsl(${h} 35% 12%)"/>
    </linearGradient>
    <radialGradient id="glow" cx="50%" cy="35%" r="55%">
      <stop offset="0%" stop-color="hsla(${h},70%,60%,0.35)"/>
      <stop offset="100%" stop-color="transparent"/>
    </radialGradient>
  </defs>
  <rect width="340" height="510" fill="url(#bg)"/>
  <rect width="340" height="510" fill="url(#glow)"/>
  ${motif}
  <circle cx="${60 + (seed % 200)}" cy="${300 + (seed % 120)}" r="${8 + (seed % 12)}" fill="hsla(${h2},60%,70%,0.25)"/>
  <text x="24" y="470" fill="hsla(${h},20%,92%,0.55)" font-family="Outfit, sans-serif" font-size="14" font-weight="500">${titleKo.slice(0, 14)}</text>
</svg>`;
}

let count = 0;
for (const title of catalog.titles) {
  const svg = svgFor(title);
  if (!svg) continue;
  writeFileSync(path.join(outDir, `${title.id}.svg`), svg);
  count += 1;
}
console.log(`Generated ${count} poster SVGs`);