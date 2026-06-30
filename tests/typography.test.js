import { describe, it, expect } from 'vitest';
import { graphemes, verticalTextHtml, isCjk } from '../scripts/posters/typography.mjs';
import { styleForTitle } from '../scripts/posters/title-styles.mjs';

describe('typography engine', () => {
  it('splits graphemes correctly for Korean', () => {
    expect(graphemes('달빛 항구').length).toBe(5);
  });

  it('renders CJK vertical columns in reading order', () => {
    const html = verticalTextHtml('달빛 항구', 'ko', { baseSize: 50 });
    const 달 = html.indexOf('달');
    const 구 = html.lastIndexOf('구');
    expect(달).toBeGreaterThan(-1);
    expect(구).toBeGreaterThan(달);
  });

  it('assigns vertical-elegant to romantic harbor titles', () => {
    const title = {
      id: 'moonlit-harbor',
      genre: 'romance',
      posterScene: 'moonlit pier, romantic anime harbor',
      logline: { en: 'A harbor where tides deliver lost love letters.' },
      tags: ['romance', 'sea'],
    };
    expect(styleForTitle(title)).toBe('vertical-elegant');
    expect(isCjk('ko')).toBe(true);
  });
});