/** goal-deliverable: studio-guild */
import { defaultPublicAiRoster, DEFAULT_COMMERCIAL_PROXY } from './CommercialProviders.js';

/** @typedef {'public_ai' | 'local_llm'} CollaboratorKind */

/** @typedef {'planning' | 'recruitment' | 'founding' | 'role_assignment' | 'production' | 'completed'} GuildPhase */

/** @typedef {'ollama' | 'openai'} InferenceMode */

/**
 * @typedef {'showrunner' | 'screenwriter' | 'worldbuilder' | 'editor' | 'critic' | 'refiner'} GuildRoleId
 */

/** @typedef {{ id: string, label: string, provider: string, endpoint?: string, model?: string, apiModel?: string, inferenceMode?: InferenceMode, enabled: boolean }} PublicAiCollaborator */

/** @typedef {{ id: string, label: string, endpoint: string, model: string, enabled: boolean }} LocalLlmCollaborator */

/**
 * @typedef {Object} GuildCollaboratorSettings
 * @property {PublicAiCollaborator[]} publicAi
 * @property {LocalLlmCollaborator[]} localLlm
 */

/**
 * @typedef {Object} GuildMessage
 * @property {string} id
 * @property {GuildPhase} phase
 * @property {CollaboratorKind} fromKind
 * @property {string} fromId
 * @property {string} fromLabel
 * @property {CollaboratorKind} [toKind]
 * @property {string} [toId]
 * @property {string} [toLabel]
 * @property {GuildRoleId} [role]
 * @property {string} content
 * @property {string} [provider]
 * @property {number} at
 */

/**
 * @typedef {Object} GuildMember
 * @property {CollaboratorKind} kind
 * @property {string} id
 * @property {string} label
 * @property {GuildRoleId} role
 * @property {number} recruitedAt
 * @property {string} [pitch]
 */

/**
 * @typedef {Object} GuildStudio
 * @property {string} name
 * @property {string} charter
 * @property {number} foundedAt
 * @property {GuildMember[]} members
 */

/**
 * @typedef {Object} GuildStep
 * @property {number} order
 * @property {CollaboratorKind} collaboratorKind
 * @property {string} collaboratorId
 * @property {string} collaboratorLabel
 * @property {GuildRoleId} [role]
 * @property {string} content
 * @property {number} at
 */

/**
 * @typedef {Object} GuildWorkPlan
 * @property {string} title
 * @property {string} logline
 * @property {string[]} themes
 * @property {string[]} neededRoles
 * @property {string} synopsis
 * @property {number} plannedAt
 */

/**
 * @typedef {Object} GuildArtifact
 * @property {string} titleId
 * @property {'in_progress' | 'completed'} status
 * @property {GuildPhase} [phase]
 * @property {GuildWorkPlan} [workPlan]
 * @property {GuildStudio} [studio]
 * @property {GuildMessage[]} [messages]
 * @property {GuildMember[]} [members]
 * @property {number} createdAt
 * @property {number} updatedAt
 * @property {GuildStep[]} steps
 * @property {{ synopsis: string, body: string }} merged
 */

export const COLLABORATOR_KINDS = {
  PUBLIC_AI: 'public_ai',
  LOCAL_LLM: 'local_llm',
};

export const GUILD_PHASES = {
  PLANNING: 'planning',
  RECRUITMENT: 'recruitment',
  FOUNDING: 'founding',
  ROLE_ASSIGNMENT: 'role_assignment',
  PRODUCTION: 'production',
  COMPLETED: 'completed',
};

export const GUILD_ROLES = {
  SHOWRUNNER: 'showrunner',
  SCREENWRITER: 'screenwriter',
  WORLDBUILDER: 'worldbuilder',
  EDITOR: 'editor',
  CRITIC: 'critic',
  REFINER: 'refiner',
};

/** Production order — earlier roles shape the work before later refiners. */
export const ROLE_PRODUCTION_ORDER = [
  GUILD_ROLES.SHOWRUNNER,
  GUILD_ROLES.WORLDBUILDER,
  GUILD_ROLES.SCREENWRITER,
  GUILD_ROLES.EDITOR,
  GUILD_ROLES.CRITIC,
  GUILD_ROLES.REFINER,
];

export const DEFAULT_GUILD_SETTINGS = {
  commercialProxy: DEFAULT_COMMERCIAL_PROXY,
  publicAi: defaultPublicAiRoster(),
  localLlm: [
    {
      id: 'ollama',
      label: 'Ollama',
      endpoint: 'http://127.0.0.1:11434',
      model: 'llama3',
      enabled: true,
    },
  ],
};