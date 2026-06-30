import { readFileSync, readdirSync, writeFileSync, existsSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { LOCALES } from './title-styles.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const catalog = JSON.parse(readFileSync(path.join(ROOT, 'public/data/catalog.json'), 'utf8'));
const posterRoot = path.join(ROOT, 'public/assets/posters');
const rawDir = path.join(posterRoot, 'raw');

const rawIds = new Set(
  existsSync(rawDir)
    ? readdirSync(rawDir).filter((f) => f.endsWith('.jpg')).map((f) => f.replace(/\.jpg$/, ''))
    : [],
);

const titleCounts = {};
for (const loc of LOCALES) {
  const dir = path.join(posterRoot, 'titles', loc);
  titleCounts[loc] = existsSync(dir) ? readdirSync(dir).filter((f) => f.endsWith('.png')).length : 0;
}

const meta = {
  version: 8,
  pipeline: 'raw+titleArt',
  artSource: 'raw',
  titleArt: true,
  locales: LOCALES,
  updatedAt: new Date().toISOString(),
  jpgIds: catalog.titles.map((t) => t.id).filter((id) => rawIds.has(id)),
  titleArtCounts: titleCounts,
};

writeFileSync(path.join(ROOT, 'src/data/ai-posters.json'), JSON.stringify(meta, null, 2));
console.log(`Config: ${meta.jpgIds.length} backgrounds, title art:`, titleCounts);