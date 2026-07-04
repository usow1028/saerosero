/** goal-deliverable: studio-guild */
import { getEnabledCollaborators } from './GuildSettingsService.js';
import {
  getGuildArtifact,
  saveGuildArtifact,
  mergeGuildSteps,
} from './GuildArtifactService.js';
import { runWorkPlanning } from './GuildPlanningService.js';
import {
  recruitGuildMembers,
  establishGuildStudio,
  assignAndAnnounceRoles,
} from './GuildFormationService.js';
import { getGuildSettings } from './GuildSettingsService.js';
import { sortMembersForProduction } from './GuildRoleService.js';
import {
  resetGuildBus,
  loadBusFromArtifact,
  listBusMessages,
  postBusMessage,
  getBusTranscript,
} from './GuildBusService.js';
import * as PublicAiAdapter from './adapters/PublicAiAdapter.js';
import * as LocalLlmAdapter from './adapters/LocalLlmAdapter.js';
import { COLLABORATOR_KINDS, GUILD_PHASES } from './types.js';

const ADAPTERS = {
  [COLLABORATOR_KINDS.PUBLIC_AI]: PublicAiAdapter,
  [COLLABORATOR_KINDS.LOCAL_LLM]: LocalLlmAdapter,
};

function persistAutomationState(title, locale, patch, existing, startedAt) {
  const current = getGuildArtifact(title.id) ?? existing;
  const steps = patch.steps ?? current?.steps ?? [];
  const workPlan = patch.workPlan ?? current?.workPlan;
  const merged = steps.length
    ? mergeGuildSteps(title, locale, steps, patch.studio ?? current?.studio, workPlan)
    : { synopsis: '', body: '' };
  const now = Date.now();
  return saveGuildArtifact({
    titleId: title.id,
    status: patch.status ?? current?.status ?? 'in_progress',
    phase: patch.phase ?? current?.phase ?? GUILD_PHASES.PLANNING,
    workPlan,
    studio: patch.studio ?? current?.studio,
    messages: listBusMessages(title.id),
    members: patch.members ?? current?.members ?? [],
    createdAt: current?.createdAt ?? startedAt,
    updatedAt: now,
    steps,
    merged,
  });
}

/**
 * Full automation: recruit → found studio → assign roles → produce one work.
 */
export async function runGuildAutomation(title, locale, options = {}) {
  const {
    collaborators = getEnabledCollaborators(),
    fetchFn = globalThis.fetch,
    forceOffline = false,
    onPhase,
    onActivity,
  } = options;

  const publicAiList = collaborators.publicAi ?? [];
  const localLlmList = collaborators.localLlm ?? [];
  if (!publicAiList.length || !localLlmList.length) {
    throw new Error('guild:need_both_collaborator_kinds');
  }

  const existing = getGuildArtifact(title.id);
  const startedAt = Date.now();
  resetGuildBus(title.id);
  if (existing?.messages?.length) loadBusFromArtifact(title.id, existing.messages);

  const notify = (phase) => onPhase?.(phase);
  const settings = getGuildSettings();
  const inferenceOpts = {
    fetchFn,
    forceOffline,
    collaborators: { ...collaborators, commercialProxy: settings.commercialProxy },
    commercialProxy: settings.commercialProxy,
  };

  notify(GUILD_PHASES.PLANNING);
  const { workPlan, contributions } = await runWorkPlanning(
    title,
    locale,
    collaborators,
    title.id,
    inferenceOpts,
  );
  onActivity?.({ phase: GUILD_PHASES.PLANNING, workPlan, contributions });
  persistAutomationState(title, locale, {
    phase: GUILD_PHASES.PLANNING,
    status: 'in_progress',
    workPlan,
    steps: [],
  }, existing, startedAt);

  notify(GUILD_PHASES.RECRUITMENT);

  const { members: recruited, outcomes: recruitmentOutcomes } = await recruitGuildMembers(
    title,
    locale,
    collaborators,
    title.id,
    inferenceOpts,
    workPlan,
  );
  persistAutomationState(title, locale, {
    phase: GUILD_PHASES.RECRUITMENT,
    status: 'in_progress',
    members: recruited,
    steps: [],
  }, existing, startedAt);

  notify(GUILD_PHASES.FOUNDING);
  const studio = await establishGuildStudio(title, locale, recruited, title.id, inferenceOpts);
  persistAutomationState(title, locale, {
    phase: GUILD_PHASES.FOUNDING,
    studio,
    members: recruited,
  }, existing, startedAt);

  notify(GUILD_PHASES.ROLE_ASSIGNMENT);
  const members = await assignAndAnnounceRoles(title.id, recruited, title, locale, inferenceOpts);
  studio.members = members;
  persistAutomationState(title, locale, {
    phase: GUILD_PHASES.ROLE_ASSIGNMENT,
    studio,
    members,
  }, existing, startedAt);

  notify(GUILD_PHASES.PRODUCTION);
  const steps = [];
  const prior = [];
  let order = 0;
  const productionOrder = sortMembersForProduction(members);

  for (const member of productionOrder) {
    const collaborator = member.kind === COLLABORATOR_KINDS.PUBLIC_AI
      ? publicAiList.find((c) => c.id === member.id)
      : localLlmList.find((c) => c.id === member.id);
    if (!collaborator) continue;

    const adapter = ADAPTERS[member.kind];
    const contribution = await adapter.produceForRole({
      title,
      locale,
      collaborator,
      role: member.role,
      priorSteps: prior,
      busTranscript: getBusTranscript(title.id, { limit: 30 }),
      fetchFn,
      forceOffline,
      collaborators,
    });

    order += 1;
    const step = { order, role: member.role, ...contribution };
    steps.push(step);
    prior.push(contribution);

    postBusMessage(title.id, {
      phase: GUILD_PHASES.PRODUCTION,
      fromKind: member.kind,
      fromId: member.id,
      fromLabel: member.label,
      role: member.role,
      content: contribution.content.slice(0, 160),
    });

    persistAutomationState(title, locale, {
      phase: GUILD_PHASES.PRODUCTION,
      studio,
      members,
      steps,
    }, existing, startedAt);
  }

  notify(GUILD_PHASES.COMPLETED);
  const artifact = persistAutomationState(title, locale, {
    phase: GUILD_PHASES.COMPLETED,
    status: 'completed',
    studio,
    members,
    steps,
  }, existing, startedAt);

  return {
    titleId: title.id,
    phase: GUILD_PHASES.COMPLETED,
    workPlan,
    studio,
    members,
    recruitmentOutcomes,
    messages: listBusMessages(title.id),
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

export function describeAutomationPhases(session) {
  return [
    `plan=${session.workPlan?.title ?? 'none'}`,
    `recruited=${session.members?.length ?? 0}`,
    `studio=${session.studio?.name ?? 'none'}`,
    `messages=${session.messages?.length ?? 0}`,
    `steps=${session.steps?.length ?? 0}`,
  ].join(' ');
}