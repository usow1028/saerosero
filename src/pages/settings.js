import { getSettings, patchSettings } from '../services/SettingsService.js';
import { setLocale, listLocales, t } from '../i18n/index.js';
import { el } from '../ui/helpers.js';

export function renderSettings(container, navigate) {
  const s = getSettings();
  container.replaceChildren(
    el('div', { style: 'max-width:520px;margin:2rem auto;padding:1rem;' }, [
      el('h1', { text: t('actions.settings') }),
      field(t('settings.theme'), el('select', {}, [
        opt('dark', t('settings.themeDark'), s.theme),
        opt('light', t('settings.themeLight'), s.theme),
      ]), (e) => patchSettings({ theme: e.target.value })),
      field(t('settings.language'), el('select', {}, listLocales().map((l) => opt(l.code, l.label, s.locale))), (e) => {
        patchSettings({ locale: e.target.value });
        setLocale(e.target.value);
        navigate('/settings');
      }),
      field(t('settings.mature'), el('input', { type: 'checkbox', ...(s.mature ? { checked: '' } : {}) }), (e) => patchSettings({ mature: e.target.checked })),
      field(t('settings.quality'), el('select', {}, [
        opt('auto', 'Auto', s.quality), opt('720', '720p', s.quality), opt('1080', '1080p', s.quality),
      ]), (e) => patchSettings({ quality: e.target.value })),
    ]),
  );
}

function opt(v, label, current) {
  const o = el('option', { value: v, text: label });
  if (v === current) o.selected = true;
  return o;
}

function field(label, input, onChange) {
  input.onchange = onChange;
  return el('label', { style: 'display:block;margin:1rem 0;' }, [el('span', { text: label, style: 'display:block;margin-bottom:0.35rem;' }), input]);
}