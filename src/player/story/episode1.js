/** @typedef {'dialogue' | 'minigame'} InteractionType */

/**
 * @typedef {object} DialogueChoice
 * @property {string} choiceId
 * @property {string} label
 * @property {string} branchKey
 * @property {string} nextSceneId
 */

/**
 * @typedef {object} MinigameOutcome
 * @property {string} branchKey
 * @property {string} nextSceneId
 */

/**
 * @typedef {object} InteractionNode
 * @property {string} id
 * @property {InteractionType} type
 * @property {string} sceneId
 * @property {string} [prompt]
 * @property {DialogueChoice[]} [choices]
 * @property {Record<'win'|'loss', MinigameOutcome>} [outcomes]
 * @property {string} [minigameId]
 */

/**
 * @typedef {object} Scene
 * @property {string} id
 * @property {number} durationSec
 * @property {string[]} animationSequence
 * @property {{ speaker: string, text: string, atSec?: number }[]} lines
 * @property {string} [nextSceneId]
 * @property {string} [interactionId]
 */

export const episode1 = {
  id: 'episode1',
  title: '별빛 정거장',
  startSceneId: 'intro',
  endSceneId: 'credits',
  scenes: {
    intro: {
      id: 'intro',
      durationSec: 42,
      animationSequence: ['stars_fade_in', 'station_approach', 'signal_pulse'],
      lines: [
        { speaker: '나레이션', text: '2276년, 궤도 정거장 별빛. 밤마다 울리는 낯선 신호가 있다.', atSec: 0 },
        { speaker: '아리아', text: '오늘도 왔어. 주파수가 어제보다 선명해.', atSec: 12 },
        { speaker: '나레이션', text: '당신은 정거장의 야간 관측 요원이다.', atSec: 24 },
      ],
      interactionId: 'intro_choice',
    },
    path_brave_opening: {
      id: 'path_brave_opening',
      durationSec: 48,
      animationSequence: ['thruster_burst', 'corridor_run', 'signal_lock_brave'],
      lines: [
        { speaker: '아리아', text: '좋아, 바로 신호원 쪽으로 가자. 내가 경로를 열게.', atSec: 0 },
        { speaker: '나레이션', text: '복도 너머, 붉은 경고등이 깜빡인다.', atSec: 18 },
        { speaker: '시스템', text: '외부 압력 변동 감지. 접근 주의.', atSec: 32 },
      ],
      interactionId: 'trust_choice',
    },
    path_cautious_opening: {
      id: 'path_cautious_opening',
      durationSec: 48,
      animationSequence: ['slow_zoom', 'sensor_sweep', 'signal_lock_cautious'],
      lines: [
        { speaker: '아리아', text: '서두르지 말자. 먼저 패턴을 기록하자.', atSec: 0 },
        { speaker: '나레이션', text: '관측실 창밖, 별들이 고요히 흐른다.', atSec: 18 },
        { speaker: '시스템', text: '신호 주기 7.3초. 반복 오차 0.02%.', atSec: 32 },
      ],
      interactionId: 'trust_choice',
    },
    brave_mid: {
      id: 'brave_mid',
      durationSec: 44,
      animationSequence: ['panel_spark', 'code_rain_brave', 'antenna_focus'],
      lines: [
        { speaker: '아리아', text: '신호가 코드처럼 보여. 해독이 필요해.', atSec: 0 },
        { speaker: '나레이션', text: '타이밍에 맞춰 펄스를 잡아야 한다.', atSec: 16 },
      ],
      interactionId: 'signal_decode',
    },
    cautious_mid: {
      id: 'cautious_mid',
      durationSec: 44,
      animationSequence: ['panel_glow', 'code_rain_cautious', 'antenna_focus'],
      lines: [
        { speaker: '아리아', text: '패턴이 맞았어. 이제 펄스를 동기화하자.', atSec: 0 },
        { speaker: '나레이션', text: '조용한 관측실에 리듬이 울린다.', atSec: 16 },
      ],
      interactionId: 'signal_decode',
    },
    decode_win: {
      id: 'decode_win',
      durationSec: 40,
      animationSequence: ['waveform_clear', 'hologram_map', 'path_unlock'],
      lines: [
        { speaker: '시스템', text: '해독 성공. 좌표: 외곽 선실 7-B.', atSec: 0 },
        { speaker: '아리아', text: '누군가 의도적으로 보낸 신호야.', atSec: 14 },
      ],
      interactionId: 'anomaly_choice',
    },
    decode_loss: {
      id: 'decode_loss',
      durationSec: 40,
      animationSequence: ['waveform_noise', 'static_burst', 'path_flicker'],
      lines: [
        { speaker: '시스템', text: '해독 실패. 잡음 속에 좌표 조각만 남았다.', atSec: 0 },
        { speaker: '아리아', text: '완전하진 않지만… 가볼 가치는 있어.', atSec: 14 },
      ],
      interactionId: 'anomaly_choice',
    },
    convergence_confront: {
      id: 'convergence_confront',
      durationSec: 38,
      animationSequence: ['hall_merge', 'door_force_glow', 'decision_beat_brave'],
      lines: [
        { speaker: '나레이션', text: '7-B 선실 문고리를 잡자, 금속이 뜨겁게 달아올랐다.', atSec: 0 },
        { speaker: '아리아', text: '바로 들어가. 문 너머 반응이 강해지고 있어.', atSec: 16 },
      ],
      interactionId: 'obstacle_dodge',
    },
    convergence_retreat: {
      id: 'convergence_retreat',
      durationSec: 38,
      animationSequence: ['hall_shadow', 'sensor_pause', 'decision_beat_cautious'],
      lines: [
        { speaker: '나레이션', text: '한 걸음 물러서자, 복도 조명이 푸르게 낮아졌다.', atSec: 0 },
        { speaker: '아리아', text: '천천히 접근하자. 움직임을 먼저 읽어야 해.', atSec: 16 },
      ],
      interactionId: 'obstacle_dodge',
    },
    dodge_win_ending: {
      id: 'dodge_win_ending',
      durationSec: 32,
      animationSequence: ['door_open_light', 'figure_reveal', 'hand_reach'],
      lines: [
        { speaker: '미지의 목소리', text: '늦지 않았군. 정거장의 기록을 이어줄 사람.', atSec: 0 },
        { speaker: '아리아', text: '살아있어… 그리고 우리를 기다리고 있었어.', atSec: 14 },
      ],
      nextSceneId: 'credits',
    },
    dodge_loss_ending: {
      id: 'dodge_loss_ending',
      durationSec: 32,
      animationSequence: ['door_slam', 'alarm_red', 'fade_uncertain'],
      lines: [
        { speaker: '시스템', text: '긴급 봉인. 선실 접근 실패.', atSec: 0 },
        { speaker: '아리아', text: '오늘은 여기까지야. 하지만 신호는 멈추지 않았어.', atSec: 14 },
      ],
      nextSceneId: 'credits',
    },
    credits: {
      id: 'credits',
      durationSec: 27,
      animationSequence: ['star_scroll', 'title_card', 'to_be_continued'],
      lines: [
        { speaker: '나레이션', text: '1화 끝. 당신의 선택이 별빛 정거장의 밤을 바꿨다.', atSec: 0 },
      ],
    },
  },
  interactions: [
    {
      id: 'intro_choice',
      type: 'dialogue',
      sceneId: 'intro',
      prompt: '신호를 어떻게 대응할까?',
      choices: [
        { choiceId: 'investigate', label: '직접 조사한다', branchKey: 'brave', nextSceneId: 'path_brave_opening' },
        { choiceId: 'observe', label: '관찰만 한다', branchKey: 'cautious', nextSceneId: 'path_cautious_opening' },
      ],
    },
    {
      id: 'trust_choice',
      type: 'dialogue',
      sceneId: 'path_brave_opening',
      prompt: '아리아의 제안에 어떻게 답할까?',
      choices: [
        { choiceId: 'trust_ai', label: '아리아를 믿는다', branchKey: 'trust', nextSceneId: 'brave_mid' },
        { choiceId: 'solo', label: '혼자 판단한다', branchKey: 'solo', nextSceneId: 'cautious_mid' },
      ],
    },
    {
      id: 'signal_decode',
      type: 'minigame',
      sceneId: 'brave_mid',
      minigameId: 'signal_decode',
      outcomes: {
        win: { branchKey: 'decode_win', nextSceneId: 'decode_win' },
        loss: { branchKey: 'decode_loss', nextSceneId: 'decode_loss' },
      },
    },
    {
      id: 'anomaly_choice',
      type: 'dialogue',
      sceneId: 'decode_win',
      prompt: '선실 앞에서 어떻게 행동할까?',
      choices: [
        { choiceId: 'confront', label: '문을 연다', branchKey: 'confront', nextSceneId: 'convergence_confront' },
        { choiceId: 'retreat', label: '한 걸음 물러선다', branchKey: 'retreat', nextSceneId: 'convergence_retreat' },
      ],
    },
    {
      id: 'obstacle_dodge',
      type: 'minigame',
      sceneId: 'convergence_confront',
      minigameId: 'obstacle_dodge',
      outcomes: {
        win: { branchKey: 'dodge_win', nextSceneId: 'dodge_win_ending' },
        loss: { branchKey: 'dodge_loss', nextSceneId: 'dodge_loss_ending' },
      },
    },
  ],
};