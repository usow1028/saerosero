import { t } from '../i18n/index.js';
import { el } from './helpers.js';

export function createBrandLogo({ className = 'logo', asLink = false, onClick } = {}) {
  const node = el(asLink ? 'a' : 'div', { class: className });
  if (asLink) {
    node.href = '#/';
    node.onclick = (e) => { e.preventDefault(); onClick?.(); };
  }
  node.append(
    el('span', { class: 'logo-saero', text: t('brand.part1') }),
    el('span', { class: 'logo-sero', text: t('brand.part2') }),
  );
  return node;
}