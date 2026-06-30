import { titleName } from '../services/CatalogService.js';
import { getLocale, t } from '../i18n/index.js';
import { createPosterMedia } from './poster.js';
import { el } from './helpers.js';

export function createTitleCard(title, { onClick, compact = false, showGenre = false } = {}) {
  const locale = getLocale();
  const card = el('article', { class: 'title-card', onclick: onClick });
  const poster = el('div', { class: 'poster' });
  poster.append(createPosterMedia(title));

  if (showGenre) {
    poster.append(el('span', { class: 'chip poster-badge', text: t(`genre.${title.genre}`) }));
  }

  if (title.status === 'coming_soon') {
    poster.append(el('div', { class: 'poster-lock', text: t(`status.${title.status}`) }));
  } else if (title.status === 'development') {
    poster.append(el('div', { class: 'poster-lock poster-lock--dev', text: t(`status.${title.status}`) }));
  }

  card.append(poster);
  if (!compact) {
    card.append(el('h3', { class: 'title-card-caption', text: titleName(title, locale) }));
  }
  return card;
}