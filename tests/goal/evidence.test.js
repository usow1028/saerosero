/** goal-deliverable: studio-guild */
import { describe, it, expect, beforeEach, beforeAll, afterAll } from 'vitest';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { runGuildPipeline } from '../../src/services/guild/GuildOrchestrator.js';
import { runGuildAutomation } from '../../src/services/guild/GuildAutomationOrchestrator.js';
import { COLLABORATOR_KINDS, GUILD_PHASES } from '../../src/services/guild/types.js';
import {
  getGuildArtifact,
  deleteGuildArtifact,
  saveGuildArtifact,
} from '../../src/services/guild/GuildArtifactService.js';
import { buildFeedBatch } from '../../src/services/FeedService.js';
import * as LocalLlmAdapter from '../../src/services/guild/adapters/LocalLlmAdapter.js';
import {
  assertPipelineBothKinds,
  assertArtifactNonempty,
  assertFeedGuildBatch,
  assertInProgressFeed,
  makeTestFetch,
  formatPass,
} from './assertions.mjs';
import {
  recordGuildSession,
  recordFeedGuild,
  recordGuildInference,
  flushGoalLogs,
  resetGoalLogs,
} from './reporter.mjs';
import { makeAutomationFetch } from '../guild-inference-mock.mjs';

// makeTestFetch still used by local_llm endpoint test

