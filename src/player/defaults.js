export const INTERACTION_DEFAULTS = {
  intro_choice: { timeoutSec: 18, result: { type: 'dialogue', choiceId: 'observe' } },
  trust_choice: { timeoutSec: 15, result: { type: 'dialogue', choiceId: 'trust_ai' } },
  signal_decode: { timeoutSec: 12, result: { type: 'minigame', outcome: 'loss' } },
  anomaly_choice: { timeoutSec: 20, result: { type: 'dialogue', choiceId: 'retreat' } },
  obstacle_dodge: { timeoutSec: 10, result: { type: 'minigame', outcome: 'loss' } },
};

export const GUEST_PREVIEW_SCENE = 'intro';