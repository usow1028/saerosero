/**
 * Poster title art — mood-matched, per-glyph typography treatments.
 */

import {
  canvasShell,
  esc,
  featuresCjk,
  featuresDisplay,
  featuresSerif,
  fontDisplay,
  fontSerif,
  isCjk,
  localeMeta,
  perCharLineHtml,
  perCharVerticalHtml,
  splitLines,
  titleSize,
  typeBase,
  uppercaseSafe,
} from './typography.mjs';

export function hash(id) {
  let n = 0;
  for (const c of id) n = (n * 31 + c.charCodeAt(0)) % 9973;
  return n;
}

export const TITLE_STYLES = [
  'glyph-mosaic',
  'kinetic-glyphs',
  'cinematic-glow',
  'neon-sign',
  'conic-shine',
  'chrome-block',
  'vertical-elegant',
  'impact-stack',
  'glitch-rgb',
  'romance-script',
  'noir-cut',
  'anime-bold',
  'layered-depth',
  'shimmer-gradient',
  'skew-shadow',
  'ethereal-mist',
  'brutal-impact',
  'prismatic-serif',
];

export const LOCALES = ['ko', 'en', 'ja', 'zh-Hans', 'es', 'pt-BR'];

const GENRE_FALLBACK = {
  sf: { a: '#5eead4', b: '#0e7490', c: '#ecfeff' },
  fantasy: { a: '#c4b5fd', b: '#6d28d9', c: '#f5f3ff' },
  romance: { a: '#fb7185', b: '#be123c', c: '#ffe4e6' },
  thriller: { a: '#f87171', b: '#450a0a', c: '#fecaca' },
  drama: { a: '#fbbf24', b: '#92400e', c: '#fef3c7' },
  mystery: { a: '#a5b4fc', b: '#4338ca', c: '#e0e7ff' },
  action: { a: '#fb923c', b: '#c2410c', c: '#ffedd5' },
};

const MOOD_RULES = [
  { keys: ['neon', 'cyber', 'night city', 'rain', 'noir', 'alley', 'detective'], styles: ['neon-sign', 'glyph-mosaic', 'noir-cut', 'glitch-rgb'] },
  { keys: ['space', 'orbital', 'station', 'quantum', 'sci-fi', 'future', 'android'], styles: ['kinetic-glyphs', 'cinematic-glow', 'conic-shine', 'prismatic-serif'] },
  { keys: ['harbor', 'moon', 'love', 'romantic', 'wedding', 'heart', 'letter', 'tide'], styles: ['glyph-mosaic', 'romance-script', 'vertical-elegant', 'ethereal-mist'] },
  { keys: ['battle', 'sword', 'war', 'fight', 'explosion', 'chase', 'action'], styles: ['kinetic-glyphs', 'brutal-impact', 'impact-stack', 'anime-bold'] },
  { keys: ['horror', 'ghost', 'curse', 'blood', 'thriller', 'shadow', 'murder'], styles: ['glitch-rgb', 'glyph-mosaic', 'noir-cut', 'skew-shadow'] },
  { keys: ['magic', 'fantasy', 'dragon', 'castle', 'fairy', 'enchant'], styles: ['glyph-mosaic', 'conic-shine', 'vertical-elegant', 'prismatic-serif'] },
  { keys: ['school', 'anime', 'slice', 'youth', 'club'], styles: ['kinetic-glyphs', 'anime-bold', 'impact-stack', 'cinematic-glow'] },
  { keys: ['mystery', 'secret', 'puzzle', 'clue', 'case'], styles: ['glyph-mosaic', 'noir-cut', 'layered-depth', 'skew-shadow'] },
];

const GENRE_STYLES = {
  sf: ['kinetic-glyphs', 'glyph-mosaic', 'cinematic-glow', 'conic-shine', 'prismatic-serif'],
  fantasy: ['glyph-mosaic', 'conic-shine', 'vertical-elegant', 'prismatic-serif', 'ethereal-mist'],
  romance: ['glyph-mosaic', 'romance-script', 'vertical-elegant', 'ethereal-mist', 'shimmer-gradient'],
  thriller: ['kinetic-glyphs', 'glyph-mosaic', 'noir-cut', 'glitch-rgb', 'skew-shadow'],
  drama: ['glyph-mosaic', 'cinematic-glow', 'romance-script', 'impact-stack', 'layered-depth'],
  mystery: ['glyph-mosaic', 'noir-cut', 'layered-depth', 'skew-shadow', 'glitch-rgb'],
  action: ['kinetic-glyphs', 'brutal-impact', 'impact-stack', 'anime-bold', 'chrome-block'],
};

