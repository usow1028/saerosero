import { getSettings, patchSettings } from '../services/SettingsService.js';
import { patchGuildSettings, getGuildSettings, setCommercialProxy } from '../services/guild/GuildSettingsService.js';
import { setLocale, listLocales, t } from '../i18n/index.js';
import { el } from '../ui/helpers.js';

export function renderSettings(container, navigate) {
  const s = getSettings();
  const sections = el('div', { class: 'settings-sections' });

  sections.append(
    settingsGroup(t('settings.theme'), el('select', { class: 'select-field' }, [
      opt('dark', t('settings.themeDark'), s.theme),
      opt('light', t('settings.themeLight'), s.theme),
    ]), (e) => patchSettings({ theme: e.target.value })),
    settingsGroup(t('settings.language'), el('select', { class: 'select-field' }, listLocales().map((l) => opt(l.code, l.label, s.locale))), (e) => {
      patchSettings({ locale: e.target.value });
      setLocale(e.target.value);
    }),
    settingsGroup(t('settings.mature'), toggleInput(s.mature), (e) => patchSettings({ mature: e.target.checked })),
    settingsGroup(t('settings.quality'), el('select', { class: 'select-field' }, [
      opt('auto', 'Auto', s.quality), opt('720', '720p', s.quality), opt('1080', '1080p', s.quality),
    ]), (e) => patchSettings({ quality: e.target.value })),
    settingsGroup(t('settings.localLlmEndpoint'), endpointInput(s.localLlmEndpoint), (e) => {
      patchSettings({ localLlmEndpoint: e.target.value.trim() || s.localLlmEndpoint });
      const guild = getGuildSettings();
      for (const c of guild.localLlm) c.endpoint = e.target.value.trim() || c.endpoint;
      patchGuildSettings(guild);
    }),
    settingsGroup(t('settings.localLlmModel'), modelInput(s.localLlmModel), (e) => {
      patchSettings({ localLlmModel: e.target.value.trim() || s.localLlmModel });
      const guild = getGuildSettings();
      for (const c of guild.localLlm) c.model = e.target.value.trim() || c.model;
      patchGuildSettings(guild);
    }),
    settingsGroup(t('settings.commercialProxy'), endpointInput(getGuildSettings().commercialProxy), (e) => {
      setCommercialProxy(e.target.value);
    }),
  );

  container.replaceChildren(
    el('div', { class: 'page-header' }, [
      el('h1', { text: t('actions.settings') }),
      el('p', { class: 'page-lead', text: 'SaeroSero' }),
    ]),
    sections,
  );
}

function opt(v, label, current) {
  const o = el('option', { value: v, text: label });
  if (v === current) o.selected = true;
  return o;
}

function toggleInput(checked) {
  const input = el('input', { type: 'checkbox', class: 'toggle-field' });
  if (checked) input.checked = true;
  return input;
}

function endpointInput(value) {
  return el('input', {
    class: 'text-field',
    type: 'url',
    value,
    placeholder: 'http://127.0.0.1:11434',
  });
}

function modelInput(value) {
  return el('input', {
    class: 'text-field',
    type: 'text',
    value,
    placeholder: 'llama3',
  });
}

function settingsGroup(label, control, onChange) {
  control.onchange = onChange;
  return el('div', { class: 'settings-row' }, [
    el('label', { class: 'settings-label', text: label }),
    el('div', { class: 'settings-control' }, [control]),
  ]);
}