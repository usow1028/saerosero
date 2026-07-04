/** goal-deliverable: studio-guild */
const PORT = 5180;
const URL = `http://127.0.0.1:${PORT}/`;
const CUSTOM_ENDPOINT = 'http://127.0.0.1:5199';
const IN_PROGRESS_TITLE = 'starlight-station';

function phaseFromPrompt(prompt) {
  const match = String(prompt).match(/\[GUILD_PHASE:([^\]]+)\]/);
  return match?.[1] ?? '';
}

function parsePromptFromRequest(postData) {
  if (postData?.prompt) return String(postData.prompt);
  const msg = postData?.messages?.[0]?.content;
  return msg ? String(msg) : '';
}

function inferencePayload(phase, runIndex, callIndex, prompt = '') {
  const marker = `guild e2e http draft run ${runIndex}`;
  switch (phase) {
    case 'planning_contribution':
      return {
        message: `${marker}-plan-contrib-${callIndex}`,
        logline: `${marker} logline`,
        themes: ['vision'],
        neededRoles: ['showrunner', 'editor'],
      };
    case 'planning_synthesis':
      return {
        message: `${marker}-plan-synthesis`,
        planTitle: `${marker} Work Plan`,
        logline: `${marker} unified logline`,
        themes: ['vision'],
        neededRoles: ['showrunner', 'critic'],
        synopsis: `${marker} synopsis`,
      };
    case 'recruitment_pitch':
      return { message: `${marker}-pitch-${callIndex}` };
    case 'recruitment_decision':
      return { accept: true, message: `${marker}-accept-${callIndex}` };
    case 'studio_proposal':
      return {
        studioName: `${marker} Studio`,
        charter: `${marker} charter`,
        message: `${marker}-studio`,
      };
    case 'studio_endorse':
      return { endorse: true, message: `${marker}-endorse-${callIndex}` };
    case 'role_claim':
      return {
        role: String(prompt).includes('ChatGPT') ? 'critic' : 'editor',
        message: `${marker}-role-${callIndex}`,
      };
    case 'role_finalize':
      return {
        message: `${marker}-roles`,
        assignments: [
          { memberId: 'chatgpt', role: 'critic' },
          { memberId: 'ollama', role: 'editor' },
        ],
      };
    case 'production':
      return {
        content: String(prompt).includes('Prior contributions:')
          ? `${marker}-with-context`
          : marker,
      };
    default:
      return { content: marker };
  }
}

function fulfillInference(route, payload) {
  const url = route.request().url();
  if (url.includes('/v1/chat/completions')) {
    return route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        choices: [{ message: { content: JSON.stringify(payload) } }],
      }),
    });
  }
  return route.fulfill({
    status: 200,
    contentType: 'application/json',
    body: JSON.stringify({ response: JSON.stringify(payload) }),
  });
}

export function attachPageErrors(page, errors) {
  page.on('pageerror', (e) => errors.push(String(e)));
}

export async function seedInProgressGuild(context) {
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
}

async function activateFeedSlide(page, titleId, transcript) {
  const slide = page.locator(`.feed-slide[data-title-id="${titleId}"]`).first();
  await slide.waitFor({ timeout: 10000 });
  await slide.scrollIntoViewIfNeeded();
  await page.waitForTimeout(400);
  await page.waitForSelector(`.feed-slide.is-active[data-title-id="${titleId}"]`, { timeout: 5000 });
  const activeId = await page.locator('.feed-slide.is-active').first().getAttribute('data-title-id');
  if (activeId !== titleId) throw new Error(`active slide is ${activeId}, expected ${titleId}`);
  transcript.push(`PASS: activated feed slide for ${titleId} (DOM is-active confirmed)`);
}

