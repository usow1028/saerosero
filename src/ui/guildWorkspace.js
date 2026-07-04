/** goal-deliverable: studio-guild */
import {
  getGuildSettings,
  toggleCollaborator,
  patchGuildSettings,
  getEnabledCollaborators,
  canStartGuildSession,
  setCommercialProxy,
} from '../services/guild/GuildSettingsService.js';
import { getGuildArtifact } from '../services/guild/GuildArtifactService.js';
import { runGuildAutomation } from '../services/guild/GuildAutomationOrchestrator.js';
import { GUILD_PHASES, COLLABORATOR_KINDS } from '../services/guild/types.js';
import { providerBadge } from '../services/guild/CommercialProviders.js';
import { getLocale, t } from '../i18n/index.js';
import { el } from './helpers.js';

const PHASE_ORDER = [
  GUILD_PHASES.PLANNING,
  GUILD_PHASES.RECRUITMENT,
  GUILD_PHASES.FOUNDING,
  GUILD_PHASES.ROLE_ASSIGNMENT,
  GUILD_PHASES.PRODUCTION,
  GUILD_PHASES.COMPLETED,
];

function collaboratorGroup(kind, headingKey, onSettingsChange) {
  const list = el('div', { class: 'guild-collab-list' });
  const refresh = () => {
    const settings = getGuildSettings();
    const items = kind === COLLABORATOR_KINDS.PUBLIC_AI ? settings.publicAi : settings.localLlm;
    list.replaceChildren(...items.map((c) => {
      const badge = kind === COLLABORATOR_KINDS.PUBLIC_AI
        ? el('span', { class: `guild-collab-row__badge guild-collab-row__badge--${c.provider}`, text: providerBadge(c) })
        : null;
      const row = el('label', { class: 'guild-collab-row' }, [
        el('input', { type: 'checkbox', class: 'guild-collab-toggle' }),
        badge,
        el('span', { class: 'guild-collab-row__label', text: c.label }),
      ].filter(Boolean));
      const input = row.querySelector('input');
      input.checked = c.enabled;
      input.onchange = () => {
        toggleCollaborator(kind, c.id, input.checked);
        refresh();
        onSettingsChange();
      };
      const endpointInput = el('input', {
        class: 'guild-endpoint-input',
        type: 'url',
        value: c.endpoint ?? '',
        placeholder: kind === COLLABORATOR_KINDS.PUBLIC_AI
          ? t('guild.proxyPlaceholder')
          : t('guild.endpointPlaceholder'),
      });
      endpointInput.onchange = () => {
        const next = getGuildSettings();
        const listKey = kind === COLLABORATOR_KINDS.PUBLIC_AI ? 'publicAi' : 'localLlm';
        const target = next[listKey].find((x) => x.id === c.id);
        if (target) target.endpoint = endpointInput.value.trim() || target.endpoint;
        patchGuildSettings(next);
        onSettingsChange();
      };
      row.append(endpointInput);
      if (kind === COLLABORATOR_KINDS.PUBLIC_AI) {
        const modelInput = el('input', {
          class: 'guild-model-input',
          type: 'text',
          value: c.apiModel ?? c.model ?? '',
          placeholder: t('guild.modelPlaceholder'),
        });
        modelInput.onchange = () => {
          const next = getGuildSettings();
          const target = next.publicAi.find((x) => x.id === c.id);
          if (target) {
            const val = modelInput.value.trim();
            target.apiModel = val || target.apiModel;
            target.model = val || target.model;
          }
          patchGuildSettings(next);
          onSettingsChange();
        };
        row.append(modelInput);
      } else {
        const modelInput = el('input', {
          class: 'guild-model-input',
          type: 'text',
          value: c.model ?? '',
          placeholder: t('guild.modelPlaceholder'),
        });
        modelInput.onchange = () => {
          const next = getGuildSettings();
          const target = next.localLlm.find((x) => x.id === c.id);
          if (target) target.model = modelInput.value.trim() || target.model;
          patchGuildSettings(next);
          onSettingsChange();
        };
        row.append(modelInput);
      }
      return row;
    }));
  };
  refresh();
  return el('section', { class: 'guild-collab-group' }, [
    el('h3', { text: t(headingKey) }),
    el('p', { class: 'guild-collab-group__hint', text: t(`guild.hint.${kind}`) }),
    list,
  ]);
}

