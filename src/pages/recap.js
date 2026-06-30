import { loadCatalog, getTitle, titleName } from '../services/CatalogService.js';
import { getLocale, t } from '../i18n/index.js';
import { el } from '../ui/helpers.js';

export async function renderRecap(container, navigate, titleId, episode, routeState = {}) {
  const catalog = await loadCatalog();
  const title = getTitle(catalog, titleId);
  const locale = getLocale();
  const saved = routeState.state ?? history.state?.state;
  const branchKeys = saved?.state?.branchKeys ?? {};

  const nodes = Object.entries(branchKeys).map(([k, v]) => el('span', { class: 'path-node active', text: `${k}: ${v}` }));

  container.replaceChildren(el('div', { class: 'recap-page' }, [
    el('h1', { text: t('recap.title') }),
    el('p', { text: titleName(title, locale) }),
    el('h2', { text: t('recap.path') }),
    el('div', { class: 'path-tree' }, nodes.length ? nodes : [el('span', { class: 'path-node', text: '—' })]),
    el('div', { style: 'display:flex;gap:0.5rem;flex-wrap:wrap;margin-top:2rem;' }, [
      el('button', { class: 'btn btn-primary', text: t('recap.next'), onclick: () => alert('Episode 2 — Coming Soon') }),
      el('button', { class: 'btn', text: t('recap.home'), onclick: () => navigate('/') }),
    ]),
  ]));
}