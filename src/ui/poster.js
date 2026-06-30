import aiPosters from '../data/ai-posters.json';
import { titleName } from '../services/CatalogService.js';
import { getLocale } from '../i18n/index.js';

const jpgIds = new Set(aiPosters.jpgIds ?? []);
const locales = aiPosters.locales ?? ['ko', 'en', 'ja', 'zh-Hans', 'es', 'pt-BR'];
const titleArtEnabled = aiPosters.titleArt !== false;

export function artPosterUrl(titleId) {
  if (jpgIds.has(titleId)) {
    return `/assets/posters/raw/${titleId}.jpg`;
  }
  return `/assets/posters/${titleId}.svg`;
}

export function titleArtUrl(titleId, locale = getLocale()) {
  return `/assets/posters/titles/${locale}/${titleId}.png`;
}

export function posterUrl(titleId) {
  return artPosterUrl(titleId);
}

export function heroPosterUrl(titleId) {
  return artPosterUrl(titleId);
}

export function createPosterMedia(title, { animate = true } = {}) {
  const locale = getLocale();
  const frame = document.createElement('div');
  frame.className = 'poster-frame';
  frame.dataset.titleId = title.id;

  const art = document.createElement('img');
  art.className = 'poster-img poster-img--art';
  art.dataset.titleId = title.id;
  art.alt = titleName(title, locale);
  art.loading = 'lazy';
  art.decoding = 'async';
  if (title.heroFocus) art.style.objectPosition = title.heroFocus;

  art.src = artPosterUrl(title.id);
  art.addEventListener('error', () => {
    if (art.src.includes('/raw/')) {
      art.src = `/assets/posters/v4/${title.id}.jpg`;
    } else if (art.src.endsWith('.jpg')) {
      art.src = `/assets/posters/${title.id}.svg`;
    }
  });

  frame.append(art);

  if (titleArtEnabled) {
    const titleLayer = document.createElement('img');
    titleLayer.className = 'poster-title-art';
    titleLayer.alt = '';
    titleLayer.loading = 'lazy';
    titleLayer.decoding = 'async';
    titleLayer.draggable = false;

    const fallbackChain = [locale, 'en', 'ko', ...locales.filter((l) => l !== locale && l !== 'en' && l !== 'ko')];
    let fallIdx = 0;
    const setTitleSrc = (loc) => { titleLayer.src = titleArtUrl(title.id, loc); };

    titleLayer.addEventListener('error', () => {
      fallIdx += 1;
      if (fallIdx < fallbackChain.length) setTitleSrc(fallbackChain[fallIdx]);
      else titleLayer.remove();
    });

    setTitleSrc(fallbackChain[0]);
    frame.append(titleLayer);
  }

  if (animate) {
    frame.addEventListener('mouseenter', () => frame.classList.add('is-animating'));
    frame.addEventListener('mouseleave', () => frame.classList.remove('is-animating'));
  }

  return frame;
}