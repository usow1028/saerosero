/**
 * v4 — 22 real-world-inspired poster styles (film / K-drama / anime / editorial).
 * Each layout is a distinct art direction, not just typography tweaks.
 */

const GENRE = {
  sf: { a: '#22d3ee', b: '#0e7490', c: '#67e8f9', mood: 'cool' },
  fantasy: { a: '#a78bfa', b: '#5b21b6', c: '#ddd6fe', mood: 'magic' },
  romance: { a: '#fb7185', b: '#9f1239', c: '#fecdd3', mood: 'warm' },
  thriller: { a: '#ef4444', b: '#1c1917', c: '#fca5a5', mood: 'dark' },
  drama: { a: '#fbbf24', b: '#78350f', c: '#fde68a', mood: 'human' },
  mystery: { a: '#818cf8', b: '#312e81', c: '#c7d2fe', mood: 'eerie' },
  action: { a: '#f97316', b: '#7c2d12', c: '#fdba74', mood: 'fire' },
};

export function hash(id) {
  let n = 0;
  for (const c of id) n = (n * 31 + c.charCodeAt(0)) % 9973;
  return n;
}

function esc(s) {
  return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/"/g, '&quot;');
}

function meta(title) {
  const g = GENRE[title.genre] ?? GENRE.drama;
  const seed = hash(title.id);
  const ko = title.titles?.ko ?? title.id;
  const en = title.titles?.en ?? '';
  const log = title.logline?.en ?? '';
  const tag = log.length > 60 ? `${log.slice(0, 57)}…` : log;
  return { g, seed, ko, en, tag };
}

function wrap(bgDataUrl, bgPos, filter, inner, extraCss = '') {
  return {
    bgPos,
    filter,
    html: `<!DOCTYPE html><html><head><meta charset="utf-8">
<link href="https://fonts.googleapis.com/css2?family=Bebas+Neue&family=Noto+Sans+KR:wght@400;700;900&family=Noto+Serif+KR:wght@500;700&family=Outfit:wght@400;600;700;800&family=Playfair+Display:ital,wght@0,600;1,500&display=swap" rel="stylesheet">
<style>
*{margin:0;padding:0;box-sizing:border-box}
body{width:680px;height:1020px;overflow:hidden;background:#050508}
.poster{position:relative;width:100%;height:100%;overflow:hidden}
.bg{position:absolute;inset:0;width:100%;height:100%;object-fit:cover;object-position:${bgPos};filter:${filter}}
${extraCss}
</style></head><body><div class="poster">
<img class="bg" src="${bgDataUrl}" alt="" />${inner}</div></body></html>`,
  };
}

