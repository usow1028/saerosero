import aiPosters from '../data/ai-posters.json';
import { titleName } from '../services/CatalogService.js';
import { getLocale, t } from '../i18n/index.js';
import { el } from './helpers.js';

const jpgIds = new Set(aiPosters.jpgIds ?? []);
const activeVariant = aiPosters.activeVariant ?? 'v3';

const GENRE_CLASS = {
  sf: 'poster-title--sf',
  fantasy: 'poster-title--fantasy',
  romance: 'poster-title--romance',
  thriller: 'poster-title--thriller',
  drama: 'poster-title--drama',
  mystery: 'poster-title--mystery',
  action: 'poster-title--action',
};

export function posterVariant() {
  return activeVariant;
}

export function posterUrl(titleId, { preferJpg = true, variant = activeVariant } = {}) {
  if (preferJpg && jpgIds?.has(titleId)) {
    return `/assets/posters/${variant}/${titleId}.jpg`;
  }
  return `/assets/posters/${titleId}.svg`;
}

export function heroPosterUrl(titleId) {
  return posterUrl(titleId);
}

function secondaryTitle(title, locale) {
  const primary = titleName(title, locale);
  const en = title.titles?.en ?? '';
  const ko = title.titles?.ko ?? '';
  if (locale === 'ko') return en;
  if (locale === 'en') return ko;
  return en !== primary ? en : ko;
}

function createPosterTitleOverlay(title, { show = true } = {}) {
  if (!show) return null;
  const locale = getLocale();
  const primary = titleName(title, locale);
  const secondary = secondaryTitle(title, locale);
  const genreClass = GENRE_CLASS[title.genre] ?? 'poster-title--drama';

  const wrap = el('div', { class: `poster-title ${genreClass}` });
  wrap.append(
    el('span', { class: 'poster-title-tag', text: t(`genre.${title.genre}`) }),
    el('div', { class: 'poster-title-rule' }),
    el('span', { class: 'poster-title-primary', text: primary }),
    secondary ? el('span', { class: 'poster-title-secondary', text: secondary }) : null,
  );
  return wrap;
}

export function createPosterMedia(title, { animate = true, titleOverlay = null } = {}) {
  const frame = document.createElement('div');
  frame.className = 'poster-frame';

  const img = document.createElement('img');
  img.className = 'poster-img';
  img.alt = titleName(title, getLocale());
  img.loading = 'lazy';
  img.decoding = 'async';
  if (title.heroFocus) {
    img.style.objectPosition = title.heroFocus;
  }

  const isJpg = jpgIds.has(title.id);
  const overlay = titleOverlay ?? !isJpg;

  img.src = posterUrl(title.id);
  img.addEventListener('error', () => {
    if (img.src.includes('.jpg')) {
      const variants = ['v3', 'v2', 'v1'];
      const current = variants.find((v) => img.src.includes(`/${v}/`));
      const fallbackVariant = current ? variants[variants.indexOf(current) + 1] : null;
      if (fallbackVariant && jpgIds.has(title.id)) {
        img.src = posterUrl(title.id, { variant: fallbackVariant });
        return;
      }
      img.src = posterUrl(title.id, { preferJpg: false });
      const fallbackTitle = createPosterTitleOverlay(title, { show: true });
      if (fallbackTitle) frame.append(fallbackTitle);
    }
  }, { once: true });

  frame.append(img);

  if (overlay) {
    const titleEl = createPosterTitleOverlay(title);
    if (titleEl) frame.append(titleEl);
  }

  if (animate) {
    frame.addEventListener('mouseenter', () => frame.classList.add('is-animating'));
    frame.addEventListener('mouseleave', () => frame.classList.remove('is-animating'));
  }

  return frame;
}