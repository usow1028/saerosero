import { loadCatalog, titleName } from '../services/CatalogService.js';
import { buildHomeRows } from '../services/RecommendationService.js';
import { getLocale, t } from '../i18n/index.js';
import { createTitleCard } from '../ui/TitleCard.js';
import { wrapScrollRow } from '../ui/ScrollRow.js';
import { playButton, infoButton } from '../ui/actions.js';
import { heroPosterUrl, posterUrl } from '../ui/poster.js';
import { el } from '../ui/helpers.js';

export async function renderHome(container, navigate) {
  const catalog = await loadCatalog();
  const locale = getLocale();
  const rows = buildHomeRows(catalog, locale);
  const heroTitle = rows.find((r) => r.id === 'hero')?.items[0];

  container.replaceChildren();

  if (heroTitle) {
    const hero = el('section', { class: 'hero' });
    const media = el('div', { class: 'hero-media' });
    const img = el('img', { class: 'hero-img', src: heroPosterUrl(heroTitle.id), alt: '' });
    img.addEventListener('error', () => {
      if (img.src.endsWith('.jpg')) img.src = posterUrl(heroTitle.id, { preferJpg: false });
    }, { once: true });
    media.append(img);
    hero.append(media, el('div', { class: 'hero-overlay' }));
    hero.append(el('div', { class: 'hero-content' }, [
      el('span', { class: 'chip chip-hero', text: t(`genre.${heroTitle.genre}`) }),
      el('h1', { text: titleName(heroTitle, locale) }),
      el('p', { text: heroTitle.logline?.[locale] ?? heroTitle.logline?.en ?? '' }),
      el('div', { class: 'hero-actions' }, [
        playButton(t('actions.play'), () => navigate(`/watch/${heroTitle.id}/1`)),
        infoButton(t('actions.info'), () => navigate(`/title/${heroTitle.id}`)),
      ]),
    ]));
    container.append(hero);
  }

  for (const row of rows.filter((r) => r.id !== 'hero')) {
    const section = el('section', { class: 'row-section' });
    section.append(el('div', { class: 'row-head' }, [
      el('h2', { text: t(row.labelKey) }),
    ]));
    const track = el('div', { class: 'row-track' });
    for (const item of row.items) {
      track.append(createTitleCard(item, { onClick: () => navigate(`/title/${item.id}`) }));
    }
    section.append(wrapScrollRow(track));
    container.append(section);
  }
}