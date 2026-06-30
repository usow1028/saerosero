/**
 * v3 integrated posters — typography shares the image (background-clip, blend, knockout).
 * Not a separate text plate on top of a picture.
 */

const GENRE = {
  sf: { accent: '#5eead4', rim: 'rgba(94,234,212,0.6)' },
  fantasy: { accent: '#c4b5fd', rim: 'rgba(196,181,253,0.55)' },
  romance: { accent: '#fb7185', rim: 'rgba(251,113,133,0.5)' },
  thriller: { accent: '#ef4444', rim: 'rgba(239,68,68,0.45)' },
  drama: { accent: '#fbbf24', rim: 'rgba(251,191,36,0.5)' },
  mystery: { accent: '#818cf8', rim: 'rgba(129,140,248,0.5)' },
  action: { accent: '#f97316', rim: 'rgba(249,115,22,0.55)' },
};

export function hash(id) {
  let n = 0;
  for (const c of id) n = (n * 31 + c.charCodeAt(0)) % 9973;
  return n;
}

function esc(s) {
  return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/"/g, '&quot;');
}

function baseCss(g, bgPos) {
  return `
*{margin:0;padding:0;box-sizing:border-box}
body{width:680px;height:1020px;overflow:hidden;background:#030508}
.poster{position:relative;width:100%;height:100%;overflow:hidden}
.bg{position:absolute;inset:0;width:100%;height:100%;object-fit:cover;object-position:${bgPos}}
.imgfill{
  background-image:url("__BG__");
  background-size:680px 1020px;
  background-position:${bgPos};
  -webkit-background-clip:text;
  background-clip:text;
  -webkit-text-fill-color:transparent;
  color:transparent;
}
.rim{
  text-shadow:
    0 0 1px rgba(255,255,255,0.85),
    0 0 18px ${g.rim},
    0 2px 4px rgba(0,0,0,0.9),
    0 8px 28px rgba(0,0,0,0.75);
}
.grain{position:absolute;inset:0;opacity:0.1;mix-blend-mode:soft-light;pointer-events:none;
  background-image:url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence baseFrequency='0.9' numOctaves='3'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E")}
`;
}

