/** goal-deliverable: studio-guild */
import * as PublicAiAdapter from './adapters/PublicAiAdapter.js';
import * as LocalLlmAdapter from './adapters/LocalLlmAdapter.js';
import { getEnabledCollaborators } from './GuildSettingsService.js';
import {
  getGuildArtifact,
  saveGuildArtifact,
  mergeGuildSteps,
} from './GuildArtifactService.js';
import { assignAndAnnounceRoles } from './GuildFormationService.js';
import { sortMembersForProduction } from './GuildRoleService.js';
import {
  resetGuildBus,
  getBusTranscript,
  postBusMessage,
} from './GuildBusService.js';
import { COLLABORATOR_KINDS, GUILD_PHASES } from './types.js';

const ADAPTERS = {
  [COLLABORATOR_KINDS.PUBLIC_AI]: PublicAiAdapter,
  [COLLABORATOR_KINDS.LOCAL_LLM]: LocalLlmAdapter,
};

export function getAdapter(kind) {
  return ADAPTERS[kind] ?? null;
}

function persistArtifact(title, locale, status, steps, existing, startedAt, patch = {}) {
  const merged = steps.length
    ? mergeGuildSteps(title, locale, steps, patch.studio)
    : { synopsis: '', body: '' };
  const now = Date.now();
  return saveGuildArtifact({
    titleId: title.id,
    status,
    phase: patch.phase ?? existing?.phase,
    studio: patch.studio,
    members: patch.members,
    messages: patch.messages,
    createdAt: existing?.createdAt ?? startedAt,
    updatedAt: now,
    steps,
    merged,
  });
}

/**
 * Legacy sequential pipeline — still inference-driven with bus context and negotiated roles.
 */
export async function runGuildPipeline(title, locale, options = {}) {
  const {
    collaborators = getEnabledCollaborators(),
    fetchFn = globalThis.fetch,
    forceOffline = false,
  } = options;

  const publicAiList = collaborators.publicAi ?? [];
  const localLlmList = collaborators.localLlm ?? [];

  if (!publicAiList.length || !localLlmList.length) {
    throw new Error('guild:need_both_collaborator_kinds');
  }

  const existing = getGuildArtifact(title.id);
  const startedAt = Date.now();
  resetGuildBus(title.id);

  const roster = [
    ...publicAiList.map((c) => ({
      kind: COLLABORATOR_KINDS.PUBLIC_AI,
      id: c.id,
      label: c.label,
      recruitedAt: startedAt,
    })),
    ...localLlmList.map((c) => ({
      kind: COLLABORATOR_KINDS.LOCAL_LLM,
      id: c.id,
      label: c.label,
      recruitedAt: startedAt,
    })),
  ];

  const inferenceOpts = { fetchFn, forceOffline, collaborators };
  const members = await assignAndAnnounceRoles(title.id, roster, title, locale, inferenceOpts);

  const steps = [];
  const prior = [];
  let order = 0;
  const productionOrder = sortMembersForProduction(members);

  persistArtifact(title, locale, 'in_progress', steps, existing, startedAt, {
    phase: GUILD_PHASES.PRODUCTION,
    members,
    messages: [],
  });

  for (const member of productionOrder) {
    const collaborator = member.kind === COLLABORATOR_KINDS.PUBLIC_AI
      ? publicAiList.find((c) => c.id === member.id)
      : localLlmList.find((c) => c.id === member.id);
    if (!collaborator) continue;

    const adapter = ADAPTERS[member.kind];
    const busTranscript = getBusTranscript(title.id, { limit: 30 });
    const contribution = await adapter.produceForRole({
      title,
      locale,
      collaborator,
      role: member.role,
      priorSteps: prior,
      busTranscript,
      fetchFn,
      forceOffline,
      collaborators,
    });

    order += 1;
    steps.push({ order, role: member.role, ...contribution });
    prior.push(contribution);

    postBusMessage(title.id, {
      phase: GUILD_PHASES.PRODUCTION,
      fromKind: member.kind,
      fromId: member.id,
      fromLabel: member.label,
      role: member.role,
      content: contribution.content.slice(0, 160),
    });

    persistArtifact(title, locale, 'in_progress', steps, existing, startedAt, {
      phase: GUILD_PHASES.PRODUCTION,
      members,
    });
  }

  const artifact = persistArtifact(title, locale, 'completed', steps, existing, startedAt, {
    phase: GUILD_PHASES.COMPLETED,
    members,
  });

  return {
    titleId: title.id,
    members,
    steps: steps.map((s) => ({
      order: s.order,
      collaboratorKind: s.collaboratorKind,
      collaboratorId: s.collaboratorId,
      collaboratorLabel: s.collaboratorLabel,
      role: s.role,
    })),
    artifact,
  };
}

export function describePipelineSteps(session) {
  return session.steps.map((s) => `${s.order}:${s.collaboratorKind}:${s.collaboratorId}`);
}