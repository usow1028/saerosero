const PALETTES = {
  stars_fade_in: ['#0a1028', '#1a3a6a', '#7ec8ff'],
  station_approach: ['#101830', '#2a5088', '#a8d8ff'],
  signal_pulse: ['#18082a', '#5a2a88', '#ffb86b'],
  thruster_burst: ['#2a0810', '#aa3030', '#ff8860'],
  corridor_run: ['#1a1020', '#603050', '#ff90b0'],
  signal_lock_brave: ['#102040', '#3080c0', '#90e0ff'],
  slow_zoom: ['#081820', '#204858', '#90c8d0'],
  sensor_sweep: ['#101828', '#385878', '#b0d0f0'],
  signal_lock_cautious: ['#0a1828', '#285868', '#80b8c8'],
  panel_spark: ['#201008', '#a06020', '#ffd080'],
  code_rain_brave: ['#100820', '#6020a0', '#d080ff'],
  panel_glow: ['#081018', '#206060', '#80e0c0'],
  code_rain_cautious: ['#081018', '#204878', '#90c0ff'],
  antenna_focus: ['#101020', '#4040a0', '#c0c0ff'],
  waveform_clear: ['#081028', '#2080c0', '#e0f8ff'],
  hologram_map: ['#101030', '#4060c0', '#a0e0ff'],
  path_unlock: ['#201040', '#8060e0', '#ffe0a0'],
  waveform_noise: ['#180818', '#804080', '#ffa0c0'],
  static_burst: ['#202020', '#606060', '#d0d0d0'],
  path_flicker: ['#281018', '#a04060', '#ffc0d0'],
  hall_merge: ['#101020', '#505090', '#d0d0ff'],
  door_force_glow: ['#281018', '#c05030', '#ffd080'],
  decision_beat_brave: ['#301020', '#a04050', '#ffc0a0'],
  hall_shadow: ['#080c18', '#283858', '#90a8c8'],
  sensor_pause: ['#0a1420', '#305070', '#a0c0e0'],
  decision_beat_cautious: ['#101828', '#406080', '#c0e0ff'],
  anomaly_glow: ['#180828', '#9040c0', '#ffe080'],
  decision_beat: ['#201030', '#7050b0', '#fff0c0'],
  door_open_light: ['#302010', '#c0a060', '#fff8e0'],
  figure_reveal: ['#201828', '#9070b0', '#fff0ff'],
  hand_reach: ['#281830', '#b080c0', '#ffffff'],
  door_slam: ['#200810', '#a03040', '#ff8080'],
  alarm_red: ['#300808', '#d04040', '#ffb0b0'],
  fade_uncertain: ['#181820', '#505060', '#c0c0d0'],
  star_scroll: ['#080818', '#304070', '#a0c8ff'],
  title_card: ['#101028', '#5060a0', '#e0e8ff'],
  to_be_continued: ['#180820', '#7040a0', '#ffd0ff'],
};

const BRANCH_OVERLAYS = {
  intro_choice: {
    brave: 'rgba(255, 120, 80, 0.10)',
    cautious: 'rgba(80, 180, 220, 0.10)',
  },
  trust_choice: {
    trust: 'rgba(180, 120, 255, 0.09)',
    solo: 'rgba(120, 200, 160, 0.09)',
  },
  signal_decode: {
    decode_win: 'rgba(120, 200, 255, 0.08)',
    decode_loss: 'rgba(255, 120, 160, 0.10)',
  },
  anomaly_choice: {
    confront: 'rgba(255, 160, 80, 0.11)',
    retreat: 'rgba(100, 160, 220, 0.11)',
  },
  obstacle_dodge: {
    dodge_win: 'rgba(255, 230, 160, 0.07)',
    dodge_loss: 'rgba(180, 80, 100, 0.10)',
  },
};

export class CanvasRenderer {
  /**
   * @param {HTMLCanvasElement} canvas
   */
  constructor(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.width = canvas.width;
    this.height = canvas.height;
    this.frame = 0;
    this.activeKey = 'stars_fade_in';
    this.branchKeys = {};
  }

  setAnimationSequence(sequence, branchKeys = {}) {
    this.sequence = sequence;
    this.seqIndex = 0;
    this.activeKey = sequence[0] ?? 'stars_fade_in';
    this.branchKeys = branchKeys;
  }

