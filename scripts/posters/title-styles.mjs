/**
 * Poster title art — mood-matched treatments rendered via typography engine.
 * Pipeline: HTML/CSS (Chromium) → transparent PNG (Playwright omitBackground).
 */

import {
  canvasShell,
  esc,
  featuresCjk,
  featuresDisplay,
  featuresSerif,
  fontDisplay,
  fontSans,
  fontSerif,
  graphemes,
  isCjk,
  localeMeta,
  splitLines,
  titleSize,
  typeBase,
  uppercaseSafe,
  verticalTextHtml,
} from './typography.mjs';

export const TITLE_STYLES = [
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
  { keys: ['neon', 'cyber', 'night city', 'rain', 'noir', 'alley', 'detective'], styles: ['neon-sign', 'noir-cut', 'glitch-rgb', 'skew-shadow'] },
  { keys: ['space', 'orbital', 'station', 'quantum', 'sci-fi', 'future', 'android'], styles: ['cinematic-glow', 'conic-shine', 'layered-depth', 'prismatic-serif'] },
  { keys: ['harbor', 'moon', 'love', 'romantic', 'wedding', 'heart', 'letter', 'tide'], styles: ['romance-script', 'ethereal-mist', 'vertical-elegant', 'shimmer-gradient'] },
  { keys: ['battle', 'sword', 'war', 'fight', 'explosion', 'chase', 'action'], styles: ['brutal-impact', 'impact-stack', 'chrome-block', 'anime-bold'] },
  { keys: ['horror', 'ghost', 'curse', 'blood', 'thriller', 'shadow', 'murder'], styles: ['glitch-rgb', 'noir-cut', 'skew-shadow', 'layered-depth'] },
  { keys: ['magic', 'fantasy', 'dragon', 'castle', 'fairy', 'enchant'], styles: ['conic-shine', 'ethereal-mist', 'vertical-elegant', 'prismatic-serif'] },
  { keys: ['school', 'anime', 'slice', 'youth', 'club'], styles: ['anime-bold', 'impact-stack', 'cinematic-glow'] },
  { keys: ['mystery', 'secret', 'puzzle', 'clue', 'case'], styles: ['noir-cut', 'layered-depth', 'glitch-rgb', 'skew-shadow'] },
];

const GENRE_STYLES = {
  sf: ['cinematic-glow', 'conic-shine', 'layered-depth', 'prismatic-serif', 'neon-sign'],
  fantasy: ['conic-shine', 'ethereal-mist', 'vertical-elegant', 'prismatic-serif', 'shimmer-gradient'],
  romance: ['romance-script', 'ethereal-mist', 'vertical-elegant', 'shimmer-gradient', 'cinematic-glow'],
  thriller: ['noir-cut', 'glitch-rgb', 'skew-shadow', 'layered-depth', 'brutal-impact'],
  drama: ['cinematic-glow', 'romance-script', 'impact-stack', 'chrome-block', 'layered-depth'],
  mystery: ['noir-cut', 'glitch-rgb', 'layered-depth', 'skew-shadow', 'vertical-elegant'],
  action: ['brutal-impact', 'impact-stack', 'chrome-block', 'anime-bold', 'skew-shadow'],
};

export function hash(id) {
  let n = 0;
  for (const c of id) n = (n * 31 + c.charCodeAt(0)) % 9973;
  return n;
}

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

