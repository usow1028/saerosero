/**
 * Pure timing minigame: hit when cursor is inside target zone.
 * @param {number} cursorPos 0..1
 * @param {number} zoneStart 0..1
 * @param {number} zoneEnd 0..1
 */
export function evaluateSignalDecode(cursorPos, zoneStart, zoneEnd) {
  const inZone = cursorPos >= zoneStart && cursorPos <= zoneEnd;
  return {
    outcome: inZone ? 'win' : 'loss',
    branchKey: inZone ? 'decode_win' : 'decode_loss',
  };
}

/**
 * @param {number} elapsedMs
 * @param {number} periodMs
 */
export function signalCursorPosition(elapsedMs, periodMs = 1800) {
  const t = (elapsedMs % periodMs) / periodMs;
  return t < 0.5 ? t * 2 : (1 - t) * 2;
}

export const DEFAULT_ZONE = { start: 0.42, end: 0.58 };