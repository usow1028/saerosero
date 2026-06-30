import { titleName } from '../services/CatalogService.js';
import { getLocale, t } from '../i18n/index.js';
import { el } from './helpers.js';

export function posterStyle(title) {
  if (title.id === 'starlight-station') {
    return { backgroundImage: 'url(/assets/posters/starlight-station.jpg)' };
  }
  return { '--hue': title.hue ?? 200 };
}

export function createTitleCard(title, { onClick, compact = false } = {}) {
  const locale = getLocale();
  const card = el('article', { class: 'title-card', onclick: onClick });
  card.onmouseenter = () => poster.classList.add('poster-preview');
  card.onmouseleave = () => poster.classList.remove('poster-preview');
  const poster = el('div', { class: 'poster', style: posterStyle(title) });

  if (title.id === 'starlight-station') {
    poster.style.backgroundSize = 'cover';
    poster.style.backgroundPosition = 'center';
  }

  poster.append(el('span', { class: 'chip poster-badge', text: t(`genre.${title.genre}`) }));

  if (title.status !== 'playable') {
    poster.append(el('div', { class: 'poster-lock', text: t(`status.${title.status}`) }));
  }

  card.append(poster);
  if (!compact) card.append(el('h3', { text: titleName(title, locale) }));
  return card;
}