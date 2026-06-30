import { listProfiles, createProfile, setActiveProfileId, getActiveProfileId } from '../services/ProfileService.js';
import { t } from '../i18n/index.js';
import { el } from '../ui/helpers.js';

export function renderProfiles(container, navigate) {
  const active = getActiveProfileId();
  const grid = el('div', { class: 'profile-grid' });

  for (const p of listProfiles()) {
    const card = el('div', { class: `profile-card${active === p.id ? ' active' : ''}` });
    card.append(
      el('div', { class: 'profile-avatar', text: p.avatar }),
      el('span', { text: p.name }),
    );
    card.onclick = () => { setActiveProfileId(p.id); navigate('/'); };
    grid.append(card);
  }

  const add = el('div', { class: 'profile-card' }, [
    el('div', { class: 'profile-avatar', text: '+' }),
    el('span', { text: t('profile.add') }),
  ]);
  add.onclick = () => {
    const name = prompt('Profile name');
    if (name) { createProfile(name); renderProfiles(container, navigate); }
  };
  grid.append(add);

  const guest = el('button', { class: 'btn', text: t('profile.guest'), style: 'margin:1rem auto;display:block;' });
  guest.onclick = () => { setActiveProfileId(null); navigate('/'); };

  container.replaceChildren(el('h1', { text: t('profile.title'), style: 'text-align:center;margin-top:2rem;' }), grid, guest);
}