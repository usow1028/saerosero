/**
 * Dodge minigame: survive until timer ends with enough hits avoided.
 * @param {number} hits
 * @param {number} maxHits
 */
export function evaluateObstacleDodge(hits, maxHits = 3) {
  const survived = hits < maxHits;
  return {
    outcome: survived ? 'win' : 'loss',
    branchKey: survived ? 'dodge_win' : 'dodge_loss',
  };
}

/**
 * @param {number} lane 0|1|2
 * @param {{ lane: number }[]} obstacles
 */
export function dodgeCollision(lane, obstacles) {
  return obstacles.some((o) => o.lane === lane);
}

/**
 * @param {number} tick
 */
export function spawnObstacleLane(tick) {
  return tick % 3;
}