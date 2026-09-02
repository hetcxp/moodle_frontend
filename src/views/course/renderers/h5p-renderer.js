import { CourseService } from '../../../services/courses.js';
import { AuthService } from '../../../services/auth.js';
import { replacePluginfileUrls } from '../../../utils/image.js';
import { sanitizeHtml } from '../../../utils/sanitize.js';

/**
 * Renders an embedded H5P Activity (mod_h5pactivity) with xAPI tracking bridge and async description.
 *
 * @param {object} options
 * @param {object} options.mod - Module data
 * @param {number} options.courseId - Course ID
 * @returns {HTMLElement}
 */
export function createH5pRenderer({ mod, courseId }) {
  const contentWrapper = document.createElement('div');
  contentWrapper.className = 'resource-content h5p-content';

  const moodleBase = mod.url.split('/mod/')[0];
  const embedUrl = `${moodleBase}/local/headless/h5p.php?id=${mod.id}&token=${AuthService.getToken()}`;

  // Fetch introduction asynchronously
  CourseService.getH5pActivityIntro(courseId, mod.id).then(intro => {
    if (intro) {
      const descDiv = document.createElement('div');
      descDiv.className = 'h5p-description';
      descDiv.style.cssText = 'margin-bottom: 1.5rem; padding: 1.5rem; background: var(--color-surface); border-radius: var(--radius-card, 8px); border: 1px solid var(--color-border); line-height: 1.6; color: var(--color-text-primary);';
      descDiv.innerHTML = sanitizeHtml(replacePluginfileUrls(intro));
      contentWrapper.insertBefore(descDiv, iframe);
    }
  });

  const iframe = document.createElement('iframe');
  iframe.className = 'resource-content h5p-iframe';
  iframe.src = embedUrl;
  iframe.style.width = '100%';
  iframe.style.border = 'none';
  iframe.style.minHeight = '500px';

  contentWrapper.appendChild(iframe);
  return contentWrapper;
}
