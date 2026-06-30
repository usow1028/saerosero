import { readJson, writeJson } from './storage.js';

const KEY = 'profiles';

function initialFromName(name) {
  const t = name.trim();
  return t ? t[0].toUpperCase() : 'G';
}

export function listProfiles() {
  return readJson(KEY, []);
}

export function saveProfiles(profiles) {
  writeJson(KEY, profiles);
}

export function createProfile(name) {
  const profiles = listProfiles();
  const hue = (profiles.length * 47 + 160) % 360;
  const profile = {
    id: crypto.randomUUID(),
    name: name.trim() || 'Guest',
    initial: initialFromName(name),
    hue,
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