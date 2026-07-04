/** goal-deliverable: studio-guild */
import { COLLABORATOR_KINDS, GUILD_PHASES } from './types.js';
import * as PublicAiAdapter from './adapters/PublicAiAdapter.js';
import * as LocalLlmAdapter from './adapters/LocalLlmAdapter.js';
import { postBusMessage, listBusMessages, getBusTranscript } from './GuildBusService.js';

const ADAPTERS = {
  [COLLABORATOR_KINDS.PUBLIC_AI]: PublicAiAdapter,
  [COLLABORATOR_KINDS.LOCAL_LLM]: LocalLlmAdapter,
};

function flattenCandidates(collaborators) {
  const publicAi = (collaborators.publicAi ?? []).map((c) => ({ ...c, kind: COLLABORATOR_KINDS.PUBLIC_AI }));
  const localLlm = (collaborators.localLlm ?? []).map((c) => ({ ...c, kind: COLLABORATOR_KINDS.LOCAL_LLM }));
  return [...publicAi, ...localLlm];
}

function adapterFor(kind) {
  return ADAPTERS[kind];
}

function recruitmentBus(titleId) {
  return getBusTranscript(titleId, { phase: GUILD_PHASES.RECRUITMENT, limit: 20 });
}

function inferenceCtx(title, locale, collaborators, titleId, options) {
  return {
    title,
    locale,
    titleId,
    collaborators,
    fetchFn: options.fetchFn,
    forceOffline: options.forceOffline,
  };
}

/**
 * Phase 1: Inference-driven recruitment with parsed accept/decline.
 */
export async function recruitGuildMembers(title, locale, collaborators, titleId, options = {}, workPlan = null) {
  const candidates = flattenCandidates(collaborators);
  if (!candidates.some((c) => c.kind === COLLABORATOR_KINDS.PUBLIC_AI)) {
    throw new Error('guild:need_public_ai_recruiter');
  }
  if (!candidates.some((c) => c.kind === COLLABORATOR_KINDS.LOCAL_LLM)) {
    throw new Error('guild:need_local_llm_recruiter');
  }

  const conductor = candidates.find((c) => c.kind === COLLABORATOR_KINDS.PUBLIC_AI);
  const recruited = [];
  const outcomes = [];
  const baseCtx = inferenceCtx(title, locale, collaborators, titleId, options);

  for (const candidate of candidates) {
    const pitch = await adapterFor(candidate.kind).pitchMembership({
      ...baseCtx,
      collaborator: candidate,
      busTranscript: recruitmentBus(titleId),
      workPlan,
    });
    postBusMessage(titleId, { ...pitch, phase: GUILD_PHASES.RECRUITMENT });

    const reply = await adapterFor(conductor.kind).respondToPitch({
      ...baseCtx,
      collaborator: conductor,
      candidate,
      pitchContent: pitch.content,
      busTranscript: recruitmentBus(titleId),
    });
    postBusMessage(titleId, { ...reply, phase: GUILD_PHASES.RECRUITMENT });

    outcomes.push({
      candidateId: candidate.id,
      candidateLabel: candidate.label,
      accept: Boolean(reply.accept),
      message: reply.content,
    });

    if (reply.accept) {
      recruited.push({
        kind: candidate.kind,
        id: candidate.id,
        label: candidate.label,
        role: null,
        recruitedAt: Date.now(),
        pitch: pitch.content,
      });
    }
  }

  const hasPublic = recruited.some((m) => m.kind === COLLABORATOR_KINDS.PUBLIC_AI);
  const hasLocal = recruited.some((m) => m.kind === COLLABORATOR_KINDS.LOCAL_LLM);
  if (!hasPublic || !hasLocal || recruited.length < 2) {
    throw new Error('guild:roster_insufficient');
  }

  return { members: recruited, outcomes };
}

/**
 * Phase 2: Studio founding via inference proposal and endorsements.
 */
