/** goal-deliverable: studio-guild */
import { COLLABORATOR_KINDS } from '../../src/services/guild/types.js';
import { describePipelineSteps } from '../../src/services/guild/GuildOrchestrator.js';

export function assertPipelineBothKinds(session) {
  const kinds = session.steps.map((s) => s.collaboratorKind);
  const firstPublic = kinds.indexOf(COLLABORATOR_KINDS.PUBLIC_AI);
  const firstLocal = kinds.indexOf(COLLABORATOR_KINDS.LOCAL_LLM);
  const ok = firstPublic >= 0 && firstLocal > firstPublic;
  return {
    ok,
    kinds,
    stepNames: describePipelineSteps(session),
    detail: `public@${firstPublic} local@${firstLocal}`,
  };
}

export function assertArtifactNonempty(artifact) {
  const stepCount = artifact?.steps?.length ?? 0;
  const bodyLen = artifact?.merged?.body?.length ?? 0;
  const synopsisLen = artifact?.merged?.synopsis?.length ?? 0;
  return {
    ok: stepCount > 0 && bodyLen > 0 && synopsisLen > 0,
    stepCount,
    bodyLen,
    synopsisLen,
  };
}

export function assertFeedGuildBatch(batch, titleId) {
  const ids = batch.items.map((t) => t.id);
  const unique = new Set(ids);
  const guildItem = batch.items.find((t) => t.id === titleId);
  const catalogCount = batch.items.filter((t) => !t.guildWork).length;
  return {
    ok: unique.size === ids.length
      && ids.includes(titleId)
      && guildItem?.guildWork === true
      && catalogCount > 0,
    batchSize: batch.items.length,
    guildWork: guildItem?.guildWork,
    guildStatus: guildItem?.guildStatus,
    catalogCount,
    duplicateCount: ids.length - unique.size,
  };
}

export function assertInProgressFeed(batch, titleId) {
  const item = batch.items.find((t) => t.id === titleId);
  return {
    ok: item?.guildWork === true && item?.guildStatus === 'in_progress',
    guildStatus: item?.guildStatus,
  };
}

function promptFromInit(init) {
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

export function makeTestFetch({ response = 'http inference draft', onRequest } = {}) {
  return async (url, init) => {
    const prompt = promptFromInit(init);
    onRequest?.({ url, init, prompt });
    const phase = prompt.match(/\[GUILD_PHASE:([^\]]+)\]/)?.[1] ?? '';
    let payload = { content: response };
    if (phase === 'recruitment_pitch') payload = { message: response };
    else if (phase === 'recruitment_decision') payload = { accept: true, message: response };
    else if (phase === 'production') payload = { content: response };
    if (String(url).includes('/v1/chat/completions')) {
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
  };
}

export function formatPass(label, ok, detail = '') {
  return `${ok ? 'PASS' : 'FAIL'}: ${label}${detail ? ` — ${detail}` : ''}`;
}