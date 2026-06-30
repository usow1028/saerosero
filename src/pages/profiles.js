import { listProfiles, createProfile, setActiveProfileId, getActiveProfileId } from '../services/ProfileService.js';
import { t } from '../i18n/index.js';
import { el } from '../ui/helpers.js';

export function renderProfiles(container, navigate) {
  const active = getActiveProfileId();
  const grid = el('div', { class: 'profile-grid' });

  for (const p of listProfiles()) {
    const card = el('button', { class: `profile-card${active === p.id ? ' active' : ''}`, type: 'button' });
    const av = el('div', { class: 'profile-avatar', style: `--av-hue:${p.hue}` });
    av.textContent = p.initial;
    card.append(av, el('span', { class: 'profile-name', text: p.name }));
    card.onclick = () => { setActiveProfileId(p.id); navigate('/'); };
    grid.append(card);
  }

  const add = el('button', { class: 'profile-card profile-card--add', type: 'button' }, [
    el('div', { class: 'profile-avatar profile-avatar--add', text: '+' }),
    el('span', { class: 'profile-name', text: t('profile.add') }),
  ]);
  add.onclick = () => {
    const name = prompt('Profile name');
    if (name) { createProfile(name); renderProfiles(container, navigate); }
  };
  grid.append(add);

  const guest = el('button', { class: 'btn btn-secondary btn-wide', type: 'button', text: t('profile.guest') });
  guest.onclick = () => { setActiveProfileId(null); navigate('/'); };

  container.replaceChildren(
    el('div', { class: 'page-header' }, [
      el('h1', { text: t('profile.title') }),
      el('p', { class: 'page-lead', text: t('brand.tagline') }),
    ]),
    grid,
    guest,
  );
}