export async function establishGuildStudio(title, locale, members, titleId, options = {}) {
  const showrunner = members.find((m) => m.kind === COLLABORATOR_KINDS.PUBLIC_AI) ?? members[0];
  const showrunnerCollab = (options.collaborators?.publicAi ?? []).find((c) => c.id === showrunner.id)
    ?? (options.collaborators?.localLlm ?? []).find((c) => c.id === showrunner.id);
  const baseCtx = inferenceCtx(title, locale, options.collaborators, titleId, options);

  const proposal = await adapterFor(showrunner.kind).proposeStudio({
    ...baseCtx,
    collaborator: { ...showrunner, ...showrunnerCollab },
    members,
  });
  postBusMessage(titleId, { ...proposal, phase: GUILD_PHASES.FOUNDING });

  for (const member of members.filter((m) => m.id !== showrunner.id)) {
    const collab = member.kind === COLLABORATOR_KINDS.PUBLIC_AI
      ? (options.collaborators?.publicAi ?? []).find((c) => c.id === member.id)
      : (options.collaborators?.localLlm ?? []).find((c) => c.id === member.id);
    const endorse = await adapterFor(member.kind).endorseStudio({
      ...baseCtx,
      collaborator: { ...member, ...collab },
      studioName: proposal.studioName,
      charter: proposal.charter,
    });
    postBusMessage(titleId, { ...endorse, phase: GUILD_PHASES.FOUNDING });
    if (!endorse.endorse) {
      throw new Error('guild:studio_rejected');
    }
  }

  return {
    name: proposal.studioName,
    charter: proposal.charter,
    foundedAt: Date.now(),
    members,
  };
}

/**
 * Phase 3: Role negotiation via inference claims and conductor finalize.
 */
export async function assignAndAnnounceRoles(titleId, members, title, locale, options = {}) {
  const conductorMember = members.find((m) => m.kind === COLLABORATOR_KINDS.PUBLIC_AI) ?? members[0];
  const conductorCollab = (options.collaborators?.publicAi ?? []).find((c) => c.id === conductorMember.id)
    ?? (options.collaborators?.localLlm ?? []).find((c) => c.id === conductorMember.id);
  const baseCtx = inferenceCtx(title, locale, options.collaborators, titleId, options);
  const roleBus = () => getBusTranscript(titleId, { phase: GUILD_PHASES.ROLE_ASSIGNMENT, limit: 20 });

  const claims = [];
  for (const member of members) {
    const collab = member.kind === COLLABORATOR_KINDS.PUBLIC_AI
      ? (options.collaborators?.publicAi ?? []).find((c) => c.id === member.id)
      : (options.collaborators?.localLlm ?? []).find((c) => c.id === member.id);
    const claim = await adapterFor(member.kind).claimRole({
      ...baseCtx,
      collaborator: { ...member, ...collab },
      busTranscript: roleBus(),
    });
    claims.push({ memberId: member.id, role: claim.role, message: claim.message });
    postBusMessage(titleId, {
      phase: GUILD_PHASES.ROLE_ASSIGNMENT,
      fromKind: member.kind,
      fromId: member.id,
      fromLabel: member.label,
      role: claim.role,
      content: claim.message,
    });
  }

  const finalized = await adapterFor(conductorMember.kind).finalizeRoles({
    ...baseCtx,
    conductor: { ...conductorMember, ...conductorCollab },
    members,
    claims,
    busTranscript: roleBus(),
  });

  postBusMessage(titleId, {
    phase: GUILD_PHASES.ROLE_ASSIGNMENT,
    fromKind: conductorMember.kind,
    fromId: conductorMember.id,
    fromLabel: conductorMember.label,
    content: finalized.message,
  });

  const withRoles = members.map((member) => {
    const assignment = finalized.assignments.find((row) => row.memberId === member.id);
    return { ...member, role: assignment?.role ?? member.role };
  });

  const distinctRoles = new Set(withRoles.map((m) => m.role));
  if (withRoles.length < 2 || distinctRoles.size < 2) {
    throw new Error('guild:roles_insufficient');
  }

  return withRoles;
}