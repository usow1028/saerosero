/** goal-deliverable: studio-guild */
import { GUILD_ROLES } from '../types.js';

const VALID_ROLES = new Set(Object.values(GUILD_ROLES));

export function extractJsonObject(text) {
  const trimmed = String(text ?? '').trim();
  if (!trimmed) throw new Error('guild:inference_parse_failed');

  try {
    return JSON.parse(trimmed);
  } catch {
    /* try fenced or embedded object */
  }

  const fence = trimmed.match(/```(?:json)?\s*([\s\S]*?)```/i);
  if (fence) {
    try {
      return JSON.parse(fence[1].trim());
    } catch {
      /* continue */
    }
  }

  const brace = trimmed.match(/\{[\s\S]*\}/);
  if (brace) {
    try {
      return JSON.parse(brace[0]);
    } catch {
      /* continue */
    }
  }

  throw new Error('guild:inference_parse_failed');
}

export function parsePlanContribution(raw) {
  const data = extractJsonObject(raw);
  const message = String(data.message ?? '').trim();
  const logline = String(data.logline ?? '').trim();
  const themes = Array.isArray(data.themes) ? data.themes.map(String) : [];
  const neededRoles = Array.isArray(data.neededRoles) ? data.neededRoles.map(String) : [];
  if (!message) throw new Error('guild:inference_parse_failed');
  return { message, logline, themes, neededRoles };
}

export function parsePlanSynthesis(raw) {
  const data = extractJsonObject(raw);
  const message = String(data.message ?? '').trim();
  const planTitle = String(data.planTitle ?? data.title ?? '').trim();
  const logline = String(data.logline ?? '').trim();
  const synopsis = String(data.synopsis ?? data.message ?? '').trim();
  const themes = Array.isArray(data.themes) ? data.themes.map(String) : [];
  const neededRoles = Array.isArray(data.neededRoles) ? data.neededRoles.map(String) : [];
  if (!message || !planTitle || !logline) throw new Error('guild:inference_parse_failed');
  return { message, planTitle, logline, synopsis, themes, neededRoles };
}

export function parseRecruitmentPitch(raw) {
  const data = extractJsonObject(raw);
  const message = String(data.message ?? data.pitch ?? '').trim();
  if (!message) throw new Error('guild:inference_parse_failed');
  return { message };
}

export function parseRecruitmentDecision(raw) {
  const data = extractJsonObject(raw);
  const message = String(data.message ?? data.reply ?? '').trim();
  const accept = data.accept === true || data.decision === 'accept';
  if (!message) throw new Error('guild:inference_parse_failed');
  return { accept, message };
}

export function parseStudioProposal(raw) {
  const data = extractJsonObject(raw);
  const studioName = String(data.studioName ?? data.name ?? '').trim();
  const charter = String(data.charter ?? '').trim();
  const message = String(data.message ?? '').trim();
  if (!studioName || !charter || !message) throw new Error('guild:inference_parse_failed');
  return { studioName, charter, message };
}

export function parseStudioEndorse(raw) {
  const data = extractJsonObject(raw);
  const message = String(data.message ?? data.endorsement ?? '').trim();
  const endorse = data.endorse !== false && data.accept !== false;
  if (!message) throw new Error('guild:inference_parse_failed');
  return { endorse, message };
}

export function parseRoleClaim(raw) {
  const data = extractJsonObject(raw);
  const role = String(data.role ?? '').trim();
  const message = String(data.message ?? '').trim();
  if (!VALID_ROLES.has(role) || !message) throw new Error('guild:inference_parse_failed');
  return { role, message };
}

export function parseRoleFinalize(raw, memberIds) {
  const data = extractJsonObject(raw);
  const message = String(data.message ?? '').trim();
  const assignments = Array.isArray(data.assignments) ? data.assignments : [];
  const parsed = assignments.map((row) => ({
    memberId: String(row.memberId ?? row.id ?? '').trim(),
    role: String(row.role ?? '').trim(),
  })).filter((row) => row.memberId && VALID_ROLES.has(row.role));

  if (!message || parsed.length < memberIds.length) {
    throw new Error('guild:inference_parse_failed');
  }

  for (const id of memberIds) {
    if (!parsed.some((row) => row.memberId === id)) {
      throw new Error('guild:inference_parse_failed');
    }
  }

  return { message, assignments: parsed };
}

export function parseProductionDraft(raw) {
  const data = extractJsonObject(raw);
  const content = String(data.content ?? data.draft ?? data.text ?? '').trim();
  if (!content) throw new Error('guild:inference_parse_failed');
  return { content };
}