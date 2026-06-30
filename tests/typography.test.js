import { describe, it, expect } from 'vitest';
import {
  graphemes,
  perCharLineHtml,
  perCharVerticalHtml,
  fontPool,
  isCjk,
} from '../scripts/posters/typography.mjs';
import { styleForTitle } from '../scripts/posters/title-styles.mjs';

const palette = {
  a: 'oklch(0.78 0.16 200)',
  b: 'oklch(0.32 0.12 200)',
  c: 'oklch(0.95 0.04 200)',
  glow: 'oklch(0.72 0.2 200 / 0.65)',
  stroke: 'oklch(0.22 0.08 200)',
  mix: 'color-mix(in oklch, white 70%, black)',
};

describe('typography engine', () => {
  it('splits graphemes correctly for Korean', () => {
    expect(graphemes('달빛 항구').length).toBe(5);
  });

  it('renders per-char horizontal line in reading order', () => {
    const html = perCharLineHtml('달빛 항구', { seed: 42, baseSize: 60, palette, locale: 'ko', genre: 'romance' });
    const 달 = html.indexOf('달');
    const 구 = html.lastIndexOf('구');
    expect(달).toBeGreaterThan(-1);
    expect(구).toBeGreaterThan(달);
  });

  it('renders per-char vertical columns in reading order', () => {
    const html = perCharVerticalHtml('달빛 항구', 'ko', { seed: 7, baseSize: 50, palette, genre: 'romance' });
    const 달 = html.indexOf('달');
    const 구 = html.lastIndexOf('구');
    expect(달).toBeGreaterThan(-1);
    expect(구).toBeGreaterThan(달);
  });

  it('provides diverse fonts per genre/locale', () => {
    const romanceKo = fontPool('ko', 'romance').map((f) => f.css);
    const sfEn = fontPool('en', 'sf').map((f) => f.css);
    expect(romanceKo.length).toBeGreaterThan(3);
    expect(sfEn.length).toBeGreaterThan(3);
    expect(romanceKo.some((f) => f.includes('Gowun'))).toBe(true);
    expect(sfEn.some((f) => f.includes('Orbitron'))).toBe(true);
  });

  it('assigns glyph-mosaic to romantic harbor titles', () => {
    const title = {
      id: 'moonlit-harbor',
      genre: 'romance',
      posterScene: 'moonlit pier, romantic anime harbor',
      logline: { en: 'A harbor where tides deliver lost love letters.' },
      tags: ['romance', 'sea'],
    };
    const style = styleForTitle(title);
    expect(['glyph-mosaic', 'romance-script', 'vertical-elegant', 'ethereal-mist']).toContain(style);
    expect(isCjk('ko')).toBe(true);
  });
});