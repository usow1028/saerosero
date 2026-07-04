/** goal-deliverable: studio-guild */
const PORT = 5180;
const URL = `http://127.0.0.1:${PORT}/`;

export function attachPageErrors(page, errors) {
  page.on('pageerror', (e) => errors.push(String(e)));
}

export async function runFeedShell(page, runIndex) {
  const transcript = [`--- shell run ${runIndex} ---`];
  const errors = [];
  attachPageErrors(page, errors);

  await page.goto(URL, { waitUntil: 'networkidle' });
  transcript.push('PASS: page loaded');

  await page.waitForSelector('.vertical-feed__viewport', { timeout: 15000 });
  transcript.push('PASS: vertical-feed__viewport present');

  const viewportBox = await page.locator('.vertical-feed__viewport').boundingBox();
  if (!viewportBox || viewportBox.height <= 0 || viewportBox.width <= 0) {
    throw new Error('feed viewport has zero painted area');
  }
  transcript.push(`PASS: viewport painted ${Math.round(viewportBox.width)}x${Math.round(viewportBox.height)}`);

  const initialSlides = await page.locator('.feed-slide').count();
  if (initialSlides < 1) throw new Error('no feed slides rendered');
  transcript.push(`PASS: initial slides=${initialSlides}`);

  await page.locator('.vertical-feed__track').evaluate((el) => {
    el.scrollTop = el.clientHeight;
  });
  await page.waitForTimeout(800);

  const afterSlides = await page.locator('.feed-slide').count();
  if (afterSlides < initialSlides) throw new Error('scroll did not preserve or append feed items');
  transcript.push(`PASS: after scroll slides=${afterSlides}`);

  await page.locator('.feed-dock-btn--studio').click();
  transcript.push('PASS: studio dock clicked');

  await page.waitForSelector('.guild-workspace', { timeout: 10000 });
  const groups = await page.locator('.guild-collab-group').count();
  if (groups < 2) throw new Error('guild workspace missing collaborator groups');
  transcript.push(`PASS: guild-collab-group count=${groups}`);

  if (errors.length) throw new Error(`page errors: ${errors.join('; ')}`);
  transcript.push(`PASS: zero page errors (pageerror only; asset 404 console excluded)`);

  return transcript;
}