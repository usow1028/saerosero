/** goal-deliverable: studio-guild */
import { COLLABORATOR_KINDS } from '../types.js';
import {
  resolveInferenceMode,
  resolveApiModel,
  DEFAULT_COMMERCIAL_PROXY,
} from '../CommercialProviders.js';

export function resolveCollaboratorEndpoint(collaborator, fallbackEndpoint) {
  const endpoint = collaborator.endpoint
    ?? collaborator.inferenceEndpoint
    ?? fallbackEndpoint
    ?? DEFAULT_COMMERCIAL_PROXY;
  if (!endpoint) return null;
  return endpoint.replace(/\/$/, '');
}

export function resolveCollaboratorModel(collaborator, fallbackModel = 'llama3') {
  return collaborator.model ?? collaborator.inferenceModel ?? fallbackModel;
}

async function callOllamaGenerate({ endpoint, model, prompt, fetchFn }) {
  const url = `${endpoint}/api/generate`;
  const res = await fetchFn(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ model, prompt, stream: false }),
  });
  if (!res.ok) throw new Error('guild:inference_unavailable');
  const data = await res.json();
  const text = String(data?.response ?? '').trim();
  if (!text) throw new Error('guild:inference_empty');
  return { text, url, model, transport: 'ollama' };
}

async function callOpenAIChat({ endpoint, model, prompt, fetchFn, apiKey }) {
  const url = `${endpoint}/v1/chat/completions`;
  const headers = { 'Content-Type': 'application/json' };
  if (apiKey) headers.Authorization = `Bearer ${apiKey}`;
  const res = await fetchFn(url, {
    method: 'POST',
    headers,
    body: JSON.stringify({
      model,
      messages: [{ role: 'user', content: prompt }],
      stream: false,
    }),
  });
  if (!res.ok) throw new Error('guild:inference_unavailable');
  const data = await res.json();
  const text = String(data?.choices?.[0]?.message?.content ?? '').trim();
  if (!text) throw new Error('guild:inference_empty');
  return { text, url, model, transport: 'openai' };
}

/**
 * HTTP inference — Ollama /api/generate OR OpenAI-compatible /v1/chat/completions (LiteLLM).
 */
export async function callInference({
  collaborator,
  prompt,
  fetchFn = globalThis.fetch,
  forceOffline = false,
  fallbackEndpoint,
  apiKey,
}) {
  if (forceOffline) throw new Error('guild:inference_offline');
  if (typeof fetchFn !== 'function') throw new Error('guild:inference_unavailable');

  const endpoint = resolveCollaboratorEndpoint(collaborator, fallbackEndpoint);
  if (!endpoint) throw new Error('guild:inference_no_endpoint');

  const mode = resolveInferenceMode(collaborator);
  const model = mode === 'openai'
    ? resolveApiModel(collaborator)
    : resolveCollaboratorModel(collaborator);

  try {
    if (mode === 'openai') {
      return {
        ...(await callOpenAIChat({ endpoint, model, prompt, fetchFn, apiKey })),
        kind: collaborator.kind ?? COLLABORATOR_KINDS.PUBLIC_AI,
        provider: collaborator.provider,
      };
    }
    return {
      ...(await callOllamaGenerate({ endpoint, model, prompt, fetchFn })),
      kind: collaborator.kind ?? COLLABORATOR_KINDS.LOCAL_LLM,
      provider: collaborator.provider,
    };
  } catch (err) {
    if (err.message?.startsWith('guild:')) throw err;
    throw new Error('guild:inference_unavailable');
  }
}