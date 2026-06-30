/**
 * Typography engine — per-glyph design + genre/locale font palettes.
 * Pipeline: Chromium + variable/display fonts → Playwright PNG.
 */

export const LOCALE_META = {
  ko: { lang: 'ko', script: 'cjk', dir: 'ltr', colSize: 5 },
  ja: { lang: 'ja', script: 'cjk', dir: 'ltr', colSize: 5 },
  'zh-Hans': { lang: 'zh-Hans', script: 'cjk', dir: 'ltr', colSize: 5 },
  en: { lang: 'en', script: 'latin', dir: 'ltr', colSize: 8 },
  es: { lang: 'es', script: 'latin', dir: 'ltr', colSize: 8 },
  'pt-BR': { lang: 'pt-BR', script: 'latin', dir: 'ltr', colSize: 8 },
};

/** Google Fonts families — css name + API slug */
export const FONTS = {
  notoSansKr: { css: "'Noto Sans KR'", slug: 'Noto+Sans+KR:wght@700;800;900' },
  notoSerifKr: { css: "'Noto Serif KR'", slug: 'Noto+Serif+KR:wght@600;700' },
  blackHanSans: { css: "'Black Han Sans'", slug: 'Black+Han+Sans' },
  jua: { css: "'Jua'", slug: 'Jua' },
  doHyeon: { css: "'Do Hyeon'", slug: 'Do+Hyeon' },
  gowunBatang: { css: "'Gowun Batang'", slug: 'Gowun+Batang:wght@700' },
  songMyung: { css: "'Song Myung'", slug: 'Song+Myung' },
  notoSansJp: { css: "'Noto Sans JP'", slug: 'Noto+Sans+JP:wght@700;800;900' },
  notoSerifJp: { css: "'Noto Serif JP'", slug: 'Noto+Serif+JP:wght@600;700' },
  mPlus1p: { css: "'M PLUS 1p'", slug: 'M+PLUS+1p:wght@700;800' },
  zenAntique: { css: "'Zen Antique'", slug: 'Zen+Antique' },
  shippori: { css: "'Shippori Mincho'", slug: 'Shippori+Mincho:wght@700;800' },
  notoSansSc: { css: "'Noto Sans SC'", slug: 'Noto+Sans+SC:wght@700;800;900' },
  notoSerifSc: { css: "'Noto Serif SC'", slug: 'Noto+Serif+SC:wght@600;700' },
  zcool: { css: "'ZCOOL XiaoWei'", slug: 'ZCOOL+XiaoWei' },
  longCang: { css: "'Long Cang'", slug: 'Long+Cang' },
  outfit: { css: "'Outfit'", slug: 'Outfit:wght@600;700;800;900' },
  bebas: { css: "'Bebas Neue'", slug: 'Bebas+Neue' },
  playfair: { css: "'Playfair Display'", slug: 'Playfair+Display:ital,wght@0,500;0,600;0,700;1,500' },
  syne: { css: "'Syne'", slug: 'Syne:wght@700;800' },
  orbitron: { css: "'Orbitron'", slug: 'Orbitron:wght@700;800;900' },
  cinzel: { css: "'Cinzel'", slug: 'Cinzel:wght@700;800;900' },
  righteous: { css: "'Righteous'", slug: 'Righteous' },
  cormorant: { css: "'Cormorant Garamond'", slug: 'Cormorant+Garamond:ital,wght@0,600;0,700;1,600' },
  abril: { css: "'Abril Fatface'", slug: 'Abril+Fatface' },
  anton: { css: "'Anton'", slug: 'Anton' },
  bungee: { css: "'Bungee'", slug: 'Bungee' },
  libre: { css: "'Libre Baskerville'", slug: 'Libre+Baskerville:wght@700' },
  unbounded: { css: "'Unbounded'", slug: 'Unbounded:wght@700;800;900' },
};

