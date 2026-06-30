import ko from './locales/ko.json';
import en from './locales/en.json';
import ja from './locales/ja.json';
import zhHans from './locales/zh-Hans.json';
import es from './locales/es.json';
import ptBR from './locales/pt-BR.json';

const locales = { ko, en, ja, 'zh-Hans': zhHans, es, 'pt-BR': ptBR };
const FALLBACK = 'en';

let current = 'ko';

export function setLocale(code) {
  current = locales[code] ? code : FALLBACK;
  document.documentElement.lang = current === 'zh-Hans' ? 'zh' : current.split('-')[0];
  return current;
}

export function getLocale() { return current; }

export function t(key, vars = {}) {
  const parts = key.split('.');
  let node = locales[current] ?? locales[FALLBACK];
  for (const p of parts) node = node?.[p];
  if (node == null) {
    node = locales[FALLBACK];
    for (const p of parts) node = node?.[p];
  }
  if (typeof node !== 'string') return key;
  return node.replace(/\{(\w+)\}/g, (_, k) => vars[k] ?? '');
}

export function listLocales() {
  return Object.keys(locales).map((code) => ({
    code,
    label: locales[code].meta?.label ?? code,
  }));
}