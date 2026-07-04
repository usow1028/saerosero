import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildFeedBatch } from '../src/services/FeedService.js';
import { scoreTitle } from '../src/services/RecommendationService.js';

const catalog = JSON.parse(readFileSync(path.join(path.dirname(fileURLToPath(import.meta.url)), '../public/data/catalog.json'), 'utf8'));

describe('FeedService', () => {
  it('returns batches for infinite scroll', () => {
    const first = buildFeedBatch(catalog, 'ko', { seen: new Set(), cursor: 0 });
    expect(first.items.length).toBeGreaterThan(0);
    const second = buildFeedBatch(catalog, 'ko', { seen: first.seen, cursor: first.nextCursor });
    expect(second.items.length).toBeGreaterThan(0);
  });

  it('prioritizes playable titles in scoring', () => {
    const playable = catalog.titles.find((t) => t.status === 'playable');
    const coming = catalog.titles.find((t) => t.status === 'coming_soon');
    const taste = { genres: {}, branches: {} };
    expect(scoreTitle(playable, 'ko', taste)).toBeGreaterThan(scoreTitle(coming, 'ko', taste));
  });
});