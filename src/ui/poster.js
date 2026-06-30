export function posterUrl(titleId) {
  if (titleId === 'starlight-station') return '/assets/posters/starlight-station.jpg';
  return `/assets/posters/${titleId}.svg`;
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
  frame.append(img);

  if (animate) {
    frame.addEventListener('mouseenter', () => frame.classList.add('is-animating'));
    frame.addEventListener('mouseleave', () => frame.classList.remove('is-animating'));
  }

  return frame;
}