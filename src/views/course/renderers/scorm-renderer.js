import { CourseService } from '../../../services/courses.js';
import { replacePluginfileUrls } from '../../../utils/image.js';
import { sanitizeHtml } from '../../../utils/sanitize.js';

/**
 * Renders an interactive Moodle SCORM activity with attempt tracking and autologin player popup.
 *
 * @param {object} options
 * @param {object} options.mod - Module data
 * @param {number} options.courseId - Course ID
 * @param {Function} options.onCompletionRefresh - Callback when popup is closed to reload completion status
 * @returns {HTMLElement}
 */
export function createScormRenderer({ mod, courseId, onCompletionRefresh }) {
  const contentWrapper = document.createElement('div');
  contentWrapper.className = 'resource-content scorm-content';

  let scormHtml = '<div class="scorm-container" style="padding: 2rem; background: var(--color-surface); border: 1px solid var(--color-border); border-radius: var(--radius-card); margin-bottom: 2rem; text-align: center;">';
  
  if (mod.description) {
    scormHtml += `
      <div class="scorm-description" style="margin-bottom: 2rem; text-align: left;">
        ${sanitizeHtml(replacePluginfileUrls(mod.description))}
      </div>
    `;
  }
  
  contentWrapper.innerHTML = scormHtml + '<p style="color: var(--color-text-secondary);">Cargando datos del SCORM...</p></div>';
  
  const baseUrl = mod.url.split('/view.php')[0];
  const basePlayerUrl = `${baseUrl}/player.php?a=${mod.instance}&scoid=0&display=popup&mode=normal`;

  Promise.all([
    CourseService.getScormAttemptCount(mod.instance),
    CourseService.getAutoLoginUrl(basePlayerUrl)
  ]).then(([attempts]) => {
    let attemptsHtml = '';
    if (attempts !== null) {
      attemptsHtml = `
        <div class="scorm-attempts" style="margin-bottom: 2rem; padding: 1rem; background: var(--color-bg-hover, rgba(0,0,0,0.03)); border-radius: 6px; display: inline-block; color: var(--color-text-primary);">
          <strong>Intentos realizados:</strong> ${attempts}
        </div>
      `;
    }
    
    const finalHtml = scormHtml + attemptsHtml + `
      <div class="scorm-actions">
        <button id="scorm-open-btn" class="btn-primary" style="display: inline-block; cursor: pointer; width: auto; min-width: 200px;">
          Abrir actividad SCORM
        </button>
        <p style="margin-top: 1rem; font-size: 0.9em; color: var(--color-text-secondary);">
          La actividad se abrirá en una nueva pestaña autenticada.
        </p>
      </div>
    </div>`;
    
    contentWrapper.innerHTML = finalHtml;

    const openBtn = contentWrapper.querySelector('#scorm-open-btn');
    if (openBtn) {
      openBtn.addEventListener('click', async () => {
        const freshUrl = await CourseService.getAutoLoginUrl(basePlayerUrl);
        const popup = window.open(freshUrl, '_blank');
        if (!popup) return;
        const timer = setInterval(async () => {
          if (popup.closed) {
            clearInterval(timer);
            if (typeof onCompletionRefresh === 'function') {
              onCompletionRefresh();
            }
          }
        }, 1000);
      });
    }
  }).catch((err) => {
    console.error('Error initializing SCORM renderer:', err);
    contentWrapper.innerHTML = '<p class="empty-state">No se pudo cargar la actividad SCORM.</p>';
  });

  return contentWrapper;
}
