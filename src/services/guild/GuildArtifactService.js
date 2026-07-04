/** goal-deliverable: studio-guild */
import { readJson, writeJson } from '../storage.js';
import { titleName } from '../CatalogService.js';

const INDEX_KEY = 'guild:artifacts:index';
const artifactKey = (titleId) => `guild:artifact:${titleId}`;

function readIndex() {
  return readJson(INDEX_KEY, []);
}

function writeIndex(ids) {
  writeJson(INDEX_KEY, [...new Set(ids)]);
}

export function getGuildArtifact(titleId) {
  return readJson(artifactKey(titleId), null);
}

export function listGuildArtifactIds() {
  return readIndex();
}

export function saveGuildArtifact(artifact) {
  writeJson(artifactKey(artifact.titleId), artifact);
  const ids = readIndex();
  if (!ids.includes(artifact.titleId)) {
    writeIndex([...ids, artifact.titleId]);
  }
  return artifact;
}

export function deleteGuildArtifact(titleId) {
  writeJson(artifactKey(titleId), null);
  writeIndex(readIndex().filter((id) => id !== titleId));
}

export function mergeGuildSteps(title, locale, steps, studio = null, workPlan = null) {
  const name = titleName(title, locale);
  const planLead = workPlan?.logline ? `${workPlan.title}: ${workPlan.logline} — ` : '';
  const studioLead = studio?.name ? `${studio.name} — ` : '';
  const charter = studio?.charter ? `${studio.charter} ` : '';
  const synopsis = `${planLead}${studioLead}${charter}${steps.map((s) => s.content).join(' ')}`.slice(0, 280);
  const roster = studio?.members?.length
    ? `Roster: ${studio.members.map((m) => `${m.label} (${m.role})`).join(', ')}\n\n`
    : '';
  const body = roster + steps
    .map((s, i) => `[${i + 1}] ${s.collaboratorLabel}${s.role ? ` (${s.role})` : ''}: ${s.content}`)
    .join('\n\n');
  return { synopsis, body, titleName: name };
}

export function isGuildFeedEligible(artifact) {
  return artifact?.status === 'in_progress' || artifact?.status === 'completed';
}

export function guildFeedOverlay(title, artifact, locale) {
  const name = titleName(title, locale);
  const merged = artifact.merged?.synopsis
    ? artifact.merged
    : (artifact.steps?.length
      ? mergeGuildSteps(title, locale, artifact.steps, artifact.studio)
      : {
        synopsis: artifact.studio?.name
          ? `${artifact.studio.name} — guild work in progress`
          : `${name} — guild work in progress`,
        body: '',
      });
  return {
    ...title,
    guildWork: true,
    guildStatus: artifact.status,
    guildArtifactId: artifact.titleId,
    logline: {
      ...title.logline,
      [locale]: merged.synopsis || title.logline?.[locale] || title.logline?.en || '',
    },
  };
}

export function listGuildFeedTitles(catalog, locale) {
  const byId = new Map(catalog.titles.map((t) => [t.id, t]));
  return listGuildArtifactIds()
    .map((id) => {
      const title = byId.get(id);
      const artifact = getGuildArtifact(id);
      if (!title || !artifact || !isGuildFeedEligible(artifact)) return null;
      return guildFeedOverlay(title, artifact, locale);
    })
    .filter(Boolean);
}