/** goal-deliverable: studio-guild */
const PORT = 5180;
const URL = `http://127.0.0.1:${PORT}/`;
const BAD_ENDPOINT = 'http://127.0.0.1:5197';
const IN_PROGRESS_TITLE = 'starlight-station';

export async function runFeedGuildFailure(browser, scratch) {
  const transcript = ['--- guild failure run ---'];
  const context = await browser.newContext();
  await context.addInitScript((titleId) => {
    const artifact = {
      titleId,
      status: 'in_progress',
      createdAt: Date.now(),
      updatedAt: Date.now(),
      steps: [],
      merged: { synopsis: '', body: '' },
    };
    localStorage.setItem(`saerosero:guild:artifact:${titleId}`, JSON.stringify(artifact));
    localStorage.setItem('saerosero:guild:artifacts:index', JSON.stringify([titleId]));
  }, IN_PROGRESS_TITLE);

  const page = await context.newPage();
  const errors = [];
  page.on('pageerror', (e) => errors.push(String(e)));

  await page.route(`${BAD_ENDPOINT}/api/generate`, async (route) => {
    await route.abort('failed');
  });
  await page.route(`${BAD_ENDPOINT}/v1/chat/completions`, async (route) => {
    await route.abort('failed');
  });

  await page.goto(URL, { waitUntil: 'networkidle' });
  transcript.push('PASS: page loaded');

  await page.locator(`.feed-slide[data-title-id="${IN_PROGRESS_TITLE}"]`).first().scrollIntoViewIfNeeded();
  await page.waitForTimeout(500);
  await page.locator('.feed-dock-btn--studio').click();

  await page.waitForSelector('.guild-workspace', { timeout: 10000 });

  const endpointInputs = page.locator('.guild-endpoint-input');
  const count = await endpointInputs.count();
  for (let i = 0; i < count; i += 1) {
    await endpointInputs.nth(i).fill(BAD_ENDPOINT);
    await endpointInputs.nth(i).dispatchEvent('change');
  }
  transcript.push(`PASS: endpoints set to unreachable ${BAD_ENDPOINT}`);

  await page.locator('.guild-start-btn').click();
  transcript.push('PASS: start automation clicked');

  await page.waitForSelector('.guild-status--inference-failed', { timeout: 20000 });
  const statusText = await page.locator('.guild-status').innerText();
  if (!statusText.trim()) throw new Error('guild status empty on inference failure');
  transcript.push(`PASS: inference failure visible in .guild-status text="${statusText.slice(0, 60)}"`);

  const artifactBody = await page.locator('.guild-artifact__body').count();
  const bodyText = artifactBody ? await page.locator('.guild-artifact__body').innerText() : '';
  if (bodyText.includes('guild e2e')) {
    throw new Error('artifact should not contain success draft on inference failure');
  }
  transcript.push('PASS: no success artifact body on failure');

  if (errors.length) throw new Error(`page errors: ${errors.join('; ')}`);
  transcript.push('PASS: zero page errors');

  const shot = `${scratch}/launch-feed-failure.png`;
  await page.screenshot({ path: shot, fullPage: true });
  transcript.push(`PASS: screenshot ${shot}`);

  await context.close();
  return transcript;
}