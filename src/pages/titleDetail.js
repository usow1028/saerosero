import { loadCatalog, getTitle, titleName } from '../services/CatalogService.js';
import { toggleMyList, getMyList, getWatchState } from '../services/ProgressService.js';
import { getLocale, t } from '../i18n/index.js';
import { posterStyle } from '../ui/TitleCard.js';
import { el } from '../ui/helpers.js';

export async function renderTitleDetail(container, navigate, titleId) {
  const catalog = await loadCatalog();
  const title = getTitle(catalog, titleId);
  const locale = getLocale();
  if (!title) { navigate('/'); return; }

  const inList = getMyList().includes(titleId);
  const saved = getWatchState(titleId, 1);

  const poster = el('div', { class: 'poster', style: { ...posterStyle(title), width: '100%', maxWidth: '240px' } });
  if (title.id === 'starlight-station') {
    poster.style.backgroundSize = 'cover';
    poster.style.backgroundPosition = 'center';
    poster.style.minHeight = '360px';
  }

  container.replaceChildren(el('div', { class: 'detail-hero' }, [
    poster,
    el('div', {}, [
      el('span', { class: 'chip', text: t(`genre.${title.genre}`) }),
      el('h1', { text: titleName(title, locale), style: 'margin:0.5rem 0;' }),
      el('p', { text: title.logline?.[locale] ?? title.logline?.en ?? '' }),
      el('div', { style: 'display:flex;gap:0.5rem;flex-wrap:wrap;margin-top:1rem;' }, [
        title.status === 'playable'
          ? el('button', {
            class: 'btn btn-primary',
            text: saved ? t('actions.resume') : t('actions.play'),
            onclick: () => navigate(`/watch/${titleId}/1`),
          })
          : el('button', { class: 'btn', text: t('actions.notify'), onclick: () => alert('Coming soon') }),
        el('button', {
          class: 'btn',
          text: inList ? t('actions.removeList') : t('actions.addList'),
          onclick: (e) => { toggleMyList(titleId); e.target.textContent = getMyList().includes(titleId) ? t('actions.removeList') : t('actions.addList'); },
        }),
      ]),
    ]),
  ]));
}