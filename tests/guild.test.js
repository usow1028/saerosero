/** goal-deliverable: studio-guild */
import { describe, it, expect, beforeEach } from 'vitest';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { runGuildPipeline, describePipelineSteps } from '../src/services/guild/GuildOrchestrator.js';
import {
  runGuildAutomation,
  describeAutomationPhases,
} from '../src/services/guild/GuildAutomationOrchestrator.js';
import { COLLABORATOR_KINDS, GUILD_PHASES } from '../src/services/guild/types.js';
import { countBusMessages } from '../src/services/guild/GuildBusService.js';
import { assignGuildRoles } from '../src/services/guild/GuildRoleService.js';
import {
  getGuildArtifact,
  listGuildFeedTitles,
  deleteGuildArtifact,
  saveGuildArtifact,
  isGuildFeedEligible,
} from '../src/services/guild/GuildArtifactService.js';
import { buildFeedBatch } from '../src/services/FeedService.js';
import * as PublicAiAdapter from '../src/services/guild/adapters/PublicAiAdapter.js';
import * as LocalLlmAdapter from '../src/services/guild/adapters/LocalLlmAdapter.js';
import { makeAutomationFetch } from './guild-inference-mock.mjs';
import { makeTestFetch } from './goal/assertions.mjs';

const catalog = JSON.parse(
  readFileSync(path.join(path.dirname(fileURLToPath(import.meta.url)), '../public/data/catalog.json'), 'utf8'),
);

const store = new Map();

beforeEach(() => {
  store.clear();
  globalThis.localStorage = {
    getItem: (key) => (store.has(key) ? store.get(key) : null),
    setItem: (key, value) => { store.set(key, String(value)); },
    removeItem: (key) => { store.delete(key); },
    clear: () => { store.clear(); },
  };
});

const sampleTitle = catalog.titles[0];

const collaborators = {
  publicAi: [
    {
      id: 'chatgpt',
      label: 'ChatGPT',
      provider: 'chatgpt',
      endpoint: 'http://test.public:11434',
      model: 'llama3',
      enabled: true,
    },
    {
      id: 'gemini',
      label: 'Gemini',
      provider: 'gemini',
      endpoint: 'http://test.public:11434',
      model: 'llama3',
      enabled: true,
    },
  ],
  localLlm: [
    {
      id: 'ollama',
      label: 'Ollama',
      endpoint: 'http://127.0.0.1:11434',
      model: 'llama3',
      enabled: true,
    },
    {
      id: 'lmstudio',
      label: 'LM Studio',
      endpoint: 'http://127.0.0.1:1234',
      model: 'mistral',
      enabled: true,
    },
  ],
};

const pairCollaborators = {
  publicAi: [collaborators.publicAi[0]],
  localLlm: [collaborators.localLlm[0]],
};

describe('guild inference adapters', () => {
  it('public_ai production uses LiteLLM OpenAI-compatible endpoint', async () => {
    const requests = [];
    const out = await PublicAiAdapter.contribute({
      title: sampleTitle,
      locale: 'ko',
      collaborator: collaborators.publicAi[0],
      fetchFn: makeTestFetch({
        response: 'public inference draft',
        onRequest: (r) => requests.push(r.url),
      }),
      collaborators: pairCollaborators,
    });
    expect(requests[0]).toContain('/v1/chat/completions');
    expect(out.content).toBe('public inference draft');
  });

  it('local_llm production uses HTTP inference response', async () => {
    const out = await LocalLlmAdapter.contribute({
      title: sampleTitle,
      locale: 'ko',
      collaborator: collaborators.localLlm[0],
      fetchFn: makeTestFetch({ response: 'local inference draft' }),
      collaborators: pairCollaborators,
    });
    expect(out.content).toBe('local inference draft');
  });

  it('throws when inference unavailable (no silent stub)', async () => {
    await expect(PublicAiAdapter.contribute({
      title: sampleTitle,
      locale: 'ko',
      collaborator: collaborators.publicAi[0],
      fetchFn: async () => { throw new Error('down'); },
      collaborators: pairCollaborators,
    })).rejects.toThrow('guild:inference_unavailable');
  });
});

