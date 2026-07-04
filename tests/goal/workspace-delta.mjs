/** goal-deliverable: studio-guild */
import { execSync } from 'node:child_process';

const REQUIRED = [
  'saerosero/src/services/guild/CommercialProviders.js',
  'saerosero/src/services/guild/GuildPlanningService.js',
  'saerosero/src/services/guild/inference/GuildInferenceService.js',
  'saerosero/src/services/guild/GuildFormationService.js',
  'saerosero/src/services/guild/GuildAutomationOrchestrator.js',
  'saerosero/src/services/guild/adapters/PublicAiAdapter.js',
  'saerosero/src/services/guild/adapters/LocalLlmAdapter.js',
  'saerosero/src/ui/guildWorkspace.js',
  'saerosero/tests/guild-inference-mock.mjs',
  'saerosero/tests/guild.test.js',
  'saerosero/tests/goal/evidence.test.js',
  'saerosero/tests/goal/workspace-delta.mjs',
  'saerosero/tests/verify-goal.mjs',
  'saerosero/tests/launch-feed-guild.mjs',
];

function functionalPaths(paths) {
  return paths.filter((p) =>
    (p.startsWith('saerosero/src/') || p.startsWith('saerosero/tests/'))
    && !p.includes('/public/assets/posters/'),
  );
}

export function checkWorkspaceDelta() {
  let recentDiff = [];
  let statusPaths = [];

  try {
    recentDiff = execSync('git -C /home/usow diff --name-only HEAD~1..HEAD', { encoding: 'utf8' })
      .trim()
      .split('\n')
      .filter(Boolean);
  } catch {
    recentDiff = [];
  }

  try {
    statusPaths = execSync('git -C /home/usow status --porcelain', { encoding: 'utf8' })
      .trim()
      .split('\n')
      .filter(Boolean)
      .map((line) => line.slice(3));
  } catch (err) {
    return { ok: false, reason: `git status failed: ${err.message}` };
  }

  const delta = [...new Set([...recentDiff, ...statusPaths])];
  const functional = functionalPaths(delta);
  const missing = REQUIRED.filter((p) => !delta.includes(p));

  const ok = functional.length >= 10 && missing.length === 0;

  return {
    ok,
    functionalCount: functional.length,
    functionalPaths: functional,
    missingRequired: missing,
    recentDiff,
    reason: ok
      ? `functional_delta=${functional.length} required_ok=true`
      : `functional_delta=${functional.length} missing=${missing.join(', ')}`,
  };
}

export function assertWorkspaceDelta() {
  const result = checkWorkspaceDelta();
  if (!result.ok) throw new Error(`workspace-delta FAIL: ${result.reason}`);
  return result;
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const result = checkWorkspaceDelta();
  console.log(result.ok ? 'PASS' : 'FAIL', result.reason);
  if (result.functionalPaths?.length) {
    console.log('functional:', result.functionalPaths.join('\n'));
  }
  process.exit(result.ok ? 0 : 1);
}