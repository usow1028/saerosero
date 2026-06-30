import { icon } from './icons.js';
import { el } from './helpers.js';

export function wrapScrollRow(track) {
  const wrap = el('div', { class: 'row-scroll-wrap' });
  const btnL = el('button', { class: 'row-scroll-btn row-scroll-btn--left', type: 'button', 'aria-label': 'Scroll left' });
  const btnR = el('button', { class: 'row-scroll-btn row-scroll-btn--right', type: 'button', 'aria-label': 'Scroll right' });
  btnL.append(icon('chevronL', 'icon icon-sm'));
  btnR.append(icon('chevronR', 'icon icon-sm'));

  const scrollBy = () => Math.max(track.clientWidth * 0.85, 280);
  btnL.onclick = () => { track.scrollBy({ left: -scrollBy(), behavior: 'smooth' }); };
  btnR.onclick = () => { track.scrollBy({ left: scrollBy(), behavior: 'smooth' }); };

  const update = () => {
    const max = track.scrollWidth - track.clientWidth;
    btnL.classList.toggle('is-hidden', track.scrollLeft <= 4);
    btnR.classList.toggle('is-hidden', track.scrollLeft >= max - 4);
  };
  track.addEventListener('scroll', update, { passive: true });
  new ResizeObserver(update).observe(track);
  setTimeout(update, 0);

  wrap.append(btnL, track, btnR);
  return wrap;
}