/** goal-deliverable: studio-guild */

/** @typedef {'ollama' | 'openai'} InferenceMode */

/**
 * LiteLLM / OpenAI-compatible proxy presets for commercial web-service AIs.
 * Point endpoint at your LiteLLM server (default http://127.0.0.1:4000).
 */
export const COMMERCIAL_PROVIDERS = {
  chatgpt: {
    id: 'chatgpt',
    label: 'ChatGPT',
    provider: 'chatgpt',
    inferenceMode: 'openai',
    endpoint: 'http://127.0.0.1:4000',
    model: 'gpt-4o-mini',
    apiModel: 'gpt-4o-mini',
    badge: 'GPT',
  },
  claude: {
    id: 'claude',
    label: 'Claude',
    provider: 'claude',
    inferenceMode: 'openai',
    endpoint: 'http://127.0.0.1:4000',
    model: 'claude-3-5-sonnet-20241022',
    apiModel: 'claude-3-5-sonnet-20241022',
    badge: 'CL',
  },
  grok: {
    id: 'grok',
    label: 'Grok',
    provider: 'grok',
    inferenceMode: 'openai',
    endpoint: 'http://127.0.0.1:4000',
    model: 'grok-beta',
    apiModel: 'grok-beta',
    badge: 'GK',
  },
  gemini: {
    id: 'gemini',
    label: 'Gemini',
    provider: 'gemini',
    inferenceMode: 'openai',
    endpoint: 'http://127.0.0.1:4000',
    model: 'gemini/gemini-2.0-flash',
    apiModel: 'gemini/gemini-2.0-flash',
    badge: 'GM',
  },
};

export const DEFAULT_COMMERCIAL_PROXY = 'http://127.0.0.1:4000';

export function isCommercialProvider(provider) {
  return Boolean(COMMERCIAL_PROVIDERS[provider]);
}

export function resolveInferenceMode(collaborator) {
  if (collaborator.inferenceMode === 'openai' || collaborator.inferenceMode === 'ollama') {
    return collaborator.inferenceMode;
  }
  if (isCommercialProvider(collaborator.provider)) return 'openai';
  return 'ollama';
}

export function resolveApiModel(collaborator) {
  return collaborator.apiModel ?? collaborator.model ?? 'gpt-4o-mini';
}

export function providerBadge(collaborator) {
  const preset = COMMERCIAL_PROVIDERS[collaborator.provider];
  if (preset?.badge) return preset.badge;
  if (collaborator.provider === 'ollama' || collaborator.id === 'ollama') return 'OL';
  return 'AI';
}

export function defaultPublicAiRoster(proxyEndpoint = DEFAULT_COMMERCIAL_PROXY) {
  return Object.values(COMMERCIAL_PROVIDERS).map((preset) => ({
    ...preset,
    endpoint: proxyEndpoint,
    enabled: preset.id === 'chatgpt',
  }));
}