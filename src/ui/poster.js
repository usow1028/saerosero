import aiPosters from '../data/ai-posters.json';

const jpgIds = new Set(aiPosters.jpgIds ?? []);

export function posterUrl(titleId, { preferJpg = true } = {}) {
  if (preferJpg && jpgIds?.has(titleId)) {
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
  img.alt = '';
  img.loading = 'lazy';
  img.decoding = 'async';
  if (title.heroFocus) {
    img.style.objectPosition = title.heroFocus;
  }

  img.src = posterUrl(title.id);
  img.addEventListener('error', () => {
    if (img.src.endsWith('.jpg')) img.src = posterUrl(title.id, { preferJpg: false });
  }, { once: true });

  frame.append(img);

  if (animate) {
    frame.addEventListener('mouseenter', () => frame.classList.add('is-animating'));
    frame.addEventListener('mouseleave', () => frame.classList.remove('is-animating'));
  }

  return frame;
}