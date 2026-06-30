import { t } from '../i18n/index.js';
import { getActiveProfile } from '../services/ProfileService.js';
import { el } from './helpers.js';

export function createNav(active, navigate) {
  const profile = getActiveProfile();
  const nav = el('header', { class: 'top-nav' }, [
    el('a', { class: 'logo', href: '#/', onclick: (e) => { e.preventDefault(); navigate('/'); } }, [
      el('span', { class: 'logo-saero', text: 'Saero' }),
      el('span', { class: 'logo-sero', text: 'Sero' }),
    ]),
    el('nav', { class: 'nav-links' }, [
      ['/', 'home', t('nav.home')],
      ['/browse', 'browse', t('nav.browse')],
      ['/search', 'search', t('nav.search')],
      ['/mylist', 'mylist', t('nav.mylist')],
    ].map(([path, , label]) => el('a', {
      href: `#${path}`,
      class: active === path ? 'active' : '',
      text: label,
      onclick: (e) => { e.preventDefault(); navigate(path); },
    }))),
    el('div', { class: 'nav-actions' }, [
      el('button', { class: 'btn btn-ghost', text: '🔍', onclick: () => navigate('/search') }),
      el('button', {
        class: 'btn btn-ghost',
        text: profile ? `${profile.avatar} ${profile.name}` : t('actions.profiles'),
        onclick: () => navigate('/profiles'),
      }),
      el('button', { class: 'btn btn-ghost', text: '⚙', onclick: () => navigate('/settings') }),
    ]),
  ]);
  return nav;
}