const LOCALE_FONT_POOL = {
  ko: [FONTS.notoSansKr, FONTS.blackHanSans, FONTS.jua, FONTS.doHyeon, FONTS.gowunBatang, FONTS.songMyung, FONTS.notoSerifKr],
  ja: [FONTS.notoSansJp, FONTS.mPlus1p, FONTS.zenAntique, FONTS.shippori, FONTS.notoSerifJp],
  'zh-Hans': [FONTS.notoSansSc, FONTS.zcool, FONTS.longCang, FONTS.notoSerifSc],
  en: [FONTS.outfit, FONTS.bebas, FONTS.playfair, FONTS.syne, FONTS.orbitron, FONTS.cinzel, FONTS.righteous, FONTS.cormorant, FONTS.abril, FONTS.anton, FONTS.bungee, FONTS.libre, FONTS.unbounded],
  es: [FONTS.outfit, FONTS.bebas, FONTS.playfair, FONTS.cinzel, FONTS.cormorant, FONTS.anton, FONTS.unbounded],
  'pt-BR': [FONTS.outfit, FONTS.bebas, FONTS.playfair, FONTS.cinzel, FONTS.cormorant, FONTS.anton, FONTS.unbounded],
};

/** Genre-accent fonts merged into locale pool */
const GENRE_ACCENT = {
  sf: { ko: [FONTS.doHyeon, FONTS.blackHanSans, FONTS.orbitron], en: [FONTS.orbitron, FONTS.unbounded, FONTS.syne] },
  fantasy: { ko: [FONTS.songMyung, FONTS.gowunBatang, FONTS.jua], en: [FONTS.cinzel, FONTS.playfair, FONTS.abril] },
  romance: { ko: [FONTS.gowunBatang, FONTS.songMyung, FONTS.jua], en: [FONTS.playfair, FONTS.cormorant, FONTS.libre, FONTS.abril] },
  thriller: { ko: [FONTS.blackHanSans, FONTS.doHyeon], en: [FONTS.anton, FONTS.bebas, FONTS.bungee] },
  drama: { ko: [FONTS.gowunBatang, FONTS.notoSerifKr], en: [FONTS.libre, FONTS.cormorant, FONTS.cinzel] },
  mystery: { ko: [FONTS.songMyung, FONTS.notoSerifKr], en: [FONTS.cinzel, FONTS.playfair, FONTS.libre] },
  action: { ko: [FONTS.blackHanSans, FONTS.jua, FONTS.doHyeon], en: [FONTS.righteous, FONTS.anton, FONTS.bungee, FONTS.bebas] },
};

export function localeMeta(locale) {
  return LOCALE_META[locale] ?? LOCALE_META.en;
}

export function isCjk(locale) {
  return localeMeta(locale).script === 'cjk';
}

export function graphemes(text) {
  const s = String(text);
  if (typeof Intl !== 'undefined' && Intl.Segmenter) {
    const seg = new Intl.Segmenter('und', { granularity: 'grapheme' });
    return [...seg.segment(s)].map((x) => x.segment);
  }
  return [...s];
}

export function esc(s) {
  return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/"/g, '&quot;');
}

export function charSeed(seed, index) {
  return (seed * 131 + index * 97 + 17) % 10000;
}

export function fontPool(locale, genre = 'drama') {
  const base = LOCALE_FONT_POOL[locale] ?? LOCALE_FONT_POOL.en;
  const accent = GENRE_ACCENT[genre]?.[locale] ?? GENRE_ACCENT[genre]?.en ?? [];
  const seen = new Set();
  const pool = [];
  for (const f of [...accent, ...base]) {
    if (!seen.has(f.css)) { seen.add(f.css); pool.push(f); }
  }
  return pool;
}

export function pickFont(pool, seed, index) {
  return pool[charSeed(seed, index) % pool.length].css;
}

export function fontSans(locale) {
  if (locale === 'ja') return FONTS.notoSansJp.css + ", " + FONTS.notoSansKr.css + ", sans-serif";
  if (locale === 'zh-Hans') return FONTS.notoSansSc.css + ", " + FONTS.notoSansKr.css + ", sans-serif";
  if (locale === 'ko') return FONTS.notoSansKr.css + ", sans-serif";
  return FONTS.outfit.css + ", " + FONTS.bebas.css + ", sans-serif";
}

export function fontSerif(locale) {
  if (locale === 'ja') return FONTS.notoSerifJp.css + ", " + FONTS.shippori.css + ", serif";
  if (locale === 'zh-Hans') return FONTS.notoSerifSc.css + ", serif";
  if (locale === 'ko') return FONTS.gowunBatang.css + ", " + FONTS.notoSerifKr.css + ", serif";
  return FONTS.playfair.css + ", " + FONTS.cormorant.css + ", serif";
}

