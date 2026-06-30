/**
 * Cinematic v2 poster composites — varied layouts, real key-visual feel.
 * Reads AI art from posters/raw/, writes to posters/v2/
 */
import { readFileSync, mkdirSync, existsSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright';
import { posterHtmlV2, layoutNameFor } from './poster-layouts-v2.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const rawDir = path.join(ROOT, 'public/assets/posters/raw');
const v2Dir = path.join(ROOT, 'public/assets/posters/v2');
const catalog = JSON.parse(readFileSync(path.join(ROOT, 'public/data/catalog.json'), 'utf8'));

mkdirSync(v2Dir, { recursive: true });

const pending = catalog.titles.filter((t) => existsSync(path.join(rawDir, `${t.id}.jpg`)));
if (!pending.length) {
  console.error('No raw poster art found. Ensure posters/raw/*.jpg exists.');
  process.exit(1);
}

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 680, height: 1020 } });

const layouts = {};
let count = 0;

for (const title of pending) {
  const raw = readFileSync(path.join(rawDir, `${title.id}.jpg`));
  const bgDataUrl = `data:image/jpeg;base64,${raw.toString('base64')}`;
  const layout = layoutNameFor(title.id);
  layouts[layout] = (layouts[layout] ?? 0) + 1;

  await page.setContent(posterHtmlV2(title, bgDataUrl), { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(120);
  await page.screenshot({ path: path.join(v2Dir, `${title.id}.jpg`), type: 'jpeg', quality: 91 });
  count += 1;
  if (count % 10 === 0) console.log(`v2 composited ${count}/${pending.length}...`);
}

await browser.close();

const jpgIds = pending.map((t) => t.id);
const meta = {
  version: 4,
  activeVariant: 'v2',
  variants: { v1: 'v1', v2: 'v2' },
  composited: true,
  layoutDistribution: layouts,
  updatedAt: new Date().toISOString(),
  jpgIds,
};

writeFileSync(path.join(ROOT, 'src/data/ai-posters.json'), JSON.stringify(meta, null, 2));
console.log(`v2 cinematic posters: ${count}`);
console.log('Layout mix:', layouts);