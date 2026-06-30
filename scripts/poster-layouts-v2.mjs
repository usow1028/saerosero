/** Cinematic poster layout templates — varied, non-uniform key-visual treatments */

const GENRE = {
  sf: { accent: '#5eead4', sub: '#99f6e4', glow: 'rgba(94,234,212,0.45)', font: 'Outfit', serif: false },
  fantasy: { accent: '#c4b5fd', sub: '#ddd6fe', glow: 'rgba(196,181,253,0.5)', font: 'Noto Serif KR', serif: true },
  romance: { accent: '#fb7185', sub: '#fecdd3', glow: 'rgba(251,113,133,0.4)', font: 'Noto Sans KR', serif: false },
  thriller: { accent: '#ef4444', sub: '#fca5a5', glow: 'rgba(239,68,68,0.35)', font: 'Outfit', serif: false },
  drama: { accent: '#fbbf24', sub: '#fde68a', glow: 'rgba(251,191,36,0.4)', font: 'Noto Serif KR', serif: true },
  mystery: { accent: '#818cf8', sub: '#c7d2fe', glow: 'rgba(129,140,248,0.4)', font: 'Outfit', serif: false },
  action: { accent: '#f97316', sub: '#fdba74', glow: 'rgba(249,115,22,0.45)', font: 'Outfit', serif: false },
};

export function hash(id) {
  let n = 0;
  for (const c of id) n = (n * 31 + c.charCodeAt(0)) % 9973;
  return n;
}

function splitKo(ko) {
  if (ko.length <= 4) return { main: ko, sub: '' };
  if (ko.length <= 7) return { main: ko.slice(0, Math.ceil(ko.length / 2)), sub: ko.slice(Math.ceil(ko.length / 2)) };
  const cut = ko.includes(' ') ? ko.indexOf(' ') + 1 : Math.ceil(ko.length / 2);
  return { main: ko.slice(0, cut).trim(), sub: ko.slice(cut).trim() };
}

function baseCss(g) {
  return `
*{margin:0;padding:0;box-sizing:border-box}
body{width:680px;height:1020px;overflow:hidden;background:#050810}
.poster{position:relative;width:100%;height:100%;overflow:hidden}
.bg{position:absolute;inset:0;width:100%;height:100%;object-fit:cover;display:block}
.grain{position:absolute;inset:0;opacity:0.14;mix-blend-mode:overlay;pointer-events:none;
  background-image:url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E")}
.ko{font-family:'${g.font}',${g.serif ? 'serif' : 'sans-serif'}}
.en{font-family:'Outfit',sans-serif}
.stroke{-webkit-text-stroke:1.5px rgba(0,0,0,0.55);paint-order:stroke fill}
`;
}

