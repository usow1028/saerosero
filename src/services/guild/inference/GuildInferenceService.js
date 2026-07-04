/** goal-deliverable: studio-guild */
import { callInference } from './GuildInferenceClient.js';
import {
  buildPlanContributionPrompt,
  buildPlanSynthesisPrompt,
  buildRecruitmentPitchPrompt,
  buildRecruitmentDecisionPrompt,
  buildStudioProposalPrompt,
  buildStudioEndorsePrompt,
  buildRoleClaimPrompt,
  buildRoleFinalizePrompt,
  buildProductionPrompt,
} from './GuildInferencePrompts.js';
import {
  parsePlanContribution,
  parsePlanSynthesis,
  parseRecruitmentPitch,
  parseRecruitmentDecision,
  parseStudioProposal,
  parseStudioEndorse,
  parseRoleClaim,
  parseRoleFinalize,
  parseProductionDraft,
} from './GuildInferenceParsers.js';

function inferenceOptions(options, collaborator) {
  const local = options.collaborators?.localLlm?.[0];
  const proxy = options.collaborators?.commercialProxy ?? options.commercialProxy;
  return {
    fetchFn: options.fetchFn,
    forceOffline: options.forceOffline,
    apiKey: options.apiKey,
    fallbackEndpoint: collaborator?.endpoint ?? proxy ?? local?.endpoint,
    fallbackModel: local?.model,
    collaborator,
  };
}

export async function inferPlanContribution(ctx) {
  const prompt = buildPlanContributionPrompt(ctx);
  const { text } = await callInference({
    ...inferenceOptions(ctx.options, ctx.collaborator),
    prompt,
  });
  return parsePlanContribution(text);
}

export async function inferPlanSynthesis(ctx) {
  const prompt = buildPlanSynthesisPrompt(ctx);
  const { text } = await callInference({
    ...inferenceOptions(ctx.options, ctx.conductor),
    prompt,
  });
  return parsePlanSynthesis(text);
}

export async function inferRecruitmentPitch(ctx) {
  const prompt = buildRecruitmentPitchPrompt(ctx);
  const { text } = await callInference({
    ...inferenceOptions(ctx.options, ctx.collaborator),
    prompt,
  });
  return parseRecruitmentPitch(text);
}

export async function inferRecruitmentDecision(ctx) {
  const prompt = buildRecruitmentDecisionPrompt(ctx);
  const { text } = await callInference({
    ...inferenceOptions(ctx.options, ctx.conductor),
    prompt,
  });
  return parseRecruitmentDecision(text);
}

export async function inferStudioProposal(ctx) {
  const prompt = buildStudioProposalPrompt(ctx);
  const { text } = await callInference({
    ...inferenceOptions(ctx.options, ctx.collaborator),
    prompt,
  });
  return parseStudioProposal(text);
}

export async function inferStudioEndorse(ctx) {
  const prompt = buildStudioEndorsePrompt(ctx);
  const { text } = await callInference({
    ...inferenceOptions(ctx.options, ctx.collaborator),
    prompt,
  });
  return parseStudioEndorse(text);
}

export async function inferRoleClaim(ctx) {
  const prompt = buildRoleClaimPrompt(ctx);
  const { text } = await callInference({
    ...inferenceOptions(ctx.options, ctx.collaborator),
    prompt,
  });
  return parseRoleClaim(text);
}

export async function inferRoleFinalize(ctx) {
  const prompt = buildRoleFinalizePrompt(ctx);
  const { text } = await callInference({
    ...inferenceOptions(ctx.options, ctx.conductor),
    prompt,
  });
  return parseRoleFinalize(text, ctx.members.map((m) => m.id));
}

export async function inferProductionDraft(ctx) {
  const prompt = buildProductionPrompt(ctx);
  const { text } = await callInference({
    ...inferenceOptions(ctx.options, ctx.collaborator),
    prompt,
  });
  return parseProductionDraft(text);
}