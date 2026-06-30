import { titleName } from '../services/CatalogService.js';
import { getLocale, t } from '../i18n/index.js';
import { el } from './helpers.js';

const LAYOUTS = [
  'poster-layout--bottom-hero',
  'poster-layout--vertical',
  'poster-layout--center',
  'poster-layout--diagonal',
  'poster-layout--top-tag',
  'poster-layout--neon',
  'poster-layout--drama',
  'poster-layout--blockbuster',
];

const GENRE_CLASS = {
  sf: 'poster-title--sf',
  fantasy: 'poster-title--fantasy',
  romance: 'poster-title--romance',
  thriller: 'poster-title--thriller',
  drama: 'poster-title--drama',
  mystery: 'poster-title--mystery',
  action: 'poster-title--action',
};

function hash(id) {
  let n = 0;
  for (const c of id) n = (n * 31 + c.charCodeAt(0)) % 9973;
  return n;
}

export function layoutClassFor(titleId) {
  return LAYOUTS[hash(titleId) % LAYOUTS.length];
}

function secondaryTitle(title, locale) {
  const primary = titleName(title, locale);
  for (const code of ['en', 'ko', 'ja', 'zh-Hans', 'es', 'pt-BR']) {
    if (code === locale) continue;
    const name = title.titles?.[code];
    if (name && name !== primary) return name;
  }
  return '';
}

function tagline(title, locale) {
  return title.logline?.[locale] ?? title.logline?.en ?? '';
}

export function createPosterTitleOverlay(title) {
  const locale = getLocale();
  const primary = titleName(title, locale);
  const secondary = secondaryTitle(title, locale);
  const genreClass = GENRE_CLASS[title.genre] ?? 'poster-title--drama';
  const layout = layoutClassFor(title.id);
  const tag = tagline(title, locale);
  const showTagline = layout === 'poster-layout--drama' && tag.length > 0 && tag.length < 72;

  const wrap = el('div', {
    class: `poster-title ${genreClass} ${layout}`,
    dataset: { titleId: title.id },
  });

  wrap.append(
    el('span', { class: 'poster-title-tag', text: t(`genre.${title.genre}`) }),
    el('div', { class: 'poster-title-rule' }),
    el('span', { class: 'poster-title-primary', text: primary }),
    showTagline ? el('span', { class: 'poster-title-tagline', text: tag }) : null,
    secondary ? el('span', { class: 'poster-title-secondary', text: secondary }) : null,
  );

  return wrap;
}

/** Update all live poster overlays after locale change */
export function refreshPosterOverlays(catalogTitles) {
  const locale = getLocale();
  const byId = new Map(catalogTitles.map((t) => [t.id, t]));

  document.querySelectorAll('.poster-title[data-title-id]').forEach((node) => {
    const title = byId.get(node.dataset.titleId);
    if (!title) return;

    const primary = titleName(title, locale);
    const secondary = secondaryTitle(title, locale);
    const tag = tagline(title, locale);
    const isDrama = node.classList.contains('poster-layout--drama');

    node.querySelector('.poster-title-primary')?.replaceChildren(primary);
    node.querySelector('.poster-title-tag')?.replaceChildren(t(`genre.${title.genre}`));

    const sec = node.querySelector('.poster-title-secondary');
    if (secondary) {
      if (sec) sec.textContent = secondary;
      else node.append(el('span', { class: 'poster-title-secondary', text: secondary }));
    } else {
      sec?.remove();
    }

    const tagEl = node.querySelector('.poster-title-tagline');
    if (isDrama && tag.length > 0 && tag.length < 72) {
      if (tagEl) tagEl.textContent = tag;
      else {
        const secRef = node.querySelector('.poster-title-secondary');
        const taglineEl = el('span', { class: 'poster-title-tagline', text: tag });
        if (secRef) node.insertBefore(taglineEl, secRef);
        else node.append(taglineEl);
      }
    } else {
      tagEl?.remove();
    }
  });

  document.querySelectorAll('.poster-img[data-title-id]').forEach((img) => {
    const title = byId.get(img.dataset.titleId);
    if (title) img.alt = titleName(title, locale);
  });
}