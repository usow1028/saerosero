import { writeFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const genres = ['sf', 'fantasy', 'romance', 'thriller', 'drama', 'mystery', 'action'];
const ages = ['all', '12', '15', '19'];

const seeds = [
  { id: 'starlight-station', status: 'playable', genre: 'sf', age: '12', featured: true, hue: 200 },
  { id: 'moonlit-harbor', status: 'development', genre: 'romance', age: '12', featured: true, hue: 220 },
  { id: 'quantum-letters', status: 'development', genre: 'mystery', age: '15', featured: true, hue: 260 },
];

const titles = {
  'starlight-station': { ko: '별빛 정거장', en: 'Starlight Station', ja: '星灯りの駅', 'zh-Hans': '星光车站', es: 'Estación Starlight' },
  'moonlit-harbor': { ko: '달빛 항구', en: 'Moonlit Harbor', ja: '月明かりの港', 'zh-Hans': '月光港湾', es: 'Puerto Lunar' },
  'quantum-letters': { ko: '양자 우편', en: 'Quantum Letters', ja: '量子の手紙', 'zh-Hans': '量子书信', es: 'Cartas Cuánticas' },
};

function makeComingSoon(i) {
  const id = `title-${String(i).padStart(3, '0')}`;
  const genre = genres[i % genres.length];
  const age = ages[i % ages.length];
  const hue = (i * 37) % 360;
  const ko = `인터루드 ${i}`;
  return {
    id,
    status: 'coming_soon',
    genre,
    age,
    interactive: true,
    hue,
    episodes: 1,
    titles: { ko, en: `Interlude ${i}`, ja: `間奏曲 ${i}`, 'zh-Hans': `插曲 ${i}`, es: `Interludio ${i}` },
    logline: {
      ko: '곧 공개됩니다. 새로운 인터랙티브 이야기.',
      en: 'Coming soon — a new interactive story.',
    },
  };
}

const catalog = {
  version: 1,
  updatedAt: new Date().toISOString(),
  titles: [
    ...seeds.map((s, idx) => ({
      id: s.id,
      status: s.status,
      genre: s.genre,
      age: s.age,
      interactive: true,
      featured: s.featured ?? false,
      hue: s.hue,
      episodes: s.id === 'starlight-station' ? 1 : 0,
      titles: titles[s.id],
      logline: {
        ko: s.id === 'starlight-station'
          ? '궤도 정거장에서 울리는 신호. 당신의 선택이 밤을 바꾼다.'
          : '제작 중인 인터랙티브 시리즈.',
        en: s.id === 'starlight-station'
          ? 'A signal echoes through the orbital station. Your choices reshape the night.'
          : 'Interactive series in development.',
      },
      tags: [s.genre, 'interactive'],
      characters: s.id === 'starlight-station' ? ['아리아', 'Aria'] : [],
    })),
    ...Array.from({ length: 52 }, (_, i) => makeComingSoon(i + 1)),
  ],
};

writeFileSync(path.join(ROOT, 'public/data/catalog.json'), JSON.stringify(catalog, null, 2));
console.log(`catalog.json: ${catalog.titles.length} titles`);