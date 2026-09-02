import { CourseService } from '../../../services/courses.js';
import { AuthService } from '../../../services/auth.js';
import { replacePluginfileUrls } from '../../../utils/image.js';
import { sanitizeHtml } from '../../../utils/sanitize.js';

/**
 * Renders an Assignment activity (mod_assign) with instructions, attachments and submission button.
 *
 * @param {object} options
 * @param {object} options.mod - Module data
 * @param {number} options.courseId - Course ID
 * @returns {Promise<HTMLElement>}
 */
export async function createAssignRenderer({ mod, courseId }) {
  const contentWrapper = document.createElement('div');
  contentWrapper.className = 'resource-content assign-content';

  const assignData = await CourseService.getAssignmentData(courseId, mod.id);

  // 1. Description
  const description = (assignData && assignData.intro) || mod.description || mod.intro || '';
  if (description) {
    const descDiv = document.createElement('div');
    descDiv.className = 'assign-description';
    descDiv.style.cssText = 'margin-bottom: 1.5rem; padding: 1.5rem; background: var(--color-surface); border-radius: var(--radius-card, 8px); border: 1px solid var(--color-border); line-height: 1.7; color: var(--color-text-primary);';
    descDiv.innerHTML = sanitizeHtml(replacePluginfileUrls(description));
    contentWrapper.appendChild(descDiv);
  }

  // 2. Attachments
  const wsFiles = [
    ...(assignData?.introfiles || []),
    ...(assignData?.introattachments || []),
  ];
  const contentsFiles = (mod.contents || []).filter(c => c.type === 'file');
  const seenNames = new Set();
  const allFiles = [...wsFiles, ...contentsFiles].filter(f => {
    if (seenNames.has(f.filename)) return false;
    seenNames.add(f.filename);
    return true;
  });

  if (allFiles.length > 0) {
    const attachTitle = document.createElement('h3');
    attachTitle.textContent = 'Archivos adjuntos';
    attachTitle.style.cssText = 'font-size: 1rem; font-weight: 600; margin-bottom: 0.75rem; color: var(--color-text-primary);';
    contentWrapper.appendChild(attachTitle);

    const fileList = document.createElement('ul');
    fileList.style.cssText = 'list-style: none; padding: 0; margin-bottom: 1.5rem; display: flex; flex-direction: column; gap: 0.5rem;';
    allFiles.forEach(f => {
      const li = document.createElement('li');
      const token = AuthService.getToken();
      const fileUrl = f.fileurl + (f.fileurl.includes('?') ? '&' : '?') + `token=${token}`;
      li.innerHTML = `<a href="${fileUrl}" target="_blank" rel="noopener" style="display:inline-flex;align-items:center;gap:0.5rem;padding:0.5rem 1rem;background:var(--color-surface);border:1px solid var(--color-border);border-radius:6px;text-decoration:none;color:var(--color-primary);font-size:0.875rem;font-weight:500;">📎 ${f.filename}</a>`;
      fileList.appendChild(li);
    });
    contentWrapper.appendChild(fileList);
  }

  // 3. Submit Action Button
  const statusDiv = document.createElement('div');
  statusDiv.style.cssText = 'margin-top: 0.5rem;';
  const submitBtn = document.createElement('button');
  submitBtn.className = 'btn-primary';
  submitBtn.style.cssText = 'width: auto; min-width: 180px;';
  submitBtn.textContent = 'Ir a enviar tarea →';
  submitBtn.onclick = async () => {
    submitBtn.disabled = true;
    submitBtn.textContent = 'Abriendo...';
    const url = await CourseService.getAutoLoginUrl(mod.url);
    window.open(url, '_blank');
    submitBtn.disabled = false;
    submitBtn.textContent = 'Ir a enviar tarea →';
  };
  statusDiv.appendChild(submitBtn);
  contentWrapper.appendChild(statusDiv);

  return contentWrapper;
}
