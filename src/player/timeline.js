import { getInteractionNode } from './engine/branchResolver.js';

/**
 * Build linear timeline with branch markers for progress bar (longest path estimate).
 * @param {object} episode
 */
export function buildTimeline(episode) {
  const segments = [];
  let offset = 0;
  const markers = [];

  function walk(sceneId, visited = new Set()) {
    if (!sceneId || visited.has(sceneId)) return;
    const scene = episode.scenes[sceneId];
    if (!scene) return;

    visited.add(sceneId);
    const start = offset;
    offset += scene.durationSec;
    segments.push({ sceneId, start, end: offset, duration: scene.durationSec });

    if (scene.interactionId) {
      const node = getInteractionNode(episode, scene.interactionId);
      markers.push({
        interactionId: scene.interactionId,
        atSec: offset,
        type: node?.type ?? 'dialogue',
      });
      const nextVisited = new Set(visited);
      if (node?.type === 'dialogue') {
        const child = node.choices[0];
        walk(child.nextSceneId, nextVisited);
      } else if (node?.type === 'minigame') {
        walk(node.outcomes.win.nextSceneId, nextVisited);
      }
    } else if (scene.nextSceneId) {
      walk(scene.nextSceneId, visited);
    }
  }

  walk(episode.startSceneId);
  return { totalSec: offset, segments, markers };
}

export function secToProgress(sec, totalSec) {
  return totalSec > 0 ? Math.min(Math.max(sec / totalSec, 0), 1) : 0;
}