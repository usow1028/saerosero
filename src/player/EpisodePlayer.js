import { episode1 } from './story/episode1.js';
import { createInitialState, getCurrentScene, getPendingInteraction, transition, isEpisodeComplete } from './engine/stateMachine.js';
import { CanvasRenderer } from './renderer/canvasRenderer.js';
import { evaluateSignalDecode, signalCursorPosition, DEFAULT_ZONE } from './minigames/signalDecode.js';
import { evaluateObstacleDodge, dodgeCollision, spawnObstacleLane } from './minigames/obstacleDodge.js';
import { buildTimeline, secToProgress } from './timeline.js';
import { INTERACTION_DEFAULTS, GUEST_PREVIEW_SCENE } from './defaults.js';

export class EpisodePlayer {
  /**
   * @param {HTMLElement} root
   * @param {object} options
   */
  constructor(root, options = {}) {
    this.root = root;
    this.options = options;
    this.episode = episode1;
    this.timeline = buildTimeline(this.episode);
    this.state = createInitialState(this.episode);
    this.lockedInteractions = new Set();
    this.completedScenes = [];
    this.sceneElapsed = 0;
    this.sceneDuration = 0;
    this.globalElapsed = 0;
    this.running = false;
    this.waitingInteraction = false;
    this.interactionTimer = null;
    this.uiHideTimer = null;
    this.showUi = true;
    this.paused = false;
    this.rafId = null;
    this.lastTs = 0;

    this.mount();
    this.loop = this.loop.bind(this);
  }

  mount() {
    this.root.className = 'player-page show-ui';
    this.root.innerHTML = `
      <div class="player-stage">
        <canvas class="player-canvas" width="1920" height="1080"></canvas>
        <div class="player-overlay-top">
          <button class="btn btn-ghost" data-back>←</button>
          <span class="branch-badge" data-branch></span>
          <button class="btn btn-ghost" data-fs>⛶</button>
        </div>
        <div class="player-dialogue hidden" data-dialogue>
          <p class="speaker" data-speaker></p>
          <p class="line" data-line></p>
        </div>
        <div class="player-interaction hidden" data-interaction>
          <p data-prompt></p>
          <div class="choice-row" data-choices></div>
          <div data-minigame></div>
        </div>
        <div class="player-controls" data-controls>
          <div class="progress-time"><span data-cur>0:00</span><span data-tot></span></div>
          <div class="progress-wrap" data-progress><div class="progress-rail"><div class="progress-fill" data-fill></div></div></div>
          <div class="control-row">
            <button class="btn btn-ghost" data-play>⏸</button>
            <button class="btn btn-ghost" data-save>${'💾'}</button>
          </div>
        </div>
      </div>`;

    this.canvas = this.root.querySelector('.player-canvas');
    this.renderer = new CanvasRenderer(this.canvas);
    this.els = {
      dialogue: this.root.querySelector('[data-dialogue]'),
      speaker: this.root.querySelector('[data-speaker]'),
      line: this.root.querySelector('[data-line]'),
      interaction: this.root.querySelector('[data-interaction]'),
      prompt: this.root.querySelector('[data-prompt]'),
      choices: this.root.querySelector('[data-choices]'),
      minigame: this.root.querySelector('[data-minigame]'),
      fill: this.root.querySelector('[data-fill]'),
      cur: this.root.querySelector('[data-cur]'),
      tot: this.root.querySelector('[data-tot]'),
      branch: this.root.querySelector('[data-branch]'),
      progress: this.root.querySelector('[data-progress]'),
    };

    this.els.tot.textContent = this.fmt(this.timeline.totalSec);
    this.paintMarkers();

    this.root.querySelector('[data-back]').onclick = () => this.options.onExit?.();
    this.root.querySelector('[data-fs]').onclick = () => this.toggleFullscreen();
    this.root.querySelector('[data-play]').onclick = () => this.togglePause();
    this.root.querySelector('[data-save]').onclick = () => this.options.onSaveRequest?.(this.exportState());
    this.els.progress.onclick = (e) => this.onSeek(e);
    this.root.addEventListener('mousemove', () => this.revealUi());
    this.root.addEventListener('click', () => this.revealUi());
  }

  paintMarkers() {
    for (const m of this.timeline.markers) {
      const dot = document.createElement('span');
      dot.className = 'branch-marker';
      dot.style.left = `${secToProgress(m.atSec, this.timeline.totalSec) * 100}%`;
      dot.title = m.interactionId;
      this.els.progress.appendChild(dot);
    }
  }

  fmt(sec) {
    const m = Math.floor(sec / 60);
    const s = Math.floor(sec % 60);
    return `${m}:${String(s).padStart(2, '0')}`;
  }

