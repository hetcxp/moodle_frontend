import { AuthService } from '../../../services/auth.js';

/**
 * Renders file resources (mod_resource) supporting inline PDF, images, video, audio and downloads.
 *
 * @param {object} options
 * @param {object} options.mod - Module data
 * @returns {HTMLElement}
 */
export function createResourceRenderer({ mod }) {
  const contentWrapper = document.createElement('div');
  contentWrapper.className = 'resource-content file-content';

  if (mod.contents && mod.contents.length > 0) {
    const file = mod.contents.find(c => c.type === 'file');
    if (file) {
      const token = AuthService.getToken();
      const fileUrl = file.fileurl + (file.fileurl.includes('?') ? '&' : '?') + `token=${token}`;
      
      if (file.mimetype === 'application/pdf') {
        const iframe = document.createElement('iframe');
        iframe.className = 'resource-content pdf-iframe';
        iframe.src = fileUrl;
        iframe.style.width = '100%';
        iframe.style.minHeight = '80vh';
        iframe.style.border = 'none';
        contentWrapper.appendChild(iframe);
      } else if (file.mimetype && file.mimetype.startsWith('image/')) {
        const img = document.createElement('img');
        img.src = fileUrl;
        img.style.maxWidth = '100%';
        img.style.height = 'auto';
        img.style.display = 'block';
        img.style.margin = '0 auto';
        contentWrapper.appendChild(img);
      } else if (file.mimetype && file.mimetype.startsWith('video/')) {
        const video = document.createElement('video');
        video.src = fileUrl;
        video.controls = true;
        video.style.maxWidth = '100%';
        video.style.display = 'block';
        video.style.margin = '0 auto';
        contentWrapper.appendChild(video);
      } else if (file.mimetype && file.mimetype.startsWith('audio/')) {
        const audio = document.createElement('audio');
        audio.src = fileUrl;
        audio.controls = true;
        audio.style.display = 'block';
        audio.style.margin = '2rem auto';
        contentWrapper.appendChild(audio);
      } else {
        contentWrapper.innerHTML = `
          <div style="text-align: center; padding: 2rem;">
            <p style="color: var(--color-text-secondary);">Este archivo no se puede previsualizar directamente.</p>
            <a href="${fileUrl}" target="_blank" rel="noopener" class="btn-primary" style="display:inline-block; margin-top: 1rem; width: auto;">
              Descargar / Abrir ${file.filename}
            </a>
          </div>
        `;
      }
    } else {
      contentWrapper.innerHTML = '<p class="empty-state">No se encontró ningún archivo en este recurso.</p>';
    }
  } else {
    contentWrapper.innerHTML = '<p class="empty-state">Este recurso no tiene contenido disponible.</p>';
  }

  return contentWrapper;
}