describe('GuildAutomationOrchestrator (inference-driven)', () => {
  it('runs planning phase before recruitment and persists workPlan', async () => {
    const requests = [];
    const fetchFn = makeAutomationFetch({
      marker: 'PLAN-TEST',
      memberRoles: { chatgpt: 'critic', ollama: 'editor' },
      onRequest: (r) => requests.push(r),
    });

    const session = await runGuildAutomation(sampleTitle, 'ko', {
      collaborators: pairCollaborators,
      fetchFn,
    });

    const planningCalls = requests.filter((r) => r.phase?.includes('planning'));
    expect(planningCalls.length).toBeGreaterThanOrEqual(2);
    expect(session.workPlan?.title).toContain('PLAN-TEST Work Plan');
    expect(session.messages.some((m) => m.phase === GUILD_PHASES.PLANNING)).toBe(true);

    const artifact = getGuildArtifact(sampleTitle.id);
    expect(artifact.workPlan?.title).toContain('PLAN-TEST Work Plan');

    deleteGuildArtifact(sampleTitle.id);
  });

  it('parsed accept:false excludes candidate from roster', async () => {
    const decisions = [];
    const fetchFn = makeAutomationFetch({
      marker: 'DECLINE-TEST',
      declineCandidates: ['gemini'],
      memberRoles: { chatgpt: 'critic', ollama: 'editor' },
      onDecision: (d) => decisions.push(d),
    });

    const session = await runGuildAutomation(sampleTitle, 'ko', {
      collaborators: {
        publicAi: collaborators.publicAi.slice(0, 2),
        localLlm: [collaborators.localLlm[0]],
      },
      fetchFn,
    });

    expect(decisions.some((d) => d.accept === false)).toBe(true);
    expect(decisions.some((d) => d.accept === true)).toBe(true);
    expect(session.recruitmentOutcomes.find((o) => o.candidateId === 'gemini')?.accept).toBe(false);
    expect(session.members.map((m) => m.id)).toEqual(['chatgpt', 'ollama']);
    expect(session.members.some((m) => m.id === 'gemini')).toBe(false);

    deleteGuildArtifact(sampleTitle.id);
  });

  it('recruitment posts inference-returned bus messages and HTTP was called', async () => {
    const requests = [];
    const fetchFn = makeAutomationFetch({
      marker: 'RECRUIT-HTTP',
      memberRoles: { chatgpt: 'critic', ollama: 'editor' },
      onRequest: (r) => requests.push(r),
    });

    const session = await runGuildAutomation(sampleTitle, 'ko', {
      collaborators: pairCollaborators,
      fetchFn,
    });

    const recruitmentCalls = requests.filter((r) => r.phase?.includes('recruitment'));
    expect(recruitmentCalls.length).toBeGreaterThan(0);
    expect(session.messages.some((m) => m.content.includes('RECRUIT-HTTP-pitch'))).toBe(true);
    expect(session.messages.some((m) => m.content.includes('RECRUIT-HTTP-accept'))).toBe(true);

    deleteGuildArtifact(sampleTitle.id);
  });

  it('roles come from inference negotiation, not static kind lookup', async () => {
    const fetchFn = makeAutomationFetch({
      memberRoles: { chatgpt: 'critic', ollama: 'editor' },
    });

    const session = await runGuildAutomation(sampleTitle, 'ko', {
      collaborators: pairCollaborators,
      fetchFn,
    });

    const staticRoles = assignGuildRoles(
      session.members.map((m) => ({ ...m, role: null })),
    ).map((m) => m.role);
    const inferredRoles = session.members.map((m) => m.role);

    expect(new Set(inferredRoles).size).toBeGreaterThanOrEqual(2);
    expect(inferredRoles).toEqual(['critic', 'editor']);
    expect(inferredRoles).not.toEqual(staticRoles);

    deleteGuildArtifact(sampleTitle.id);
  });

  it('production artifact includes inference content and prior context', async () => {
    const fetchFn = makeAutomationFetch({
      marker: 'PROD-CTX',
      memberRoles: { chatgpt: 'critic', ollama: 'editor' },
    });

    const session = await runGuildAutomation(sampleTitle, 'ko', {
      collaborators: pairCollaborators,
      fetchFn,
    });

    expect(session.phase).toBe(GUILD_PHASES.COMPLETED);
    expect(session.steps.length).toBeGreaterThanOrEqual(2);

    const artifact = getGuildArtifact(sampleTitle.id);
    expect(artifact.merged.body).toContain('PROD-CTX-production');
    expect(artifact.merged.body).toMatch(/PROD-CTX-production-with-context/);

    deleteGuildArtifact(sampleTitle.id);
  });

  it('fails honestly when endpoints are unreachable', async () => {
    await expect(runGuildAutomation(sampleTitle, 'ko', {
      collaborators: pairCollaborators,
      fetchFn: async () => { throw new Error('network down'); },
    })).rejects.toThrow('guild:inference_unavailable');
  });
});