  revealUi() {
    this.root.classList.add('show-ui');
    clearTimeout(this.uiHideTimer);
    this.uiHideTimer = setTimeout(() => {
      if (this.running && !this.paused) this.root.classList.remove('show-ui');
    }, 3000);
  }

  loadState(saved) {
    if (!saved) return;
    this.state = saved.state;
    this.lockedInteractions = new Set(saved.lockedInteractions ?? []);
    this.completedScenes = saved.completedScenes ?? [];
    this.globalElapsed = saved.globalElapsed ?? 0;
  }

  exportState() {
    return {
      state: this.state,
      lockedInteractions: [...this.lockedInteractions],
      completedScenes: this.completedScenes,
      globalElapsed: this.globalElapsed,
    };
  }

  start() {
    if (this.running) return;
    this.running = true;
    this.enterScene(this.state.currentSceneId);
    this.lastTs = performance.now();
    this.rafId = requestAnimationFrame(this.loop);
    this.options.onFullscreenRequest?.();
    this.revealUi();
  }

  enterScene(sceneId) {
    const scene = this.episode.scenes[sceneId];
    this.sceneElapsed = 0;
    this.sceneDuration = scene.durationSec;
    this.renderer.setAnimationSequence(scene.animationSequence, this.state.branchKeys);
    this.updateBranchBadge();
    if (scene.lines[0]) this.showLine(scene.lines[0].speaker, scene.lines[0].text);
  }

  updateBranchBadge() {
    const keys = Object.values(this.state.branchKeys);
    this.els.branch.textContent = keys.length ? keys.join(' · ') : '—';
  }

  showLine(speaker, text) {
    this.els.dialogue.classList.remove('hidden');
    this.els.speaker.textContent = speaker;
    this.els.line.textContent = text;
  }

  globalTime() {
    const done = this.completedScenes.reduce((s, id) => s + (this.episode.scenes[id]?.durationSec ?? 0), 0);
    return done + this.sceneElapsed;
  }

  updateProgressUi() {
    const g = this.globalTime();
    this.els.fill.style.width = `${secToProgress(g, this.timeline.totalSec) * 100}%`;
    this.els.cur.textContent = this.fmt(g);
    this.options.onProgress?.(g, this.exportState());
  }

  loop(ts) {
    if (!this.running) return;
    if (!this.paused) {
      const dt = Math.min((ts - this.lastTs) / 1000, 0.1);
      this.lastTs = ts;
      if (!this.waitingInteraction) {
        this.sceneElapsed += dt;
        const progress = Math.min(this.sceneElapsed / this.sceneDuration, 1);
        this.updateDialogueLines(progress);
        this.renderer.render(progress);
        this.updateProgressUi();

        if (this.sceneElapsed >= this.sceneDuration) {
          const interaction = getPendingInteraction(this.episode, this.state);
          if (interaction) this.beginInteraction(interaction);
          else this.finishScene();
        }
      } else {
        this.renderer.render(1);
      }
    } else {
      this.lastTs = ts;
    }
    this.rafId = requestAnimationFrame(this.loop);
  }

  updateDialogueLines(progress) {
    const scene = getCurrentScene(this.episode, this.state);
    const idx = Math.min(Math.floor(progress * scene.lines.length), scene.lines.length - 1);
    const line = scene.lines[idx];
    if (line) this.showLine(line.speaker, line.text);
  }

  beginInteraction(interaction) {
    if (this.options.isGuest && interaction.id === 'intro_choice' && this.state.currentSceneId === GUEST_PREVIEW_SCENE) {
      this.options.onGuestGate?.();
      return;
    }
    this.waitingInteraction = true;
    this.els.dialogue.classList.add('hidden');
    this.presentInteraction(interaction);
    this.startInteractionTimer(interaction.id);
  }

  startInteractionTimer(interactionId) {
    clearTimeout(this.interactionTimer);
    const def = INTERACTION_DEFAULTS[interactionId];
    if (!def) return;
    this.interactionTimer = setTimeout(() => {
      if (!this.waitingInteraction) return;
      this.resolveDefault(interactionId);
    }, def.timeoutSec * 1000);
  }

  resolveDefault(interactionId) {
    const def = INTERACTION_DEFAULTS[interactionId];
    if (!def) return;
    this.resolveInteraction({ interactionId, ...def.result });
  }

  presentInteraction(interaction) {
    this.els.interaction.classList.remove('hidden');
    this.els.choices.innerHTML = '';
    this.els.minigame.innerHTML = '';
    if (interaction.type === 'dialogue') {
      this.els.prompt.textContent = interaction.prompt;
      for (const c of interaction.choices) {
        const btn = document.createElement('button');
        btn.className = 'btn';
        btn.textContent = c.label;
        btn.onclick = () => this.resolveInteraction({ interactionId: interaction.id, type: 'dialogue', choiceId: c.choiceId });
        this.els.choices.appendChild(btn);
      }
      return;
    }
    if (interaction.minigameId === 'signal_decode') this.runSignalDecode(interaction.id);
    else if (interaction.minigameId === 'obstacle_dodge') this.runObstacleDodge(interaction.id);
  }

