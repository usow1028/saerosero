/** goal-deliverable: studio-guild */
/**
 * Pure helpers for resolving the active feed slide from DOM state.
 */

export function indexFromSlide(slideEl, itemCount) {
  if (!slideEl) return null;
  const idx = Number(slideEl.dataset?.index);
  if (Number.isNaN(idx) || idx < 0 || idx >= itemCount) return null;
  return idx;
}

export function visibleRatio(slideRect, trackRect) {
  const visible = Math.min(slideRect.bottom, trackRect.bottom) - Math.max(slideRect.top, trackRect.top);
  if (visible <= 0 || slideRect.height <= 0) return 0;
  return visible / slideRect.height;
}

/**
 * Resolve active index: prefer .is-active, else the slide with highest visible ratio in track.
 */
export function resolveActiveIndex(trackEl, itemCount, fallback = 0) {
  if (!trackEl || itemCount <= 0) return fallback;

  const marked = trackEl.querySelector('.feed-slide.is-active');
  const fromMarked = indexFromSlide(marked, itemCount);
  if (fromMarked !== null) return fromMarked;

  const trackRect = trackEl.getBoundingClientRect();
  let bestIdx = fallback;
  let bestRatio = 0;

  for (const slide of trackEl.querySelectorAll('.feed-slide')) {
    const idx = indexFromSlide(slide, itemCount);
    if (idx === null) continue;
    const ratio = visibleRatio(slide.getBoundingClientRect(), trackRect);
    if (ratio > bestRatio) {
      bestRatio = ratio;
      bestIdx = idx;
    }
  }

  return bestRatio >= 0.5 ? bestIdx : fallback;
}