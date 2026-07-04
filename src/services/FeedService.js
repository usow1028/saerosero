/** goal-deliverable: studio-guild */
import { scoreTitle } from './RecommendationService.js';
import { getTaste } from './ProgressService.js';
import { getFeedSignals, getLikes } from './EngagementService.js';
import { listGuildFeedTitles } from './guild/GuildArtifactService.js';

const BATCH_SIZE = 8;
const GUILD_BOOST = 35;

function engagementBoost(titleId, signals, likes) {
  let boost = 0;
  const views = signals.views[titleId] ?? 0;
  const skips = signals.skips[titleId] ?? 0;
  const dwell = signals.dwell[titleId] ?? 0;

  if (likes[titleId]) boost += 40;
  if (views > 0 && skips / views < 0.3) boost += 25;
  if (dwell > 8000) boost += 20;
  if (skips > views) boost -= 30;
  return boost;
}

function weightedShuffle(items, seed) {
  let s = seed;
  return [...items]
    .map((item) => {
      s = (s * 1103515245 + 12345) & 0x7fffffff;
      const jitter = (s % 1000) / 1000;
      return { item, sort: item._score + jitter * 12 };
    })
    .sort((a, b) => b.sort - a.sort)
    .map((x) => x.item);
}

export function scoreForFeed(title, locale) {
  const taste = getTaste();
  const signals = getFeedSignals();
  const likes = getLikes();
  const base = scoreTitle(title, locale, taste);
  const boost = engagementBoost(title.id, signals, likes);
  return base + boost;
}

export function buildFeedBatch(catalog, locale, { seen = new Set(), cursor = 0 } = {}) {
  const taste = getTaste();
  const signals = getFeedSignals();
  const likes = getLikes();
  const guildTitles = listGuildFeedTitles(catalog, locale);
  const guildById = new Map(guildTitles.map((title) => [title.id, title]));

  const catalogPool = catalog.titles
    .filter((title) => !guildById.has(title.id))
    .map((title) => ({
      title,
      _score: scoreTitle(title, locale, taste) + engagementBoost(title.id, signals, likes),
    }));

  const guildPool = guildTitles.map((title) => ({
    title,
    _score: scoreTitle(title, locale, taste)
      + engagementBoost(title.id, signals, likes)
      + GUILD_BOOST,
  }));

  const pool = [...guildPool, ...catalogPool];

  const unseen = pool.filter((x) => !seen.has(x.title.id));
  const source = unseen.length ? unseen : pool;
  const ranked = weightedShuffle(source, cursor + Date.now());
  const batch = ranked.slice(0, BATCH_SIZE).map((x) => x.title);

  return {
    items: batch,
    nextCursor: cursor + 1,
    seen: new Set([...seen, ...batch.map((t) => t.id)]),
  };
}