  runSignalDecode(interactionId) {
    this.els.prompt.textContent = '';
    const wrap = document.createElement('div');
    wrap.innerHTML = `<p>신호 동기화 — 파란 구간에서 동기화</p><button class="btn btn-primary" data-sync>동기화</button>`;
    const started = performance.now();
    wrap.querySelector('[data-sync]').onclick = () => {
      const pos = signalCursorPosition(performance.now() - started);
      const r = evaluateSignalDecode(pos, DEFAULT_ZONE.start, DEFAULT_ZONE.end);
      this.resolveInteraction({ interactionId, type: 'minigame', outcome: r.outcome });
    };
    this.els.minigame.append(wrap);
  }

  runObstacleDodge(interactionId) {
    let lane = 1; let hits = 0; let tick = 0;
    const wrap = document.createElement('div');
    wrap.innerHTML = `<p>장애물 회피</p><p>레인: <span data-lane>1</span> | 충돌: <span data-hits>0</span></p>
      <div class="choice-row"><button class="btn" data-l="0">←</button><button class="btn" data-l="1">●</button><button class="btn" data-l="2">→</button></div>`;
    wrap.querySelectorAll('[data-l]').forEach((b) => b.onclick = () => { lane = Number(b.dataset.l); wrap.querySelector('[data-lane]').textContent = String(lane); });
    const timer = setInterval(() => {
      if (this.paused) return;
      tick += 1;
      if (dodgeCollision(lane, [{ lane: spawnObstacleLane(tick) }])) {
        hits += 1;
        wrap.querySelector('[data-hits]').textContent = String(hits);
      }
      if (tick >= 8) {
        clearInterval(timer);
        const r = evaluateObstacleDodge(hits);
        this.resolveInteraction({ interactionId, type: 'minigame', outcome: r.outcome });
      }
    }, 1000);
    this.els.minigame.append(wrap);
  }

  resolveInteraction(result) {
    clearTimeout(this.interactionTimer);
    this.lockedInteractions.add(result.interactionId);
    if (!this.completedScenes.includes(this.state.currentSceneId)) {
      this.completedScenes.push(this.state.currentSceneId);
    }
    const { nextState } = transition(this.episode, this.state, result);
    this.state = nextState;
    this.waitingInteraction = false;
    this.els.interaction.classList.add('hidden');
    this.enterScene(this.state.currentSceneId);
    this.options.onBranch?.(result, this.state);
  }

  finishScene() {
    const scene = getCurrentScene(this.episode, this.state);
    if (!this.completedScenes.includes(scene.id)) this.completedScenes.push(scene.id);
    if (scene.nextSceneId) {
      this.state = { ...this.state, currentSceneId: scene.nextSceneId, visitedSceneIds: [...this.state.visitedSceneIds, scene.nextSceneId] };
      this.enterScene(scene.nextSceneId);
      return;
    }
    if (isEpisodeComplete(this.episode, this.state)) {
      this.running = false;
      cancelAnimationFrame(this.rafId);
      this.options.onComplete?.(this.exportState());
    }
  }

  onSeek(e) {
    const rect = this.els.progress.getBoundingClientRect();
    const ratio = (e.clientX - rect.left) / rect.width;
    const target = ratio * this.timeline.totalSec;
    const current = this.globalTime();
    if (target > current) {
      for (const m of this.timeline.markers) {
        if (m.atSec > current && m.atSec <= target && !this.lockedInteractions.has(m.interactionId)) {
          this.resolveDefault(m.interactionId);
        }
      }
    }
    this.seekToTime(target);
  }

  seekToTime(targetSec) {
    let acc = 0;
    for (const seg of this.timeline.segments) {
      if (targetSec >= seg.start && targetSec < seg.end) {
        this.state.currentSceneId = seg.sceneId;
        this.sceneElapsed = targetSec - seg.start;
        this.enterScene(seg.sceneId);
        return;
      }
      acc = seg.end;
    }
  }

  togglePause() {
    this.paused = !this.paused;
    this.root.querySelector('[data-play]').textContent = this.paused ? '▶' : '⏸';
    if (this.interactionTimer && this.paused) clearTimeout(this.interactionTimer);
  }

  toggleFullscreen() {
    if (!document.fullscreenElement) this.root.requestFullscreen?.();
    else document.exitFullscreen?.();
  }

  destroy() {
    this.running = false;
    cancelAnimationFrame(this.rafId);
    clearTimeout(this.interactionTimer);
    clearTimeout(this.uiHideTimer);
  }
}