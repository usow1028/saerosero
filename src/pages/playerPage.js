import { isGuestMode } from '../services/ProfileService.js';
import { getWatchState, setWatchState, upsertContinue, writeSaveSlot, recordTaste } from '../services/ProgressService.js';
import { loadCatalog, getTitle } from '../services/CatalogService.js';
import { EpisodePlayer } from '../player/EpisodePlayer.js';
import { t } from '../i18n/index.js';
import { el } from '../ui/helpers.js';

let activePlayer = null;

export async function renderPlayer(container, navigate, titleId, episode) {
  const catalog = await loadCatalog();
  const title = getTitle(catalog, titleId);
  if (!title || title.status !== 'playable') {
    navigate(`/title/${titleId}`);
    return;
  }

  activePlayer?.destroy();
  container.replaceChildren();
  const root = el('div');
  container.append(root);

  const player = new EpisodePlayer(root, {
    isGuest: isGuestMode(),
    onExit: () => { player.destroy(); navigate(`/title/${titleId}`); },
    onGuestGate: () => showGate(navigate),
    onProgress: (sec, state) => {
      setWatchState(titleId, episode, state);
      upsertContinue({ titleId, episode, progressSec: sec, label: state.state.currentSceneId });
    },
    onBranch: (result, state) => recordTaste(title.genre, state.branchKeys[result.interactionId]),
    onComplete: (state) => {
      history.pushState({ state }, '', `#/recap/${titleId}/${episode}`);
      navigate(`/recap/${titleId}/${episode}`, { state });
    },
    onSaveRequest: (state) => {
      const slot = Number(prompt('Save slot 1-3', '1')) - 1;
      if (slot >= 0 && slot < 3) writeSaveSlot(titleId, episode, slot, state);
    },
    onFullscreenRequest: () => root.requestFullscreen?.().catch(() => {}),
  });

  const saved = getWatchState(titleId, episode);
  if (saved) player.loadState(saved);
  player.start();
  activePlayer = player;
}

function showGate(navigate) {
  const backdrop = el('div', { class: 'modal-backdrop' });
  backdrop.append(el('div', { class: 'modal' }, [
    el('h2', { text: t('gate.title') }),
    el('p', { text: t('gate.body') }),
    el('button', { class: 'btn btn-primary', text: t('gate.cta'), onclick: () => { backdrop.remove(); navigate('/profiles'); } }),
  ]));
  document.body.append(backdrop);
}