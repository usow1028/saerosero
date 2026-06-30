import { readFileSync, readdirSync, writeFileSync, existsSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const catalog = JSON.parse(readFileSync(path.join(ROOT, 'public/data/catalog.json'), 'utf8'));
const posterRoot = path.join(ROOT, 'public/assets/posters');

let existing = {};
try {
  existing = JSON.parse(readFileSync(path.join(ROOT, 'src/data/ai-posters.json'), 'utf8'));
} catch { /* fresh */ }

const activeVariant = existing.activeVariant ?? 'v4';
const variantDir = path.join(posterRoot, activeVariant);
const onDisk = new Set(
  existsSync(variantDir)
    ? readdirSync(variantDir).filter((f) => f.endsWith('.jpg')).map((f) => f.replace(/\.jpg$/, ''))
    : readdirSync(posterRoot).filter((f) => f.endsWith('.jpg')).map((f) => f.replace(/\.jpg$/, '')),
);

const jpgIds = catalog.titles.map((t) => t.id).filter((id) => onDisk.has(id));

writeFileSync(
  path.join(ROOT, 'src/data/ai-posters.json'),
  JSON.stringify({
    ...existing,
    version: existing.version ?? 4,
    activeVariant,
    variants: existing.variants ?? { v1: 'v1', v2: 'v2', v3: 'v3', v4: 'v4' },
    updatedAt: new Date().toISOString(),
    jpgIds,
  }, null, 2),
);
console.log(`ai-posters.json: ${jpgIds.length} titles @ ${activeVariant}/`);