/**
 * @param {import('../story/episode1.js').episode1 extends infer E ? E : never} episode
 */
export function getInteractionNodes(episode) {
  return episode.interactions;
}

/**
 * Longest-path duration through the scene graph (seconds).
 * @param {typeof import('../story/episode1.js').episode1} episode
 */
export function getTotalDurationSec(episode) {
  const memo = new Map();

  function walk(sceneId, visited = new Set()) {
    if (!sceneId || visited.has(sceneId)) return 0;
    if (memo.has(sceneId)) return memo.get(sceneId);

    const scene = episode.scenes[sceneId];
    if (!scene) return 0;

    const nextVisited = new Set(visited);
    nextVisited.add(sceneId);

    let tail = 0;
    if (scene.interactionId) {
      const node = episode.interactions.find((n) => n.id === scene.interactionId);
      if (node?.type === 'dialogue') {
        const childDurations = node.choices.map((c) => walk(c.nextSceneId, nextVisited));
        tail = childDurations.length ? Math.max(...childDurations) : 0;
      } else if (node?.type === 'minigame') {
        const childDurations = Object.values(node.outcomes).map((o) =>
          walk(o.nextSceneId, nextVisited),
        );
        tail = childDurations.length ? Math.max(...childDurations) : 0;
      }
    } else if (scene.nextSceneId) {
      tail = walk(scene.nextSceneId, nextVisited);
    }

    const total = scene.durationSec + tail;
    memo.set(sceneId, total);
    return total;
  }

  return walk(episode.startSceneId);
}

/**
 * @param {typeof import('../story/episode1.js').episode1} episode
 */
export function validateStoryScope(episode) {
  const totalDurationSec = getTotalDurationSec(episode);
  const interactionNodes = getInteractionNodes(episode);
  const inRange = totalDurationSec >= 240 && totalDurationSec <= 360;
  const enoughInteractions = interactionNodes.length >= 5;
  const validTypes = interactionNodes.every((n) => n.type === 'dialogue' || n.type === 'minigame');

  return {
    totalDurationSec,
    interactionNodes,
    inRange,
    enoughInteractions,
    validTypes,
    ok: inRange && enoughInteractions && validTypes,
  };
}