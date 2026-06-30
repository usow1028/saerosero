import { t } from '../i18n/index.js';
import { getActiveProfile } from '../services/ProfileService.js';
import { createBrandLogo } from './BrandLogo.js';
import { icon } from './icons.js';
import { el } from './helpers.js';

export function createNav(active, navigate) {
  const profile = getActiveProfile();
  const nav = el('header', { class: 'top-nav' }, [
    createBrandLogo({ asLink: true, onClick: () => navigate('/') }),
    el('nav', { class: 'nav-links' }, [
      ['/', t('nav.home')],
      ['/browse', t('nav.browse')],
      ['/search', t('nav.search')],
      ['/mylist', t('nav.mylist')],
    ].map(([path, label]) => el('a', {
      href: `#${path}`,
      class: active === path ? 'active' : '',
      text: label,
      onclick: (e) => { e.preventDefault(); navigate(path); },
    }))),
    el('div', { class: 'nav-actions' }, [
      el('button', { class: 'icon-btn', type: 'button', title: t('nav.search'), onclick: () => navigate('/search') }, [icon('search')]),
      el('button', {
        class: 'profile-pill',
        type: 'button',
        onclick: () => navigate('/profiles'),
      }, [
        profile ? el('span', { class: 'avatar-dot', style: `--av-hue:${profile.hue ?? 200}`, text: profile.initial }) : icon('profile', 'icon'),
        el('span', { class: 'profile-pill-label', text: profile ? profile.name : t('actions.profiles') }),
      ]),
      el('button', { class: 'icon-btn', type: 'button', title: t('actions.settings'), onclick: () => navigate('/settings') }, [icon('settings')]),
    ]),
  ]);
  return nav;
}