  advanceSequenceStep() {
    if (!this.sequence) return;
    this.seqIndex = Math.min(this.seqIndex + 1, this.sequence.length - 1);
    this.activeKey = this.sequence[this.seqIndex];
  }

  applyBranchOverlays(ctx, w, h) {
    for (const [interactionId, key] of Object.entries(this.branchKeys)) {
      const palette = BRANCH_OVERLAYS[interactionId];
      const color = palette?.[key];
      if (color) {
        ctx.fillStyle = color;
        ctx.fillRect(0, 0, w, h);
      }
    }
  }

  /**
   * @param {number} progress 0..1 within scene
   */
  render(progress = 0) {
    const ctx = this.ctx;
    const w = this.width;
    const h = this.height;
    const palette = PALETTES[this.activeKey] ?? PALETTES.stars_fade_in;

    const grd = ctx.createLinearGradient(0, 0, w, h);
    grd.addColorStop(0, palette[0]);
    grd.addColorStop(0.5 + progress * 0.2, palette[1]);
    grd.addColorStop(1, palette[2]);
    ctx.fillStyle = grd;
    ctx.fillRect(0, 0, w, h);

    this.drawStars(ctx, w, h, palette[2]);
    this.drawSceneMotif(ctx, w, h, this.activeKey, progress);
    this.applyBranchOverlays(ctx, w, h);

    this.frame += 1;
  }

  drawStars(ctx, w, h, color) {
    ctx.fillStyle = color;
    for (let i = 0; i < 40; i += 1) {
      const x = ((i * 97 + this.frame * (i % 3 + 1) * 0.15) % w);
      const y = ((i * 53) % h);
      const r = (i % 5) === 0 ? 1.8 : 1;
      ctx.globalAlpha = 0.35 + (i % 7) * 0.08;
      ctx.beginPath();
      ctx.arc(x, y, r, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.globalAlpha = 1;
  }

  drawSceneMotif(ctx, w, h, key, progress) {
    const cx = w * 0.5;
    const cy = h * 0.45;
    const pulse = 0.5 + Math.sin(this.frame * 0.06) * 0.2;

    if (key.includes('station') || key.includes('hall')) {
      ctx.strokeStyle = 'rgba(200, 220, 255, 0.5)';
      ctx.lineWidth = 2;
      ctx.strokeRect(cx - 120, cy - 60, 240, 120);
      ctx.fillStyle = 'rgba(126, 200, 255, 0.15)';
      ctx.fillRect(cx - 100, cy - 20, 200, 40);
    }

    if (key.includes('door_force') || key.includes('decision_beat_brave')) {
      ctx.fillStyle = 'rgba(255, 140, 80, 0.35)';
      ctx.fillRect(cx - 30, cy - 90, 60, 180 * pulse);
    }

    if (key.includes('hall_shadow') || key.includes('decision_beat_cautious')) {
      ctx.fillStyle = 'rgba(80, 140, 220, 0.25)';
      ctx.fillRect(cx - 140, cy - 40, 280, 80);
    }

    if (key.includes('signal') || key.includes('waveform')) {
      ctx.beginPath();
      ctx.strokeStyle = 'rgba(255, 184, 107, 0.8)';
      ctx.lineWidth = 2;
      for (let x = 0; x < w; x += 6) {
        const y = cy + Math.sin((x + this.frame * 4) * 0.04) * (30 + progress * 20);
        if (x === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.stroke();
    }

    if (key.includes('door') || key.includes('figure')) {
      ctx.fillStyle = 'rgba(255, 240, 200, 0.25)';
      ctx.fillRect(cx - 40, cy - 80, 80, 160 * pulse);
    }

    if (key.includes('title') || key.includes('continued')) {
      ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
      ctx.font = 'bold 28px system-ui, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('별빛 정거장', cx, cy);
      ctx.font = '16px system-ui, sans-serif';
      ctx.fillStyle = 'rgba(200, 220, 255, 0.8)';
      ctx.fillText('To Be Continued', cx, cy + 36);
    }
  }

  sampleCenterPixel() {
    const { data } = this.ctx.getImageData(this.width / 2, this.height / 2, 1, 1);
    return `rgb(${data[0]},${data[1]},${data[2]})`;
  }
}