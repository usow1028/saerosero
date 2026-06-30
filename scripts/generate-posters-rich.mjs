/**
 * Scene-specific cinematic SVG posters — fallback until AI JPG exists.
 * Reads catalog.json; skips ids that already have a .jpg on disk.
 */
import { writeFileSync, mkdirSync, existsSync, readFileSync, readdirSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const catalog = JSON.parse(readFileSync(path.join(ROOT, 'public/data/catalog.json'), 'utf8'));
const outDir = path.join(ROOT, 'public/assets/posters');
mkdirSync(outDir, { recursive: true });

const genrePalette = {
  sf: { sat: 62, lit: [14, 22, 38], accent: 'cyan' },
  fantasy: { sat: 48, lit: [16, 26, 42], accent: 'emerald' },
  romance: { sat: 42, lit: [18, 30, 48], accent: 'rose' },
  thriller: { sat: 28, lit: [10, 18, 28], accent: 'crimson' },
  drama: { sat: 35, lit: [14, 24, 36], accent: 'amber' },
  mystery: { sat: 40, lit: [12, 20, 34], accent: 'violet' },
  action: { sat: 58, lit: [16, 28, 44], accent: 'orange' },
};

function hash(id) {
  let n = 0;
  for (const c of id) n = (n * 31 + c.charCodeAt(0)) % 9973;
  return n;
}

function hsl(h, s, l, a = 1) {
  return a < 1 ? `hsla(${h},${s}%,${l}%,${a})` : `hsl(${h},${s}%,${l}%)`;
}

function sceneLayers(title) {
  const h = title.hue ?? (hash(title.id) % 360);
  const pal = genrePalette[title.genre] ?? genrePalette.drama;
  const seed = hash(title.id);
  const scene = (title.posterScene ?? title.genre).toLowerCase();

  const stars = Array.from({ length: 18 }, (_, i) => {
    const x = (seed * (i + 3)) % 320 + 10;
    const y = (seed * (i + 7)) % 200 + 20;
    const r = 0.8 + (i % 3) * 0.6;
    const op = 0.25 + (i % 5) * 0.12;
    return `<circle cx="${x}" cy="${y}" r="${r}" fill="white" opacity="${op.toFixed(2)}"/>`;
  }).join('');

  const rain = scene.includes('rain') || scene.includes('neon')
    ? Array.from({ length: 24 }, (_, i) => {
        const x = (i * 14 + seed % 20) % 340;
        const y = (i * 19) % 400;
        return `<line x1="${x}" y1="${y}" x2="${x - 4}" y2="${y + 22}" stroke="${hsl(h, 55, 70, 0.18)}" stroke-width="1.2"/>`;
      }).join('')
    : '';

  const horizon = `<ellipse cx="170" cy="420" rx="200" ry="55" fill="${hsl(h, pal.sat, pal.lit[0], 0.55)}"/>`;
  const glow = `<ellipse cx="170" cy="${140 + seed % 80}" rx="120" ry="90" fill="${hsl(h, pal.sat + 10, pal.lit[2], 0.22)}"/>`;
  const vignette = `<rect width="340" height="510" fill="url(#vignette)"/>`;

  const figure = `<g opacity="0.85">
    <ellipse cx="170" cy="360" rx="48" ry="12" fill="${hsl(h, 20, 8, 0.5)}"/>
    <path d="M ${150 + seed % 20} 360 L ${170} ${220 + seed % 40} L ${190 - seed % 15} 360 Z" fill="${hsl((h + 30) % 360, pal.sat, pal.lit[1], 0.75)}"/>
    <circle cx="170" cy="${200 + seed % 30}" r="22" fill="${hsl(h, 35, pal.lit[2], 0.9)}"/>
  </g>`;

  const accentOrb = `<circle cx="${60 + seed % 200}" cy="${80 + seed % 100}" r="${35 + seed % 25}" fill="${hsl((h + 50) % 360, pal.sat, pal.lit[2], 0.18)}"/>`;

  const sceneTag = title.titles?.en ?? title.id;
  const tag = sceneTag.length > 22 ? `${sceneTag.slice(0, 20)}…` : sceneTag;

  return { h, pal, stars, rain, horizon, glow, vignette, figure, accentOrb, tag, scene };
}

function svgFor(title) {
  if (existsSync(path.join(outDir, `${title.id}.jpg`))) return null;

  const { h, pal, stars, rain, horizon, glow, vignette, figure, accentOrb, tag, scene } = sceneLayers(title);
  const h2 = (h + 42) % 360;

  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 340 510" width="340" height="510">
  <defs>
    <linearGradient id="sky" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" stop-color="${hsl(h, pal.sat + 8, pal.lit[2])}"/>
      <stop offset="45%" stop-color="${hsl(h2, pal.sat, pal.lit[1])}"/>
      <stop offset="100%" stop-color="${hsl(h, pal.sat - 5, pal.lit[0])}"/>
    </linearGradient>
    <radialGradient id="sun" cx="72%" cy="18%" r="45%">
      <stop offset="0%" stop-color="${hsl((h + 20) % 360, 70, 72, 0.55)}"/>
      <stop offset="100%" stop-color="transparent"/>
    </radialGradient>
    <linearGradient id="vignette" x1="50%" y1="50%" x2="50%" y2="100%">
      <stop offset="55%" stop-color="transparent"/>
      <stop offset="100%" stop-color="rgba(0,0,0,0.72)"/>
    </linearGradient>
    <filter id="blur"><feGaussianBlur stdDeviation="18"/></filter>
  </defs>
  <rect width="340" height="510" fill="url(#sky)"/>
  <rect width="340" height="510" fill="url(#sun)"/>
  ${stars}
  ${accentOrb}
  <rect x="0" y="280" width="340" height="230" fill="${hsl(h, pal.sat - 10, pal.lit[0], 0.35)}" filter="url(#blur)" opacity="0.6"/>
  ${glow}
  ${rain}
  ${horizon}
  ${figure}
  <rect x="0" y="0" width="340" height="510" fill="url(#vignette)" opacity="0.35"/>
  ${vignette}
  <text x="20" y="488" fill="${hsl(h, 18, 92, 0.7)}" font-family="Outfit, system-ui, sans-serif" font-size="11" font-weight="600" letter-spacing="0.06em">${tag.toUpperCase()}</text>
  <text x="20" y="36" fill="${hsl(h, 25, 88, 0.35)}" font-family="Outfit, system-ui, sans-serif" font-size="9" letter-spacing="0.12em">${scene.slice(0, 36)}</text>
</svg>`;
}

let count = 0;
for (const title of catalog.titles) {
  const svg = svgFor(title);
  if (!svg) continue;
  writeFileSync(path.join(outDir, `${title.id}.svg`), svg);
  count += 1;
}

const jpgIds = readdirSync(outDir).filter((f) => f.endsWith('.jpg')).map((f) => f.replace(/\.jpg$/, ''));
writeFileSync(
  path.join(ROOT, 'public/data/ai-posters.json'),
  JSON.stringify({ version: 2, updatedAt: new Date().toISOString(), jpgIds }, null, 2),
);
console.log(`Rich SVG posters: ${count} | JPG on disk: ${jpgIds.length}`);