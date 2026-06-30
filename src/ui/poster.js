/** Titles with Grok Image (or other AI) raster posters — prefer .jpg over .svg */
export const AI_POSTER_IDS = new Set([
  'starlight-station',
  'moonlit-harbor',
  'quantum-letters',
  'title-001',
  'title-002',
  'title-003',
  'title-004',
  'title-005',
]);

export function posterUrl(titleId) {
  if (AI_POSTER_IDS.has(titleId)) {
    return `/assets/posters/${titleId}.jpg`;
  }
  return `/assets/posters/${titleId}.svg`;
}

/** Hero uses wide crop of the same asset — stable focal point independent of card crop */
export function heroPosterUrl(titleId) {
  return posterUrl(titleId);
}

export function createPosterMedia(title, { animate = true } = {}) {
  const frame = document.createElement('div');
  frame.className = 'poster-frame';

  const img = document.createElement('img');
  img.className = 'poster-img';
  img.src = posterUrl(title.id);
  img.alt = '';
  img.loading = 'lazy';
  img.decoding = 'async';
  if (title.heroFocus) {
    img.style.objectPosition = title.heroFocus;
  }
  frame.append(img);

  if (animate) {
    frame.addEventListener('mouseenter', () => frame.classList.add('is-animating'));
    frame.addEventListener('mouseleave', () => frame.classList.remove('is-animating'));
  }

  return frame;
}