/** goal-deliverable: studio-guild */
import { readJson, writeJson } from '../storage.js';
import { DEFAULT_GUILD_SETTINGS } from './types.js';
import { isCommercialProvider } from './CommercialProviders.js';

const KEY = 'guild:settings';

export function getGuildSettings() {
  const stored = readJson(KEY, {});
  const commercialProxy = stored.commercialProxy ?? DEFAULT_GUILD_SETTINGS.commercialProxy;
  const publicAi = (stored.publicAi ?? DEFAULT_GUILD_SETTINGS.publicAi).map((c) => ({ ...c }));
  for (const c of publicAi) {
    if (isCommercialProvider(c.provider) && !c.endpoint) {
      c.endpoint = commercialProxy;
    }
  }
  return {
    commercialProxy,
    publicAi,
    localLlm: stored.localLlm ?? DEFAULT_GUILD_SETTINGS.localLlm.map((c) => ({ ...c })),
  };
}

export function setCommercialProxy(url) {
  const settings = getGuildSettings();
  const proxy = url.trim() || DEFAULT_GUILD_SETTINGS.commercialProxy;
  settings.commercialProxy = proxy;
  for (const c of settings.publicAi) {
    if (isCommercialProvider(c.provider)) c.endpoint = proxy;
  }
  writeJson(KEY, settings);
  return settings;
}

export function patchGuildSettings(patch) {
  const next = {
    ...getGuildSettings(),
    ...patch,
  };
  writeJson(KEY, next);
  return next;
}

export function toggleCollaborator(kind, id, enabled) {
  const settings = getGuildSettings();
  const list = kind === 'public_ai' ? settings.publicAi : settings.localLlm;
  const collab = list.find((c) => c.id === id);
  if (collab) collab.enabled = enabled;
  writeJson(KEY, settings);
  return settings;
}

export function getEnabledCollaborators() {
  const settings = getGuildSettings();
  return {
    publicAi: settings.publicAi.filter((c) => c.enabled),
    localLlm: settings.localLlm.filter((c) => c.enabled),
  };
}

export function canStartGuildSession() {
  const { publicAi, localLlm } = getEnabledCollaborators();
  return {
    ok: publicAi.length > 0 && localLlm.length > 0,
    publicAiCount: publicAi.length,
    localLlmCount: localLlm.length,
  };
}