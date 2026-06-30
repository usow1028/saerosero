import { readJson, writeJson } from './storage.js';
import { getActiveProfileId } from './ProfileService.js';

/** @typedef {import('./ProgressService.types.js').WatchProgress} WatchProgress */
/** @typedef {import('./ProgressService.types.js').SaveSlot} SaveSlot */

function scopeKey(suffix) {
  const pid = getActiveProfileId() ?? 'guest';
  return `progress:${pid}:${suffix}`;
}

export function getContinueWatching() {
  return readJson(scopeKey('continue'), []);
}

export function upsertContinue(entry) {
  const list = getContinueWatching().filter((e) => !(e.titleId === entry.titleId && e.episode === entry.episode));
  list.unshift({ ...entry, updatedAt: Date.now() });
  writeJson(scopeKey('continue'), list.slice(0, 20));
}

export function getMyList() {
  return readJson(scopeKey('mylist'), []);
}

export function toggleMyList(titleId) {
  const list = getMyList();
  const idx = list.indexOf(titleId);
  if (idx >= 0) list.splice(idx, 1);
  else list.push(titleId);
  writeJson(scopeKey('mylist'), list);
  return list.includes(titleId);
}

export function getSaveSlots(titleId, episode) {
  return readJson(scopeKey(`saves:${titleId}:${episode}`), [null, null, null]);
}

export function writeSaveSlot(titleId, episode, slotIndex, data) {
  const slots = getSaveSlots(titleId, episode);
  slots[slotIndex] = { ...data, savedAt: Date.now() };
  writeJson(scopeKey(`saves:${titleId}:${episode}`), slots);
}

export function getWatchState(titleId, episode) {
  return readJson(scopeKey(`watch:${titleId}:${episode}`), null);
}

export function setWatchState(titleId, episode, state) {
  writeJson(scopeKey(`watch:${titleId}:${episode}`), state);
}

export function recordTaste(genre, branchKey) {
  const pid = getActiveProfileId();
  if (!pid) return;
  const key = `taste:${pid}`;
  const taste = readJson(key, { genres: {}, branches: {} });
  taste.genres[genre] = (taste.genres[genre] ?? 0) + 1;
  if (branchKey) taste.branches[branchKey] = (taste.branches[branchKey] ?? 0) + 1;
  writeJson(key, taste);
}

export function getTaste() {
  const pid = getActiveProfileId();
  if (!pid) return { genres: {}, branches: {} };
  return readJson(`taste:${pid}`, { genres: {}, branches: {} });
}