const LAYOUTS = {
  animeKeyVisual(title, bg) {
    const { g, ko, en } = meta(title);
    return wrap(bg, 'center 28%', 'saturate(1.2) contrast(1.08) brightness(1.02)', `
<div style="position:absolute;inset:0;background:linear-gradient(180deg,transparent 25%,${g.b}88 55%,${g.b}ee 100%)"></div>
<div style="position:absolute;inset:0;background:radial-gradient(circle at 80% 15%,${g.a}44,transparent 40%)"></div>
${[...Array(8)].map((_, i) => `<div style="position:absolute;left:${10 + i * 11}%;top:${8 + (i % 3) * 5}%;width:4px;height:4px;background:#fff;border-radius:50%;opacity:0.6"></div>`).join('')}
<div style="position:absolute;left:5%;right:5%;bottom:6%;text-align:center">
  <div style="font-family:'Noto Sans KR',sans-serif;font-size:58px;font-weight:900;line-height:1;color:#fff;
    text-shadow:0 0 30px ${g.a},0 3px 0 ${g.b},0 6px 20px rgba(0,0,0,0.8)">${esc(ko)}</div>
  <div style="margin-top:8px;font-family:'Bebas Neue',sans-serif;font-size:26px;letter-spacing:0.35em;color:${g.c}">${esc(en)}</div>
</div>
<div style="position:absolute;top:5%;right:5%;padding:4px 10px;border:2px solid ${g.a};font:700 10px Outfit;color:${g.a};letter-spacing:0.2em">INTERACTIVE</div>`, `
.stars{position:absolute;width:100%;height:100%;pointer-events:none}`);
  },

  koreanDrama(title, bg) {
    const { g, ko, en, tag } = meta(title);
    return wrap(bg, 'center 35%', 'saturate(0.95) contrast(1.02) brightness(1.05) blur(0px)', `
<div style="position:absolute;inset:0;background:linear-gradient(180deg,rgba(255,255,255,0.08) 0%,transparent 40%,rgba(20,10,30,0.85) 100%)"></div>
<div style="position:absolute;inset:0;backdrop-filter:blur(0px)"></div>
<div style="position:absolute;left:8%;right:8%;bottom:12%">
  <div style="font-family:'Noto Serif KR',serif;font-size:52px;font-weight:700;line-height:1.2;color:#fff;letter-spacing:-0.02em">${esc(ko)}</div>
  <div style="width:40px;height:1px;background:${g.a};margin:14px 0"></div>
  <div style="font-family:'Playfair Display',serif;font-style:italic;font-size:16px;color:rgba(255,255,255,0.75);line-height:1.4">${esc(tag)}</div>
  <div style="margin-top:12px;font-family:Outfit;font-size:13px;letter-spacing:0.25em;color:${g.c};text-transform:uppercase">${esc(en)}</div>
</div>`);
  },

  blockbuster(title, bg) {
    const { g, ko, en } = meta(title);
    return wrap(bg, 'center 30%', 'saturate(1.25) contrast(1.15) hue-rotate(-8deg)', `
<div style="position:absolute;inset:0;background:linear-gradient(180deg,rgba(0,40,80,0.4) 0%,transparent 35%,rgba(0,0,0,0.9) 75%)"></div>
<div style="position:absolute;left:4%;right:4%;bottom:8%;text-align:center">
  <div style="font-family:'Bebas Neue',sans-serif;font-size:82px;line-height:0.9;color:#fff;
    text-shadow:0 4px 0 ${g.b},0 8px 0 rgba(0,0,0,0.5),0 0 60px ${g.a}">${esc(ko)}</div>
  <div style="font-family:Outfit;font-size:20px;font-weight:800;letter-spacing:0.5em;color:${g.a};margin-top:6px">${esc(en)}</div>
</div>`);
  },

  minimalSwiss(title, bg) {
    const { g, ko, en, seed } = meta(title);
    const top = seed % 2 === 0;
    return wrap(bg, 'center center', 'saturate(0.7) contrast(1.1)', `
<div style="position:absolute;inset:0;background:${g.b}"></div>
<div style="position:absolute;${top ? 'top:18%' : 'bottom:22%'};left:10%;right:10%;height:38%;overflow:hidden;border-radius:2px">
  <img src="${bg}" style="width:100%;height:100%;object-fit:cover;object-position:center 35%;filter:saturate(1.3)" />
</div>
<div style="position:absolute;${top ? 'bottom:10%' : 'top:8%'};left:8%;right:8%">
  <div style="font-family:Outfit;font-size:${ko.length > 6 ? 48 : 56}px;font-weight:800;line-height:1;color:#fff;letter-spacing:-0.03em">${esc(ko)}</div>
  <div style="font-family:Outfit;font-size:14px;font-weight:600;letter-spacing:0.3em;color:${g.a};margin-top:10px">${esc(en)}</div>
</div>`);
  },

  noirThriller(title, bg) {
    const { g, ko, en } = meta(title);
    return wrap(bg, 'center 40%', 'grayscale(1) contrast(1.35) brightness(0.85)', `
<div style="position:absolute;inset:0;background:repeating-linear-gradient(0deg,transparent,transparent 3px,rgba(0,0,0,0.15) 3px,rgba(0,0,0,0.15) 4px)"></div>
<div style="position:absolute;inset:0;background:radial-gradient(ellipse at 50% 80%,transparent 30%,rgba(0,0,0,0.8) 100%)"></div>
<div style="position:absolute;left:6%;bottom:10%">
  <div style="font-family:'Noto Serif KR',serif;font-size:48px;font-weight:700;color:#fff;line-height:1.1">${esc(ko)}</div>
  <div style="font-family:'Bebas Neue';font-size:36px;color:${g.a};letter-spacing:0.15em;margin-top:6px">${esc(en)}</div>
</div>`);
  },

  retroSynthwave(title, bg) {
    const { g, ko, en } = meta(title);
    return wrap(bg, 'center 50%', 'saturate(1.3) hue-rotate(240deg) contrast(1.1)', `
<div style="position:absolute;inset:0;background:linear-gradient(180deg,#1a0a2e 0%,transparent 30%,#ff6b9d44 70%,#ffc37155 100%)"></div>
<div style="position:absolute;bottom:25%;left:0;right:0;height:35%;background:linear-gradient(180deg,transparent,${g.a}22);
  transform:perspective(400px) rotateX(65deg);transform-origin:bottom"></div>
<div style="position:absolute;left:5%;right:5%;bottom:8%;text-align:center">
  <div style="font-family:'Bebas Neue';font-size:64px;background:linear-gradient(180deg,#fff,${g.a});-webkit-background-clip:text;
    -webkit-text-fill-color:transparent;filter:drop-shadow(0 0 20px ${g.a})">${esc(ko)}</div>
  <div style="font-family:Outfit;font-size:16px;letter-spacing:0.4em;color:#ff9eeb;margin-top:8px">${esc(en)}</div>
</div>`);
  },

  collageTorn(title, bg) {
    const { g, ko, en } = meta(title);
    return wrap(bg, 'center 32%', 'saturate(1.1)', `
<div style="position:absolute;inset:0;background:#e8e0d5"></div>
<div style="position:absolute;top:12%;left:8%;width:84%;height:52%;overflow:hidden;
  clip-path:polygon(0 8%,92% 0,100% 88%,6% 100%);box-shadow:4px 8px 24px rgba(0,0,0,0.35)">
  <img src="${bg}" style="width:100%;height:100%;object-fit:cover;object-position:center 30%" />
</div>
<div style="position:absolute;top:10%;left:6%;width:60px;height:24px;background:rgba(255,220,100,0.6);transform:rotate(-8deg)"></div>
<div style="position:absolute;left:10%;bottom:14%;font-family:'Noto Sans KR';font-size:44px;font-weight:900;color:#1a1a1a">${esc(ko)}</div>
<div style="position:absolute;left:10%;bottom:8%;font-family:'Playfair Display',serif;font-style:italic;font-size:18px;color:#555">${esc(en)}</div>`);
  },

  magazineEditorial(title, bg) {
    const { g, ko, en } = meta(title);
    return wrap(bg, '70% 30%', 'saturate(1.05) contrast(1.08)', `
<div style="position:absolute;inset:0;background:#f5f0eb"></div>
<div style="position:absolute;top:0;right:0;width:72%;height:72%;overflow:hidden">
  <img src="${bg}" style="width:100%;height:100%;object-fit:cover" />
</div>
<div style="position:absolute;left:6%;top:55%;width:55%">
  <div style="font-family:'Playfair Display',serif;font-size:56px;font-weight:600;line-height:0.95;color:#111">${esc(ko)}</div>
</div>
<div style="position:absolute;left:6%;top:8%;font-family:Outfit;font-size:11px;font-weight:700;letter-spacing:0.4em;color:${g.b}">SAEROSERO PRESENTS</div>
<div style="position:absolute;right:6%;bottom:6%;font-family:Outfit;font-size:12px;letter-spacing:0.2em;color:#666;writing-mode:vertical-rl">${esc(en)}</div>`);
  },

  floatingHead(title, bg) {
    const { g, ko, en, seed } = meta(title);
    const pos = ['center 25%', 'center 35%', '60% 30%'][seed % 3];
    return wrap(bg, pos, 'saturate(1.15) contrast(1.12)', `
<div style="position:absolute;inset:0;background:radial-gradient(ellipse 70% 50% at 50% 35%,transparent 20%,${g.b}dd 100%)"></div>
<div style="position:absolute;left:50%;top:6%;transform:translateX(-50%);font-family:Outfit;font-size:11px;letter-spacing:0.5em;color:${g.c}">${esc(en)}</div>
<div style="position:absolute;left:50%;bottom:8%;transform:translateX(-50%);text-align:center;width:90%">
  <div style="font-family:'Noto Sans KR';font-size:50px;font-weight:900;color:#fff;text-shadow:0 0 40px ${g.a}">${esc(ko)}</div>
</div>`);
  },

  splitDiptych(title, bg) {
    const { g, ko, en } = meta(title);
    return wrap(bg, 'center center', 'saturate(1.1)', `
<div style="position:absolute;inset:0;left:42%;overflow:hidden">
  <img src="${bg}" style="width:100%;height:100%;object-fit:cover;object-position:center 35%" />
</div>
<div style="position:absolute;inset:0;right:58%;background:linear-gradient(180deg,${g.b},${g.a}33)"></div>
<div style="position:absolute;left:6%;top:50%;transform:translateY(-50%);writing-mode:vertical-rl;
  font-family:'Noto Serif KR';font-size:42px;font-weight:700;color:#fff;letter-spacing:0.1em">${esc(ko)}</div>
<div style="position:absolute;left:6%;bottom:8%;font-family:Outfit;font-size:12px;letter-spacing:0.25em;color:${g.c}">${esc(en)}</div>`);
  },

  circlePortrait(title, bg) {
    const { g, ko, en } = meta(title);
    return wrap(bg, 'center 30%', 'saturate(1.08)', `
<div style="position:absolute;inset:0;background:linear-gradient(180deg,${g.b} 0%,#0a0a12 100%)"></div>
<div style="position:absolute;left:50%;top:18%;transform:translateX(-50%);width:72%;aspect-ratio:1;border-radius:50%;overflow:hidden;
  border:4px solid ${g.a};box-shadow:0 0 60px ${g.a}55, inset 0 0 40px rgba(0,0,0,0.5)">
  <img src="${bg}" style="width:100%;height:100%;object-fit:cover" />
</div>
<div style="position:absolute;left:8%;right:8%;bottom:10%;text-align:center">
  <div style="font-family:'Noto Serif KR';font-size:44px;font-weight:700;color:#fff">${esc(ko)}</div>
  <div style="font-family:Outfit;font-size:14px;letter-spacing:0.3em;color:${g.c};margin-top:8px">${esc(en)}</div>
</div>`);
  },

  glitchDigital(title, bg) {
    const { g, ko, en } = meta(title);
    return wrap(bg, 'center 35%', 'saturate(1.2) contrast(1.2)', `
<div style="position:absolute;inset:0;background:linear-gradient(180deg,transparent 40%,#000a 100%)"></div>
<div style="position:absolute;inset:0;background:repeating-linear-gradient(0deg,transparent,transparent 2px,rgba(0,255,255,0.03) 2px,rgba(0,255,255,0.03) 4px)"></div>
<div style="position:absolute;left:4%;bottom:12%">
  <div style="font-family:Outfit;font-size:54px;font-weight:800;color:#fff;text-shadow:3px 0 ${g.a},-3px 0 #ff00ff,0 0 20px ${g.a}">${esc(ko)}</div>
  <div style="font-family:Outfit;font-size:14px;letter-spacing:0.35em;color:#0ff;margin-top:8px;opacity:0.9">${esc(en)}</div>
</div>`);
  },

  watercolorSketch(title, bg) {
    const { g, ko, en } = meta(title);
    return wrap(bg, 'center 40%', 'saturate(0.85) contrast(0.95) brightness(1.08)', `
<div style="position:absolute;inset:4%;border:2px solid rgba(80,60,40,0.25);border-radius:2px"></div>
<div style="position:absolute;inset:0;background:radial-gradient(ellipse at 30% 20%,${g.c}33,transparent 50%)"></div>
<div style="position:absolute;inset:8%;overflow:hidden;filter:blur(0.3px);opacity:0.92">
  <img src="${bg}" style="width:100%;height:100%;object-fit:cover;mask-image:radial-gradient(ellipse 90% 85% at 50% 45%,#000 40%,transparent 100%)" />
</div>
<div style="position:absolute;left:10%;bottom:12%;font-family:'Noto Serif KR';font-size:46px;font-weight:700;color:#3d2c1e">${esc(ko)}</div>
<div style="position:absolute;left:10%;bottom:7%;font-family:'Playfair Display',serif;font-style:italic;font-size:16px;color:#6b5344">${esc(en)}</div>`);
  },

  saulBass(title, bg) {
    const { g, ko, en, seed } = meta(title);
    const shape = seed % 2 ? 'circle' : 'triangle';
    const shapeEl = shape === 'circle'
      ? `<div style="position:absolute;left:50%;top:32%;transform:translate(-50%,-50%);width:200px;height:200px;border-radius:50%;background:${g.a};mix-blend-mode:multiply;opacity:0.85"></div>`
      : `<div style="position:absolute;left:50%;top:35%;transform:translate(-50%,-50%);width:0;height:0;
        border-left:100px solid transparent;border-right:100px solid transparent;border-bottom:180px solid ${g.a};opacity:0.8"></div>`;
    return wrap(bg, 'center 50%', 'saturate(0.3) contrast(1.4) brightness(0.7)', `
<div style="position:absolute;inset:0;background:${g.b}"></div>
${shapeEl}
<div style="position:absolute;inset:0;opacity:0.35"><img class="bg" src="${bg}" style="filter:grayscale(1)" /></div>
<div style="position:absolute;left:8%;bottom:15%">
  <div style="font-family:Outfit;font-size:52px;font-weight:800;color:#fff;line-height:1">${esc(ko)}</div>
  <div style="font-family:Outfit;font-size:13px;letter-spacing:0.35em;color:${g.c};margin-top:10px">${esc(en)}</div>
</div>`);
  },

  filmStrip(title, bg) {
    const { g, ko, en } = meta(title);
    return wrap(bg, 'center 35%', 'saturate(1.1) sepia(0.1)', `
<div style="position:absolute;inset:0;background:#111"></div>
<div style="position:absolute;top:15%;left:5%;right:5%;height:55%;border-top:18px solid #222;border-bottom:18px solid #222;
  background:repeating-linear-gradient(90deg,#222 0,#222 12px,transparent 12px,transparent 24px);overflow:hidden">
  <img src="${bg}" style="width:100%;height:100%;object-fit:cover;margin-top:18px;height:calc(100% - 36px)" />
</div>
<div style="position:absolute;left:8%;bottom:10%;font-family:'Bebas Neue';font-size:48px;color:#fff;letter-spacing:0.05em">${esc(ko)}</div>
<div style="position:absolute;right:8%;bottom:11%;font-family:Outfit;font-size:12px;color:${g.a};letter-spacing:0.2em">${esc(en)}</div>`);
  },

  neonSign(title, bg) {
    const { g, ko, en } = meta(title);
    return wrap(bg, 'center 40%', 'saturate(0.9) brightness(0.75) contrast(1.1)', `
<div style="position:absolute;inset:0;background:linear-gradient(180deg,#0a0612 0%,transparent 50%,#0a0612 100%)"></div>
<div style="position:absolute;left:50%;top:50%;transform:translate(-50%,-30%);text-align:center">
  <div style="font-family:'Noto Sans KR';font-size:52px;font-weight:900;color:${g.a};
    text-shadow:0 0 10px ${g.a},0 0 30px ${g.a},0 0 60px ${g.a},0 0 100px ${g.b}">${esc(ko)}</div>
  <div style="font-family:'Bebas Neue';font-size:28px;color:#fff;letter-spacing:0.4em;margin-top:16px;
    text-shadow:0 0 15px #fff,0 0 30px ${g.c}">${esc(en)}</div>
</div>`);
  },

  stampArchive(title, bg) {
    const { g, ko, en } = meta(title);
    return wrap(bg, 'center 38%', 'sepia(0.35) contrast(1.05)', `
<div style="position:absolute;inset:0;background:#d4c4a8"></div>
<div style="position:absolute;inset:8%;border:3px double #5c4033;background:#efe6d8;padding:12px">
  <div style="width:100%;height:58%;overflow:hidden;margin-bottom:12px;border:1px solid #8b7355">
    <img src="${bg}" style="width:100%;height:100%;object-fit:cover" />
  </div>
  <div style="font-family:'Noto Serif KR';font-size:32px;font-weight:700;color:#3d2914;border-bottom:1px solid #8b7355;padding-bottom:8px">${esc(ko)}</div>
  <div style="font-family:Outfit;font-size:11px;letter-spacing:0.2em;color:#6b5344;margin-top:6px">FILE NO. ${hash(title.id) % 9000 + 1000} — ${esc(en)}</div>
</div>`);
  },

  actionBurst(title, bg) {
    const { g, ko, en } = meta(title);
    const lines = [...Array(16)].map((_, i) => {
      const a = i * 22.5;
      return `<div style="position:absolute;left:50%;top:45%;width:3px;height:120%;background:linear-gradient(180deg,${g.a}88,transparent);
        transform-origin:center top;transform:rotate(${a}deg)"></div>`;
    }).join('');
    return wrap(bg, 'center 35%', 'saturate(1.3) contrast(1.2)', `
<div style="position:absolute;inset:0;background:radial-gradient(circle at 50% 40%,transparent 15%,rgba(0,0,0,0.7) 70%)"></div>
<div style="position:absolute;inset:0;opacity:0.4">${lines}</div>
<div style="position:absolute;left:50%;bottom:10%;transform:translateX(-50%);text-align:center">
  <div style="font-family:'Bebas Neue';font-size:72px;color:#fff;text-shadow:0 0 20px ${g.a},4px 4px 0 ${g.b}">${esc(ko)}</div>
  <div style="font-family:Outfit;font-size:16px;font-weight:800;letter-spacing:0.4em;color:${g.c}">${esc(en)}</div>
</div>`);
  },

  romanceNovel(title, bg) {
    const { g, ko, en } = meta(title);
    return wrap(bg, 'center 38%', 'saturate(1.05) brightness(1.1)', `
<div style="position:absolute;inset:0;background:linear-gradient(180deg,${g.c}44 0%,transparent 50%,${g.b}99 100%)"></div>
<div style="position:absolute;inset:0;background:radial-gradient(circle at 70% 20%,rgba(255,255,255,0.4),transparent 35%)"></div>
<div style="position:absolute;left:8%;right:8%;top:42%;text-align:center">
  <div style="font-family:'Playfair Display',serif;font-style:italic;font-size:22px;color:rgba(255,255,255,0.9);margin-bottom:12px">${esc(en)}</div>
  <div style="font-family:'Noto Serif KR';font-size:48px;font-weight:700;color:#fff;line-height:1.2;text-shadow:0 2px 20px ${g.b}">${esc(ko)}</div>
  <div style="width:80px;height:1px;background:linear-gradient(90deg,transparent,#fff,transparent);margin:14px auto"></div>
</div>`);
  },

  mysteryEvidence(title, bg) {
    const { g, ko, en } = meta(title);
    return wrap(bg, 'center 35%', 'saturate(0.9) contrast(1.05)', `
<div style="position:absolute;inset:0;background:#1a1814"></div>
<div style="position:absolute;left:12%;top:15%;width:76%;padding:10px 10px 28px;background:#fff;box-shadow:4px 6px 20px rgba(0,0,0,0.5);transform:rotate(-3deg)">
  <img src="${bg}" style="width:100%;aspect-ratio:4/5;object-fit:cover" />
  <div style="font-family:Outfit;font-size:10px;color:#333;margin-top:6px;text-align:center">${esc(en)}</div>
</div>
<div style="position:absolute;right:10%;top:12%;width:50px;height:50px;border:3px solid ${g.a};border-radius:50%;opacity:0.6"></div>
<div style="position:absolute;left:8%;bottom:12%;font-family:'Noto Serif KR';font-size:40px;font-weight:700;color:#e8e0d0">${esc(ko)}</div>
<div style="position:absolute;left:8%;bottom:7%;font-family:Outfit;font-size:10px;letter-spacing:0.3em;color:${g.a}">CLASSIFIED</div>`);
  },

  imaxScope(title, bg) {
    const { g, ko, en } = meta(title);
    return wrap(bg, 'center 35%', 'saturate(1.15) contrast(1.1)', `
<div style="position:absolute;top:0;left:0;right:0;height:14%;background:#000"></div>
<div style="position:absolute;bottom:0;left:0;right:0;height:22%;background:#000;display:flex;flex-direction:column;align-items:center;justify-content:center">
  <div style="font-family:'Bebas Neue';font-size:42px;color:#fff;letter-spacing:0.08em">${esc(ko)}</div>
  <div style="font-family:Outfit;font-size:11px;letter-spacing:0.45em;color:${g.a};margin-top:4px">${esc(en)}</div>
</div>`);
  },

  popArt(title, bg) {
    const { g, ko, en, seed } = meta(title);
    const dot = seed % 2 ? '#fff' : g.a;
    return wrap(bg, 'center 32%', 'saturate(1.4) contrast(1.25)', `
<div style="position:absolute;inset:0;background:${g.b}"></div>
<div style="position:absolute;inset:0;background-image:radial-gradient(${dot} 1.5px,transparent 1.5px);background-size:8px 8px;opacity:0.35"></div>
<div style="position:absolute;top:10%;left:8%;width:84%;height:50%;overflow:hidden;border:4px solid #000">
  <img src="${bg}" style="width:100%;height:100%;object-fit:cover;filter:contrast(1.3)" />
</div>
<div style="position:absolute;left:8%;bottom:12%;font-family:'Bebas Neue';font-size:56px;color:#fff;
  -webkit-text-stroke:3px #000;paint-order:stroke fill">${esc(ko)}</div>
<div style="position:absolute;left:8%;bottom:6%;font-family:Outfit;font-size:14px;font-weight:800;color:${g.c};background:#000;padding:4px 8px">${esc(en)}</div>`);
  },
};

const KEYS = Object.keys(LAYOUTS);

export function posterHtmlV4(title, bgDataUrl) {
  const layout = LAYOUTS[KEYS[hash(title.id) % KEYS.length]](title, bgDataUrl);
  return layout.html;
}

export function layoutNameForV4(titleId) {
  return KEYS[hash(titleId) % KEYS.length];
}

export function layoutCountV4() {
  return KEYS.length;
}