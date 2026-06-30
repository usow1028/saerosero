import { readJson, writeJson } from './storage.js';

const DEFAULTS = {
  theme: 'dark',
  locale: 'ko',
  mature: false,
  quality: 'auto',
  subtitleSize: 'm',
  subtitleBg: 60,
  subtitlePosition: 'bottom',
  showDialoguePanel: true,
};

export function getSettings() {
  return { ...DEFAULTS, ...readJson('settings', {}) };
}

export function patchSettings(patch) {
  const next = { ...getSettings(), ...patch };
  writeJson('settings', next);
  applyTheme(next.theme);
  return next;
}

export function applyTheme(theme) {
  document.documentElement.dataset.theme = theme;
}