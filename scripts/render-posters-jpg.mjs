/**
 * Renders cinematic anime-style poster JPGs from catalog posterScene metadata.
 * Skips titles that already have a .jpg file.
 */
import { readFileSync, mkdirSync, existsSync, readdirSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const outDir = path.join(ROOT, 'public/assets/posters');
const catalog = JSON.parse(readFileSync(path.join(ROOT, 'public/data/catalog.json'), 'utf8'));

const GENRE_STYLES = {
  sf: { g1: '#0a1628', g2: '#1a4a6e', g3: '#0d2840', accent: '#4ecdc4', glow: 'rgba(78,205,196,0.35)' },
  fantasy: { g1: '#1a0f28', g2: '#3d2a5c', g3: '#0f1a14', accent: '#9b59b6', glow: 'rgba(155,89,182,0.4)' },
  romance: { g1: '#2a1520', g2: '#6e3a52', g3: '#1a1020', accent: '#f8a5c2', glow: 'rgba(248,165,194,0.35)' },
  thriller: { g1: '#0a0a12', g2: '#1e1e32', g3: '#080810', accent: '#c0392b', glow: 'rgba(192,57,43,0.3)' },
  drama: { g1: '#1a1810', g2: '#4a3d28', g3: '#12100a', accent: '#d4a574', glow: 'rgba(212,165,116,0.35)' },
  mystery: { g1: '#10101a', g2: '#2a2848', g3: '#0a0a14', accent: '#7f8cff', glow: 'rgba(127,140,255,0.35)' },
  action: { g1: '#1a1008', g2: '#5c3018', g3: '#100804', accent: '#ff6b35', glow: 'rgba(255,107,53,0.4)' },
};

function hash(id) {
  let n = 0;
  for (const c of id) n = (n * 31 + c.charCodeAt(0)) % 9973;
  return n;
}

function posterHtml(title) {
  const style = GENRE_STYLES[title.genre] ?? GENRE_STYLES.drama;
  const seed = hash(title.id);
  const scene = title.posterScene || title.genre;
  const name = title.titles?.en ?? title.id;
  const stars = Array.from({ length: 40 }, (_, i) => {
    const x = (seed * (i + 2) + i * 37) % 100;
    const y = (seed * (i + 5) + i * 23) % 65;
    const s = 0.15 + (i % 4) * 0.12;
    const op = 0.2 + (i % 6) * 0.1;
    return `<div class="star" style="left:${x}%;top:${y}%;width:${s}%;opacity:${op}"></div>`;
  }).join('');

  const rain = scene.includes('rain') || scene.includes('neon')
    ? '<div class="rain"></div>' : '';
  const orbX = 15 + (seed % 55);
  const orbY = 10 + (seed % 35);

  return `<!DOCTYPE html><html><head><meta charset="utf-8"><style>
  *{margin:0;padding:0;box-sizing:border-box}
  body{width:680px;height:1020px;overflow:hidden;font-family:system-ui,sans-serif}
  .poster{position:relative;width:100%;height:100%;
    background:linear-gradient(165deg,${style.g1} 0%,${style.g2} 42%,${style.g3} 100%)}
  .stars{position:absolute;inset:0;overflow:hidden}
  .star{position:absolute;height:0;padding-bottom:100%;background:#fff;border-radius:50%}
  .orb{position:absolute;width:55%;aspect-ratio:1;border-radius:50%;
    background:radial-gradient(circle,${style.glow} 0%,transparent 70%);
    left:${orbX}%;top:${orbY}%;filter:blur(40px)}
  .horizon{position:absolute;bottom:0;left:-10%;width:120%;height:45%;
    background:linear-gradient(0deg,${style.g3}ee 0%,transparent 100%)}
  .silhouette{position:absolute;bottom:12%;left:50%;transform:translateX(-50%);
    width:38%;height:48%;background:linear-gradient(180deg,transparent 20%,${style.accent}55 45%,${style.g1} 100%);
    clip-path:polygon(30% 100%,50% 15%,70% 100%);opacity:0.85}
  .ground{position:absolute;bottom:0;width:100%;height:18%;
    background:linear-gradient(0deg,#00000088,transparent)}
  .vignette{position:absolute;inset:0;background:radial-gradient(ellipse 80% 70% at 50% 40%,transparent 30%,#00000066 100%)}
  .accent-line{position:absolute;top:35%;left:8%;width:84%;height:2px;
    background:linear-gradient(90deg,transparent,${style.accent}88,transparent);opacity:0.5}
  .scene-tag{position:absolute;top:4%;left:5%;right:5%;
    font-size:18px;letter-spacing:0.2em;text-transform:uppercase;color:${style.accent}55;font-weight:600}
  .title-block{position:absolute;bottom:6%;left:5%;right:5%}
  .title-en{font-size:28px;font-weight:700;color:#ffffffcc;letter-spacing:0.04em;text-shadow:0 2px 20px #000}
  .title-ko{font-size:20px;color:#ffffff88;margin-top:6px}
  .rain{position:absolute;inset:0;background:repeating-linear-gradient(
    105deg,transparent,transparent 8px,rgba(255,255,255,0.03) 8px,rgba(255,255,255,0.03) 9px)}
  .particles{position:absolute;inset:0;
    background-image:radial-gradient(${style.accent}33 1px,transparent 1px);
    background-size:24px 24px;opacity:0.25}
</style></head><body>
<div class="poster">
  <div class="stars">${stars}</div>
  <div class="orb"></div>
  <div class="particles"></div>
  ${rain}
  <div class="accent-line"></div>
  <div class="silhouette"></div>
  <div class="horizon"></div>
  <div class="ground"></div>
  <div class="vignette"></div>
  <div class="scene-tag">${scene}</div>
  <div class="title-block">
    <div class="title-en">${name}</div>
    <div class="title-ko">${title.titles?.ko ?? ''}</div>
  </div>
</div></body></html>`;
}

mkdirSync(outDir, { recursive: true });
const existing = new Set(readdirSync(outDir).filter((f) => f.endsWith('.jpg')).map((f) => f.replace(/\.jpg$/, '')));
const pending = catalog.titles.filter((t) => !existing.has(t.id));

if (!pending.length) {
  console.log('All titles already have JPG posters.');
  process.exit(0);
}

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 680, height: 1020 } });

let count = 0;
for (const title of pending) {
  await page.setContent(posterHtml(title), { waitUntil: 'domcontentloaded' });
  await page.screenshot({
    path: path.join(outDir, `${title.id}.jpg`),
    type: 'jpeg',
    quality: 88,
  });
  count += 1;
  if (count % 10 === 0) console.log(`Rendered ${count}/${pending.length}...`);
}

await browser.close();

const jpgIds = readdirSync(outDir).filter((f) => f.endsWith('.jpg')).map((f) => f.replace(/\.jpg$/, ''));
writeFileSync(
  path.join(ROOT, 'src/data/ai-posters.json'),
  JSON.stringify({ version: 2, updatedAt: new Date().toISOString(), jpgIds }, null, 2),
);
console.log(`Rendered ${count} JPG posters. Total JPG: ${jpgIds.length}`);