/** goal-deliverable: studio-guild */
import { COLLABORATOR_KINDS, GUILD_ROLES } from '../types.js';
import {
  inferRecruitmentPitch,
  inferRecruitmentDecision,
  inferStudioProposal,
  inferStudioEndorse,
  inferRoleClaim,
  inferRoleFinalize,
  inferProductionDraft,
} from '../inference/GuildInferenceService.js';

export const KIND = COLLABORATOR_KINDS.PUBLIC_AI;

function baseMessage(collaborator, overrides = {}) {
  return {
    fromKind: KIND,
    fromId: collaborator.id,
    fromLabel: collaborator.label,
    at: Date.now(),
    ...overrides,
  };
}

function inferenceCtx(collaborator, options = {}) {
  return { collaborator, options };
}

export async function pitchMembership(ctx) {
  const { message } = await inferRecruitmentPitch({
    title: ctx.title,
    locale: ctx.locale,
    collaborator: { ...ctx.collaborator, kind: KIND },
    busTranscript: ctx.busTranscript,
    workPlan: ctx.workPlan,
    options: ctx,
  });
  return baseMessage(ctx.collaborator, { content: message });
}

export async function respondToPitch(ctx) {
  const { accept, message } = await inferRecruitmentDecision({
    title: ctx.title,
    locale: ctx.locale,
    conductor: { ...ctx.collaborator, kind: KIND },
    candidate: ctx.candidate,
    pitchMessage: ctx.pitchContent,
    busTranscript: ctx.busTranscript,
    options: ctx,
  });
  return {
    ...baseMessage(ctx.collaborator, {
      toKind: ctx.candidate.kind,
      toId: ctx.candidate.id,
      toLabel: ctx.candidate.label,
      content: message,
    }),
    accept,
  };
}

export async function proposeStudio(ctx) {
  const parsed = await inferStudioProposal({
    title: ctx.title,
    locale: ctx.locale,
    collaborator: { ...ctx.collaborator, kind: KIND },
    rosterLabels: ctx.members.map((m) => m.label),
    options: ctx,
  });
  return {
    ...baseMessage(ctx.collaborator, { content: parsed.message }),
    studioName: parsed.studioName,
    charter: parsed.charter,
  };
}

export async function endorseStudio(ctx) {
  const { endorse, message } = await inferStudioEndorse({
    collaborator: { ...ctx.collaborator, kind: KIND },
    studioName: ctx.studioName,
    charter: ctx.charter,
    options: ctx,
  });
  return { ...baseMessage(ctx.collaborator, { content: message }), endorse };
}

export async function claimRole(ctx) {
  const { role, message } = await inferRoleClaim({
    title: ctx.title,
    locale: ctx.locale,
    collaborator: { ...ctx.collaborator, kind: KIND },
    busTranscript: ctx.busTranscript,
    options: ctx,
  });
  return { role, message };
}

export async function finalizeRoles(ctx) {
  return inferRoleFinalize({
    conductor: { ...ctx.conductor, kind: KIND },
    members: ctx.members,
    claims: ctx.claims,
    busTranscript: ctx.busTranscript,
    options: ctx,
  });
}

export async function produceForRole(ctx) {
  const { content } = await inferProductionDraft({
    title: ctx.title,
    locale: ctx.locale,
    collaborator: { ...ctx.collaborator, kind: KIND },
    role: ctx.role ?? GUILD_ROLES.SCREENWRITER,
    priorSteps: ctx.priorSteps,
    busTranscript: ctx.busTranscript,
    options: ctx,
  });
  return {
    collaboratorKind: KIND,
    collaboratorId: ctx.collaborator.id,
    collaboratorLabel: ctx.collaborator.label,
    role: ctx.role,
    content,
    at: Date.now(),
  };
}

/** Legacy pipeline entry — uses inference, no template fallback. */
export async function contribute({
  title,
  locale,
  collaborator,
  priorSteps = [],
  busTranscript = '',
  fetchFn = globalThis.fetch,
  forceOffline = false,
  collaborators,
  role = GUILD_ROLES.SCREENWRITER,
}) {
  return produceForRole({
    title,
    locale,
    collaborator,
    role,
    priorSteps,
    busTranscript,
    fetchFn,
    forceOffline,
    collaborators,
  });
}