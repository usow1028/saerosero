import { loadCatalog, searchTitles, filterTitles } from '../services/CatalogService.js';
import { sortByRecommendation } from '../services/RecommendationService.js';
import { getLocale, t } from '../i18n/index.js';
import { createTitleCard } from '../ui/TitleCard.js';
import { icon } from '../ui/icons.js';
import { el } from '../ui/helpers.js';

export async function renderSearch(container, navigate, query = '') {
  const catalog = await loadCatalog();
  const locale = getLocale();

  const field = el('div', { class: 'search-field' });
  field.append(icon('search', 'icon search-field-icon'));
  const input = el('input', {
    type: 'search',
    class: 'search-input',
    placeholder: t('search.placeholder'),
    value: query,
  });
  field.append(input);

  const grid = el('div', { class: 'search-grid' });

  function run(q) {
    let items = q ? searchTitles(catalog, q, locale) : [];
    if (!items.length && q) {
      grid.replaceChildren(el('p', { class: 'search-empty', text: t('search.empty') }));
      const suggest = el('section', { class: 'row-section' });
      suggest.append(el('h3', { class: 'search-suggest-title', text: t('search.suggest') }));
      const track = el('div', { class: 'search-grid' });
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
  container.replaceChildren(
    el('div', { class: 'page-header' }, [el('h1', { text: t('nav.search') }), field]),
    grid,
  );
  run(query);
}