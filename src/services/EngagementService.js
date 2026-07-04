import { readJson, writeJson } from './storage.js';
import { getActiveProfileId } from './ProfileService.js';

function scopeKey(suffix) {
  const pid = getActiveProfileId() ?? 'guest';
  return `engagement:${pid}:${suffix}`;
}

export function getLikes() {
  return readJson(scopeKey('likes'), {});
}

export function isLiked(titleId) {
  return Boolean(getLikes()[titleId]);
}

export function toggleLike(titleId) {
  const likes = getLikes();
  if (likes[titleId]) delete likes[titleId];
  else likes[titleId] = Date.now();
  writeJson(scopeKey('likes'), likes);
  return Boolean(likes[titleId]);
}

export function getLikeCount(titleId) {
  const base = titleId.split('').reduce((n, c) => n + c.charCodeAt(0), 0) % 900 + 100;
  return base + (isLiked(titleId) ? 1 : 0);
}

export function getComments(titleId) {
  return readJson(scopeKey(`comments:${titleId}`), []);
}

export function addComment(titleId, text) {
  const trimmed = text.trim();
  if (!trimmed) return getComments(titleId);
  const list = getComments(titleId);
  list.unshift({ id: `${Date.now()}`, text: trimmed, at: Date.now() });
  writeJson(scopeKey(`comments:${titleId}`), list.slice(0, 50));
  return list;
}

export function getFeedSignals() {
  return readJson(scopeKey('signals'), { views: {}, skips: {}, dwell: {} });
}

export function recordFeedView(titleId, dwellMs = 0) {
  const signals = getFeedSignals();
  signals.views[titleId] = (signals.views[titleId] ?? 0) + 1;
  signals.dwell[titleId] = (signals.dwell[titleId] ?? 0) + dwellMs;
  writeJson(scopeKey('signals'), signals);
}

export function recordFeedSkip(titleId) {
  const signals = getFeedSignals();
  signals.skips[titleId] = (signals.skips[titleId] ?? 0) + 1;
  writeJson(scopeKey('signals'), signals);
}