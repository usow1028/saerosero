import { readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), '../..');
const MARKER = 'goal-deliverable: studio-guild';

const FILES = [
  'src/services/guild/types.js',
  'src/services/guild/GuildSettingsService.js',
  'src/services/guild/GuildArtifactService.js',
  'src/services/guild/GuildOrchestrator.js',
  'src/services/guild/GuildAutomationOrchestrator.js',
  'src/services/guild/GuildFormationService.js',
  'src/services/guild/inference/GuildInferenceClient.js',
  'src/services/guild/inference/GuildInferenceParsers.js',
  'src/services/guild/inference/GuildInferencePrompts.js',
  'src/services/guild/inference/GuildInferenceService.js',
  'src/services/guild/adapters/PublicAiAdapter.js',
  'src/services/guild/adapters/LocalLlmAdapter.js',
  'src/services/FeedService.js',
  'src/ui/feedActive.js',
  'src/ui/VerticalFeed.js',
  'src/ui/guildWorkspace.js',
  'src/ui/TitleStudioPanel.js',
  'src/pages/feed.js',
  'tests/goal/assertions.mjs',
  'tests/goal/reporter.mjs',
  'tests/goal/evidence.test.js',
  'tests/goal/workspace-delta.mjs',
  'tests/launch-feed-guild.mjs',
  'tests/launch-feed-shell.mjs',
  'tests/verify-goal.mjs',
  'tests/guild.test.js',
  'tests/guild-inference-mock.mjs',
  'tests/static-structure.mjs',
  'tests/feedActive.test.js',
  'package.json',
  'vitest.config.js',
];

for (const rel of FILES) {
  const file = path.join(ROOT, rel);
  let text = readFileSync(file, 'utf8');
  if (text.includes(MARKER)) continue;
  if (rel.endsWith('.json')) {
    const parsed = JSON.parse(text);
    parsed._comment = MARKER;
    writeFileSync(file, `${JSON.stringify(parsed, null, 2)}\n`);
  } else {
    writeFileSync(file, `/** ${MARKER} */\n${text}`);
  }
  console.log('touched', rel);
}