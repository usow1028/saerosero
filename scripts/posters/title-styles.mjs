/**
 * Title-only art layers — transparent canvas, Photoshop-style CSS treatments.
 * Each style is a full 680×1020 overlay; only title graphics are visible.
 */

export const TITLE_STYLES = [
  'cinematic-glow',
  'neon-sign',
  'gold-foil',
  'chrome-block',
  'vertical-elegant',
  'impact-stack',
  'glitch-rgb',
  'romance-script',
  'noir-cut',
  'anime-bold',
];

export const LOCALES = ['ko', 'en', 'ja', 'zh-Hans', 'es', 'pt-BR'];

const GENRE = {
  sf: { a: '#5eead4', b: '#0e7490', c: '#ecfeff' },
  fantasy: { a: '#c4b5fd', b: '#6d28d9', c: '#f5f3ff' },
  romance: { a: '#fb7185', b: '#be123c', c: '#ffe4e6' },
  thriller: { a: '#f87171', b: '#450a0a', c: '#fecaca' },
  drama: { a: '#fbbf24', b: '#92400e', c: '#fef3c7' },
  mystery: { a: '#a5b4fc', b: '#4338ca', c: '#e0e7ff' },
  action: { a: '#fb923c', b: '#c2410c', c: '#ffedd5' },
};

export function hash(id) {
  let n = 0;
  for (const c of id) n = (n * 31 + c.charCodeAt(0)) % 9973;
  return n;
}

function esc(s) {
  return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/"/g, '&quot;');
}

function fontFor(locale) {
  if (locale === 'ja') return "'Noto Sans JP', 'Noto Sans KR', sans-serif";
  if (locale === 'zh-Hans') return "'Noto Sans SC', 'Noto Sans KR', sans-serif";
  if (locale === 'ko') return "'Noto Sans KR', sans-serif";
  return "'Outfit', 'Bebas Neue', sans-serif";
}

function serifFor(locale) {
  if (locale === 'ja') return "'Noto Serif JP', 'Noto Serif KR', serif";
  if (locale === 'zh-Hans') return "'Noto Serif SC', 'Noto Serif KR', serif";
  if (locale === 'ko') return "'Noto Serif KR', serif";
  return "'Playfair Display', 'Noto Serif KR', serif";
}

function titleText(title, locale) {
  return title.titles?.[locale] ?? title.titles?.en ?? title.titles?.ko ?? title.id;
}

function splitLines(text, max = 9) {
  if (text.length <= max) return [text];
  const mid = Math.ceil(text.length / 2);
  const space = text.indexOf(' ');
  if (space > 0 && space < text.length - 2) {
    return [text.slice(0, space), text.slice(space + 1)];
  }
  return [text.slice(0, mid), text.slice(mid)];
}

export function styleForTitle(titleId) {
  return TITLE_STYLES[hash(titleId) % TITLE_STYLES.length];
}

