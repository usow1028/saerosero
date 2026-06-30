/**
 * v3 integrated poster composites — type woven into the image.
 */
import { readFileSync, mkdirSync, existsSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright';
import { posterHtmlV3, layoutNameForV3 } from './poster-layouts-v3.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const rawDir = path.join(ROOT, 'public/assets/posters/raw');
const v3Dir = path.join(ROOT, 'public/assets/posters/v3');
const catalog = JSON.parse(readFileSync(path.join(ROOT, 'public/data/catalog.json'), 'utf8'));

mkdirSync(v3Dir, { recursive: true });
const pending = catalog.titles.filter((t) => existsSync(path.join(rawDir, `${t.id}.jpg`)));
if (!pending.length) {
  console.error('No raw art in posters/raw/');
  process.exit(1);
}

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 680, height: 1020 } });
const layouts = {};
let count = 0;

for (const title of pending) {
  const raw = readFileSync(path.join(rawDir, `${title.id}.jpg`));
  const bgDataUrl = `data:image/jpeg;base64,${raw.toString('base64')}`;
  const layout = layoutNameForV3(title.id);
  layouts[layout] = (layouts[layout] ?? 0) + 1;

  await page.setContent(posterHtmlV3(title, bgDataUrl), { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(150);
  await page.screenshot({ path: path.join(v3Dir, `${title.id}.jpg`), type: 'jpeg', quality: 92 });
  count += 1;
  if (count % 10 === 0) console.log(`v3 integrated ${count}/${pending.length}...`);
}

await browser.close();

const meta = {
  version: 5,
  activeVariant: 'v3',
  variants: { v1: 'v1', v2: 'v2', v3: 'v3' },
  composited: true,
  integrated: true,
  layoutDistribution: layouts,
  updatedAt: new Date().toISOString(),
  jpgIds: pending.map((t) => t.id),
};

writeFileSync(path.join(ROOT, 'src/data/ai-posters.json'), JSON.stringify(meta, null, 2));
console.log(`v3 integrated posters: ${count}`);
console.log('Layout mix:', layouts);