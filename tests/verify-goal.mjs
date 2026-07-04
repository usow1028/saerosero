/** goal-deliverable: studio-guild — planning, LiteLLM proxy, inference automation */
import { spawn, execSync } from 'node:child_process';
import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright';
import { runFeedShell } from './launch-feed-shell.mjs';
import { runFeedGuild } from './launch-feed-guild.mjs';
import { runFeedGuildFailure } from './launch-feed-guild-failure.mjs';
import { assertWorkspaceDelta } from './goal/workspace-delta.mjs';

const SCRATCH = process.env.SCRATCH || '/tmp/grok-goal-09ef9dd2d2bc/implementer';
const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const PORT = 5180;
const URL = `http://127.0.0.1:${PORT}/`;

async function waitForServer(ms = 20000) {
  const start = Date.now();
  while (Date.now() - start < ms) {
    try {
      const res = await fetch(URL);
      if (res.ok) return;
    } catch { /* retry */ }
    await new Promise((r) => setTimeout(r, 400));
  }
  throw new Error('preview server did not start');
}

async function main() {
  await mkdir(SCRATCH, { recursive: true });
  const transcript = ['verify-goal'];

  const delta = assertWorkspaceDelta();
  await writeFile(
    path.join(SCRATCH, 'workspace-delta.log'),
    [
      `PASS: workspace-delta ${delta.reason}`,
      `functional_count=${delta.functionalCount}`,
      'functional_paths:',
      ...(delta.functionalPaths ?? []).map((p) => `  - ${p}`),
    ].join('\n') + '\n',
  );
  transcript.push(`PASS: workspace-delta (${delta.functionalCount} functional paths)`);

  const vitestOut = execSync('npm test 2>&1', { cwd: ROOT, env: { ...process.env, SCRATCH }, encoding: 'utf8' });
  await writeFile(path.join(SCRATCH, 'vitest.log'), vitestOut);
  transcript.push('PASS: vitest');

  execSync('npm run build', { cwd: ROOT, stdio: 'inherit' });
  transcript.push('PASS: build');

  const preview = spawn('npm', ['run', 'preview', '--', '--host', '127.0.0.1', '--port', String(PORT)], {
    cwd: ROOT,
    stdio: ['ignore', 'pipe', 'pipe'],
  });

  try {
    await waitForServer();
    transcript.push('PASS: preview server ready');

    const browser = await chromium.launch({ headless: true });

    for (const run of [1, 2]) {
      const ctx = await browser.newContext();
      const page = await ctx.newPage();
      transcript.push(...await runFeedShell(page, run));
      await ctx.close();
    }

    for (const run of [1, 2]) {
      transcript.push(...await runFeedGuild(browser, run, SCRATCH));
    }

    transcript.push(...await runFeedGuildFailure(browser, SCRATCH));

    await browser.close();

    const staticOut = execSync(`SCRATCH=${SCRATCH} node tests/static-structure.mjs`, {
      cwd: ROOT,
      encoding: 'utf8',
    });
    await writeFile(path.join(SCRATCH, 'static-structure.log'), staticOut);
    transcript.push('PASS: static-structure');

    transcript.push('');
    transcript.push('all verification steps complete');
    await writeFile(path.join(SCRATCH, 'launch-feed.log'), `${transcript.join('\n')}\n`);
    console.log(transcript.join('\n'));
  } finally {
    preview.kill('SIGTERM');
  }
}

main().catch(async (err) => {
  const fail = [`FAIL: ${err.message}`, err.stack || ''];
  await writeFile(path.join(SCRATCH, 'launch-feed.log'), `${fail.join('\n')}\n`);
  console.error(err);
  process.exit(1);
});