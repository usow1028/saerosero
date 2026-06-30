import { readJson, writeJson } from './storage.js';

const KEY = 'profiles';
const AVATARS = ['🌙', '⭐', '🌊', '🎬', '🪐', '✨', '🦋', '🎭', '🌸', '🔮', '🎐', '🌌'];

export function listProfiles() {
  return readJson(KEY, []);
}

export function saveProfiles(profiles) {
  writeJson(KEY, profiles);
}

export function createProfile(name) {
  const profiles = listProfiles();
  const profile = {
    id: crypto.randomUUID(),
    name: name.trim() || 'Guest',
    avatar: AVATARS[profiles.length % AVATARS.length],
    createdAt: Date.now(),
    taste: { genres: {}, branches: {} },
  };
  profiles.push(profile);
  saveProfiles(profiles);
  return profile;
}

export function getActiveProfileId() {
  return readJson('activeProfile', null);
}

export function setActiveProfileId(id) {
  writeJson('activeProfile', id);
}

export function getActiveProfile() {
  const id = getActiveProfileId();
  return listProfiles().find((p) => p.id === id) ?? null;
}

export function isGuestMode() {
  return !getActiveProfileId();
}

export { AVATARS };