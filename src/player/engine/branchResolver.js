/**
 * @typedef {object} PlayerState
 * @property {string} currentSceneId
 * @property {string[]} visitedSceneIds
 * @property {Record<string, string>} branchKeys
 */

/**
 * @typedef {object} DialogueResult
 * @property {string} interactionId
 * @property {'dialogue'} type
 * @property {string} choiceId
 */

/**
 * @typedef {object} MinigameResult
 * @property {string} interactionId
 * @property {'minigame'} type
 * @property {'win' | 'loss'} outcome
 */

/** @typedef {DialogueResult | MinigameResult} InteractionResult */

/**
 * @param {typeof import('../story/episode1.js').episode1} episode
 * @param {string} interactionId
 */
export function getInteractionNode(episode, interactionId) {
  return episode.interactions.find((n) => n.id === interactionId) ?? null;
}

/**
 * @param {typeof import('../story/episode1.js').episode1} episode
 * @param {InteractionResult} interactionResult
 */
export function resolveNextScene(episode, interactionResult) {
  const node = getInteractionNode(episode, interactionResult.interactionId);
  if (!node) {
    throw new Error(`Unknown interaction: ${interactionResult.interactionId}`);
  }

  if (node.type === 'dialogue' && interactionResult.type === 'dialogue') {
    const choice = node.choices.find((c) => c.choiceId === interactionResult.choiceId);
    if (!choice) {
      throw new Error(`Unknown choice: ${interactionResult.choiceId}`);
    }
    return {
      nextSceneId: choice.nextSceneId,
      branchKey: choice.branchKey,
    };
  }

  if (node.type === 'minigame' && interactionResult.type === 'minigame') {
    const outcome = node.outcomes[interactionResult.outcome];
    if (!outcome) {
      throw new Error(`Unknown outcome: ${interactionResult.outcome}`);
    }
    return {
      nextSceneId: outcome.nextSceneId,
      branchKey: outcome.branchKey,
    };
  }

  throw new Error(`Interaction type mismatch for ${interactionResult.interactionId}`);
}

/**
 * @param {typeof import('../story/episode1.js').episode1} episode
 * @param {PlayerState} state
 * @param {InteractionResult} interactionResult
 */
export function applyBranch(episode, state, interactionResult) {
  const { nextSceneId, branchKey } = resolveNextScene(episode, interactionResult);
  return {
    currentSceneId: nextSceneId,
    visitedSceneIds: [...state.visitedSceneIds, nextSceneId],
    branchKeys: {
      ...state.branchKeys,
      [interactionResult.interactionId]: branchKey,
    },
  };
}

/**
 * Predict scene sequence IDs for a list of interaction results.
 * @param {typeof import('../story/episode1.js').episode1} episode
 * @param {InteractionResult[]} results
 */
export function predictSceneSequence(episode, results) {
  let state = {
    currentSceneId: episode.startSceneId,
    visitedSceneIds: [episode.startSceneId],
    branchKeys: {},
  };

  const sequence = [episode.startSceneId];

  for (const result of results) {
    state = applyBranch(episode, state, result);
    sequence.push(state.currentSceneId);
  }

  return { sequence, finalState: state };
}