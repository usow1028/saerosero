/** goal-deliverable: studio-guild */
import { INFERENCE_PHASE_TAGS } from '../src/services/guild/inference/GuildInferencePrompts.js';

function parsePrompt(init) {
  try {
    const body = JSON.parse(init?.body ?? '{}');
    if (body.prompt) return String(body.prompt);
    const msg = body.messages?.[0]?.content;
    if (msg) return String(msg);
  } catch {
    /* ignore */
  }
  return '';
}

function phaseFromPrompt(prompt) {
  const match = prompt.match(/\[GUILD_PHASE:([^\]]+)\]/);
  return match?.[1] ?? '';
}

function isOpenAiUrl(url) {
  return String(url).includes('/v1/chat/completions');
}

function formatInferenceResponse(url, payload) {
  if (isOpenAiUrl(url)) {
    return {
      ok: true,
      json: async () => ({
        choices: [{ message: { content: JSON.stringify(payload) } }],
      }),
    };
  }
  return {
    ok: true,
    json: async () => ({ response: JSON.stringify(payload) }),
  };
}

/**
 * Injectable fetch that returns phase-appropriate JSON inference bodies.
 * Drives the real automation entry — does not mock orchestrator logic.
 */
function candidateIdFromDecisionPrompt(prompt) {
  const tag = prompt.match(/\[CANDIDATE_ID:([^\]]+)\]/);
  if (tag) return tag[1];
  for (const id of ['chatgpt', 'claude', 'grok', 'gemini', 'ollama', 'lmstudio']) {
    if (prompt.toLowerCase().includes(id)) return id;
  }
  return '';
}

export function makeAutomationFetch({
  marker = 'INFERENCE-MOCK',
  memberRoles = {},
  declineCandidates = [],
  onRequest,
  onDecision,
} = {}) {
  let callIndex = 0;

  return async (url, init) => {
    const prompt = parsePrompt(init);
    const phase = phaseFromPrompt(prompt);
    onRequest?.({ url, prompt, phase, callIndex });
    callIndex += 1;

    let payload;

    switch (phase) {
      case INFERENCE_PHASE_TAGS.PLANNING_CONTRIBUTION:
        payload = {
          message: `${marker}-plan-contrib-${callIndex}`,
          logline: `${marker} logline ${callIndex}`,
          themes: ['collaboration'],
          neededRoles: ['showrunner', 'editor'],
        };
        break;
      case INFERENCE_PHASE_TAGS.PLANNING_SYNTHESIS:
        payload = {
          message: `${marker}-plan-synthesis`,
          planTitle: `${marker} Work Plan`,
          logline: `${marker} unified logline`,
          themes: ['collaboration', 'vision'],
          neededRoles: ['showrunner', 'critic'],
          synopsis: `${marker} synopsis for party recruitment`,
        };
        break;
      case INFERENCE_PHASE_TAGS.RECRUITMENT_PITCH:
        payload = { message: `${marker}-pitch-${callIndex}` };
        break;
      case INFERENCE_PHASE_TAGS.RECRUITMENT_DECISION: {
        const candidateKey = candidateIdFromDecisionPrompt(prompt);
        const declined = declineCandidates.includes(candidateKey);
        const accept = !declined;
        payload = {
          accept,
          message: accept
            ? `${marker}-accept-${callIndex}`
            : `${marker}-decline-${callIndex}`,
        };
        onDecision?.({ candidateKey, accept, message: payload.message, prompt });
        break;
      }
      case INFERENCE_PHASE_TAGS.STUDIO_PROPOSAL:
        payload = {
          studioName: `${marker} Studio`,
          charter: `${marker} collaborative charter`,
          message: `${marker}-studio-proposal`,
        };
        break;
      case INFERENCE_PHASE_TAGS.STUDIO_ENDORSE:
        payload = { endorse: true, message: `${marker}-studio-endorse-${callIndex}` };
        break;
      case INFERENCE_PHASE_TAGS.ROLE_CLAIM: {
        const wantsCritic = prompt.includes('ChatGPT') || prompt.includes('chatgpt');
        payload = {
          role: wantsCritic ? 'critic' : 'editor',
          message: `${marker}-role-claim-${callIndex}`,
        };
        break;
      }
      case INFERENCE_PHASE_TAGS.ROLE_FINALIZE: {
        const assignments = Object.entries(memberRoles).map(([memberId, role]) => ({
          memberId,
          role,
        }));
        payload = {
          message: `${marker}-roles-finalized`,
          assignments,
        };
        break;
      }
      case INFERENCE_PHASE_TAGS.PRODUCTION: {
        const hasPrior = prompt.includes('Prior contributions:');
        payload = {
          content: hasPrior
            ? `${marker}-production-with-context-${callIndex}`
            : `${marker}-production-${callIndex}`,
        };
        break;
      }
      default:
        payload = { content: `${marker}-fallback-${callIndex}` };
    }

    return formatInferenceResponse(url, payload);
  };
}