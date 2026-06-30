import { loadCatalog, getTitle, titleName } from '../services/CatalogService.js';
import { toggleMyList, getMyList, getWatchState } from '../services/ProgressService.js';
import { getLocale, t } from '../i18n/index.js';
import { createPosterMedia } from '../ui/poster.js';
import { playButton } from '../ui/actions.js';
import { icon } from '../ui/icons.js';
import { el } from '../ui/helpers.js';

export async function renderTitleDetail(container, navigate, titleId) {
  const catalog = await loadCatalog();
  const title = getTitle(catalog, titleId);
  const locale = getLocale();
  if (!title) { navigate('/'); return; }

  const inList = getMyList().includes(titleId);
  const saved = getWatchState(titleId, 1);

  const poster = el('div', { class: 'detail-poster' });
  poster.append(createPosterMedia(title, { animate: false }));

  const listBtn = el('button', { class: 'btn btn-secondary', type: 'button' });
  const syncListBtn = () => {
    const on = getMyList().includes(titleId);
    listBtn.replaceChildren(icon('list', 'icon'), el('span', { text: on ? t('actions.removeList') : t('actions.addList') }));
  };
  syncListBtn();
  listBtn.onclick = () => { toggleMyList(titleId); syncListBtn(); };

  container.replaceChildren(el('div', { class: 'detail-hero' }, [
    poster,
    el('div', { class: 'detail-meta' }, [
      el('span', { class: 'chip', text: t(`genre.${title.genre}`) }),
      el('h1', { text: titleName(title, locale) }),
      el('p', { class: 'detail-logline', text: title.logline?.[locale] ?? title.logline?.en ?? '' }),
      el('div', { class: 'detail-actions' }, [
        title.status === 'playable'
          ? playButton(saved ? t('actions.resume') : t('actions.play'), () => navigate(`/watch/${titleId}/1`))
          : el('button', { class: 'btn btn-secondary', type: 'button', text: t('actions.notify'), onclick: () => {} }),
        listBtn,
      ]),
    ]),
  ]));
}