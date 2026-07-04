/** goal-deliverable: studio-guild */
import { titleName } from '../services/CatalogService.js';
import { toggleMyList, getMyList, getWatchState } from '../services/ProgressService.js';
import {
  toggleLike, isLiked, getLikeCount, getComments, addComment,
} from '../services/EngagementService.js';
import { getLocale, t } from '../i18n/index.js';
import { createPosterMedia } from './poster.js';
import { playButton } from './actions.js';
import { icon } from './icons.js';
import { el } from './helpers.js';
import { createGuildWorkspace } from './guildWorkspace.js';

export function openTitleStudioPanel(title, navigate, onClose) {
  const locale = getLocale();
  const backdrop = el('div', { class: 'studio-panel-backdrop guild-panel-backdrop' });
  const panel = el('div', {
    class: 'studio-panel guild-panel',
    'data-studio-title-id': title.id,
  });

  const close = () => {
    backdrop.classList.add('is-closing');
    setTimeout(() => { backdrop.remove(); onClose?.(); }, 280);
  };

  backdrop.addEventListener('click', (e) => { if (e.target === backdrop) close(); });

  const posterWrap = el('div', { class: 'studio-panel__poster' });
  posterWrap.append(createPosterMedia(title, { animate: false }));

  const likeBtn = el('button', { class: 'studio-action-btn', type: 'button' });
  const syncLike = () => {
    const liked = isLiked(title.id);
    likeBtn.classList.toggle('is-active', liked);
    likeBtn.replaceChildren(
      icon('heart', 'icon'),
      el('span', { text: String(getLikeCount(title.id)) }),
    );
  };
  syncLike();
  likeBtn.onclick = () => { toggleLike(title.id); syncLike(); };

  const listBtn = el('button', { class: 'studio-action-btn', type: 'button' });
  const syncList = () => {
    const on = getMyList().includes(title.id);
    listBtn.replaceChildren(icon('list', 'icon'), el('span', { text: on ? t('actions.removeList') : t('actions.addList') }));
  };
  syncList();
  listBtn.onclick = () => { toggleMyList(title.id); syncList(); };

  const saved = getWatchState(title.id, 1);
  const actions = el('div', { class: 'studio-panel__actions' }, [
    title.status === 'playable'
      ? playButton(saved ? t('actions.resume') : t('actions.playFull'), () => {
        close();
        navigate(`/watch/${title.id}/1`);
      })
      : el('button', { class: 'btn btn-secondary', type: 'button', text: t('actions.notify'), onclick: () => {} }),
    likeBtn,
    listBtn,
    el('button', {
      class: 'studio-action-btn',
      type: 'button',
      onclick: () => { close(); navigate(`/title/${title.id}`); },
    }, [icon('info', 'icon'), el('span', { text: t('feed.fullDetail') })]),
  ]);

  const commentList = el('div', { class: 'studio-comments__list' });
  const renderComments = () => {
    const comments = getComments(title.id);
    commentList.replaceChildren(
      ...(comments.length
        ? comments.map((c) => el('div', { class: 'studio-comment' }, [
          el('p', { text: c.text }),
          el('time', { text: new Date(c.at).toLocaleDateString(locale) }),
        ]))
        : [el('p', { class: 'studio-comments__empty', text: t('feed.noComments') })]),
    );
  };
  renderComments();

  const commentInput = el('input', {
    class: 'studio-comments__input',
    type: 'text',
    placeholder: t('feed.commentPlaceholder'),
    maxlength: '280',
  });
  const commentForm = el('form', { class: 'studio-comments__form', onsubmit: (e) => {
    e.preventDefault();
    addComment(title.id, commentInput.value);
    commentInput.value = '';
    renderComments();
  } }, [
    commentInput,
    el('button', { class: 'btn btn-primary', type: 'submit', text: t('feed.commentPost') }),
  ]);

  panel.append(
    el('header', { class: 'studio-panel__head' }, [
      el('button', { class: 'studio-panel__close', type: 'button', 'aria-label': t('actions.back'), onclick: close }, [icon('chevronL')]),
      el('span', { class: 'studio-panel__badge', text: t('feed.studio') }),
    ]),
    el('div', { class: 'studio-panel__body' }, [
      posterWrap,
      el('div', { class: 'studio-panel__meta' }, [
        el('span', { class: 'chip', text: t(`genre.${title.genre}`) }),
        el('span', { class: 'chip chip-muted', text: t(`status.${title.status}`) }),
        el('h1', { text: titleName(title, locale) }),
        el('p', { class: 'studio-panel__logline', text: title.logline?.[locale] ?? title.logline?.en ?? '' }),
        title.interactive ? el('p', { class: 'studio-panel__tag', text: t('feed.interactive') }) : null,
        actions,
        createGuildWorkspace(title),
        el('section', { class: 'studio-comments' }, [
          el('h3', { text: t('feed.comments') }),
          commentList,
          commentForm,
        ]),
      ]),
    ]),
  );

  backdrop.append(panel);
  document.body.append(backdrop);
  requestAnimationFrame(() => backdrop.classList.add('is-open'));

  return { close };
}