import { loadCatalog, titleName } from '../services/CatalogService.js';
import { buildHomeRows } from '../services/RecommendationService.js';
import { getLocale, t } from '../i18n/index.js';
import { createTitleCard } from '../ui/TitleCard.js';
import { el } from '../ui/helpers.js';

export async function renderHome(container, navigate) {
  const catalog = await loadCatalog();
  const locale = getLocale();
  const rows = buildHomeRows(catalog, locale);
  const heroTitle = rows.find((r) => r.id === 'hero')?.items[0];

  container.replaceChildren();

  if (heroTitle) {
    const hero = el('section', { class: 'hero' });
    const bg = el('div', { class: 'hero-bg' });
    if (heroTitle.id === 'starlight-station') {
      bg.style.backgroundImage = 'url(/assets/posters/starlight-station.jpg)';
    } else {
      bg.style.background = `linear-gradient(135deg, hsl(${heroTitle.hue} 40% 18%), hsl(${heroTitle.hue} 50% 32%))`;
    }
    hero.append(bg, el('div', { class: 'hero-overlay' }));
    hero.append(el('div', { class: 'hero-content' }, [
      el('span', { class: 'chip', text: t(`genre.${heroTitle.genre}`) }),
      el('h1', { text: titleName(heroTitle, locale) }),
      el('p', { text: heroTitle.logline?.[locale] ?? heroTitle.logline?.en ?? '' }),
      el('div', { class: 'hero-actions' }, [
        el('button', { class: 'btn btn-primary', text: `▶ ${t('actions.play')}`, onclick: () => navigate(`/watch/${heroTitle.id}/1`) }),
        el('button', { class: 'btn', text: t('actions.info'), onclick: () => navigate(`/title/${heroTitle.id}`) }),
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
    section.append(track);
    container.append(section);
  }
}