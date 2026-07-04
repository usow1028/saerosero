/** goal-deliverable: studio-guild */
import { GUILD_PHASES } from './types.js';

let messageSeq = 0;

/**
 * In-memory guild bus keyed by titleId.
 * Messages are also persisted on the guild artifact.
 */
const buses = new Map();

function nextId() {
  messageSeq += 1;
  return `msg-${messageSeq}`;
}

export function resetGuildBus(titleId) {
  if (titleId) buses.delete(titleId);
  else buses.clear();
}

export function loadBusFromArtifact(titleId, messages = []) {
  buses.set(titleId, [...messages]);
}

export function listBusMessages(titleId) {
  return buses.get(titleId) ?? [];
}

export function postBusMessage(titleId, message) {
  const entry = {
    id: message.id ?? nextId(),
    phase: message.phase ?? GUILD_PHASES.RECRUITMENT,
    fromKind: message.fromKind,
    fromId: message.fromId,
    fromLabel: message.fromLabel,
    toKind: message.toKind,
    toId: message.toId,
    toLabel: message.toLabel,
    role: message.role,
    content: message.content,
    provider: message.provider,
    at: message.at ?? Date.now(),
  };
  const list = buses.get(titleId) ?? [];
  list.push(entry);
  buses.set(titleId, list);
  return entry;
}

export function getBusTranscript(titleId, { phase, limit = 12 } = {}) {
  let messages = listBusMessages(titleId);
  if (phase) messages = messages.filter((m) => m.phase === phase);
  return messages.slice(-limit).map((m) => {
    const target = m.toLabel ? ` → ${m.toLabel}` : '';
    return `[${m.fromLabel}${target}] ${m.content}`;
  }).join('\n');
}

export function countBusMessages(titleId, phase) {
  const messages = listBusMessages(titleId);
  return phase ? messages.filter((m) => m.phase === phase).length : messages.length;
}