function renderPhaseTrack(activePhase) {
  const track = el('ol', { class: 'guild-phase-track' });
  track.replaceChildren(...PHASE_ORDER.map((phase) => {
    const idx = PHASE_ORDER.indexOf(phase);
    const activeIdx = PHASE_ORDER.indexOf(activePhase ?? GUILD_PHASES.PLANNING);
    const state = idx < activeIdx ? 'done' : idx === activeIdx ? 'active' : 'pending';
    return el('li', {
      class: `guild-phase guild-phase--${state}`,
      'data-phase': phase,
      text: t(`guild.phase.${phase}`),
    });
  }));
  return track;
}

function renderBusMessages(messages) {
  const list = el('div', { class: 'guild-bus' });
  if (!messages?.length) {
    list.append(el('p', { class: 'guild-bus__empty', text: t('guild.busEmpty') }));
    return list;
  }
  list.replaceChildren(...messages.map((m) => {
    const headParts = [
      m.provider
        ? el('span', { class: `guild-bus__badge guild-bus__badge--${m.provider}`, text: providerBadge({ provider: m.provider }) })
        : null,
      el('span', { class: 'guild-bus__from', text: m.fromLabel }),
      el('span', { class: 'guild-bus__phase', text: t(`guild.phase.${m.phase}`) }),
    ].filter(Boolean);
    return el('article', { class: 'guild-bus__msg' }, [
      el('header', { class: 'guild-bus__head' }, headParts),
      el('p', { class: 'guild-bus__body', text: m.content }),
    ]);
  }));
  return list;
}

function renderWorkPlan(workPlan) {
  const panel = el('div', { class: 'guild-plan-panel' });
  if (!workPlan?.title) {
    panel.append(el('p', { class: 'guild-plan__empty', text: t('guild.planEmpty') }));
    return panel;
  }
  const themes = workPlan.themes?.length
    ? el('ul', { class: 'guild-plan__themes' }, workPlan.themes.map((th) => el('li', { text: th })))
    : null;
  const roles = workPlan.neededRoles?.length
    ? el('p', {
      class: 'guild-plan__roles',
      text: `${t('guild.planRoles')}: ${workPlan.neededRoles.map((r) => t(`guild.role.${r}`)).join(', ')}`,
    })
    : null;
  panel.replaceChildren(
    el('h4', { class: 'guild-plan__title', text: workPlan.title }),
    el('p', { class: 'guild-plan__logline', text: workPlan.logline }),
    themes,
    roles,
    workPlan.synopsis ? el('p', { class: 'guild-plan__synopsis', text: workPlan.synopsis }) : null,
  );
  return panel;
}

function renderRoster(members) {
  const list = el('ul', { class: 'guild-roster' });
  if (!members?.length) {
    list.append(el('li', { class: 'guild-roster__empty', text: t('guild.rosterEmpty') }));
    return list;
  }
  list.replaceChildren(...members.map((m) => el('li', { class: 'guild-roster__member' }, [
    el('span', { class: 'guild-roster__name', text: m.label }),
    el('span', { class: 'guild-roster__kind', text: t(`guild.kind.${m.kind}`) }),
    el('span', { class: 'guild-roster__role', text: m.role ? t(`guild.role.${m.role}`) : t('guild.rolePending') }),
  ])));
  return list;
}

