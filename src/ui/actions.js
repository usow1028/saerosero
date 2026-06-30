import { icon } from './icons.js';
import { el } from './helpers.js';

export function playButton(label, onClick) {
  const btn = el('button', { class: 'btn btn-primary', type: 'button', onclick: onClick });
  btn.append(icon('play', 'icon icon-play'), el('span', { text: label }));
  return btn;
}

export function infoButton(label, onClick) {
  const btn = el('button', { class: 'btn btn-secondary', type: 'button', onclick: onClick });
  btn.append(icon('info', 'icon'), el('span', { text: label }));
  return btn;
}