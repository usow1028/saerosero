/**
 * v4 — 22 distinct film / drama / anime poster art directions.
 */
import { readFileSync, mkdirSync, existsSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright';
import { posterHtmlV4, layoutNameForV4, layoutCountV4 } from './poster-layouts-v4.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const rawDir = path.join(ROOT, 'public/assets/posters/raw');
const v4Dir = path.join(ROOT, 'public/assets/posters/v4');
const catalog = JSON.parse(readFileSync(path.join(ROOT, 'public/data/catalog.json'), 'utf8'));

mkdirSync(v4Dir, { recursive: true });
const pending = catalog.titles.filter((t) => existsSync(path.join(rawDir, `${t.id}.jpg`)));
if (!pending.length) {
  console.error('No raw art in posters/raw/');
  process.exit(1);
}

console.log(`v4: ${layoutCountV4()} poster styles → ${pending.length} titles`);

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 680, height: 1020 } });
const layouts = {};
let count = 0;

for (const title of pending) {
  const raw = readFileSync(path.join(rawDir, `${title.id}.jpg`));
  const bgDataUrl = `data:image/jpeg;base64,${raw.toString('base64')}`;
  const layout = layoutNameForV4(title.id);
  layouts[layout] = (layouts[layout] ?? 0) + 1;

  await page.setContent(posterHtmlV4(title, bgDataUrl), { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(180);
  await page.screenshot({ path: path.join(v4Dir, `${title.id}.jpg`), type: 'jpeg', quality: 93 });
  count += 1;
  if (count % 10 === 0) console.log(`v4 poster ${count}/${pending.length}...`);
}

await browser.close();

writeFileSync(
  path.join(ROOT, 'src/data/ai-posters.json'),
  JSON.stringify({
    version: 6,
    activeVariant: 'v4',
    variants: { v1: 'v1', v2: 'v2', v3: 'v3', v4: 'v4' },
    styleCount: layoutCountV4(),
    composited: true,
    layoutDistribution: layouts,
    updatedAt: new Date().toISOString(),
    jpgIds: pending.map((t) => t.id),
  }, null, 2),
);

console.log(`v4 cinematic posters: ${count}`);
console.log('Styles used:', layouts);