export function fontDisplay(locale) {
  if (isCjk(locale)) return fontPool(locale, 'action')[0]?.css ?? fontSans(locale);
  return FONTS.bebas.css + ", " + fontSans(locale);
}

export function titleSize(name, base, longBase) {
  const n = graphemes(name).length;
  if (n > 14) return longBase - 8;
  if (n > 10) return longBase;
  if (n > 7) return base - 4;
  return base;
}

export function splitLines(text, max = 9) {
  const chars = graphemes(text);
  if (chars.length <= max) return [text];
  const space = text.indexOf(' ');
  if (space > 0 && space < text.length - 2) {
    return [text.slice(0, space), text.slice(space + 1)];
  }
  const mid = Math.ceil(chars.length / 2);
  return [chars.slice(0, mid).join(''), chars.slice(mid).join('')];
}

export function typeBase(extra = '') {
  return `text-rendering:optimizeLegibility;font-kerning:normal;font-variant-ligatures:common-ligatures;${extra}`;
}

export function featuresSerif() {
  return "font-feature-settings:'kern' 1,'liga' 1,'onum' 1";
}

export function featuresDisplay() {
  return "font-feature-settings:'kern' 1,'liga' 1";
}

export function featuresCjk() {
  return "font-feature-settings:'kern' 1;font-variant-east-asian:proportional-width";
}

/** Per-character style recipe — deterministic from seed + index */
export function glyphRecipe(seed, index, baseSize, palette, mode = 'mosaic') {
  const r = charSeed(seed, index);
  const r2 = charSeed(seed, index + 41);
  const size = baseSize + (r % 17) - 8;
  const rotate = mode === 'subtle' ? (r % 5) - 2 : (r % 9) - 4;
  const y = (r2 % 7) - 3;
  const colors = ['#fff', palette.a, palette.c, palette.mix];
  const color = colors[r % colors.length];
  const weights = [600, 700, 800, 900];
  const weight = weights[r2 % weights.length];
  const italic = mode === 'romance' && r % 3 === 0;
  const gradient = mode === 'mosaic' && r % 4 === 0;
  const stroke = mode === 'stroke' || (mode === 'mosaic' && r % 5 === 0);
  const glow = mode === 'neon' || mode === 'glow' || (mode === 'mosaic' && r % 3 === 1);

  return { size, rotate, y, color, weight, italic, gradient, stroke, glow, hueShift: (r % 40) - 20 };
}

function glyphShadow(recipe, palette, mode) {
  const parts = [];
  if (recipe.glow || mode === 'neon') {
    parts.push(`0 0 12px ${palette.a}`, `0 0 28px ${palette.glow}`, `0 0 48px ${palette.b}`);
  }
  if (recipe.stroke || mode === 'stroke') {
    parts.push(`0 4px 0 ${palette.b}`, `0 6px 16px rgba(0,0,0,0.75)`);
  }
  if (mode === 'mosaic') {
    parts.push(`0 2px 8px rgba(0,0,0,0.85)`, `0 0 20px ${palette.glow}`);
  }
  if (mode === 'glow') {
    parts.push(`0 0 40px ${palette.glow}`, `0 3px 0 ${palette.b}`, `0 8px 32px rgba(0,0,0,0.8)`);
  }
  return parts.length ? `text-shadow:${parts.join(',')}` : '';
}

function glyphSpan(ch, index, opts) {
  const {
    seed, baseSize, palette, pool, locale, mode = 'mosaic', feat = '',
    display = 'inline-block',
  } = opts;
  if (ch === ' ') {
    return `<span style="display:${display};width:0.35em"></span>`;
  }
  const recipe = glyphRecipe(seed, index, baseSize, palette, mode);
  const ff = pickFont(pool, seed, index);
  const shadow = glyphShadow(recipe, palette, mode);
  const transform = `transform:rotate(${recipe.rotate}deg) translateY(${recipe.y}px)`;
  const strokeCss = recipe.stroke
    ? `-webkit-text-stroke:2px ${palette.stroke};paint-order:stroke fill;`
    : '';

  if (recipe.gradient) {
    const angle = 100 + recipe.hueShift;
    return `<span style="display:${display};font-family:${ff};font-size:${recipe.size}px;font-weight:${recipe.weight};
      font-style:${recipe.italic ? 'italic' : 'normal'};${transform};${typeBase(feat)}${strokeCss}
      background:linear-gradient(${angle}deg, ${palette.c}, ${palette.a}, #fff, ${palette.b});
      -webkit-background-clip:text;background-clip:text;-webkit-text-fill-color:transparent;
      filter:drop-shadow(0 2px 4px rgba(0,0,0,0.9))">${esc(ch)}</span>`;
  }

  return `<span style="display:${display};font-family:${ff};font-size:${recipe.size}px;font-weight:${recipe.weight};
    font-style:${recipe.italic ? 'italic' : 'normal'};color:${recipe.color};${transform};${typeBase(feat)}${strokeCss}${shadow}">${esc(ch)}</span>`;
}

