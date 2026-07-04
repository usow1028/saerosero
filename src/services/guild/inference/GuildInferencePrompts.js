/** goal-deliverable: studio-guild */
import { titleName } from '../../CatalogService.js';
import { GUILD_ROLES } from '../types.js';

const ROLE_LIST = Object.values(GUILD_ROLES).join(', ');

export const INFERENCE_PHASE_TAGS = {
  PLANNING_CONTRIBUTION: 'planning_contribution',
  PLANNING_SYNTHESIS: 'planning_synthesis',
  RECRUITMENT_PITCH: 'recruitment_pitch',
  RECRUITMENT_DECISION: 'recruitment_decision',
  STUDIO_PROPOSAL: 'studio_proposal',
  STUDIO_ENDORSE: 'studio_endorse',
  ROLE_CLAIM: 'role_claim',
  ROLE_FINALIZE: 'role_finalize',
  PRODUCTION: 'production',
};

function phaseTag(tag) {
  return `[GUILD_PHASE:${tag}]`;
}

export function buildPlanContributionPrompt({
  title,
  locale,
  collaborator,
  busTranscript = '',
  workPlanContext = [],
}) {
  const name = titleName(title, locale);
  const prior = workPlanContext.map((c) => `${c.contributorLabel}: ${c.message}`).join('\n');
  return [
    phaseTag(INFERENCE_PHASE_TAGS.PLANNING_CONTRIBUTION),
    `You are ${collaborator.label} (${collaborator.provider}), a commercial AI planning a new work.`,
    `Base catalog title: "${name}" (${title.genre}). Propose creative direction for a guild-produced work.`,
    prior ? `Prior plan ideas:\n${prior}` : '',
    busTranscript ? `Planning bus:\n${busTranscript}` : '',
    'Respond with JSON only: {"message":"your plan pitch","logline":"one sentence","themes":["theme1"],"neededRoles":["showrunner","editor"]}',
  ].filter(Boolean).join('\n');
}

export function buildPlanSynthesisPrompt({
  title,
  locale,
  conductor,
  contributions = [],
  busTranscript = '',
}) {
  const name = titleName(title, locale);
  const ideas = contributions.map((c) => `${c.contributorLabel}: ${c.message} | ${c.logline}`).join('\n');
  return [
    phaseTag(INFERENCE_PHASE_TAGS.PLANNING_SYNTHESIS),
    `You are ${conductor.label}, lead planner synthesizing the guild work plan for "${name}".`,
    `Contributions:\n${ideas}`,
    busTranscript ? `Planning bus:\n${busTranscript}` : '',
    'Merge into one actionable plan the party will recruit against.',
    'Respond with JSON only: {"message":"synthesis speech","planTitle":"...","logline":"...","themes":["..."],"neededRoles":["..."],"synopsis":"..."}',
  ].filter(Boolean).join('\n');
}

export function buildRecruitmentPitchPrompt({
  title,
  locale,
  collaborator,
  busTranscript = '',
  workPlan = null,
}) {
  const name = titleName(title, locale);
  const planBlock = workPlan
    ? `Approved work plan: "${workPlan.title}" — ${workPlan.logline}. Themes: ${workPlan.themes?.join(', ')}. Needs: ${workPlan.neededRoles?.join(', ')}.`
    : '';
  return [
    phaseTag(INFERENCE_PHASE_TAGS.RECRUITMENT_PITCH),
    `You are ${collaborator.label} (${collaborator.provider}), recruiting for the guild party.`,
    `Pitch why you should join the party to produce "${name}" (${title.genre}).`,
    planBlock,
    busTranscript ? `Guild bus so far:\n${busTranscript}` : '',
    'Respond with JSON only: {"message":"your pitch referencing the work plan"}',
  ].filter(Boolean).join('\n');
}

export function buildRecruitmentDecisionPrompt({
  title,
  locale,
  conductor,
  candidate,
  pitchMessage,
  busTranscript = '',
}) {
  const name = titleName(title, locale);
  return [
    phaseTag(INFERENCE_PHASE_TAGS.RECRUITMENT_DECISION),
    `You are ${conductor.label}, guild conductor for "${name}".`,
    `[CANDIDATE_ID:${candidate.id}]`,
    `${candidate.label} pitched: ${pitchMessage}`,
    busTranscript ? `Guild bus:\n${busTranscript}` : '',
    'Decide accept or decline for the party roster.',
    'Respond with JSON only: {"accept":true|false,"message":"your reply to the candidate"}',
  ].filter(Boolean).join('\n');
}

export function buildStudioProposalPrompt({ title, locale, collaborator, rosterLabels }) {
  const name = titleName(title, locale);
  return [
    phaseTag(INFERENCE_PHASE_TAGS.STUDIO_PROPOSAL),
    `You are ${collaborator.label}, founding a studio for "${name}" with roster: ${rosterLabels.join(', ')}.`,
    'Propose a studio name and charter.',
    'Respond with JSON only: {"studioName":"...","charter":"...","message":"founding speech"}',
  ].join('\n');
}

export function buildStudioEndorsePrompt({ collaborator, studioName, charter }) {
  return [
    phaseTag(INFERENCE_PHASE_TAGS.STUDIO_ENDORSE),
    `You are ${collaborator.label}. Studio "${studioName}" charter: ${charter}`,
    'Endorse or reject joining this studio.',
    'Respond with JSON only: {"endorse":true|false,"message":"your endorsement speech"}',
  ].join('\n');
}

export function buildRoleClaimPrompt({ title, locale, collaborator, busTranscript = '' }) {
  const name = titleName(title, locale);
  return [
    phaseTag(INFERENCE_PHASE_TAGS.ROLE_CLAIM),
    `You are ${collaborator.label}, negotiating a production role for "${name}".`,
    `Valid roles: ${ROLE_LIST}.`,
    busTranscript ? `Guild bus:\n${busTranscript}` : '',
    'Claim the role you will own in this production.',
    'Respond with JSON only: {"role":"one_valid_role","message":"why you want this role"}',
  ].filter(Boolean).join('\n');
}

export function buildRoleFinalizePrompt({
  conductor,
  members,
  claims,
  busTranscript = '',
}) {
  const roster = members.map((m) => `${m.id}:${m.label}`).join(', ');
  const claimText = claims.map((c) => `${c.memberId} wants ${c.role}: ${c.message}`).join('\n');
  return [
    phaseTag(INFERENCE_PHASE_TAGS.ROLE_FINALIZE),
    `You are ${conductor.label}, finalizing distinct roles for: ${roster}.`,
    `Role claims:\n${claimText}`,
    busTranscript ? `Guild bus:\n${busTranscript}` : '',
    `Assign each memberId one of: ${ROLE_LIST}. Roles must be distinct where possible.`,
    'Respond with JSON only: {"message":"summary","assignments":[{"memberId":"id","role":"role"}]}',
  ].filter(Boolean).join('\n');
}

export function buildProductionPrompt({
  title,
  locale,
  collaborator,
  role,
  priorSteps = [],
  busTranscript = '',
}) {
  const name = titleName(title, locale);
  const prior = priorSteps.map((s) => `${s.collaboratorLabel}: ${s.content}`).join('\n');
  return [
    phaseTag(INFERENCE_PHASE_TAGS.PRODUCTION),
    `You are ${collaborator.label} in role ${role} for "${name}" (${title.genre}).`,
    prior ? `Prior contributions:\n${prior}` : '',
    busTranscript ? `Guild bus:\n${busTranscript}` : '',
    'Write the next production contribution using prior context.',
    'Respond with JSON only: {"content":"draft text"}',
  ].filter(Boolean).join('\n');
}