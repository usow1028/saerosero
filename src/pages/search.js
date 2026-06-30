import { loadCatalog, searchTitles, titleName, filterTitles } from '../services/CatalogService.js';
import { sortByRecommendation } from '../services/RecommendationService.js';
import { getLocale, t } from '../i18n/index.js';
import { createTitleCard } from '../ui/TitleCard.js';
import { el } from '../ui/helpers.js';

export async function renderSearch(container, navigate, query = '') {
  const catalog = await loadCatalog();
  const locale = getLocale();
  const input = el('input', {
    type: 'search',
    placeholder: t('search.placeholder'),
    value: query,
    style: 'width:100%;max-width:480px;padding:0.75rem 1rem;border-radius:12px;border:1px solid var(--border);background:var(--bg-elevated);margin:1rem;',
  });
  const grid = el('div', { class: 'search-grid' });

  function run(q) {
    let items = q ? searchTitles(catalog, q, locale) : [];
    if (!items.length && q) {
      grid.replaceChildren(el('p', { text: t('search.empty'), style: 'padding:1rem;' }));
      const suggest = el('section', { class: 'row-section' });
      suggest.append(el('h3', { text: t('search.suggest'), style: 'padding:0 1rem;' }));
      const track = el('div', { class: 'row-track' });
      sortByRecommendation(filterTitles(catalog, {}), locale).slice(0, 8).forEach((item) => {
        track.append(createTitleCard(item, { onClick: () => navigate(`/title/${item.id}`) }));
      });
      suggest.append(track);
      grid.append(suggest);
      return;
    }
    if (!q) items = sortByRecommendation(catalog.titles, locale).slice(0, 12);
    grid.replaceChildren(...items.map((item) => createTitleCard(item, { onClick: () => navigate(`/title/${item.id}`) })));
  }

  input.oninput = () => run(input.value);
  container.replaceChildren(el('div', { style: 'padding:0 1.5rem;' }, [input]), grid);
  run(query);
}