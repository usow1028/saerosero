import { startRouter, navigate as nav, route } from './router.js';
import { getSettings, applyTheme, patchSettings } from './services/SettingsService.js';
import { setLocale } from './i18n/index.js';
import { createNav } from './ui/Nav.js';
import { createBrandLogo } from './ui/BrandLogo.js';
import { el } from './ui/helpers.js';
import { renderHome } from './pages/home.js';
import { renderBrowse } from './pages/browse.js';
import { renderSearch } from './pages/search.js';
import { renderTitleDetail } from './pages/titleDetail.js';
import { renderProfiles } from './pages/profiles.js';
import { renderSettings } from './pages/settings.js';
import { renderPlayer } from './pages/playerPage.js';
import { renderRecap } from './pages/recap.js';
import { loadCatalog, filterTitles, titleName } from './services/CatalogService.js';
import { getMyList } from './services/ProgressService.js';
import { getLocale, t } from './i18n/index.js';
import { createTitleCard } from './ui/TitleCard.js';

const root = document.getElementById('root');
let splashDone = false;

function init() {
  const settings = getSettings();
  applyTheme(settings.theme);
  setLocale(settings.locale);
  showSplash(() => {
    splashDone = true;
    boot();
  });
}

function showSplash(done) {
  const splash = el('div', { class: 'splash' });
  splash.append(el('div', { class: 'splash-inner' }, [
    createBrandLogo({ className: 'logo logo--splash' }),
    el('p', { class: 'splash-tagline', text: t('brand.tagline') }),
  ]));
  const end = () => { splash.remove(); done(); };
  splash.onclick = end;
  root.append(splash);
  setTimeout(end, 2000);
}

function boot() {
  const shell = el('div', { class: 'app-shell' });
  const navSlot = el('div');
  const page = el('main', { class: 'page' });
  shell.append(navSlot, page);
  root.append(shell);

  const go = (path, state = {}) => nav(path, state);

  async function render(path, routeState = {}) {
    const isPlayer = path.startsWith('/watch/');
    navSlot.replaceChildren(isPlayer ? el('div') : createNav(path.split('/')[1] ? `/${path.split('/')[1]}` : '/', go));

    if (path === '/' || path === '') return renderHome(page, go);
    if (path === '/browse') return renderBrowse(page, go);
    if (path === '/search') return renderSearch(page, go);
    if (path === '/profiles') return renderProfiles(page, go);
    if (path === '/settings') return renderSettings(page, go);
    if (path === '/mylist') return renderMyList(page, go);
    if (path.startsWith('/title/')) return renderTitleDetail(page, go, path.split('/')[2]);
    if (path.startsWith('/watch/')) {
      const [, , id, ep] = path.split('/');
      return renderPlayer(page, go, id, Number(ep) || 1);
    }
    if (path.startsWith('/recap/')) {
      const [, , id, ep] = path.split('/');
      return renderRecap(page, go, id, Number(ep) || 1, routeState);
    }
    return go('/');
  }

  route('/', () => render('/'));
  route('/browse', () => render('/browse'));
  route('/search', () => render('/search'));
  route('/profiles', () => render('/profiles'));
  route('/settings', () => render('/settings'));
  route('/mylist', () => render('/mylist'));
  route('/title/:id', ({ params }) => render(`/title/${params.id}`));
  route('/watch/:id/:ep', ({ params }) => render(`/watch/${params.id}/${params.ep}`));
  route('/recap/:id/:ep', ({ params, state }) => render(`/recap/${params.id}/${params.ep}`, state));

  startRouter(render);
}

async function renderMyList(container, navigate) {
  const catalog = await loadCatalog();
  const ids = new Set(getMyList());
  const items = catalog.titles.filter((t) => ids.has(t.id));
  const grid = el('div', { class: 'search-grid' });
  grid.replaceChildren(...items.map((item) => createTitleCard(item, { onClick: () => navigate(`/title/${item.id}`) })));
  container.replaceChildren(el('h1', { text: t('nav.mylist'), style: 'padding:1.5rem;' }), grid);
}

init();