/**
 * Horizontal per-glyph line — reading order preserved, each char uniquely styled.
 */
export function perCharLineHtml(text, opts) {
  const {
    seed = 0, baseSize = 80, palette, locale, genre = 'drama',
    mode = 'mosaic', align = 'center', lineHeight = 1.0, feat = '',
  } = opts;
  const pool = fontPool(locale, genre);
  const chars = graphemes(text);
  const featCss = feat || (isCjk(locale) ? featuresCjk() : featuresDisplay());
  const spans = chars.map((ch, i) => glyphSpan(ch, i, {
    seed, baseSize, palette, pool, locale, mode, feat: featCss,
  })).join('');
  const justify = align === 'left' ? 'flex-start' : align === 'right' ? 'flex-end' : 'center';
  return `<div style="display:flex;flex-wrap:wrap;align-items:baseline;justify-content:${justify};
    gap:0.04em;line-height:${lineHeight}">${spans}</div>`;
}

/**
 * Vertical per-glyph — columns top→bottom, cols right→left (CJK tradition).
 */
export function perCharVerticalHtml(text, locale, opts = {}) {
  const {
    seed = 0, baseSize = 56, palette, genre = 'drama', mode = 'mosaic',
  } = opts;
  const meta = localeMeta(locale);
  const pool = fontPool(locale, genre);
  const feat = isCjk(locale) ? featuresCjk() : featuresSerif();
  const raw = graphemes(text.replace(/\s/g, ''));

  const columns = [];
  for (let i = 0; i < raw.length; i += meta.colSize) {
    columns.push(raw.slice(i, i + meta.colSize));
  }

  const colHtml = columns.map((col, ci) => {
    const spans = col.map((ch, ri) => {
      const idx = ci * meta.colSize + ri;
      return glyphSpan(ch, idx, {
        seed, baseSize, palette, pool, locale, mode, feat,
        display: 'block',
      });
    }).join('');
    return `<div style="display:flex;flex-direction:column;align-items:center;margin-left:${ci ? '0.22em' : '0'}">${spans}</div>`;
  }).join('');

  return `<div style="display:flex;flex-direction:row-reverse;align-items:flex-start">${colHtml}</div>`;
}

/** Legacy vertical (simple) — delegates to per-char vertical */
export function verticalTextHtml(text, locale, opts = {}) {
  const { baseSize = 56, palette, genre = 'drama', seed = 0, mode = 'subtle' } = opts;
  const g = palette ?? { a: '#fff', b: '#000', c: '#fff', glow: 'transparent', stroke: '#000', mix: '#fff' };
  return perCharVerticalHtml(text, locale, { seed, baseSize, palette: g, genre, mode });
}

export function uppercaseSafe(text, locale) {
  return isCjk(locale) ? text : text.toUpperCase();
}

export function googleFontsUrl() {
  const slugs = new Set(Object.values(FONTS).map((f) => f.slug));
  return `https://fonts.googleapis.com/css2?${[...slugs].map((s) => `family=${s}`).join('&')}&display=swap`;
}

export function canvasShell(lang, body) {
  return `<!DOCTYPE html><html lang="${lang}"><head><meta charset="utf-8">
<link href="${googleFontsUrl()}" rel="stylesheet">
<style>
*{margin:0;padding:0;box-sizing:border-box}
html,body{width:680px;height:1020px;overflow:hidden;background:transparent}
.canvas{position:relative;width:680px;height:1020px;background:transparent}
</style></head><body>
<div class="canvas">${body}</div>
</body></html>`;
}