describe('GuildOrchestrator', () => {
  it('runs pipeline with role negotiation and bus-context production', async () => {
    const requests = [];
    const session = await runGuildPipeline(sampleTitle, 'ko', {
      collaborators: pairCollaborators,
      fetchFn: makeAutomationFetch({
        marker: 'PIPELINE-CTX',
        memberRoles: { chatgpt: 'critic', ollama: 'editor' },
        onRequest: (r) => requests.push(r),
      }),
    });

    const roleCalls = requests.filter((r) => r.phase?.includes('role'));
    const productionCalls = requests.filter((r) => r.phase === 'production');
    expect(roleCalls.length).toBeGreaterThan(0);
    expect(productionCalls.length).toBeGreaterThanOrEqual(2);
    expect(session.members.every((m) => m.role)).toBe(true);
    expect(session.steps.every((s) => s.role)).toBe(true);

    const artifact = getGuildArtifact(sampleTitle.id);
    expect(artifact.merged.body).toContain('PIPELINE-CTX-production-with-context');

    deleteGuildArtifact(sampleTitle.id);
  });
});

describe('feed guild integration', () => {
  it('includes in-progress guild works in feed batches', () => {
    saveGuildArtifact({
      titleId: sampleTitle.id,
      status: 'in_progress',
      createdAt: Date.now(),
      updatedAt: Date.now(),
      steps: [],
      merged: { synopsis: '', body: '' },
    });
    expect(isGuildFeedEligible(getGuildArtifact(sampleTitle.id))).toBe(true);

    const feedTitles = listGuildFeedTitles(catalog, 'ko');
    const inProgress = feedTitles.find((t) => t.id === sampleTitle.id);
    expect(inProgress?.guildWork).toBe(true);
    expect(inProgress?.guildStatus).toBe('in_progress');

    const batch = buildFeedBatch(catalog, 'ko', { seen: new Set(), cursor: 0 });
    const batchItem = batch.items.find((t) => t.id === sampleTitle.id);
    expect(batchItem?.guildStatus).toBe('in_progress');

    deleteGuildArtifact(sampleTitle.id);
  });

  it('includes guild work titles in feed batches without duplicate ids', async () => {
    await runGuildAutomation(sampleTitle, 'ko', {
      collaborators: pairCollaborators,
      fetchFn: makeAutomationFetch({ memberRoles: { chatgpt: 'critic', ollama: 'editor' } }),
    });

    const batch = buildFeedBatch(catalog, 'ko', { seen: new Set(), cursor: 0 });
    const ids = batch.items.map((t) => t.id);
    expect(new Set(ids).size).toBe(ids.length);
    expect(ids).toContain(sampleTitle.id);

    deleteGuildArtifact(sampleTitle.id);
  });
});