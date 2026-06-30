/** Switch active poster variant: node scripts/set-poster-variant.mjs v1|v2 */
import { readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const variant = process.argv[2];
if (!['v1', 'v2', 'v3', 'v4'].includes(variant)) {
  console.error('Usage: node scripts/set-poster-variant.mjs v1|v2|v3|v4');
  process.exit(1);
}

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const metaPath = path.join(ROOT, 'src/data/ai-posters.json');
const meta = JSON.parse(readFileSync(metaPath, 'utf8'));
meta.activeVariant = variant;
meta.updatedAt = new Date().toISOString();
writeFileSync(metaPath, JSON.stringify(meta, null, 2));
console.log(`Active poster variant → ${variant}`);