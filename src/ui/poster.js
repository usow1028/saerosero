import aiPosters from '../data/ai-posters.json';
import { titleName } from '../services/CatalogService.js';
import { getLocale } from '../i18n/index.js';
import { createPosterTitleOverlay } from './PosterTitleOverlay.js';

const jpgIds = new Set(aiPosters.jpgIds ?? []);
const dynamicTitles = aiPosters.dynamicTitles !== false;
const artSource = aiPosters.artSource ?? 'raw';
const bakedVariant = aiPosters.activeVariant ?? 'v4';

export function posterVariant() {
  return dynamicTitles ? 'dynamic' : bakedVariant;
}

/** Text-free art layer — locale can change via CSS overlay */
export function artPosterUrl(titleId) {
  if (jpgIds.has(titleId)) {
    return `/assets/posters/${artSource}/${titleId}.jpg`;
  }
  return `/assets/posters/${titleId}.svg`;
}

export function posterUrl(titleId, { preferJpg = true, variant } = {}) {
  if (dynamicTitles) return artPosterUrl(titleId);
  const v = variant ?? bakedVariant;
  if (preferJpg && jpgIds?.has(titleId)) {
    return `/assets/posters/${v}/${titleId}.jpg`;
  }
  return `/assets/posters/${titleId}.svg`;
}

export function heroPosterUrl(titleId) {
  return posterUrl(titleId);
}

export function createPosterMedia(title, { animate = true } = {}) {
  const frame = document.createElement('div');
  frame.className = 'poster-frame';
  frame.dataset.titleId = title.id;

  const img = document.createElement('img');
  img.className = 'poster-img';
  img.dataset.titleId = title.id;
  img.alt = titleName(title, getLocale());
  img.loading = 'lazy';
  img.decoding = 'async';
  if (title.heroFocus) {
    img.style.objectPosition = title.heroFocus;
  }

  img.src = posterUrl(title.id);
  img.addEventListener('error', () => {
    if (img.src.includes('/raw/')) {
      img.src = `/assets/posters/v4/${title.id}.jpg`;
      return;
    }
    if (img.src.includes('.jpg')) {
      img.src = `/assets/posters/${title.id}.svg`;
    }
  });

  frame.append(img);

  if (dynamicTitles) {
    frame.append(createPosterTitleOverlay(title));
  }

  if (animate) {
    frame.addEventListener('mouseenter', () => frame.classList.add('is-animating'));
    frame.addEventListener('mouseleave', () => frame.classList.remove('is-animating'));
  }

  return frame;
}