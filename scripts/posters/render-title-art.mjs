/**
 * Renders transparent PNG title art per title × locale.
 * Output: public/assets/posters/titles/{locale}/{id}.png
 */
import { readFileSync, mkdirSync, existsSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright';
import { LOCALES, styleForTitle, titleArtHtml, TITLE_STYLES } from './title-styles.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const outRoot = path.join(ROOT, 'public/assets/posters/titles');
const catalog = JSON.parse(readFileSync(path.join(ROOT, 'public/data/catalog.json'), 'utf8'));
const force = process.argv.includes('--force');

mkdirSync(outRoot, { recursive: true });
for (const loc of LOCALES) mkdirSync(path.join(outRoot, loc), { recursive: true });

const jobs = [];
for (const title of catalog.titles) {
  const style = styleForTitle(title.id);
  for (const locale of LOCALES) {
    const out = path.join(outRoot, locale, `${title.id}.png`);
    if (!force && existsSync(out)) continue;
    jobs.push({ title, locale, style, out });
  }
}

if (!jobs.length) {
  console.log('All title art PNGs exist. Use --force to regenerate.');
  process.exit(0);
}

console.log(`Rendering ${jobs.length} title art PNGs (${TITLE_STYLES.length} styles × ${LOCALES.length} locales)...`);

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 680, height: 1020 } });

let count = 0;
const styleUse = {};

for (const job of jobs) {
  await page.setContent(titleArtHtml(job.title, job.locale, job.style), { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(100);
  await page.screenshot({ path: job.out, type: 'png', omitBackground: true });
  styleUse[job.style] = (styleUse[job.style] ?? 0) + 1;
  count += 1;
  if (count % 50 === 0) console.log(`  ${count}/${jobs.length}...`);
}

await browser.close();

const metaPath = path.join(ROOT, 'src/data/ai-posters.json');
let existing = {};
try { existing = JSON.parse(readFileSync(metaPath, 'utf8')); } catch { /* */ }

writeFileSync(metaPath, JSON.stringify({
  ...existing,
  version: 8,
  pipeline: 'raw+titleArt',
  artSource: 'raw',
  titleArt: true,
  titleStyles: TITLE_STYLES.length,
  locales: LOCALES,
  styleDistribution: styleUse,
  updatedAt: new Date().toISOString(),
  jpgIds: catalog.titles.map((t) => t.id),
}, null, 2));

console.log(`Title art complete: ${count} PNGs → posters/titles/`);