/** Resolve style per locale — vertical-elegant only when script supports it well */
function resolveStyle(styleKey, locale) {
  if (styleKey === 'vertical-elegant' && !isCjk(locale) && graphemes(locale).length) {
    const latinAlt = ['romance-script', 'ethereal-mist', 'shimmer-gradient', 'cinematic-glow'];
    return latinAlt[hash(locale) % latinAlt.length];
  }
  return styleKey;
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
  'cinematic-glow'(name, g, locale, tagline) {
    const lines = splitLines(name, 8);
    const size = titleSize(name, 94, 78);
    const ff = fontSans(locale);
    const feat = isCjk(locale) ? featuresCjk() : featuresDisplay();
    return `
<div style="position:absolute;left:4%;right:4%;bottom:7%">
  ${lines.map((line, i) => `<div style="font-family:${ff};font-size:${size - i * 8}px;font-weight:900;line-height:0.92;color:#fff;
    ${typeBase(feat)}text-wrap:balance;
    text-shadow:0 0 48px ${g.a},0 3px 0 ${g.b},0 6px 0 rgba(0,0,0,0.55),0 12px 40px rgba(0,0,0,0.9),
    0 0 100px ${g.glow};-webkit-text-stroke:1.5px color-mix(in oklch, white 25%, transparent);
    paint-order:stroke fill">${esc(line)}</div>`).join('')}
  ${taglineHtml(tagline, g, locale)}
</div>`;
  },

  'neon-sign'(name, g, locale, tagline) {
    const ff = fontSans(locale);
    const size = titleSize(name, 90, 74);
    return `
<div style="position:absolute;left:50%;top:50%;transform:translate(-50%,-50%);text-align:center;width:94%">
  <div style="font-family:${ff};font-size:${size}px;font-weight:900;color:${g.a};${typeBase(featuresDisplay())}
    text-shadow:0 0 8px #fff,0 0 16px ${g.a},0 0 36px ${g.a},0 0 72px ${g.b},0 0 120px ${g.b},
    0 0 160px ${g.glow};filter:drop-shadow(0 4px 20px rgba(0,0,0,0.8))">${esc(name)}</div>
  ${taglineHtml(tagline, g, locale, { italic: false })}
</div>`;
  },

  'conic-shine'(name, g, locale, tagline) {
    const ff = fontSerif(locale);
    const size = titleSize(name, 86, 70);
    return `
<div style="position:absolute;left:5%;right:5%;bottom:9%;text-align:center">
  <div style="font-family:${ff};font-size:${size}px;font-weight:700;${typeBase(featuresSerif())}
    background:conic-gradient(from 210deg at 50% 40%, ${g.c}, ${g.a}, ${g.mix}, ${g.b}, ${g.c});
    -webkit-background-clip:text;background-clip:text;-webkit-text-fill-color:transparent;
    filter:drop-shadow(0 3px 6px rgba(0,0,0,0.95)) drop-shadow(0 0 32px ${g.glow})">${esc(name)}</div>
  ${taglineHtml(tagline, g, locale)}
</div>`;
  },

  'chrome-block'(name, g, locale) {
    const ff = fontDisplay(locale);
    const size = titleSize(name, 98, 82);
    const label = uppercaseSafe(name, locale);
    return `
<div style="position:absolute;left:-3%;right:-3%;bottom:6%;text-align:center;transform:rotate(-2deg)">
  <div style="font-family:${ff};font-size:${size}px;font-weight:400;letter-spacing:${isCjk(locale) ? '0.02em' : '0.05em'};
    ${typeBase(featuresDisplay())}color:#f0f0f0;
    text-shadow:0 1px 0 #fff,0 4px 0 #bbb,0 7px 0 #777,0 10px 0 #444,0 14px 28px rgba(0,0,0,0.85),
    0 0 50px ${g.glow}">${esc(label)}</div>
</div>`;
  },

  'vertical-elegant'(name, g, locale, tagline) {
    const base = titleSize(name, 62, 52);
    const glow = `;text-shadow:0 0 28px ${g.a},3px 0 16px rgba(0,0,0,0.85)`;
    const body = verticalTextHtml(name, locale, { baseSize: base, color: '#fff', glow });
    return `
<div style="position:absolute;left:6%;top:10%;bottom:12%;display:flex;align-items:center">
  <div style="border-right:4px solid ${g.a};padding-right:18px">${body}</div>
</div>
${taglineHtml(tagline, g, locale, { top: true })}`;
  },

  'impact-stack'(name, g, locale) {
    const lines = splitLines(name, 7);
    const ff = fontSans(locale);
    const size = titleSize(name, 98, 84);
    const feat = isCjk(locale) ? featuresCjk() : featuresDisplay();
    return `
<div style="position:absolute;left:3%;bottom:6%;transform:rotate(-3.5deg);transform-origin:left bottom">
  ${lines.map((line, i) => `<div style="font-family:${ff};font-size:${size - i * 18}px;font-weight:900;line-height:0.88;
    color:${i === 0 ? '#fff' : g.a};${typeBase(feat)}
    -webkit-text-stroke:3px ${g.stroke};paint-order:stroke fill;
    text-shadow:6px 6px 0 ${g.b},0 0 40px ${g.glow}">${esc(line)}</div>`).join('')}
</div>`;
  },

  'glitch-rgb'(name, g, locale, tagline) {
    const ff = fontSans(locale);
    const size = titleSize(name, 82, 68);
    return `
<div style="position:absolute;left:4%;bottom:9%">
  <div style="font-family:${ff};font-size:${size}px;font-weight:800;color:#fff;position:relative;${typeBase(featuresDisplay())}">
    <span style="position:absolute;inset:0;color:#0ff;opacity:0.9;transform:translate(-4px,-2px)" aria-hidden="true">${esc(name)}</span>
    <span style="position:absolute;inset:0;color:#f0f;opacity:0.9;transform:translate(4px,2px)" aria-hidden="true">${esc(name)}</span>
    <span style="position:relative;text-shadow:0 0 20px ${g.glow}">${esc(name)}</span>
  </div>
  ${taglineHtml(tagline, g, locale, { italic: false })}
</div>`;
  },

  'romance-script'(name, g, locale, tagline) {
    const ff = fontSerif(locale);
    const size = titleSize(name, 78, 64);
    return `
<div style="position:absolute;left:6%;right:6%;top:46%;text-align:center">
  <div style="font-family:${ff};font-style:italic;font-size:${size}px;font-weight:500;color:#fff;
    ${typeBase(featuresSerif())}text-wrap:balance;
    text-shadow:0 3px 32px ${g.b},0 0 50px ${g.glow}">${esc(name)}</div>
  <div style="width:80px;height:2px;background:linear-gradient(90deg,transparent,${g.a},transparent);margin:14px auto"></div>
  ${taglineHtml(tagline, g, locale)}
</div>`;
  },

  'noir-cut'(name, g, locale, tagline) {
    const ff = fontSans(locale);
    const size = titleSize(name, 74, 62);
    const label = uppercaseSafe(name, locale);
    return `
<div style="position:absolute;left:5%;bottom:8%">
  <div style="font-family:${ff};font-size:${size}px;font-weight:800;color:#f8f8f8;
    letter-spacing:${isCjk(locale) ? '0.04em' : '0.08em'};${isCjk(locale) ? '' : 'text-transform:uppercase;'}
    ${typeBase(featuresDisplay())}
    box-decoration-break:clone;-webkit-box-decoration-break:clone;
    background:${g.b};padding:10px 18px;box-shadow:8px 8px 0 ${g.a},0 0 40px ${g.glow}">${esc(label)}</div>
  ${taglineHtml(tagline, g, locale, { italic: false })}
</div>`;
  },

  'anime-bold'(name, g, locale) {
    const lines = splitLines(name, 6);
    const ff = fontSans(locale);
    const size = titleSize(name, 90, 76);
    const feat = isCjk(locale) ? featuresCjk() : featuresDisplay();
    return `
<div style="position:absolute;left:3%;right:3%;bottom:6%;text-align:center">
  ${lines.map((line) => `<div style="font-family:${ff};font-size:${size}px;font-weight:900;line-height:1.02;color:#fff;
    ${typeBase(feat)}-webkit-text-stroke:4px ${g.b};paint-order:stroke fill;
    text-shadow:0 0 32px ${g.a},0 5px 0 ${g.b},0 8px 20px rgba(0,0,0,0.75)">${esc(line)}</div>`).join('')}
</div>`;
  },

  'layered-depth'(name, g, locale, tagline) {
    const ff = fontSans(locale);
    const size = titleSize(name, 88, 72);
    const layers = [14, 10, 5, 0];
    const spans = layers.map((off, i) =>
      `<span style="position:absolute;inset:0;transform:translate(${off}px,${off}px);color:${g.b};opacity:${0.3 + i * 0.18}" aria-hidden="true">${esc(name)}</span>`,
    ).join('');
    return `
<div style="position:absolute;left:5%;bottom:10%">
  <div style="font-family:${ff};font-size:${size}px;font-weight:900;color:#fff;position:relative;${typeBase(featuresDisplay())}">
    ${spans}
    <span style="position:relative;text-shadow:0 0 36px ${g.glow}">${esc(name)}</span>
  </div>
  ${taglineHtml(tagline, g, locale)}
</div>`;
  },

  'shimmer-gradient'(name, g, locale, tagline) {
    const ff = fontSerif(locale);
    const size = titleSize(name, 84, 70);
    return `
<div style="position:absolute;left:5%;right:5%;bottom:9%;text-align:center">
  <div style="font-family:${ff};font-size:${size}px;font-weight:700;${typeBase(featuresSerif())}
    background:linear-gradient(105deg, ${g.c} 0%, ${g.a} 22%, #fff 42%, ${g.mix} 52%, ${g.b} 78%, ${g.c} 100%);
    background-size:220% auto;-webkit-background-clip:text;background-clip:text;-webkit-text-fill-color:transparent;
    filter:drop-shadow(0 4px 8px rgba(0,0,0,0.9)) drop-shadow(0 0 28px ${g.glow})">${esc(name)}</div>
  ${taglineHtml(tagline, g, locale)}
</div>`;
  },

  'skew-shadow'(name, g, locale, tagline) {
    const ff = fontSans(locale);
    const size = titleSize(name, 86, 72);
    return `
<div style="position:absolute;left:4%;bottom:9%;transform:skewX(-6deg)">
  <div style="font-family:${ff};font-size:${size}px;font-weight:900;color:#fff;position:relative;${typeBase(featuresDisplay())}">
    <span style="position:absolute;inset:0;color:${g.b};transform:translate(10px,10px) skewX(6deg)" aria-hidden="true">${esc(name)}</span>
    <span style="position:relative;text-shadow:0 0 24px ${g.glow};-webkit-text-stroke:1px ${g.a}">${esc(name)}</span>
  </div>
  ${taglineHtml(tagline, g, locale, { italic: false })}
</div>`;
  },

  'ethereal-mist'(name, g, locale, tagline) {
    const ff = fontSerif(locale);
    const size = titleSize(name, 80, 66);
    return `
<div style="position:absolute;left:6%;right:6%;top:44%;text-align:center">
  <div style="font-family:${ff};font-size:${size}px;font-weight:600;font-style:italic;color:${g.c};
    ${typeBase(featuresSerif())}text-wrap:balance;
    text-shadow:0 0 60px ${g.glow},0 0 100px ${g.a},0 4px 30px rgba(0,0,0,0.6)">${esc(name)}</div>
  ${taglineHtml(tagline, g, locale)}
</div>`;
  },

  'brutal-impact'(name, g, locale) {
    const lines = splitLines(name, 6);
    const ff = fontDisplay(locale);
    const size = titleSize(name, 102, 88);
    return `
<div style="position:absolute;left:2%;right:2%;bottom:5%;text-align:center">
  ${lines.map((line, i) => `<div style="font-family:${ff};font-size:${size - i * 12}px;font-weight:400;line-height:0.9;
    color:${i === 0 ? '#fff' : g.a};letter-spacing:${isCjk(locale) ? '0.02em' : '0.06em'};
    ${typeBase(featuresDisplay())}-webkit-text-stroke:2px ${g.stroke};paint-order:stroke fill;
    text-shadow:0 8px 0 ${g.b},0 12px 24px rgba(0,0,0,0.9),0 0 50px ${g.glow}">${esc(uppercaseSafe(line, locale))}</div>`).join('')}
</div>`;
  },

  'prismatic-serif'(name, g, locale, tagline) {
    const ff = fontSerif(locale);
    const size = titleSize(name, 88, 74);
    return `
<div style="position:absolute;left:5%;right:5%;bottom:9%;text-align:center">
  <div style="font-family:${ff};font-size:${size}px;font-weight:700;${typeBase(featuresSerif())}
    background:linear-gradient(135deg, ${g.c} 0%, ${g.a} 30%, ${g.mix} 50%, ${g.b} 80%);
    -webkit-background-clip:text;background-clip:text;-webkit-text-fill-color:transparent;
    filter:drop-shadow(0 2px 2px rgba(0,0,0,1)) drop-shadow(0 0 40px ${g.glow});
    -webkit-text-stroke:0.5px color-mix(in oklch, ${g.a} 40%, transparent);paint-order:stroke fill">${esc(name)}</div>
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
  const render = RENDERERS[resolved] ?? RENDERERS['cinematic-glow'];
  const body = render(name, g, locale, tagline);
  const { lang } = localeMeta(locale);

  return canvasShell(lang, body);
}