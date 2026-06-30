/**
 * Typography engine for poster title art (Playwright → PNG).
 *
 * Stack: Chromium layout + CSS Typography L3/4 + Google/Noto variable fonts.
 * Not pure "CSS tricks" — locale script, reading order, optical sizing,
 * and OpenType features are first-class.
 */

export const LOCALE_META = {
  ko: { lang: 'ko', script: 'cjk', dir: 'ltr', colSize: 5 },
  ja: { lang: 'ja', script: 'cjk', dir: 'ltr', colSize: 5 },
  'zh-Hans': { lang: 'zh-Hans', script: 'cjk', dir: 'ltr', colSize: 5 },
  en: { lang: 'en', script: 'latin', dir: 'ltr', colSize: 8 },
  es: { lang: 'es', script: 'latin', dir: 'ltr', colSize: 8 },
  'pt-BR': { lang: 'pt-BR', script: 'latin', dir: 'ltr', colSize: 8 },
};

export function localeMeta(locale) {
  return LOCALE_META[locale] ?? LOCALE_META.en;
}

export function isCjk(locale) {
  return localeMeta(locale).script === 'cjk';
}

/** Grapheme-safe split (handles surrogate pairs, combining marks) */
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

export function fontSans(locale) {
  if (locale === 'ja') return "'Noto Sans JP', 'Noto Sans KR', system-ui, sans-serif";
  if (locale === 'zh-Hans') return "'Noto Sans SC', 'Noto Sans KR', system-ui, sans-serif";
  if (locale === 'ko') return "'Noto Sans KR', system-ui, sans-serif";
  return "'Outfit', 'Bebas Neue', system-ui, sans-serif";
}

export function fontSerif(locale) {
  if (locale === 'ja') return "'Noto Serif JP', 'Noto Serif KR', Georgia, serif";
  if (locale === 'zh-Hans') return "'Noto Serif SC', 'Noto Serif KR', Georgia, serif";
  if (locale === 'ko') return "'Noto Serif KR', Georgia, serif";
  return "'Playfair Display', 'Noto Serif KR', Georgia, serif";
}

export function fontDisplay(locale) {
  if (isCjk(locale)) return fontSans(locale);
  return "'Bebas Neue', " + fontSans(locale);
}

/** Optical title size from grapheme count */
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

/** OpenType + rendering defaults per treatment */
export function typeBase(extra = '') {
  return `text-rendering:optimizeLegibility;font-kerning:normal;font-variant-ligatures:common-ligatures;${extra}`;
}

export function featuresSerif() {
  return "font-feature-settings:'kern' 1,'liga' 1,'onum' 1";
}

export function featuresDisplay() {
  return "font-feature-settings:'kern' 1,'liga' 1,'ss01' 1";
}

export function featuresCjk() {
  return "font-feature-settings:'kern' 1;font-variant-east-asian:proportional-width";
}

/**
 * Vertical text — reading order preserved.
 * CJK: columns right→left, each column top→bottom (traditional poster).
 * Latin: single column top→bottom per word, or letter-stack for short titles.
 */
export function verticalTextHtml(text, locale, opts = {}) {
  const { baseSize = 56, fontFamily, color = '#fff', glow = '', stroke = '' } = opts;
  const meta = localeMeta(locale);
  const ff = fontFamily ?? fontSerif(locale);
  const feat = isCjk(locale) ? featuresCjk() : featuresSerif();

  if (meta.script === 'latin') {
    const words = text.trim().split(/\s+/).filter(Boolean);
    if (words.length > 1) {
      const cols = words.map((word, wi) => {
        const letters = graphemes(word);
        const spans = letters.map((ch, i) =>
          `<span style="display:block;line-height:0.92;font-size:${baseSize - (i % 3) * 3}px">${esc(ch)}</span>`,
        ).join('');
        return `<div style="display:flex;flex-direction:column;align-items:center;margin-left:${wi ? '0.35em' : '0'}">${spans}</div>`;
      }).join('');
      return `<div style="display:flex;flex-direction:row-reverse;align-items:flex-start;gap:0.1em;font-family:${ff};font-weight:700;color:${color};${typeBase(feat)}${stroke}${glow}">${cols}</div>`;
    }
    const letters = graphemes(text.replace(/\s/g, ''));
    const spans = letters.map((ch, i) =>
      `<span style="display:block;line-height:0.9;font-size:${baseSize - (i % 4) * 3}px">${esc(ch)}</span>`,
    ).join('');
    return `<div style="display:flex;flex-direction:column;align-items:center;font-family:${ff};font-weight:700;color:${color};${typeBase(feat)}${stroke}${glow}">${spans}</div>`;
  }

  // CJK — strip spaces, split into columns, preserve forward reading order
  const chars = graphemes(text.replace(/\s/g, ''));
  const colSize = meta.colSize;
  const columns = [];
  for (let i = 0; i < chars.length; i += colSize) {
    columns.push(chars.slice(i, i + colSize));
  }

  const colHtml = columns.map((col, ci) => {
    const spans = col.map((ch, i) =>
      `<span style="display:block;line-height:1.02;font-size:${baseSize - (i % 4) * 4}px;text-orientation:upright">${esc(ch)}</span>`,
    ).join('');
    return `<div style="display:flex;flex-direction:column;align-items:center;margin-left:${ci ? '0.28em' : '0'}">${spans}</div>`;
  }).join('');

  return `<div style="display:flex;flex-direction:row-reverse;align-items:flex-start;font-family:${ff};font-weight:700;color:${color};
    ${typeBase(feat)}${stroke}${glow}">${colHtml}</div>`;
}

export function uppercaseSafe(text, locale) {
  return isCjk(locale) ? text : text.toUpperCase();
}

export function googleFontsUrl() {
  return 'https://fonts.googleapis.com/css2'
    + '?family=Bebas+Neue'
    + '&family=Noto+Sans+JP:wght@700;800;900'
    + '&family=Noto+Sans+KR:wght@700;800;900'
    + '&family=Noto+Sans+SC:wght@700;800;900'
    + '&family=Noto+Serif+JP:wght@600;700'
    + '&family=Noto+Serif+KR:wght@600;700'
    + '&family=Noto+Serif+SC:wght@600;700'
    + '&family=Outfit:wght@600;700;800;900'
    + '&family=Playfair+Display:ital,wght@0,500;0,600;0,700;1,500'
    + '&family=Syne:wght@700;800'
    + '&display=swap';
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