export async function runFeedGuild(browser, runIndex, scratch) {
  const transcript = [`--- guild run ${runIndex} ---`];
  const context = await browser.newContext();
  await seedInProgressGuild(context);
  const page = await context.newPage();
  const errors = [];
  attachPageErrors(page, errors);

  const hitUrls = [];
  let callIndex = 0;
  const handleInference = async (route) => {
    hitUrls.push(route.request().url());
    const postData = route.request().postDataJSON();
    const prompt = parsePromptFromRequest(postData);
    const phase = phaseFromPrompt(prompt);
    const payload = inferencePayload(phase, runIndex, callIndex, prompt);
    callIndex += 1;
    await fulfillInference(route, payload);
  };

  await page.route(`${CUSTOM_ENDPOINT}/api/generate`, handleInference);
  await page.route(`${CUSTOM_ENDPOINT}/v1/chat/completions`, handleInference);

  await page.goto(URL, { waitUntil: 'networkidle' });
  transcript.push('PASS: page loaded with in_progress seed');

  const inProgressSlide = page.locator(
    `.feed-slide[data-guild-status="in_progress"][data-title-id="${IN_PROGRESS_TITLE}"]`,
  );
  await inProgressSlide.first().waitFor({ timeout: 10000 });
  transcript.push('PASS: in_progress guild item visible in feed');

  await activateFeedSlide(page, IN_PROGRESS_TITLE, transcript);

  await page.locator('.feed-dock-btn--studio').click();
  transcript.push('PASS: studio dock clicked for active in_progress title');

  await page.waitForSelector(`.guild-panel[data-studio-title-id="${IN_PROGRESS_TITLE}"]`, { timeout: 10000 });
  await page.waitForSelector('.guild-workspace', { timeout: 5000 });
  transcript.push(`PASS: guild workspace open for ${IN_PROGRESS_TITLE}`);

  await page.waitForSelector('.guild-phase[data-phase="planning"]', { timeout: 5000 });
  transcript.push('PASS: planning phase visible in phase track');

  await page.waitForSelector('.guild-proxy-input', { timeout: 5000 });
  transcript.push('PASS: LiteLLM proxy input visible');

  const endpointInputs = page.locator('.guild-endpoint-input');
  const count = await endpointInputs.count();
  for (let i = 0; i < count; i += 1) {
    await endpointInputs.nth(i).fill(CUSTOM_ENDPOINT);
    await endpointInputs.nth(i).dispatchEvent('change');
  }
  transcript.push(`PASS: endpoints set to ${CUSTOM_ENDPOINT}`);

  const startBtn = page.locator('.guild-start-btn');
  if (await startBtn.isDisabled()) throw new Error('start button disabled');
  await startBtn.click();
  transcript.push('PASS: start-session clicked');

  await page.waitForSelector('.guild-plan__title', { timeout: 20000 });
  const planTitle = await page.locator('.guild-plan__title').innerText();
  const marker = `guild e2e http draft run ${runIndex}`;
  if (!planTitle.includes(marker)) {
    throw new Error(`work plan title missing marker: ${planTitle}`);
  }
  transcript.push(`PASS: work plan panel visible title="${planTitle.slice(0, 40)}"`);

  await page.waitForSelector('.guild-activity__item', { timeout: 20000 });
  transcript.push('PASS: live activity feed visible');

  await page.waitForSelector('.guild-bus__msg', { timeout: 20000 });
  transcript.push('PASS: guild bus messages visible');

  await page.waitForSelector('.guild-roster__member', { timeout: 20000 });
  transcript.push('PASS: guild roster populated');

  await page.waitForSelector('.guild-step', { timeout: 30000 });
  const stepCount = await page.locator('.guild-step').count();
  if (stepCount < 2) throw new Error(`expected >=2 steps, got ${stepCount}`);
  transcript.push(`PASS: pipeline steps count=${stepCount}`);

  await page.waitForSelector('.guild-artifact__body', { timeout: 30000 });
  const artifactText = await page.locator('.guild-artifact__body').innerText();
  if (!artifactText.trim()) throw new Error('artifact body empty');
  if (!artifactText.includes(marker)) {
    throw new Error(`artifact missing HTTP inference text: ${marker}`);
  }
  transcript.push(`PASS: artifact body includes HTTP draft len=${artifactText.trim().length}`);

  if (hitUrls.length < 3) throw new Error(`expected >=3 inference calls, got ${hitUrls.length}`);
  const openAiHits = hitUrls.filter((u) => u.includes('/v1/chat/completions'));
  const ollamaHits = hitUrls.filter((u) => u.includes('/api/generate'));
  if (!openAiHits.length) throw new Error('expected LiteLLM /v1/chat/completions hits');
  if (!ollamaHits.length) throw new Error('expected Ollama /api/generate hits');
  transcript.push(`PASS: fetch hits=${hitUrls.length} openai=${openAiHits.length} ollama=${ollamaHits.length}`);

  if (errors.length) throw new Error(`page errors: ${errors.join('; ')}`);
  transcript.push('PASS: zero page errors (pageerror only; asset 404 console excluded)');

  const shot = `${scratch}/launch-feed-${runIndex}.png`;
  await page.screenshot({ path: shot, fullPage: true });
  transcript.push(`PASS: screenshot ${shot}`);

  await context.close();
  return transcript;
}