export function createGuildWorkspace(title) {
  const locale = getLocale();
  const statusEl = el('p', { class: 'guild-status', text: '' });
  const phaseEl = el('div', { class: 'guild-phase-wrap' });
  const planEl = el('div', { class: 'guild-plan-wrap' });
  const activityEl = el('div', { class: 'guild-activity' });
  const studioEl = el('div', { class: 'guild-studio' });
  const busEl = el('div', { class: 'guild-bus-wrap' });
  const rosterEl = el('div', { class: 'guild-roster-wrap' });
  const stepsEl = el('ol', { class: 'guild-steps' });
  const artifactEl = el('div', { class: 'guild-artifact' });

  function pushActivity(text) {
    const item = el('p', { class: 'guild-activity__item', text });
    activityEl.prepend(item);
    while (activityEl.children.length > 6) {
      activityEl.lastChild?.remove();
    }
  }

  function renderStudio(studio) {
    if (!studio?.name) {
      studioEl.replaceChildren();
      return;
    }
    studioEl.replaceChildren(
      el('h3', { text: t('guild.studioFounded') }),
      el('p', { class: 'guild-studio__name', text: studio.name }),
      el('p', { class: 'guild-studio__charter', text: studio.charter }),
    );
  }

  function renderArtifact() {
    const artifact = getGuildArtifact(title.id);
    if (!artifact?.merged?.body) {
      artifactEl.replaceChildren(el('p', { class: 'guild-artifact__empty', text: t('guild.noArtifact') }));
      return;
    }
    artifactEl.replaceChildren(
      el('p', { class: 'guild-artifact__synopsis', text: artifact.merged.synopsis }),
      el('pre', { class: 'guild-artifact__body', text: artifact.merged.body }),
    );
  }

  function renderSteps(sessionSteps) {
    if (!sessionSteps?.length) {
      stepsEl.replaceChildren();
      return;
    }
    stepsEl.replaceChildren(
      ...sessionSteps.map((s) => {
        const parts = [
          el('span', { class: 'guild-step__order', text: String(s.order) }),
          el('span', { class: 'guild-step__kind', text: t(`guild.kind.${s.collaboratorKind}`) }),
          el('span', { class: 'guild-step__label', text: s.collaboratorLabel ?? s.collaboratorId }),
        ];
        if (s.role) {
          parts.push(el('span', { class: 'guild-step__role', text: t(`guild.role.${s.role}`) }));
        }
        return el('li', { class: 'guild-step' }, parts);
      }),
    );
  }

  function hydrateFromArtifact() {
    const artifact = getGuildArtifact(title.id);
    phaseEl.replaceChildren(renderPhaseTrack(artifact?.phase));
    planEl.replaceChildren(renderWorkPlan(artifact?.workPlan));
    renderStudio(artifact?.studio);
    busEl.replaceChildren(renderBusMessages(artifact?.messages));
    rosterEl.replaceChildren(renderRoster(artifact?.members));
    if (artifact?.steps?.length) renderSteps(artifact.steps);
    renderArtifact();
  }

  const proxySection = el('section', { class: 'guild-proxy-section' });
  const proxyInput = el('input', {
    class: 'guild-proxy-input',
    type: 'url',
    value: getGuildSettings().commercialProxy,
    placeholder: t('guild.proxyPlaceholder'),
  });
  proxyInput.onchange = () => {
    setCommercialProxy(proxyInput.value);
    hydrateFromArtifact();
    syncStartButton();
  };
  proxySection.replaceChildren(
    el('h3', { text: t('guild.commercialProxy') }),
    el('p', { class: 'guild-proxy-section__hint', text: t('guild.commercialProxyHint') }),
    proxyInput,
  );

  const startBtn = el('button', {
    class: 'btn btn-primary guild-start-btn',
    type: 'button',
    text: t('guild.startAutomation'),
  });

  function syncStartButton() {
    const gate = canStartGuildSession();
    const running = startBtn.dataset.running === '1';
    startBtn.disabled = running || !gate.ok;
    if (!gate.ok && !running) {
      statusEl.textContent = t('guild.needBothKinds');
    } else if (!running && statusEl.textContent === t('guild.needBothKinds')) {
      statusEl.textContent = '';
    }
  }

  startBtn.onclick = async () => {
    const gate = canStartGuildSession();
    if (!gate.ok) {
      statusEl.textContent = t('guild.needBothKinds');
      return;
    }

    startBtn.dataset.running = '1';
    startBtn.disabled = true;
    statusEl.textContent = t('guild.automationRunning');
    statusEl.classList.remove('guild-status--inference-failed', 'guild-status--roster-failed');
    activityEl.replaceChildren();
    try {
      const session = await runGuildAutomation(title, locale, {
        collaborators: getEnabledCollaborators(),
        fetchFn: globalThis.fetch,
        onPhase: (phase) => {
          phaseEl.replaceChildren(renderPhaseTrack(phase));
          statusEl.textContent = t(`guild.phaseRunning.${phase}`);
          pushActivity(t(`guild.phaseRunning.${phase}`));
          hydrateFromArtifact();
        },
        onActivity: ({ phase, workPlan }) => {
          if (phase === GUILD_PHASES.PLANNING && workPlan?.title) {
            planEl.replaceChildren(renderWorkPlan(workPlan));
            pushActivity(`${t('guild.planReady')}: ${workPlan.title}`);
          }
        },
      });
      phaseEl.replaceChildren(renderPhaseTrack(GUILD_PHASES.COMPLETED));
      planEl.replaceChildren(renderWorkPlan(session.workPlan));
      renderStudio(session.studio);
      busEl.replaceChildren(renderBusMessages(session.messages));
      rosterEl.replaceChildren(renderRoster(session.members));
      renderSteps(session.steps);
      renderArtifact();
      statusEl.textContent = t('guild.automationCompleted');
      pushActivity(t('guild.automationCompleted'));
    } catch (err) {
      const code = err.message ?? '';
      if (code === 'guild:need_both_collaborator_kinds') {
        statusEl.textContent = t('guild.needBothKinds');
      } else if (code.startsWith('guild:inference')) {
        statusEl.textContent = t('guild.inferenceFailed');
        statusEl.dataset.errorCode = code;
        statusEl.classList.add('guild-status--inference-failed');
      } else if (code === 'guild:roster_insufficient' || code === 'guild:roles_insufficient') {
        statusEl.textContent = t('guild.rosterFailed');
        statusEl.classList.add('guild-status--roster-failed');
      } else {
        statusEl.textContent = t('guild.failed');
      }
    } finally {
      startBtn.dataset.running = '0';
      syncStartButton();
    }
  };

  hydrateFromArtifact();
  syncStartButton();

  return el('section', { class: 'guild-workspace' }, [
    el('h2', { class: 'guild-workspace__title', text: t('guild.title') }),
    el('p', { class: 'guild-lead', text: t('guild.leadAutomation') }),
    phaseEl,
    proxySection,
    collaboratorGroup(COLLABORATOR_KINDS.PUBLIC_AI, 'guild.publicAi', syncStartButton),
    collaboratorGroup(COLLABORATOR_KINDS.LOCAL_LLM, 'guild.localLlm', syncStartButton),
    el('div', { class: 'guild-actions' }, [startBtn]),
    statusEl,
    el('section', { class: 'guild-activity-section' }, [
      el('h3', { text: t('guild.activity') }),
      activityEl,
    ]),
    el('section', { class: 'guild-plan-section' }, [
      el('h3', { text: t('guild.workPlan') }),
      planEl,
    ]),
    studioEl,
    el('section', { class: 'guild-bus-section' }, [
      el('h3', { text: t('guild.bus') }),
      busEl,
    ]),
    el('section', { class: 'guild-roster-section' }, [
      el('h3', { text: t('guild.roster') }),
      rosterEl,
    ]),
    el('section', { class: 'guild-pipeline' }, [
      el('h3', { text: t('guild.pipeline') }),
      stepsEl,
    ]),
    el('section', { class: 'guild-output' }, [
      el('h3', { text: t('guild.artifact') }),
      artifactEl,
    ]),
  ]);
}