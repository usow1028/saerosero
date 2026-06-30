import { readFileSync, readdirSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const catalog = JSON.parse(readFileSync(path.join(ROOT, 'public/data/catalog.json'), 'utf8'));
const posterDir = path.join(ROOT, 'public/assets/posters');
const onDisk = new Set(readdirSync(posterDir).filter((f) => f.endsWith('.jpg')).map((f) => f.replace(/\.jpg$/, '')));
const jpgIds = catalog.titles.map((t) => t.id).filter((id) => onDisk.has(id));

writeFileSync(
  path.join(ROOT, 'public/data/ai-posters.json'),
  JSON.stringify({ version: 2, updatedAt: new Date().toISOString(), jpgIds }, null, 2),
);
console.log(`ai-posters.json: ${jpgIds.length} / ${catalog.titles.length} titles with JPG`);