const LAYOUTS = {
  cinematic(title, g, bg, seed) {
    const ko = title.titles?.ko ?? title.id;
    const en = title.titles?.en ?? '';
    const { main, sub } = splitKo(ko);
    const size = ko.length > 8 ? 64 : 76;
    const pos = seed % 3;
    const bgPos = ['center 35%', 'center 42%', 'center 28%'][pos];
    return {
      bgStyle: `object-position:${bgPos};filter:saturate(1.12) contrast(1.08) brightness(0.95)`,
      html: `
<div class="shade" style="position:absolute;inset:0;background:linear-gradient(180deg,rgba(0,0,0,0.15) 0%,transparent 35%,transparent 55%,rgba(0,0,0,0.75) 78%,rgba(0,0,0,0.95) 100%)"></div>
<div class="leak" style="position:absolute;right:-10%;top:15%;width:55%;height:55%;background:radial-gradient(circle,${g.glow} 0%,transparent 65%);filter:blur(30px)"></div>
<div style="position:absolute;left:-4%;bottom:8%;width:108%;transform:rotate(-2.5deg);transform-origin:left bottom">
  <div class="ko stroke" style="font-size:${size}px;font-weight:800;line-height:0.95;letter-spacing:-0.02em;color:#fff;
    text-shadow:0 0 60px ${g.glow},0 4px 0 rgba(0,0,0,0.4),0 12px 40px rgba(0,0,0,0.8)">${main}</div>
  ${sub ? `<div class="ko" style="font-size:${size * 0.72}px;font-weight:700;margin-top:4px;color:${g.accent};
    text-shadow:0 2px 20px rgba(0,0,0,0.9)">${sub}</div>` : ''}
  <div class="en" style="margin-top:14px;font-size:20px;font-weight:600;letter-spacing:0.32em;text-transform:uppercase;color:${g.sub};
    text-shadow:0 2px 8px rgba(0,0,0,0.9)">${en}</div>
</div>
<div style="position:absolute;top:5%;right:5%;font:700 9px/1 Outfit;letter-spacing:0.25em;color:${g.accent};
  padding:6px 10px;border-left:3px solid ${g.accent};background:linear-gradient(90deg,rgba(0,0,0,0.5),transparent)">INTERACTIVE</div>`,
    };
  },

  verticalRail(title, g, bg, seed) {
    const ko = title.titles?.ko ?? title.id;
    const en = title.titles?.en ?? '';
    const chars = [...ko].map((c) => `<span style="display:block;margin:0.12em 0">${c}</span>`).join('');
    return {
      bgStyle: `object-position:65% center;filter:saturate(1.1) contrast(1.06)`,
      html: `
<div style="position:absolute;inset:0;background:linear-gradient(90deg,rgba(0,0,0,0.82) 0%,rgba(0,0,0,0.45) 28%,transparent 52%)"></div>
<div style="position:absolute;left:5%;top:8%;bottom:12%;display:flex;flex-direction:column;justify-content:flex-end">
  <div class="ko" style="writing-mode:vertical-rl;font-size:52px;font-weight:700;letter-spacing:0.15em;color:#fff;
    text-shadow:0 0 30px ${g.glow},2px 0 8px rgba(0,0,0,0.8);border-right:2px solid ${g.accent};padding-right:18px">${chars}</div>
</div>
<div style="position:absolute;left:5%;bottom:6%;right:40%">
  <div class="en" style="font-size:18px;font-weight:700;letter-spacing:0.28em;text-transform:uppercase;color:${g.sub}">${en}</div>
</div>
<div style="position:absolute;bottom:6%;right:5%;width:80px;height:3px;background:linear-gradient(90deg,transparent,${g.accent})"></div>`,
    };
  },

  diagonalSweep(title, g, bg, seed) {
    const ko = title.titles?.ko ?? title.id;
    const en = title.titles?.en ?? '';
    const angle = -6 - (seed % 4);
    return {
      bgStyle: `object-position:center 30%;filter:saturate(1.15) contrast(1.1)`,
      html: `
<div style="position:absolute;inset:0;background:linear-gradient(${angle + 90}deg,transparent 40%,rgba(0,0,0,0.6) 70%,rgba(0,0,0,0.92) 100%)"></div>
<div style="position:absolute;left:-8%;right:-8%;bottom:18%;height:38%;background:linear-gradient(90deg,${g.accent}22,transparent 60%);
  transform:skewY(${angle * 0.3}deg);transform-origin:left"></div>
<div style="position:absolute;left:4%;right:4%;bottom:14%;transform:rotate(${angle}deg);transform-origin:left bottom">
  <div class="ko stroke" style="font-size:68px;font-weight:800;line-height:0.92;color:#fff;
    text-shadow:0 8px 32px rgba(0,0,0,0.85)">${ko}</div>
  <div class="en" style="margin-top:8px;font-size:22px;font-weight:700;letter-spacing:0.35em;color:${g.accent}">${en}</div>
</div>`,
    };
  },

  watermark(title, g, bg, seed) {
    const ko = title.titles?.ko ?? title.id;
    const en = title.titles?.en ?? '';
    const wm = ko.replace(/\s/g, '').slice(0, 3);
    return {
      bgStyle: `object-position:center 38%;filter:saturate(1.08) contrast(1.05) brightness(1.02)`,
      html: `
<div style="position:absolute;inset:0;background:radial-gradient(ellipse 80% 60% at 50% 40%,transparent 20%,rgba(0,0,0,0.55) 100%)"></div>
<div class="ko" style="position:absolute;left:50%;top:42%;transform:translate(-50%,-50%);font-size:220px;font-weight:900;
  color:transparent;-webkit-text-stroke:2px rgba(255,255,255,0.08);opacity:0.9;letter-spacing:-0.05em">${wm}</div>
<div style="position:absolute;left:6%;right:6%;bottom:10%;text-align:center">
  <div class="ko" style="font-size:58px;font-weight:800;line-height:1;color:#fff;
    text-shadow:0 0 40px ${g.glow},0 4px 24px rgba(0,0,0,0.9)">${ko}</div>
  <div style="width:60px;height:2px;background:${g.accent};margin:14px auto"></div>
  <div class="en" style="font-size:19px;font-weight:500;letter-spacing:0.4em;text-transform:uppercase;color:${g.sub}">${en}</div>
</div>`,
    };
  },

  edgeBleed(title, g, bg, seed) {
    const ko = title.titles?.ko ?? title.id;
    const en = title.titles?.en ?? '';
    const { main, sub } = splitKo(ko);
    return {
      bgStyle: `object-position:70% 25%;filter:saturate(1.14) contrast(1.12)`,
      html: `
<div style="position:absolute;inset:0;background:linear-gradient(0deg,rgba(0,0,0,0.9) 0%,transparent 45%,rgba(0,0,0,0.25) 100%)"></div>
<div style="position:absolute;left:-6%;bottom:6%;width:112%">
  <div class="ko stroke" style="font-size:88px;font-weight:900;line-height:0.88;letter-spacing:-0.03em;color:#fff;
    text-shadow:0 0 80px ${g.glow}">${main}</div>
  ${sub ? `<div class="ko" style="font-size:52px;font-weight:700;margin-left:8%;color:${g.accent};
    text-shadow:0 4px 20px rgba(0,0,0,0.8)">${sub}</div>` : ''}
</div>
<div class="en" style="position:absolute;right:5%;bottom:7%;font-size:16px;font-weight:700;letter-spacing:0.22em;
  writing-mode:vertical-rl;text-transform:uppercase;color:${g.sub};opacity:0.85">${en.replace(/ /g, '\n')}</div>
<div style="position:absolute;top:0;left:0;right:0;height:4px;background:linear-gradient(90deg,${g.accent},transparent)"></div>`,
    };
  },

  logoLockup(title, g, bg, seed) {
    const ko = title.titles?.ko ?? title.id;
    const en = title.titles?.en ?? '';
    return {
      bgStyle: `object-position:center 32%;filter:saturate(1.1) contrast(1.08)`,
      html: `
<div style="position:absolute;inset:0;background:linear-gradient(180deg,rgba(0,0,0,0.35) 0%,transparent 30%,rgba(0,0,0,0.5) 65%,rgba(0,0,0,0.92) 100%)"></div>
<div style="position:absolute;left:50%;bottom:12%;transform:translateX(-50%);width:88%;text-align:center;
  padding:28px 20px 22px;background:linear-gradient(180deg,rgba(0,0,0,0.25),rgba(0,0,0,0.65));
  border:1px solid rgba(255,255,255,0.12);border-radius:2px;backdrop-filter:blur(2px)">
  <div class="ko" style="font-size:${ko.length > 7 ? 48 : 56}px;font-weight:800;line-height:1.05;color:#fff;
    text-shadow:0 2px 24px ${g.glow}">${ko}</div>
  <div style="display:flex;align-items:center;justify-content:center;gap:12px;margin-top:12px">
    <span style="width:24px;height:1px;background:${g.accent}"></span>
    <span class="en" style="font-size:15px;font-weight:600;letter-spacing:0.3em;text-transform:uppercase;color:${g.sub}">${en}</span>
    <span style="width:24px;height:1px;background:${g.accent}"></span>
  </div>
</div>
<div style="position:absolute;top:6%;left:6%;font:800 56px/1 Outfit;color:rgba(255,255,255,0.06);letter-spacing:-0.04em">${title.genre.toUpperCase()}</div>`,
    };
  },
};

const LAYOUT_KEYS = Object.keys(LAYOUTS);

export function posterHtmlV2(title, bgDataUrl) {
  const g = GENRE[title.genre] ?? GENRE.drama;
  const seed = hash(title.id);
  const layoutKey = LAYOUT_KEYS[seed % LAYOUT_KEYS.length];
  const layout = LAYOUTS[layoutKey](title, g, bgDataUrl, seed);

  return `<!DOCTYPE html><html><head><meta charset="utf-8">
<link href="https://fonts.googleapis.com/css2?family=Noto+Sans+KR:wght@400;500;700;900&family=Noto+Serif+KR:wght@600;700;900&family=Outfit:wght@500;600;700;800;900&display=swap" rel="stylesheet">
<style>${baseCss(g)} .bg{${layout.bgStyle}}</style></head><body>
<div class="poster">
  <img class="bg" src="${bgDataUrl}" alt="" />
  ${layout.html}
  <div class="grain"></div>
</div></body></html>`;
}

export function layoutNameFor(titleId) {
  return LAYOUT_KEYS[hash(titleId) % LAYOUT_KEYS.length];
}