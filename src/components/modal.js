export function createModal(titleText, contentElement) {
  const overlay = document.createElement('div');
  overlay.className = 'modal-overlay';
  overlay.setAttribute('role', 'dialog');
  overlay.setAttribute('aria-modal', 'true');

  const modal = document.createElement('div');
  modal.className = 'modal-content';

  const header = document.createElement('div');
  header.className = 'modal-header';

  const titleId = `modal-title-${Date.now()}`;
  const title = document.createElement('h3');
  title.id = titleId;
  title.textContent = titleText;
  overlay.setAttribute('aria-labelledby', titleId);

  const close = () => {
    document.removeEventListener('keydown', onKeyDown);
    if (overlay.parentNode) {
      overlay.remove();
    }
  };

  const onKeyDown = (e) => {
    if (e.key === 'Escape') {
      close();
    }
  };
  document.addEventListener('keydown', onKeyDown);

  const closeBtn = document.createElement('button');
  closeBtn.className = 'modal-close';
  closeBtn.type = 'button';
  closeBtn.setAttribute('aria-label', 'Cerrar modal');
  closeBtn.innerHTML = '&times;';
  closeBtn.onclick = close;

  header.appendChild(title);
  header.appendChild(closeBtn);

  const body = document.createElement('div');
  body.className = 'modal-body';
  body.appendChild(contentElement);

  modal.appendChild(header);
  modal.appendChild(body);
  overlay.appendChild(modal);

  // Close when clicking outside
  overlay.addEventListener('click', (e) => {
    if (e.target === overlay) {
      close();
    }
  });

  overlay.close = close;
  return overlay;
}
