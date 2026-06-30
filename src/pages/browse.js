import { loadCatalog, filterTitles, titleName } from '../services/CatalogService.js';
import { getLocale, t } from '../i18n/index.js';
import { createTitleCard } from '../ui/TitleCard.js';
import { wrapScrollRow } from '../ui/ScrollRow.js';
import { el } from '../ui/helpers.js';

export async function renderBrowse(container, navigate) {
  const catalog = await loadCatalog();
  const locale = getLocale();
  let filters = { genre: '', age: '', status: '' };

  const track = el('div', { class: 'row-track' });

  function refresh() {
    let items = filterTitles(catalog, {
      genre: filters.genre || undefined,
      age: filters.age || undefined,
      status: filters.status || undefined,
    });
    if (filters.sort === 'title') items.sort((a, b) => titleName(a, locale).localeCompare(titleName(b, locale)));
    track.replaceChildren(...items.map((item) => createTitleCard(item, { onClick: () => navigate(`/title/${item.id}`) })));
  }

  const bar = el('div', { class: 'browse-bar' }, [
    el('h2', { text: t('browse.title') }),
    mkSelect(t('browse.filterGenre'), [
      ['', '—'], ['sf', t('genre.sf')], ['fantasy', t('genre.fantasy')], ['romance', t('genre.romance')],
      ['thriller', t('genre.thriller')], ['drama', t('genre.drama')], ['mystery', t('genre.mystery')], ['action', t('genre.action')],
    ], (v) => { filters.genre = v; refresh(); }),
    mkSelect(t('browse.filterAge'), [['', '—'], ['all', 'ALL'], ['12', '12+'], ['15', '15+'], ['19', '19+']], (v) => { filters.age = v; refresh(); }),
    mkSelect(t('browse.filterStatus'), [
      ['', '—'], ['playable', t('status.playable')], ['development', t('status.development')], ['coming_soon', t('status.coming_soon')],
    ], (v) => { filters.status = v; refresh(); }),
    mkSelect(t('browse.sort'), [['rec', t('browse.sortRec')], ['title', t('browse.sortTitle')]], (v) => { filters.sort = v; refresh(); }),
  ]);

  container.replaceChildren(bar, wrapScrollRow(track));
  refresh();
}

function mkSelect(label, pairs, onChange) {
  const sel = el('select');
  for (const [val, text] of pairs) sel.append(el('option', { value: val, text }));
  sel.onchange = () => onChange(sel.value);
  return el('label', {}, [document.createTextNode(`${label} `), sel]);
}