const LAYOUTS = {
  imageFill(title, g, seed) {
    const ko = title.titles?.ko ?? title.id;
    const en = title.titles?.en ?? '';
    const bgPos = `center ${32 + (seed % 12)}%`;
    const size = ko.length > 8 ? 78 : 92;
    return {
      bgPos,
      filter: 'saturate(1.1) contrast(1.06)',
      body: `
<div style="position:absolute;inset:0;background:radial-gradient(ellipse 90% 80% at 50% 45%,transparent 30%,rgba(0,0,0,0.35) 100%)"></div>
<div style="position:absolute;left:4%;right:4%;top:50%;transform:translateY(-18%)">
  <div class="imgfill rim" style="font-family:'Noto Sans KR',sans-serif;font-size:${size}px;font-weight:900;line-height:0.95;letter-spacing:-0.03em">${esc(ko)}</div>
</div>
<div style="position:absolute;left:5%;bottom:8%;mix-blend-mode:soft-light">
  <div style="font-family:Outfit,sans-serif;font-size:17px;font-weight:600;letter-spacing:0.38em;text-transform:uppercase;color:rgba(255,255,255,0.75)">${esc(en)}</div>
</div>
<div style="position:absolute;right:5%;top:6%;width:3px;height:80px;background:linear-gradient(180deg,${g.accent},transparent)"></div>`,
    };
  },

  knockoutBlend(title, g, seed) {
    const ko = title.titles?.ko ?? title.id;
    const en = title.titles?.en ?? '';
    const bgPos = `center ${28 + (seed % 15)}%`;
    return {
      bgPos,
      filter: 'saturate(1.12) contrast(1.08)',
      body: `
<div style="position:absolute;inset:0;background:linear-gradient(180deg,transparent 50%,rgba(0,0,0,0.25) 100%)"></div>
<div style="position:absolute;left:0;right:0;bottom:10%;text-align:center;padding:0 4%">
  <div style="font-family:'Noto Serif KR',serif;font-size:72px;font-weight:900;line-height:1;color:#fff;
    mix-blend-mode:overlay;text-shadow:0 0 40px ${g.rim}">${esc(ko)}</div>
  <div style="font-family:Outfit,sans-serif;font-size:16px;font-weight:700;letter-spacing:0.42em;
    text-transform:uppercase;color:${g.accent};mix-blend-mode:screen;margin-top:10px">${esc(en)}</div>
</div>`,
    };
  },

  splitClip(title, g, seed) {
    const ko = title.titles?.ko ?? title.id;
    const en = title.titles?.en ?? '';
    const bgPos = `${45 + (seed % 20)}% center`;
    const mid = Math.ceil(ko.length / 2);
    const a = ko.slice(0, mid);
    const b = ko.slice(mid);
    return {
      bgPos,
      filter: 'saturate(1.08) contrast(1.1)',
      body: `
<div style="position:absolute;inset:0;background:linear-gradient(105deg,rgba(0,0,0,0.45) 0%,transparent 45%)"></div>
<div style="position:absolute;left:5%;top:12%;font-family:'Noto Sans KR',sans-serif;font-size:56px;font-weight:800;line-height:1.05">
  <span class="imgfill rim" style="display:block">${esc(a)}</span>
  <span style="display:block;margin-top:6px;color:rgba(255,255,255,0.92);-webkit-text-stroke:0;
    text-shadow:0 0 24px ${g.rim},0 4px 20px rgba(0,0,0,0.8)">${esc(b)}</span>
</div>
<div style="position:absolute;left:5%;bottom:7%;font-family:Outfit,sans-serif;font-size:15px;font-weight:600;
  letter-spacing:0.3em;text-transform:uppercase;color:${g.accent}">${esc(en)}</div>`,
    };
  },

  verticalFusion(title, g, seed) {
    const ko = title.titles?.ko ?? title.id;
    const en = title.titles?.en ?? '';
    const bgPos = '62% center';
    const chars = [...ko].map((c, i) =>
      `<span class="imgfill rim" style="display:block;margin:0.08em 0;font-size:${58 - (i % 3) * 4}px">${esc(c)}</span>`,
    ).join('');
    return {
      bgPos,
      filter: 'saturate(1.1) contrast(1.05)',
      body: `
<div style="position:absolute;inset:0;background:linear-gradient(90deg,rgba(0,0,0,0.55) 0%,transparent 42%,rgba(0,0,0,0.2) 100%)"></div>
<div style="position:absolute;left:6%;top:10%;bottom:10%;display:flex;align-items:center">
  <div style="writing-mode:vertical-rl;font-family:'Noto Serif KR',serif;font-weight:800;letter-spacing:0.12em">${chars}</div>
</div>
<div style="position:absolute;right:5%;bottom:8%;writing-mode:vertical-rl;font-family:Outfit,sans-serif;
  font-size:14px;font-weight:600;letter-spacing:0.35em;color:${g.accent};opacity:0.9">${esc(en.replace(/ /g, ''))}</div>`,
    };
  },

  bleedUnified(title, g, seed) {
    const ko = title.titles?.ko ?? title.id;
    const en = title.titles?.en ?? '';
    const bgPos = `center ${25 + (seed % 10)}%`;
    return {
      bgPos,
      filter: 'saturate(1.14) contrast(1.1) brightness(0.98)',
      body: `
<div style="position:absolute;inset:-5%;width:110%;height:110%">
  <div class="imgfill rim" style="position:absolute;left:-2%;bottom:6%;font-family:'Noto Sans KR',sans-serif;
    font-size:96px;font-weight:900;line-height:0.88;letter-spacing:-0.04em;white-space:nowrap">${esc(ko)}</div>
</div>
<div style="position:absolute;right:4%;bottom:9%;font-family:Outfit,sans-serif;font-size:14px;font-weight:700;
  letter-spacing:0.28em;text-transform:uppercase;color:#fff;mix-blend-mode:difference;opacity:0.85">${esc(en)}</div>`,
    };
  },

  duotoneMerge(title, g, seed) {
    const ko = title.titles?.ko ?? title.id;
    const en = title.titles?.en ?? '';
    const bgPos = 'center 38%';
    return {
      bgPos,
      filter: `saturate(0.85) contrast(1.15) sepia(0.15)`,
      body: `
<div style="position:absolute;inset:0;background:linear-gradient(180deg,${g.accent}18,transparent 40%,${g.accent}12);mix-blend-mode:color"></div>
<div style="position:absolute;left:50%;top:54%;transform:translate(-50%,-50%);width:92%;text-align:center">
  <div style="font-family:'Noto Sans KR',sans-serif;font-size:64px;font-weight:900;line-height:1;color:#fff;
    mix-blend-mode:soft-light;text-shadow:0 0 60px ${g.rim}">${esc(ko)}</div>
  <div style="margin:16px auto;width:50%;height:1px;background:linear-gradient(90deg,transparent,${g.accent},transparent)"></div>
  <div style="font-family:Outfit,sans-serif;font-size:18px;font-weight:600;letter-spacing:0.36em;text-transform:uppercase;
    color:${g.accent};mix-blend-mode:screen">${esc(en)}</div>
</div>`,
    };
  },
};

const KEYS = Object.keys(LAYOUTS);

export function posterHtmlV3(title, bgDataUrl) {
  const g = GENRE[title.genre] ?? GENRE.drama;
  const seed = hash(title.id);
  const key = KEYS[seed % KEYS.length];
  const layout = LAYOUTS[key](title, g, seed);
  const css = baseCss(g, layout.bgPos).replace(/__BG__/g, bgDataUrl);

  return `<!DOCTYPE html><html><head><meta charset="utf-8">
<link href="https://fonts.googleapis.com/css2?family=Noto+Sans+KR:wght@700;800;900&family=Noto+Serif+KR:wght@700;800;900&family=Outfit:wght@600;700&display=swap" rel="stylesheet">
<style>${css} .bg{filter:${layout.filter}}</style></head><body>
<div class="poster">
  <img class="bg" src="${bgDataUrl}" alt="" />
  ${layout.body}
  <div class="grain"></div>
</div></body></html>`;
}

export function layoutNameForV3(titleId) {
  return KEYS[hash(titleId) % KEYS.length];
}