/** goal-deliverable: studio-guild */
import { COLLABORATOR_KINDS, GUILD_PHASES } from './types.js';
import * as PublicAiAdapter from './adapters/PublicAiAdapter.js';
import { postBusMessage, getBusTranscript } from './GuildBusService.js';
import {
  inferPlanContribution,
  inferPlanSynthesis,
} from './inference/GuildInferenceService.js';

function planningBus(titleId) {
  return getBusTranscript(titleId, { phase: GUILD_PHASES.PLANNING, limit: 30 });
}

function inferenceCtx(title, locale, collaborators, titleId, options) {
  return {
    title,
    locale,
    titleId,
    collaborators,
    fetchFn: options.fetchFn,
    forceOffline: options.forceOffline,
    apiKey: options.apiKey,
  };
}

/**
 * Phase 0: Commercial AIs collaboratively plan the work before recruiting a party.
 */
export async function runWorkPlanning(title, locale, collaborators, titleId, options = {}) {
  const publicAi = collaborators.publicAi ?? [];
  if (!publicAi.length) throw new Error('guild:need_public_ai_planner');

  const conductor = publicAi[0];
  const baseCtx = inferenceCtx(title, locale, collaborators, titleId, options);
  const contributions = [];

  for (const collaborator of publicAi) {
    const parsed = await inferPlanContribution({
      title,
      locale,
      collaborator: { ...collaborator, kind: COLLABORATOR_KINDS.PUBLIC_AI },
      busTranscript: planningBus(titleId),
      workPlanContext: contributions,
      options: baseCtx,
    });

    contributions.push({
      provider: collaborator.provider,
      contributorId: collaborator.id,
      contributorLabel: collaborator.label,
      ...parsed,
    });

    postBusMessage(titleId, {
      phase: GUILD_PHASES.PLANNING,
      fromKind: COLLABORATOR_KINDS.PUBLIC_AI,
      fromId: collaborator.id,
      fromLabel: collaborator.label,
      content: parsed.message,
      provider: collaborator.provider,
    });
  }

  const synthesis = await inferPlanSynthesis({
    title,
    locale,
    conductor: { ...conductor, kind: COLLABORATOR_KINDS.PUBLIC_AI },
    contributions,
    busTranscript: planningBus(titleId),
    options: baseCtx,
  });

  postBusMessage(titleId, {
    phase: GUILD_PHASES.PLANNING,
    fromKind: COLLABORATOR_KINDS.PUBLIC_AI,
    fromId: conductor.id,
    fromLabel: conductor.label,
    content: synthesis.message,
    provider: conductor.provider,
  });

  const workPlan = {
    title: synthesis.planTitle,
    logline: synthesis.logline,
    themes: synthesis.themes,
    neededRoles: synthesis.neededRoles,
    synopsis: synthesis.synopsis,
    plannedAt: Date.now(),
  };

  return { workPlan, contributions };
}