const catalog = JSON.parse(
  readFileSync(path.join(path.dirname(fileURLToPath(import.meta.url)), '../../public/data/catalog.json'), 'utf8'),
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

afterAll(() => {
  flushGoalLogs();
});

const sampleTitle = catalog.titles[0];

const baseCollaborators = {
  publicAi: [{
    id: 'chatgpt',
    label: 'ChatGPT',
    provider: 'chatgpt',
    endpoint: 'http://custom-public.test:9998',
    model: 'llama3',
    enabled: true,
  }],
  localLlm: [{
    id: 'ollama',
    label: 'Ollama',
    endpoint: 'http://custom-llm.test:9999',
    model: 'llama3',
    enabled: true,
  }],
};

describe('goal evidence (inference automation)', () => {
  beforeAll(() => resetGoalLogs());

  it('guild-inference: recruitment + production HTTP with parsed roster and roles', async () => {
    const requests = [];
    const customEndpoint = 'http://custom-llm.test:9999';
    const fetchFn = makeAutomationFetch({
      marker: 'GOAL-INFERENCE',
      memberRoles: { chatgpt: 'critic', ollama: 'editor' },
      onRequest: (r) => requests.push(r),
    });

    const session = await runGuildAutomation(sampleTitle, 'ko', {
      collaborators: {
        publicAi: baseCollaborators.publicAi,
        localLlm: [{ ...baseCollaborators.localLlm[0], endpoint: customEndpoint }],
      },
      fetchFn,
    });

    const artifact = getGuildArtifact(sampleTitle.id);
    const planningCalls = requests.filter((r) => r.phase?.includes('planning'));
    const recruitmentCalls = requests.filter((r) => r.phase?.includes('recruitment'));
    const productionCalls = requests.filter((r) => r.phase === 'production');
    const roles = session.members.map((m) => m.role);
    const distinctRoles = new Set(roles);
    const outcomes = session.recruitmentOutcomes ?? [];

    expect(planningCalls.length).toBeGreaterThanOrEqual(2);
    expect(session.workPlan?.title).toContain('GOAL-INFERENCE Work Plan');
    expect(recruitmentCalls.length).toBeGreaterThan(0);
    expect(productionCalls.length).toBeGreaterThanOrEqual(2);
    expect(session.members.length).toBeGreaterThanOrEqual(2);
    expect(distinctRoles.size).toBeGreaterThanOrEqual(2);
    expect(artifact.merged.body.length).toBeGreaterThan(0);
    expect(artifact.merged.body).toContain('GOAL-INFERENCE-production');
    expect(requests.some((r) => r.url === `${customEndpoint}/api/generate`)).toBe(true);
    expect(outcomes.length).toBeGreaterThanOrEqual(2);
    expect(outcomes.every((o) => typeof o.accept === 'boolean')).toBe(true);

    recordGuildInference(formatPass('planning_http', planningCalls.length >= 2, String(planningCalls.length)));
    recordGuildInference(formatPass('work_plan', Boolean(session.workPlan?.title), session.workPlan?.title?.slice(0, 40)));
    recordGuildInference(formatPass('recruitment_http', recruitmentCalls.length > 0, String(recruitmentCalls.length)));
    recordGuildInference(formatPass('parsed_outcomes', outcomes.length >= 2, String(outcomes.length)));
    recordGuildInference(formatPass('production_http', productionCalls.length >= 2, String(productionCalls.length)));
    recordGuildInference(formatPass('roster_gte_2', session.members.length >= 2, String(session.members.length)));
    recordGuildInference(formatPass('distinct_roles_gte_2', distinctRoles.size >= 2, [...distinctRoles].join(',')));
    recordGuildInference(formatPass('artifact_nonempty', artifact.merged.body.length > 0, String(artifact.merged.body.length)));
    recordGuildInference(formatPass('both_kinds', session.steps.some((s) => s.collaboratorKind === COLLABORATOR_KINDS.PUBLIC_AI)
      && session.steps.some((s) => s.collaboratorKind === COLLABORATOR_KINDS.LOCAL_LLM)));
    recordGuildInference('');
    recordGuildInference('recruitment_outcomes:');
    for (const o of outcomes) {
      recordGuildInference(`  - ${o.candidateId}: accept=${o.accept} msg=${o.message.slice(0, 40)}`);
    }
    recordGuildInference('roles:');
    for (const m of session.members) recordGuildInference(`  - ${m.label}: ${m.role}`);
    recordGuildInference('fetch_urls:');
    for (const r of requests) recordGuildInference(`  - ${r.phase} ${r.url}`);

    deleteGuildArtifact(sampleTitle.id);
  });

  it('guild-session: legacy pipeline with role negotiation and custom endpoint', async () => {
    const customEndpoint = 'http://custom-llm.test:9999';
    const requests = [];
    const fetchFn = makeAutomationFetch({
      marker: 'endpoint-specific http draft',
      memberRoles: { chatgpt: 'showrunner', ollama: 'refiner' },
      onRequest: (r) => requests.push(r),
    });

    const session = await runGuildPipeline(sampleTitle, 'ko', {
      collaborators: {
        publicAi: baseCollaborators.publicAi,
        localLlm: [{ ...baseCollaborators.localLlm[0], endpoint: customEndpoint }],
      },
      fetchFn,
    });

    const pipeline = assertPipelineBothKinds(session);
    const artifact = getGuildArtifact(sampleTitle.id);
    const artifactCheck = assertArtifactNonempty(artifact);

    expect(pipeline.ok).toBe(true);
    expect(artifactCheck.ok).toBe(true);
    expect(requests.some((r) => r.url === `${customEndpoint}/api/generate`)).toBe(true);
    expect(artifact.merged.body).toContain('endpoint-specific http draft');
    expect(session.members.map((m) => m.role)).toEqual(['showrunner', 'refiner']);

    recordGuildSession(formatPass('step_count', session.steps.length === 2, String(session.steps.length)));
    recordGuildSession(formatPass('public_ai_first', pipeline.kinds[0] === COLLABORATOR_KINDS.PUBLIC_AI, pipeline.kinds[0]));
    recordGuildSession(formatPass('local_llm_second', pipeline.kinds[1] === COLLABORATOR_KINDS.LOCAL_LLM, pipeline.kinds[1]));
    recordGuildSession(formatPass('roles_negotiated', session.members.every((m) => m.role)));
    recordGuildSession(formatPass('http_inference_body', artifact.merged.body.includes('endpoint-specific http draft')));
    recordGuildSession(formatPass('artifact_steps_nonempty', artifactCheck.stepCount > 0, String(artifactCheck.stepCount)));
    recordGuildSession(formatPass('artifact_merged_body', artifactCheck.bodyLen > 0, String(artifactCheck.bodyLen)));
    recordGuildSession('');
    recordGuildSession('step_list:');
    for (const name of pipeline.stepNames) recordGuildSession(`  - ${name}`);

    deleteGuildArtifact(sampleTitle.id);
  });

  it('feed-guild: in_progress and completed guild works in batch', async () => {
    saveGuildArtifact({
      titleId: sampleTitle.id,
      status: 'in_progress',
      createdAt: Date.now(),
      updatedAt: Date.now(),
      steps: [],
      merged: { synopsis: '', body: '' },
    });

    const inProgressBatch = buildFeedBatch(catalog, 'ko', { seen: new Set(), cursor: 42 });
    const inProgress = assertInProgressFeed(inProgressBatch, sampleTitle.id);
    expect(inProgress.ok).toBe(true);
    recordFeedGuild(formatPass('in_progress_in_batch', inProgress.ok, inProgress.guildStatus));

    await runGuildAutomation(sampleTitle, 'ko', {
      collaborators: baseCollaborators,
      fetchFn: makeAutomationFetch({
        marker: 'feed-integration',
        memberRoles: { chatgpt: 'critic', ollama: 'editor' },
      }),
    });

    const batch = buildFeedBatch(catalog, 'ko', { seen: new Set(), cursor: 0 });
    const feedCheck = assertFeedGuildBatch(batch, sampleTitle.id);
    expect(feedCheck.ok).toBe(true);
    expect(getGuildArtifact(sampleTitle.id).phase).toBe(GUILD_PHASES.COMPLETED);

    recordFeedGuild(formatPass('batch_nonempty', batch.items.length > 0, String(feedCheck.batchSize)));
    recordFeedGuild(formatPass('title_in_batch', batch.items.some((t) => t.id === sampleTitle.id)));
    recordFeedGuild(formatPass('no_duplicate_ids', feedCheck.duplicateCount === 0, `${feedCheck.batchSize}`));
    recordFeedGuild(formatPass('guildWork_flag', feedCheck.guildWork === true, String(feedCheck.guildWork)));
    recordFeedGuild(formatPass('catalog_items_present', feedCheck.catalogCount > 0, String(feedCheck.catalogCount)));
    recordFeedGuild('');
    recordFeedGuild(`batch_size: ${feedCheck.batchSize}`);
    recordFeedGuild(`guild_status: ${feedCheck.guildStatus}`);

    deleteGuildArtifact(sampleTitle.id);
  });

  it('local_llm endpoint change affects fetch URL', async () => {
    const captured = [];
    const endpointA = 'http://host-a.test:8001';
    const endpointB = 'http://host-b.test:8002';

    await LocalLlmAdapter.contribute({
      title: sampleTitle,
      locale: 'ko',
      collaborator: { ...baseCollaborators.localLlm[0], endpoint: endpointA },
      fetchFn: makeTestFetch({
        response: 'endpoint A draft',
        onRequest: (r) => captured.push(r.url),
      }),
      collaborators: baseCollaborators,
    });
    await LocalLlmAdapter.contribute({
      title: sampleTitle,
      locale: 'ko',
      collaborator: { ...baseCollaborators.localLlm[0], endpoint: endpointB },
      fetchFn: makeTestFetch({
        response: 'endpoint B draft',
        onRequest: (r) => captured.push(r.url),
      }),
      collaborators: baseCollaborators,
    });

    expect(captured[0]).toBe(`${endpointA}/api/generate`);
    expect(captured[1]).toBe(`${endpointB}/api/generate`);
  });
});