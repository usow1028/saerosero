/** goal-deliverable: studio-guild */
import { loadCatalog } from '../services/CatalogService.js';
import { buildFeedBatch } from '../services/FeedService.js';
import { recordTaste } from '../services/ProgressService.js';
import { getLocale } from '../i18n/index.js';
import { createVerticalFeed } from '../ui/VerticalFeed.js';
import { openTitleStudioPanel } from '../ui/TitleStudioPanel.js';
import { el } from '../ui/helpers.js';

let activeFeed = null;

export async function renderFeed(container, navigate) {
  activeFeed?.destroy();
  container.replaceChildren();

  const catalog = await loadCatalog();
  const locale = getLocale();
  let cursor = 0;
  let seen = new Set();

  const shell = el('div', { class: 'feed-page' });

  const feed = createVerticalFeed({
    onNeedMore: () => loadMore(),
    onStudio: (title) => openTitleStudioPanel(title, navigate, () => {}),
    onSettings: () => navigate('/settings'),
    onIndexChange: (title) => {
      if (title) recordTaste(title.genre, null);
    },
  });
  shell.append(feed.el);
  container.append(shell);
  activeFeed = feed;

  function loadMore() {
    const batch = buildFeedBatch(catalog, locale, { seen, cursor });
    cursor = batch.nextCursor;
    seen = batch.seen;
    if (batch.items.length) feed.appendItems(batch.items);
  }

  loadMore();
}