import { writeFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { CATALOG_TITLES } from './catalog-titles.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

function normalizeTitle(entry) {
  const tags = entry.tags ?? [entry.genre, 'interactive'];
  return {
    id: entry.id,
    status: entry.status,
    genre: entry.genre,
    age: entry.age,
    interactive: true,
    featured: entry.featured ?? false,
    hue: entry.hue,
    episodes: entry.episodes ?? (entry.status === 'playable' ? 1 : 0),
    titles: entry.titles,
    logline: entry.logline,
    tags,
    characters: entry.characters ?? [],
    posterScene: entry.posterScene ?? '',
  };
}

const catalog = {
  version: 2,
  updatedAt: new Date().toISOString(),
  titles: CATALOG_TITLES.map(normalizeTitle),
};

writeFileSync(path.join(ROOT, 'public/data/catalog.json'), JSON.stringify(catalog, null, 2));
console.log(`catalog.json: ${catalog.titles.length} titles`);