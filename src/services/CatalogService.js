let cache = null;

export async function loadCatalog() {
  if (cache) return cache;
  const res = await fetch('/data/catalog.json');
  cache = await res.json();
  return cache;
}

export function getTitle(catalog, id) {
  return catalog.titles.find((t) => t.id === id) ?? null;
}

export function titleName(title, locale) {
  return title.titles[locale] ?? title.titles.en ?? title.titles.ko;
}

export function searchTitles(catalog, query, locale) {
  const q = query.trim().toLowerCase();
  if (!q) return [];
  return catalog.titles.filter((t) => {
    const fields = [
      titleName(t, locale),
      t.logline?.[locale],
      t.logline?.en,
      ...(t.tags ?? []),
      ...(t.characters ?? []),
      t.genre,
    ].filter(Boolean).join(' ').toLowerCase();
    return fields.includes(q) || fields.split(/\s+/).some((w) => w.startsWith(q));
  });
}

export function filterTitles(catalog, filters) {
  return catalog.titles.filter((t) => {
    if (filters.genre && t.genre !== filters.genre) return false;
    if (filters.age && t.age !== filters.age) return false;
    if (filters.status && t.status !== filters.status) return false;
    if (filters.interactive && !t.interactive) return false;
    return true;
  });
}