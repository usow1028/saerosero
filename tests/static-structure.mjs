/** goal-deliverable: studio-guild */
import { readFile, readdir, writeFile, mkdir } from 'node:fs/promises';
import { execSync } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const SCRATCH = process.env.SCRATCH || '/tmp/grok-goal-09ef9dd2d2bc/implementer';
const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');

async function walk(dir, acc = []) {
  const entries = await readdir(dir, { withFileTypes: true });
  for (const e of entries) {
    const full = path.join(dir, e.name);
    if (e.isDirectory()) await walk(full, acc);
    else if (e.name.endsWith('.js')) acc.push(full);
  }
  return acc;
}

async function main() {
  await mkdir(SCRATCH, { recursive: true });
  const indexHtml = await readFile(path.join(ROOT, 'index.html'), 'utf8');
  const hasModuleEntry = indexHtml.includes('<script type="module" src="/src/main.js">');
  const hasImportMap = indexHtml.includes('importmap');

  const srcFiles = await walk(path.join(ROOT, 'src'));
  const guildFiles = srcFiles.filter((f) => f.includes('/guild/') || f.includes('guildWorkspace') || f.includes('TitleStudioPanel') || f.includes('feedActive'));

  const mainJs = await readFile(path.join(ROOT, 'src/main.js'), 'utf8');
  const feedJs = await readFile(path.join(ROOT, 'src/pages/feed.js'), 'utf8');
  const feedService = await readFile(path.join(ROOT, 'src/services/FeedService.js'), 'utf8');
  const studioPanel = await readFile(path.join(ROOT, 'src/ui/TitleStudioPanel.js'), 'utf8');
  const formation = await readFile(path.join(ROOT, 'src/services/guild/GuildFormationService.js'), 'utf8');
  const publicAdapter = await readFile(path.join(ROOT, 'src/services/guild/adapters/PublicAiAdapter.js'), 'utf8');
  const inferenceService = await readFile(path.join(ROOT, 'src/services/guild/inference/GuildInferenceService.js'), 'utf8');

  let functionalDelta = [];
  try {
    functionalDelta = execSync('git -C /home/usow diff --name-only HEAD~1..HEAD', { encoding: 'utf8' })
      .trim()
      .split('\n')
      .filter((p) => p.startsWith('saerosero/src/') || p.startsWith('saerosero/tests/'));
  } catch {
    functionalDelta = [];
  }

  const lines = [
    `module_entry=${hasModuleEntry}`,
    `import_map=${hasImportMap}`,
    `guild_files=${guildFiles.length}`,
    `feed_imports_studio=${feedJs.includes('TitleStudioPanel')}`,
    `studio_embeds_guild=${studioPanel.includes('createGuildWorkspace')}`,
    `feed_service_guild=${feedService.includes('listGuildFeedTitles')}`,
    `feed_service_dedup=${feedService.includes('guildById')}`,
    `main_no_node_globals=${!mainJs.includes('require(') && !mainJs.includes('process.')}`,
    `formation_uses_inference=${formation.includes('pitchMembership') && !formation.includes('seeks a guild seat')}`,
    `public_adapter_inference=${publicAdapter.includes('inferRecruitmentPitch')}`,
    `inference_service_phases=${inferenceService.includes('inferRoleFinalize') && inferenceService.includes('inferProductionDraft')}`,
    `functional_delta_count=${functionalDelta.length}`,
    'functional_delta:',
    ...functionalDelta.map((f) => `  - ${f}`),
    'guild_modules:',
    ...guildFiles.map((f) => `  - ${path.relative(ROOT, f)}`),
  ];

  await writeFile(path.join(SCRATCH, 'static-structure.log'), `${lines.join('\n')}\n`);
  console.log(lines.join('\n'));
}

main();