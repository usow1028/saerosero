import { applyBranch, resolveNextScene } from './branchResolver.js';

/**
 * @typedef {import('./branchResolver.js').PlayerState} PlayerState
 * @typedef {import('./branchResolver.js').InteractionResult} InteractionResult
 */

export function createInitialState(episode) {
  return {
    currentSceneId: episode.startSceneId,
    visitedSceneIds: [episode.startSceneId],
    branchKeys: {},
  };
}

/**
 * @param {typeof import('../story/episode1.js').episode1} episode
 * @param {PlayerState} state
 */
export function getCurrentScene(episode, state) {
  return episode.scenes[state.currentSceneId];
}

/**
 * @param {typeof import('../story/episode1.js').episode1} episode
 * @param {PlayerState} state
 */
export function getPendingInteraction(episode, state) {
  const scene = getCurrentScene(episode, state);
  if (!scene?.interactionId) return null;
  return episode.interactions.find((n) => n.id === scene.interactionId) ?? null;
}

/**
 * @param {typeof import('../story/episode1.js').episode1} episode
 * @param {PlayerState} state
 * @param {InteractionResult} result
 */
export function transition(episode, state, result) {
  const branch = resolveNextScene(episode, result);
  const nextState = applyBranch(episode, state, result);
  return { branch, nextState };
}

/**
 * @param {typeof import('../story/episode1.js').episode1} episode
 * @param {PlayerState} state
 */
export function isEpisodeComplete(episode, state) {
  const scene = getCurrentScene(episode, state);
  return scene?.id === episode.endSceneId && !scene.interactionId;
}