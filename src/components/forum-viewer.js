import { ForumService } from '../services/forum.js';
import { replacePluginfileUrls } from '../utils/image.js';

/**
 * Renderiza un foro de Moodle de forma nativa.
 * Estados: 'list' | 'thread' | 'new-discussion'
 */
export function createForumViewer({ mod, courseId }) {
  const root = document.createElement('div');
  root.className = 'forum-viewer';

  let forumId = mod.instance || null;
  let state = 'list';
  let currentDiscussion = null;

  // ── helpers ────────────────────────────────────────────────────────────────

  function initials(name = '') {
    return name.split(' ').slice(0, 2).map(w => w[0] || '').join('').toUpperCase() || '?';
  }

  function relativeTime(ts) {
    const diff = Date.now() / 1000 - ts;
    if (diff < 60) return 'hace un momento';
    if (diff < 3600) return `hace ${Math.floor(diff / 60)} min`;
    if (diff < 86400) return `hace ${Math.floor(diff / 3600)} h`;
    return new Intl.DateTimeFormat('es', { day: 'numeric', month: 'short', year: 'numeric' }).format(new Date(ts * 1000));
  }

  function showError(msg) {
    root.innerHTML = `<p class="forum-error">${msg}</p>`;
  }

  function setLoading() {
    root.innerHTML = '<div class="forum-loading"><div class="spinner"></div></div>';
  }

  // ── ESTADO: list ───────────────────────────────────────────────────────────

  async function renderList() {
    state = 'list';
    setLoading();

    if (!forumId) {
      forumId = await ForumService.getForumId(courseId, mod.id, mod.instance);
    }
    if (!forumId) {
      showError('No se pudo obtener el foro.');
      return;
    }

    const { discussions } = await ForumService.getDiscussions(forumId);

    root.innerHTML = '';

    // Toolbar
    const toolbar = document.createElement('div');
    toolbar.className = 'forum-toolbar';

    const title = document.createElement('span');
    title.className = 'forum-toolbar-title';
    title.textContent = `${discussions.length} discusion${discussions.length !== 1 ? 'es' : ''}`;
    toolbar.appendChild(title);

    const newBtn = document.createElement('button');
    newBtn.className = 'btn-primary forum-new-btn';
    newBtn.innerHTML = '＋ Nueva discusión';
    newBtn.onclick = () => renderNewDiscussion();
    toolbar.appendChild(newBtn);
    root.appendChild(toolbar);

    if (discussions.length === 0) {
      const empty = document.createElement('p');
      empty.className = 'forum-empty';
      empty.textContent = 'Aún no hay discusiones en este foro. ¡Sé el primero!';
      root.appendChild(empty);
      return;
    }

    const list = document.createElement('ul');
    list.className = 'forum-discussion-list';

    discussions.forEach(disc => {
      const li = document.createElement('li');
      li.className = 'forum-discussion-item';

      const avatar = document.createElement('div');
      avatar.className = 'forum-avatar';
      avatar.textContent = initials(disc.userfullname || disc.author || '');

      const body = document.createElement('div');
      body.className = 'forum-discussion-body';

      const subject = document.createElement('div');
      subject.className = 'forum-discussion-subject';
      subject.textContent = disc.name || disc.subject || '(Sin título)';

      const meta = document.createElement('div');
      meta.className = 'forum-discussion-meta';
      meta.innerHTML = `
        <span class="forum-author">${disc.userfullname || disc.author || 'Anónimo'}</span>
        <span class="forum-dot">·</span>
        <span class="forum-date">${relativeTime(disc.timemodified || disc.timecreated || 0)}</span>
        <span class="forum-dot">·</span>
        <span class="forum-replies">💬 ${disc.numreplies ?? 0} respuesta${disc.numreplies !== 1 ? 's' : ''}</span>
      `;

      body.appendChild(subject);
      body.appendChild(meta);

      li.appendChild(avatar);
      li.appendChild(body);
      li.onclick = () => renderThread(disc);
      list.appendChild(li);
    });

    root.appendChild(list);
  }

  // ── ESTADO: thread ─────────────────────────────────────────────────────────

  async function renderThread(disc) {
    state = 'thread';
    currentDiscussion = disc;
    setLoading();

    const posts = await ForumService.getPosts(disc.discussion || disc.id);
    const postMap = {};
    posts.forEach(p => { postMap[p.id] = p; });

    root.innerHTML = '';

    // Back button
    const backBtn = document.createElement('button');
    backBtn.className = 'btn-secondary forum-back-btn';
    backBtn.innerHTML = '← Volver al foro';
    backBtn.onclick = () => renderList();
    root.appendChild(backBtn);

    // Thread header
    const header = document.createElement('div');
    header.className = 'forum-thread-header';
    header.innerHTML = `
      <h3 class="forum-thread-title">${disc.name || disc.subject || '(Sin título)'}</h3>
      <p class="forum-thread-meta">
        Iniciado por <strong>${disc.userfullname || disc.author || 'Anónimo'}</strong>
        · ${relativeTime(disc.timecreated || disc.timemodified || 0)}
      </p>
    `;
    root.appendChild(header);

    // Posts
    const postsContainer = document.createElement('div');
    postsContainer.className = 'forum-posts-container';

    function renderPost(post, depth = 0) {
      const postEl = document.createElement('div');
      postEl.className = `forum-post${depth > 0 ? ' forum-post--reply' : ''}`;
      if (depth > 1) postEl.style.marginLeft = `${Math.min(depth, 2) * 1.5}rem`;

      const avatar = document.createElement('div');
      avatar.className = 'forum-avatar forum-avatar--sm';
      avatar.textContent = initials(post.author?.fullname || post.userfullname || '');

      const inner = document.createElement('div');
      inner.className = 'forum-post-inner';

      const postMeta = document.createElement('div');
      postMeta.className = 'forum-post-meta';
      postMeta.innerHTML = `
        <span class="forum-author">${post.author?.fullname || post.userfullname || 'Anónimo'}</span>
        <span class="forum-dot">·</span>
        <span class="forum-date">${relativeTime(post.timecreated || 0)}</span>
      `;

      const postBody = document.createElement('div');
      postBody.className = 'forum-post-body';
      postBody.innerHTML = replacePluginfileUrls(post.message || '');

      // Reply button
      const replyBtn = document.createElement('button');
      replyBtn.className = 'forum-reply-btn';
      replyBtn.textContent = 'Responder';
      replyBtn.onclick = () => {
        // Toggle inline reply form
        const existing = postEl.querySelector('.forum-reply-form');
        if (existing) { existing.remove(); return; }
        postEl.appendChild(createReplyForm(disc.discussion || disc.id, post.id, postsContainer, disc));
      };

      inner.appendChild(postMeta);
      inner.appendChild(postBody);
      inner.appendChild(replyBtn);

      postEl.appendChild(avatar);
      postEl.appendChild(inner);
      postsContainer.appendChild(postEl);

      // Render children recursively (max visual depth 2)
      posts.filter(p => p.parent == post.id).forEach(child => renderPost(child, depth + 1));
    }

    // Root posts (parent === 0 or parent not in postMap = root)
    const rootPosts = posts.filter(p => !p.parent || !postMap[p.parent]);
    if (rootPosts.length === 0 && posts.length > 0) {
      // fallback: render all flat
      posts.forEach(p => renderPost(p, 0));
    } else {
      rootPosts.forEach(p => renderPost(p, 0));
    }

    root.appendChild(postsContainer);

    // Main reply form (reply to root post)
    const rootPost = rootPosts[0] || posts[0];
    if (rootPost) {
      const mainReply = document.createElement('div');
      mainReply.className = 'forum-main-reply';
      const mainReplyLabel = document.createElement('p');
      mainReplyLabel.className = 'forum-reply-label';
      mainReplyLabel.textContent = 'Tu respuesta';
      mainReply.appendChild(mainReplyLabel);
      mainReply.appendChild(createReplyForm(disc.discussion || disc.id, rootPost.id, postsContainer, disc, true));
      root.appendChild(mainReply);
    }
  }

  // ── Reply form ─────────────────────────────────────────────────────────────

  function createReplyForm(discussionId, parentPostId, postsContainer, disc, isMain = false) {
    const form = document.createElement('div');
    form.className = `forum-reply-form${isMain ? ' forum-reply-form--main' : ''}`;

    const textarea = document.createElement('textarea');
    textarea.className = 'forum-textarea input-control';
    textarea.placeholder = 'Escribe tu respuesta...';
    textarea.rows = 3;

    const actions = document.createElement('div');
    actions.className = 'forum-form-actions';

    if (!isMain) {
      const cancelBtn = document.createElement('button');
      cancelBtn.className = 'btn-secondary forum-cancel-btn';
      cancelBtn.textContent = 'Cancelar';
      cancelBtn.onclick = () => form.remove();
      actions.appendChild(cancelBtn);
    }

    const sendBtn = document.createElement('button');
    sendBtn.className = 'btn-primary forum-send-btn';
    sendBtn.textContent = 'Enviar';
    sendBtn.onclick = async () => {
      const msg = textarea.value.trim();
      if (!msg) return;
      sendBtn.disabled = true;
      sendBtn.textContent = 'Enviando...';
      try {
        await ForumService.addPost(discussionId, parentPostId, msg);
        textarea.value = '';
        // Reload thread
        await renderThread(disc);
      } catch (e) {
        sendBtn.disabled = false;
        sendBtn.textContent = 'Enviar';
        const errMsg = e.message || 'Error al enviar';
        const errDiv = form.querySelector('.forum-form-error');
        if (errDiv) { errDiv.textContent = errMsg; } else {
          const err = document.createElement('p');
          err.className = 'forum-form-error';
          err.textContent = errMsg;
          form.appendChild(err);
        }
      }
    };

    actions.appendChild(sendBtn);
    form.appendChild(textarea);
    form.appendChild(actions);
    return form;
  }

  // ── ESTADO: new-discussion ─────────────────────────────────────────────────

  function renderNewDiscussion() {
    state = 'new-discussion';
    root.innerHTML = '';

    const backBtn = document.createElement('button');
    backBtn.className = 'btn-secondary forum-back-btn';
    backBtn.innerHTML = '← Volver al foro';
    backBtn.onclick = () => renderList();
    root.appendChild(backBtn);

    const formCard = document.createElement('div');
    formCard.className = 'forum-new-discussion-form';

    const formTitle = document.createElement('h3');
    formTitle.className = 'forum-form-title';
    formTitle.textContent = 'Nueva discusión';
    formCard.appendChild(formTitle);

    // Subject
    const subjectGroup = document.createElement('div');
    subjectGroup.className = 'input-group';
    const subjectLabel = document.createElement('label');
    subjectLabel.textContent = 'Asunto';
    const subjectInput = document.createElement('input');
    subjectInput.className = 'input-control';
    subjectInput.type = 'text';
    subjectInput.placeholder = 'Escribe el título del tema...';
    subjectGroup.appendChild(subjectLabel);
    subjectGroup.appendChild(subjectInput);
    formCard.appendChild(subjectGroup);

    // Message
    const msgGroup = document.createElement('div');
    msgGroup.className = 'input-group';
    const msgLabel = document.createElement('label');
    msgLabel.textContent = 'Mensaje';
    const msgTextarea = document.createElement('textarea');
    msgTextarea.className = 'forum-textarea input-control';
    msgTextarea.placeholder = 'Escribe tu mensaje...';
    msgTextarea.rows = 6;
    msgGroup.appendChild(msgLabel);
    msgGroup.appendChild(msgTextarea);
    formCard.appendChild(msgGroup);

    // Error placeholder
    const errorEl = document.createElement('p');
    errorEl.className = 'forum-form-error';
    errorEl.style.display = 'none';
    formCard.appendChild(errorEl);

    // Actions
    const actions = document.createElement('div');
    actions.className = 'forum-form-actions';

    const cancelBtn = document.createElement('button');
    cancelBtn.className = 'btn-secondary forum-cancel-btn';
    cancelBtn.textContent = 'Cancelar';
    cancelBtn.onclick = () => renderList();
    actions.appendChild(cancelBtn);

    const publishBtn = document.createElement('button');
    publishBtn.className = 'btn-primary forum-send-btn';
    publishBtn.textContent = 'Publicar';
    publishBtn.onclick = async () => {
      const subject = subjectInput.value.trim();
      const message = msgTextarea.value.trim();
      if (!subject || !message) {
        errorEl.textContent = 'Asunto y mensaje son obligatorios.';
        errorEl.style.display = 'block';
        return;
      }
      publishBtn.disabled = true;
      publishBtn.textContent = 'Publicando...';
      try {
        await ForumService.addDiscussion(forumId, subject, message);
        await renderList();
      } catch (e) {
        publishBtn.disabled = false;
        publishBtn.textContent = 'Publicar';
        errorEl.textContent = e.message || 'Error al publicar';
        errorEl.style.display = 'block';
      }
    };
    actions.appendChild(publishBtn);
    formCard.appendChild(actions);

    root.appendChild(formCard);
  }

  // ── init ───────────────────────────────────────────────────────────────────
  renderList();

  return root;
}
