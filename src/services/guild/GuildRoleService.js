/** goal-deliverable: studio-guild */
import { COLLABORATOR_KINDS, GUILD_ROLES, ROLE_PRODUCTION_ORDER } from './types.js';

const KIND_ROLE_PREFS = {
  [COLLABORATOR_KINDS.PUBLIC_AI]: [
    GUILD_ROLES.SHOWRUNNER,
    GUILD_ROLES.SCREENWRITER,
    GUILD_ROLES.CRITIC,
  ],
  [COLLABORATOR_KINDS.LOCAL_LLM]: [
    GUILD_ROLES.WORLDBUILDER,
    GUILD_ROLES.EDITOR,
    GUILD_ROLES.REFINER,
  ],
};

/**
 * Assign distinct production roles to recruited members.
 * @param {import('./types.js').GuildMember[]} candidates
 */
export function assignGuildRoles(candidates) {
  const used = new Set();
  return candidates.map((member, index) => {
    const prefs = KIND_ROLE_PREFS[member.kind] ?? [GUILD_ROLES.SCREENWRITER];
    const role = prefs.find((r) => !used.has(r))
      ?? ROLE_PRODUCTION_ORDER[index % ROLE_PRODUCTION_ORDER.length];
    used.add(role);
    return { ...member, role };
  });
}

/**
 * @param {import('./types.js').GuildMember[]} members
 */
export function sortMembersForProduction(members) {
  return [...members].sort((a, b) => {
    const ai = ROLE_PRODUCTION_ORDER.indexOf(a.role);
    const bi = ROLE_PRODUCTION_ORDER.indexOf(b.role);
    return (ai === -1 ? 99 : ai) - (bi === -1 ? 99 : bi);
  });
}

export function roleLabelKey(role) {
  return `guild.role.${role}`;
}