function titleText(title, locale) {
  return title.titles?.[locale] ?? title.titles?.en ?? title.titles?.ko ?? title.id;
}

function loglineText(title, locale) {
  const ll = title.logline;
  if (!ll) return '';
  return ll[locale] ?? ll.en ?? ll.ko ?? '';
}

function moodBlob(title) {
  const scene = (title.posterScene ?? '').toLowerCase();
  const log = Object.values(title.logline ?? {}).join(' ').toLowerCase();
  const tags = (title.tags ?? []).join(' ').toLowerCase();
  return `${scene} ${log} ${tags} ${title.genre ?? ''}`;
}

export function paletteFromTitle(title) {
  const h = title.hue ?? 210;
  return {
    a: `oklch(0.78 0.16 ${h})`,
    b: `oklch(0.32 0.12 ${h})`,
    c: `oklch(0.95 0.04 ${h})`,
    glow: `oklch(0.72 0.2 ${h} / 0.65)`,
    stroke: `oklch(0.22 0.08 ${h})`,
    mix: `color-mix(in oklch, oklch(0.78 0.16 ${h}) 70%, white)`,
    genre: GENRE_FALLBACK[title.genre] ?? GENRE_FALLBACK.drama,
  };
}

export function styleForTitle(title) {
  const id = typeof title === 'string' ? title : title.id;
  const blob = typeof title === 'string' ? '' : moodBlob(title);
  const genre = typeof title === 'string' ? 'drama' : (title.genre ?? 'drama');

  let candidates = GENRE_STYLES[genre] ?? TITLE_STYLES;

  for (const rule of MOOD_RULES) {
    if (rule.keys.some((k) => blob.includes(k))) {
      candidates = rule.styles.filter((s) => TITLE_STYLES.includes(s));
      if (candidates.length) break;
    }
  }

  return candidates[hash(id) % candidates.length];
}

function resolveStyle(styleKey, locale) {
  if (styleKey === 'vertical-elegant' && !isCjk(locale)) {
    const latinAlt = ['glyph-mosaic', 'romance-script', 'ethereal-mist', 'shimmer-gradient'];
    return latinAlt[hash(locale) % latinAlt.length];
  }
  return styleKey;
}

function ctx(title) {
  return { seed: hash(title.id ?? 'x'), genre: title.genre ?? 'drama' };
}

function taglineHtml(text, g, locale, opts = {}) {
  if (!text) return '';
  const { top = false, italic = true } = opts;
  const ff = fontSerif(locale);
  const pos = top
    ? 'position:absolute;left:8%;right:8%;top:6%;text-align:center'
    : 'margin-top:14px;text-align:center';
  const clip = text.length > 42 ? `${text.slice(0, 40)}…` : text;
  return `<div style="${pos};font-family:${ff};font-size:15px;font-weight:500;font-style:${italic ? 'italic' : 'normal'};
    color:${g.c};opacity:0.9;letter-spacing:0.02em;line-height:1.35;text-wrap:balance;
    ${typeBase(featuresSerif())}text-shadow:0 1px 12px ${g.b},0 0 24px ${g.glow}">${esc(clip)}</div>`;
}

