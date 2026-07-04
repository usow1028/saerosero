/** goal-deliverable: studio-guild */
import { describe, it, expect } from 'vitest';
import { indexFromSlide, visibleRatio, resolveActiveIndex } from '../src/ui/feedActive.js';

function mockSlide(index, { active = false, top = 0, height = 100 } = {}) {
  return {
    dataset: { index: String(index) },
    classList: { contains: (c) => c === 'is-active' && active },
    getBoundingClientRect: () => ({
      top,
      bottom: top + height,
      height,
    }),
  };
}

function mockTrack(slides, trackTop = 0, trackHeight = 400) {
  return {
    getBoundingClientRect: () => ({
      top: trackTop,
      bottom: trackTop + trackHeight,
      height: trackHeight,
    }),
    querySelector: (sel) => {
      if (sel === '.feed-slide.is-active') return slides.find((s) => s.classList.contains('is-active')) ?? null;
      return null;
    },
    querySelectorAll: (sel) => {
      if (sel === '.feed-slide') return slides;
      return [];
    },
  };
}

describe('feedActive', () => {
  it('indexFromSlide parses data-index within bounds', () => {
    expect(indexFromSlide(mockSlide(2), 5)).toBe(2);
    expect(indexFromSlide(mockSlide(9), 5)).toBeNull();
    expect(indexFromSlide(null, 5)).toBeNull();
  });

  it('visibleRatio computes intersection fraction', () => {
    const track = { top: 0, bottom: 400, height: 400 };
    const slide = { top: 50, bottom: 150, height: 100 };
    expect(visibleRatio(slide, track)).toBe(1);
  });

  it('resolveActiveIndex prefers is-active slide', () => {
    const slides = [
      mockSlide(0, { top: 0 }),
      mockSlide(1, { active: true, top: 400 }),
      mockSlide(2, { top: 800 }),
    ];
    const track = mockTrack(slides);
    expect(resolveActiveIndex(track, 3, 0)).toBe(1);
  });

  it('resolveActiveIndex picks most visible slide when none marked active', () => {
    const slides = [
      mockSlide(0, { top: -200 }),
      mockSlide(1, { top: 0, height: 400 }),
      mockSlide(2, { top: 500 }),
    ];
    const track = mockTrack(slides);
    expect(resolveActiveIndex(track, 3, 0)).toBe(1);
  });
});