const RENDERERS = {
  'cinematic-glow'(name, g, locale) {
    const lines = splitLines(name, 8);
    const size = name.length > 10 ? 56 : 68;
    const ff = fontFor(locale);
    return `
<div style="position:absolute;left:5%;right:5%;bottom:9%">
  ${lines.map((line, i) => `<div style="font-family:${ff};font-size:${size - i * 6}px;font-weight:900;line-height:0.95;color:#fff;
    text-shadow:0 0 40px ${g.a},0 2px 0 ${g.b},0 4px 0 rgba(0,0,0,0.5),0 8px 32px rgba(0,0,0,0.85),
    0 0 80px ${g.a}55;-webkit-text-stroke:1px rgba(255,255,255,0.15)">${esc(line)}</div>`).join('')}
</div>`;
  },

  'neon-sign'(name, g, locale) {
    const ff = fontFor(locale);
    const size = name.length > 9 ? 50 : 60;
    return `
<div style="position:absolute;left:50%;top:52%;transform:translate(-50%,-50%);text-align:center;width:92%">
  <div style="font-family:${ff};font-size:${size}px;font-weight:900;color:${g.a};
    text-shadow:0 0 7px #fff,0 0 12px ${g.a},0 0 28px ${g.a},0 0 56px ${g.b},0 0 90px ${g.b}">${esc(name)}</div>
</div>`;
  },

  'gold-foil'(name, g, locale) {
    const ff = serifFor(locale);
    return `
<div style="position:absolute;left:6%;right:6%;bottom:11%;text-align:center">
  <div style="font-family:${ff};font-size:${name.length > 8 ? 48 : 56}px;font-weight:700;
    background:linear-gradient(165deg,${g.c} 0%,${g.a} 35%,${g.b} 70%,${g.c} 100%);
    -webkit-background-clip:text;-webkit-text-fill-color:transparent;
    filter:drop-shadow(0 2px 4px rgba(0,0,0,0.9)) drop-shadow(0 0 24px ${g.a}66)">${esc(name)}</div>
</div>`;
  },

  'chrome-block'(name, g, locale) {
    const ff = "'Bebas Neue', " + fontFor(locale);
    return `
<div style="position:absolute;left:-2%;right:-2%;bottom:7%;text-align:center;transform:rotate(-1.5deg)">
  <div style="font-family:${ff};font-size:${name.length > 12 ? 52 : 64}px;font-weight:400;letter-spacing:0.04em;
    color:#e8e8e8;text-shadow:0 1px 0 #fff,0 3px 0 #999,0 5px 0 #666,0 7px 0 #333,0 9px 18px rgba(0,0,0,0.8),
    0 0 40px ${g.a}44">${esc(name.toUpperCase())}</div>
</div>`;
  },

  'vertical-elegant'(name, g, locale) {
    const ff = serifFor(locale);
    const chars = [...name].map((c, i) =>
      `<span style="display:block;margin:0.1em 0;font-size:${52 - (i % 4) * 3}px">${esc(c)}</span>`,
    ).join('');
    return `
<div style="position:absolute;left:7%;top:12%;bottom:15%;display:flex;align-items:center">
  <div style="writing-mode:vertical-rl;font-family:${ff};font-weight:700;color:#fff;
    text-shadow:0 0 20px ${g.a},2px 0 12px rgba(0,0,0,0.8);border-right:3px solid ${g.a};padding-right:16px">${chars}</div>
</div>`;
  },

  'impact-stack'(name, g, locale) {
    const lines = splitLines(name, 7);
    const ff = fontFor(locale);
    return `
<div style="position:absolute;left:4%;bottom:8%;transform:rotate(-3deg);transform-origin:left bottom">
  ${lines.map((line, i) => `<div style="font-family:${ff};font-size:${64 - i * 14}px;font-weight:900;line-height:0.9;
    color:${i === 0 ? '#fff' : g.a};-webkit-text-stroke:2px rgba(0,0,0,0.65);
    text-shadow:4px 4px 0 ${g.b},0 0 30px ${g.a}55">${esc(line)}</div>`).join('')}
</div>`;
  },

  'glitch-rgb'(name, g, locale) {
    const ff = fontFor(locale);
    const size = name.length > 9 ? 46 : 54;
    return `
<div style="position:absolute;left:5%;bottom:12%">
  <div style="font-family:${ff};font-size:${size}px;font-weight:800;color:#fff;position:relative">
    <span style="position:absolute;left:0;top:0;color:#0ff;opacity:0.85;transform:translate(-3px,-1px)">${esc(name)}</span>
    <span style="position:absolute;left:0;top:0;color:#f0f;opacity:0.85;transform:translate(3px,1px)">${esc(name)}</span>
    <span style="position:relative">${esc(name)}</span>
  </div>
</div>`;
  },

  'romance-script'(name, g, locale) {
    const ff = serifFor(locale);
    return `
<div style="position:absolute;left:8%;right:8%;top:48%;text-align:center">
  <div style="font-family:${ff};font-style:italic;font-size:${name.length > 9 ? 40 : 48}px;font-weight:500;color:#fff;
    text-shadow:0 2px 24px ${g.b},0 0 40px ${g.a}44">${esc(name)}</div>
  <div style="width:60px;height:2px;background:linear-gradient(90deg,transparent,${g.a},transparent);margin:12px auto"></div>
</div>`;
  },

  'noir-cut'(name, g, locale) {
    const ff = fontFor(locale);
    return `
<div style="position:absolute;left:6%;bottom:10%">
  <div style="font-family:${ff};font-size:${name.length > 9 ? 44 : 52}px;font-weight:800;color:#f5f5f5;
    letter-spacing:0.06em;text-transform:uppercase;
    box-decoration-break:clone;-webkit-box-decoration-break:clone;
    background:${g.b};padding:8px 14px;box-shadow:6px 6px 0 ${g.a}">${esc(name)}</div>
</div>`;
  },

  'anime-bold'(name, g, locale) {
    const lines = splitLines(name, 6);
    const ff = fontFor(locale);
    const size = name.length > 8 ? 54 : 62;
    return `
<div style="position:absolute;left:4%;right:4%;bottom:7%;text-align:center">
  ${lines.map((line) => `<div style="font-family:${ff};font-size:${size}px;font-weight:900;line-height:1.05;color:#fff;
    -webkit-text-stroke:3px ${g.b};paint-order:stroke fill;
    text-shadow:0 0 24px ${g.a},0 4px 0 ${g.b},0 6px 16px rgba(0,0,0,0.7)">${esc(line)}</div>`).join('')}
</div>`;
  },
};

export function titleArtHtml(title, locale, styleKey) {
  const g = GENRE[title.genre] ?? GENRE.drama;
  const name = titleText(title, locale);
  const render = RENDERERS[styleKey] ?? RENDERERS['cinematic-glow'];
  const body = render(name, g, locale);

  return `<!DOCTYPE html><html><head><meta charset="utf-8">
<link href="https://fonts.googleapis.com/css2?family=Bebas+Neue&family=Noto+Sans+JP:wght@700;900&family=Noto+Sans+KR:wght@700;900&family=Noto+Sans+SC:wght@700;900&family=Noto+Serif+JP:wght@600;700&family=Noto+Serif+KR:wght@600;700&family=Outfit:wght@600;700;800;900&family=Playfair+Display:ital,wght@0,500;0,600;1,500&display=swap" rel="stylesheet">
<style>
*{margin:0;padding:0;box-sizing:border-box}
html,body{width:680px;height:1020px;overflow:hidden;background:transparent}
.canvas{position:relative;width:680px;height:1020px;background:transparent}
</style></head><body>
<div class="canvas">${body}</div>
</body></html>`;
}