const RENDERERS = {
  'glyph-mosaic'(name, g, locale, tagline, title) {
    const { seed, genre } = ctx(title);
    const size = titleSize(name, 88, 72);
    const lines = splitLines(name, 8);
    const body = lines.map((line, li) => perCharLineHtml(line, {
      seed: seed + li * 13, baseSize: size - li * 6, palette: g, locale, genre, mode: 'mosaic',
    })).join('<div style="height:0.15em"></div>');
    return `
<div style="position:absolute;left:4%;right:4%;bottom:7%;text-align:center">${body}
  ${taglineHtml(tagline, g, locale)}
</div>`;
  },

  'kinetic-glyphs'(name, g, locale, tagline, title) {
    const { seed, genre } = ctx(title);
    const size = titleSize(name, 92, 76);
    return `
<div style="position:absolute;left:3%;right:3%;bottom:8%;text-align:center">
  ${perCharLineHtml(name, { seed, baseSize: size, palette: g, locale, genre, mode: 'stroke' })}
  ${taglineHtml(tagline, g, locale, { italic: false })}
</div>`;
  },

  'cinematic-glow'(name, g, locale, tagline, title) {
    const { seed, genre } = ctx(title);
    const lines = splitLines(name, 8);
    const size = titleSize(name, 94, 78);
    const body = lines.map((line, li) => perCharLineHtml(line, {
      seed: seed + li, baseSize: size - li * 8, palette: g, locale, genre, mode: 'glow',
    })).join('<div style="height:0.12em"></div>');
    return `
<div style="position:absolute;left:4%;right:4%;bottom:7%">${body}
  ${taglineHtml(tagline, g, locale)}
</div>`;
  },

  'neon-sign'(name, g, locale, tagline, title) {
    const { seed, genre } = ctx(title);
    const size = titleSize(name, 90, 74);
    return `
<div style="position:absolute;left:50%;top:50%;transform:translate(-50%,-50%);text-align:center;width:94%">
  ${perCharLineHtml(name, { seed, baseSize: size, palette: g, locale, genre, mode: 'neon' })}
  ${taglineHtml(tagline, g, locale, { italic: false })}
</div>`;
  },

  'conic-shine'(name, g, locale, tagline, title) {
    const { seed, genre } = ctx(title);
    const size = titleSize(name, 86, 70);
    return `
<div style="position:absolute;left:5%;right:5%;bottom:9%;text-align:center">
  ${perCharLineHtml(name, { seed, baseSize: size, palette: g, locale, genre, mode: 'mosaic' })}
  ${taglineHtml(tagline, g, locale)}
</div>`;
  },

  'chrome-block'(name, g, locale, tagline, title) {
    const { seed, genre } = ctx(title);
    const size = titleSize(name, 98, 82);
    const label = uppercaseSafe(name, locale);
    return `
<div style="position:absolute;left:-3%;right:-3%;bottom:6%;text-align:center;transform:rotate(-2deg)">
  ${perCharLineHtml(label, { seed, baseSize: size, palette: g, locale, genre, mode: 'stroke' })}
</div>`;
  },

  'vertical-elegant'(name, g, locale, tagline, title) {
    const { seed, genre } = ctx(title);
    const base = titleSize(name, 64, 54);
    const body = perCharVerticalHtml(name, locale, { seed, baseSize: base, palette: g, genre, mode: 'mosaic' });
    return `
<div style="position:absolute;left:6%;top:10%;bottom:12%;display:flex;align-items:center">
  <div style="border-right:4px solid ${g.a};padding-right:18px">${body}</div>
</div>
${taglineHtml(tagline, g, locale, { top: true })}`;
  },

  'impact-stack'(name, g, locale, tagline, title) {
    const { seed, genre } = ctx(title);
    const lines = splitLines(name, 7);
    const size = titleSize(name, 98, 84);
    return `
<div style="position:absolute;left:3%;bottom:6%;transform:rotate(-3.5deg);transform-origin:left bottom">
  ${lines.map((line, i) => `<div style="margin-bottom:0.05em">
    ${perCharLineHtml(line, { seed: seed + i * 7, baseSize: size - i * 18, palette: g, locale, genre, mode: 'stroke', align: 'left' })}
  </div>`).join('')}
</div>`;
  },

  'glitch-rgb'(name, g, locale, tagline, title) {
    const { seed, genre } = ctx(title);
    const size = titleSize(name, 82, 68);
    const pool = perCharLineHtml(name, { seed, baseSize: size, palette: g, locale, genre, mode: 'subtle' });
    return `
<div style="position:absolute;left:4%;bottom:9%">
  <div style="position:relative;mix-blend-mode:screen">
    <div style="position:absolute;inset:0;color:#0ff;opacity:0.85;transform:translate(-5px,-2px)" aria-hidden="true">${pool}</div>
    <div style="position:absolute;inset:0;color:#f0f;opacity:0.85;transform:translate(5px,2px)" aria-hidden="true">${pool}</div>
    <div style="position:relative">${perCharLineHtml(name, { seed: seed + 3, baseSize: size, palette: g, locale, genre, mode: 'glow' })}</div>
  </div>
  ${taglineHtml(tagline, g, locale, { italic: false })}
</div>`;
  },

  'romance-script'(name, g, locale, tagline, title) {
    const { seed, genre } = ctx(title);
    const size = titleSize(name, 78, 64);
    return `
<div style="position:absolute;left:6%;right:6%;top:46%;text-align:center">
  ${perCharLineHtml(name, { seed, baseSize: size, palette: g, locale, genre, mode: 'romance' })}
  <div style="width:80px;height:2px;background:linear-gradient(90deg,transparent,${g.a},transparent);margin:14px auto"></div>
  ${taglineHtml(tagline, g, locale)}
</div>`;
  },

  'noir-cut'(name, g, locale, tagline, title) {
    const { seed, genre } = ctx(title);
    const size = titleSize(name, 74, 62);
    const label = uppercaseSafe(name, locale);
    return `
<div style="position:absolute;left:5%;bottom:8%">
  <div style="background:${g.b};padding:10px 18px;box-shadow:8px 8px 0 ${g.a},0 0 40px ${g.glow};display:inline-block">
    ${perCharLineHtml(label, { seed, baseSize: size, palette: { ...g, a: '#f8f8f8', c: '#f8f8f8' }, locale, genre, mode: 'subtle' })}
  </div>
  ${taglineHtml(tagline, g, locale, { italic: false })}
</div>`;
  },

  'anime-bold'(name, g, locale, tagline, title) {
    const { seed, genre } = ctx(title);
    const lines = splitLines(name, 6);
    const size = titleSize(name, 90, 76);
    return `
<div style="position:absolute;left:3%;right:3%;bottom:6%;text-align:center">
  ${lines.map((line, li) => perCharLineHtml(line, {
    seed: seed + li, baseSize: size, palette: g, locale, genre, mode: 'stroke',
  })).join('<div style="height:0.1em"></div>')}
</div>`;
  },

  'layered-depth'(name, g, locale, tagline, title) {
    const { seed, genre } = ctx(title);
    const size = titleSize(name, 88, 72);
    const line = perCharLineHtml(name, { seed, baseSize: size, palette: g, locale, genre, mode: 'glow' });
    const offsets = [14, 10, 5];
    const layers = offsets.map((off, i) =>
      `<div style="position:absolute;inset:0;transform:translate(${off}px,${off}px);opacity:${0.35 + i * 0.2};color:${g.b}" aria-hidden="true">${line}</div>`,
    ).join('');
    return `
<div style="position:absolute;left:5%;bottom:10%">
  <div style="position:relative">${layers}<div style="position:relative">${line}</div></div>
  ${taglineHtml(tagline, g, locale)}
</div>`;
  },

  'shimmer-gradient'(name, g, locale, tagline, title) {
    const { seed, genre } = ctx(title);
    const size = titleSize(name, 84, 70);
    return `
<div style="position:absolute;left:5%;right:5%;bottom:9%;text-align:center">
  ${perCharLineHtml(name, { seed, baseSize: size, palette: g, locale, genre, mode: 'mosaic' })}
  ${taglineHtml(tagline, g, locale)}
</div>`;
  },

  'skew-shadow'(name, g, locale, tagline, title) {
    const { seed, genre } = ctx(title);
    const size = titleSize(name, 86, 72);
    const line = perCharLineHtml(name, { seed, baseSize: size, palette: g, locale, genre, mode: 'glow' });
    return `
<div style="position:absolute;left:4%;bottom:9%;transform:skewX(-6deg)">
  <div style="position:relative">
    <div style="position:absolute;inset:0;transform:translate(10px,10px) skewX(6deg);opacity:0.7" aria-hidden="true">${line}</div>
    <div style="position:relative">${line}</div>
  </div>
  ${taglineHtml(tagline, g, locale, { italic: false })}
</div>`;
  },

  'ethereal-mist'(name, g, locale, tagline, title) {
    const { seed, genre } = ctx(title);
    const size = titleSize(name, 80, 66);
    return `
<div style="position:absolute;left:6%;right:6%;top:44%;text-align:center">
  ${perCharLineHtml(name, { seed, baseSize: size, palette: g, locale, genre, mode: 'romance' })}
  ${taglineHtml(tagline, g, locale)}
</div>`;
  },

  'brutal-impact'(name, g, locale, tagline, title) {
    const { seed, genre } = ctx(title);
    const lines = splitLines(name, 6);
    const size = titleSize(name, 102, 88);
    return `
<div style="position:absolute;left:2%;right:2%;bottom:5%;text-align:center">
  ${lines.map((line, i) => perCharLineHtml(uppercaseSafe(line, locale), {
    seed: seed + i * 11, baseSize: size - i * 12, palette: g, locale, genre, mode: 'stroke',
  })).join('<div style="height:0.08em"></div>')}
</div>`;
  },

  'prismatic-serif'(name, g, locale, tagline, title) {
    const { seed, genre } = ctx(title);
    const size = titleSize(name, 88, 74);
    return `
<div style="position:absolute;left:5%;right:5%;bottom:9%;text-align:center">
  ${perCharLineHtml(name, { seed, baseSize: size, palette: g, locale, genre, mode: 'mosaic' })}
  ${taglineHtml(tagline, g, locale)}
</div>`;
  },
};

RENDERERS['gold-foil'] = RENDERERS['conic-shine'];

export function titleArtHtml(title, locale, styleKey) {
  const g = paletteFromTitle(title);
  const name = titleText(title, locale);
  const tagline = loglineText(title, locale);
  const resolved = resolveStyle(styleKey, locale);
  const render = RENDERERS[resolved] ?? RENDERERS['glyph-mosaic'];
  const body = render(name, g, locale, tagline, title);
  const { lang } = localeMeta(locale);

  return canvasShell(lang, body);
}