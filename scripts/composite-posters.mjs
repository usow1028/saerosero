/**
 * v1 classic composite — uniform frame/tag layout. Output: posters/v1/
 * Usage: node scripts/composite-posters.mjs
 */
import { readFileSync, mkdirSync, existsSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const outDir = path.join(ROOT, 'public/assets/posters/v1');
const rawDir = path.join(ROOT, 'public/assets/posters/raw');
const catalog = JSON.parse(readFileSync(path.join(ROOT, 'public/data/catalog.json'), 'utf8'));

const GENRE = {
  sf: { accent: '#5eead4', sub: '#a5f3fc', tag: 'SCI-FI', font: '"Outfit", sans-serif', weight: 700, tracking: '0.12em' },
  fantasy: { accent: '#c4b5fd', sub: '#e9d5ff', tag: 'FANTASY', font: '"Noto Serif KR", serif', weight: 700, tracking: '0.06em' },
  romance: { accent: '#fda4af', sub: '#fecdd3', tag: 'ROMANCE', font: '"Noto Sans KR", sans-serif', weight: 500, tracking: '0.04em' },
  thriller: { accent: '#f87171', sub: '#fca5a5', tag: 'THRILLER', font: '"Outfit", sans-serif', weight: 700, tracking: '0.14em' },
  drama: { accent: '#fcd34d', sub: '#fde68a', tag: 'DRAMA', font: '"Noto Serif KR", serif', weight: 600, tracking: '0.05em' },
  mystery: { accent: '#a5b4fc', sub: '#c7d2fe', tag: 'MYSTERY', font: '"Outfit", sans-serif', weight: 600, tracking: '0.1em' },
  action: { accent: '#fb923c', sub: '#fdba74', tag: 'ACTION', font: '"Outfit", sans-serif', weight: 800, tracking: '0.08em' },
};

function hash(id) {
  let n = 0;
  for (const c of id) n = (n * 31 + c.charCodeAt(0)) % 9973;
  return n;
}

function posterHtml(title, bgDataUrl) {
  const g = GENRE[title.genre] ?? GENRE.drama;
  const seed = hash(title.id);
  const ko = title.titles?.ko ?? title.id;
  const en = title.titles?.en ?? '';
  const tilt = (seed % 3) - 1;
  const lines = ko.length > 9 ? [ko.slice(0, Math.ceil(ko.length / 2)), ko.slice(Math.ceil(ko.length / 2))] : [ko];

  return `<!DOCTYPE html><html><head><meta charset="utf-8">
<link href="https://fonts.googleapis.com/css2?family=Noto+Sans+KR:wght@400;500;700&family=Noto+Serif+KR:wght@500;600;700&family=Outfit:wght@500;600;700;800&display=swap" rel="stylesheet">
<style>
*{margin:0;padding:0;box-sizing:border-box}
body{width:680px;height:1020px;overflow:hidden;background:#060a14}
.poster{position:relative;width:100%;height:100%;overflow:hidden}
.bg{position:absolute;inset:0;width:100%;height:100%;object-fit:cover;filter:saturate(1.08) contrast(1.04)}
.shade-top{position:absolute;inset:0 0 55% 0;background:linear-gradient(180deg,rgba(4,8,18,0.55) 0%,transparent 100%)}
.shade-bottom{position:absolute;inset:45% 0 0 0;background:linear-gradient(0deg,rgba(4,8,18,0.94) 0%,rgba(4,8,18,0.5) 45%,transparent 100%)}
.frame{position:absolute;inset:3.5%;border:1px solid rgba(255,255,255,0.12);border-radius:4px;pointer-events:none}
.corner{position:absolute;width:28px;height:28px;border:2px solid ${g.accent}88}
.corner-tl{top:5%;left:5%;border-right:none;border-bottom:none}
.corner-br{bottom:5%;right:5%;border-left:none;border-top:none}
.brand{position:absolute;top:5.5%;left:6%;font:600 11px/1 Outfit,sans-serif;letter-spacing:0.35em;color:rgba(255,255,255,0.45)}
.tag{position:absolute;top:8.5%;right:6%;font:700 10px/1 Outfit,sans-serif;letter-spacing:0.28em;color:${g.accent};opacity:0.85;
  padding:0.35rem 0.55rem;border:1px solid ${g.accent}55;background:rgba(6,10,20,0.45)}
.title-wrap{position:absolute;left:6%;right:6%;bottom:7%;transform:rotate(${tilt * 0.4}deg);transform-origin:left bottom}
.rule{width:42px;height:3px;background:linear-gradient(90deg,${g.accent},transparent);margin-bottom:14px;border-radius:2px}
.title-ko{font-family:${g.font};font-weight:${g.weight};letter-spacing:${g.tracking};
  font-size:${lines.length > 1 ? '52px' : '58px'};line-height:1.08;color:#fff;
  text-shadow:0 2px 0 rgba(0,0,0,0.35),0 8px 28px rgba(0,0,0,0.65),0 0 40px ${g.accent}33}
.title-ko .accent{color:${g.accent}}
.title-en{margin-top:10px;font:500 22px/1.2 Outfit,sans-serif;letter-spacing:0.18em;text-transform:uppercase;color:${g.sub};
  text-shadow:0 2px 12px rgba(0,0,0,0.8);opacity:0.92}
.glow{position:absolute;left:0;bottom:0;width:70%;height:35%;
  background:radial-gradient(ellipse at 20% 100%,${g.accent}22 0%,transparent 70%);pointer-events:none}
</style></head><body>
<div class="poster">
  <img class="bg" src="${bgDataUrl}" alt="" />
  <div class="shade-top"></div>
  <div class="glow"></div>
  <div class="shade-bottom"></div>
  <div class="frame"></div>
  <div class="corner corner-tl"></div>
  <div class="corner corner-br"></div>
  <div class="brand">SAEROSERO</div>
  <div class="tag">${g.tag}</div>
  <div class="title-wrap">
    <div class="rule"></div>
    ${lines.map((line) => `<div class="title-ko">${line}</div>`).join('')}
    <div class="title-en">${en}</div>
  </div>
</div></body></html>`;
}

mkdirSync(outDir, { recursive: true });
mkdirSync(rawDir, { recursive: true });

const jpgIds = catalog.titles.map((t) => t.id).filter((id) => existsSync(path.join(rawDir, `${id}.jpg`)));
if (!jpgIds.length) {
  console.error('No poster JPGs found. Run seed:posters:jpg first.');
  process.exit(1);
}

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 680, height: 1020 } });

let count = 0;
for (const title of catalog.titles) {
  const rawPath = path.join(rawDir, `${title.id}.jpg`);
  const finalPath = path.join(outDir, `${title.id}.jpg`);
  const sourcePath = existsSync(rawPath) ? rawPath : finalPath;
  if (!existsSync(sourcePath)) continue;
  const raw = readFileSync(sourcePath);
  const bgDataUrl = `data:image/jpeg;base64,${raw.toString('base64')}`;
  await page.setContent(posterHtml(title, bgDataUrl), { waitUntil: 'networkidle' });
  await page.screenshot({ path: finalPath, type: 'jpeg', quality: 90 });
  count += 1;
  if (count % 10 === 0) console.log(`Composited ${count}/${jpgIds.length}...`);
}

await browser.close();

console.log(`v1 classic composites: ${count} → posters/v1/`);