/** goal-deliverable: studio-guild */
import { titleName } from '../services/CatalogService.js';
import { getLocale, t } from '../i18n/index.js';
import { artPosterUrl } from './poster.js';
import { icon } from './icons.js';
import { el } from './helpers.js';
import { recordFeedView, recordFeedSkip } from '../services/EngagementService.js';
import { resolveActiveIndex } from './feedActive.js';

export function createVerticalFeed({ onNeedMore, onStudio, onSettings, onIndexChange }) {
  const state = {
    items: [],
    activeIndex: 0,
    viewStart: Date.now(),
    observer: null,
    slides: new Map(),
  };

  const root = el('div', { class: 'vertical-feed' });
  const viewport = el('div', { class: 'vertical-feed__viewport' });
  const track = el('div', { class: 'vertical-feed__track' });
  viewport.append(track);
  root.append(viewport);

  function setActive(index, { recordEngagement = true } = {}) {
    if (index < 0 || index >= state.items.length) return;
    const prev = state.activeIndex;
    if (prev !== index) {
      if (recordEngagement) {
        const prevTitle = state.items[prev];
        const dwell = Date.now() - state.viewStart;
        if (prevTitle) {
          if (dwell < 1200) recordFeedSkip(prevTitle.id);
          else recordFeedView(prevTitle.id, dwell);
        }
      }
      state.activeIndex = index;
      state.viewStart = Date.now();
      onIndexChange?.(state.items[index], index);

      for (const [i, slide] of state.slides) {
        slide.classList.toggle('is-active', i === index);
      }

      if (state.items.length - index <= 3) onNeedMore?.();
    }
  }

  function syncActiveFromDom() {
    const idx = resolveActiveIndex(track, state.items.length, state.activeIndex);
    if (idx !== state.activeIndex) setActive(idx);
    return idx;
  }

  function getActiveTitle() {
    syncActiveFromDom();
    return state.items[state.activeIndex] ?? null;
  }

  function bindObserver() {
    state.observer?.disconnect();
    state.observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (!entry.isIntersecting || entry.intersectionRatio < 0.6) continue;
          const idx = Number(entry.target.dataset.index);
          if (!Number.isNaN(idx)) setActive(idx);
        }
      },
      { root: track, threshold: [0.6, 0.85] },
    );
    for (const slide of state.slides.values()) state.observer.observe(slide);
  }

  function createSlide(title, index) {
    const locale = getLocale();
    const slide = el('section', {
      class: 'feed-slide',
      'data-index': String(index),
      'data-title-id': title.id,
      ...(title.guildStatus ? { 'data-guild-status': title.guildStatus } : {}),
    });

    const media = el('div', { class: 'feed-slide__media' });
    const img = el('img', {
      class: 'feed-slide__img',
      src: artPosterUrl(title.id),
      alt: titleName(title, locale),
      loading: index < 2 ? 'eager' : 'lazy',
      decoding: 'async',
    });
    img.addEventListener('error', () => {
      if (img.src.includes('/raw/')) img.src = `/assets/posters/v4/${title.id}.jpg`;
      else if (img.src.endsWith('.jpg')) img.src = `/assets/posters/${title.id}.svg`;
    });
    media.append(img);
    slide.append(media);

    if (title.guildWork) {
      slide.append(el('span', { class: 'feed-slide__guild-badge', text: t('guild.guildWork') }));
    }

    if (index === state.activeIndex) slide.classList.add('is-active');
    state.slides.set(index, slide);
    return slide;
  }

  function appendItems(titles) {
    const start = state.items.length;
    state.items.push(...titles);
    for (let i = 0; i < titles.length; i++) {
      track.append(createSlide(titles[i], start + i));
    }
    bindObserver();
  }

  function scrollTo(index, behavior = 'smooth') {
    const slide = state.slides.get(index);
    if (slide) {
      setActive(index, { recordEngagement: false });
      slide.scrollIntoView({ behavior, block: 'start' });
    }
  }

  function scrollToTitleId(titleId, behavior = 'smooth') {
    const idx = state.items.findIndex((t) => t.id === titleId);
    if (idx >= 0) scrollTo(idx, behavior);
    return idx;
  }

  let wheelLock = false;
  track.addEventListener('wheel', (e) => {
    if (Math.abs(e.deltaY) < 8 || wheelLock) return;
    e.preventDefault();
    wheelLock = true;
    const next = e.deltaY > 0
      ? Math.min(state.activeIndex + 1, state.items.length - 1)
      : Math.max(state.activeIndex - 1, 0);
    scrollTo(next);
    setTimeout(() => { wheelLock = false; }, 380);
  }, { passive: false });

  let touchY = null;
  track.addEventListener('touchstart', (e) => { touchY = e.touches[0].clientY; }, { passive: true });
  track.addEventListener('touchend', (e) => {
    if (touchY == null) return;
    const dy = touchY - e.changedTouches[0].clientY;
    touchY = null;
    if (Math.abs(dy) < 48) return;
    const next = dy > 0
      ? Math.min(state.activeIndex + 1, state.items.length - 1)
      : Math.max(state.activeIndex - 1, 0);
    scrollTo(next);
  }, { passive: true });

  track.addEventListener('scroll', () => {
    requestAnimationFrame(syncActiveFromDom);
  }, { passive: true });

  const dock = el('footer', { class: 'feed-dock' }, [
    el('div', { class: 'feed-dock__inner' }, [
      el('button', {
        class: 'feed-dock-btn feed-dock-btn--studio',
        type: 'button',
        'aria-label': t('feed.studio'),
        onclick: () => {
          const title = getActiveTitle();
          if (title) onStudio?.(title);
        },
      }, [
        el('span', { class: 'feed-dock-btn__icon', text: '◈' }),
        el('span', { class: 'feed-dock-btn__label', text: t('feed.studio') }),
      ]),
      el('button', {
        class: 'feed-dock-btn feed-dock-btn--icon',
        type: 'button',
        title: t('actions.settings'),
        'aria-label': t('actions.settings'),
        onclick: () => onSettings?.(),
      }, [icon('settings')]),
    ]),
  ]);
  root.append(dock);

  return {
    el: root,
    appendItems,
    scrollTo,
    scrollToTitleId,
    getActiveTitle,
    getActiveIndex: () => state.activeIndex,
    destroy() {
      state.observer?.disconnect();
      const title = getActiveTitle();
      if (title) recordFeedView(title.id, Date.now() - state.viewStart);
    },
  };
}