import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const catalog = JSON.parse(readFileSync(path.join(path.dirname(fileURLToPath(import.meta.url)), '../public/data/catalog.json'), 'utf8'));

describe('catalog', () => {
  it('has 50+ titles', () => {
    expect(catalog.titles.length).toBeGreaterThanOrEqual(50);
  });
  it('has playable starlight-station', () => {
    const t = catalog.titles.find((x) => x.id === 'starlight-station');
    expect(t?.status).toBe('playable');
  });
});