import { titleName } from './CatalogService.js';
import { getTaste, getContinueWatching, getMyList } from './ProgressService.js';

export function scoreTitle(title, locale, taste) {
  let score = title.featured ? 50 : 0;
  if (title.status === 'playable') score += 100;
  if (title.status === 'development') score += 30;
  score += (taste.genres[title.genre] ?? 0) * 8;
  if (title.interactive) score += 15;
  return score;
}

export function sortByRecommendation(titles, locale) {
  const taste = getTaste();
  return [...titles].sort((a, b) => scoreTitle(b, locale, taste) - scoreTitle(a, locale, taste));
}

export function buildHomeRows(catalog, locale) {
  const all = catalog.titles;
  const sorted = sortByRecommendation(all, locale);
  const continueIds = new Set(getContinueWatching().map((c) => c.titleId));
  const myList = new Set(getMyList());

  return [
    { id: 'hero', type: 'hero', items: sorted.filter((t) => t.featured).slice(0, 3) },
    { id: 'continue', type: 'row', labelKey: 'home.continue', items: all.filter((t) => continueIds.has(t.id)) },
    { id: 'interactive', type: 'row', labelKey: 'home.interactive', items: all.filter((t) => t.interactive && t.status === 'playable') },
    { id: 'trending', type: 'row', labelKey: 'home.trending', items: sorted.slice(0, 12) },
    { id: 'new', type: 'row', labelKey: 'home.new', items: all.filter((t) => t.status === 'coming_soon').slice(0, 15) },
    { id: 'mylist', type: 'row', labelKey: 'home.mylist', items: all.filter((t) => myList.has(t.id)) },
    ...['sf', 'fantasy', 'romance', 'thriller'].map((g) => ({
      id: `genre-${g}`,
      type: 'row',
      labelKey: `genre.${g}`,
      items: all.filter((t) => t.genre === g).slice(0, 12),
    })),
  ].filter((row) => row.type === 'hero' || row.items.length > 0);
}