import { CertService } from '../services/cert.js';
import { sanitizeHtml } from '../utils/sanitize.js';

/**
 * Renderiza la vista nativa de un módulo mod_customcert.
 *
 * @param {object} options
 * @param {object} options.mod        - Objeto módulo de core_course_get_contents
 * @param {object|null} options.certData   - Metadatos del cert (de getCertsByCoures)
 * @param {Array}  options.issuances  - Issuances del usuario (de getIssuances)
 * @param {number} options.courseId
 */
export function createCertViewer({ mod, certData, issuances, courseId }) {
  const hasIssuance = Array.isArray(issuances) && issuances.length > 0;

  const wrapper = document.createElement('div');
  wrapper.className = 'cert-viewer';
  wrapper.style.cssText = `
    display: flex;
    flex-direction: column;
    gap: 1.5rem;
    padding: 2rem;
    background: var(--color-surface, #1e1e2e);
    border: 1px solid var(--color-border, #333);
    border-radius: 12px;
    max-width: 640px;
    margin: 0 auto;
  `;

  // --- Header ---
  const header = document.createElement('div');
  header.style.cssText = 'display:flex; align-items:center; gap:1rem;';

  const iconWrap = document.createElement('div');
  iconWrap.style.cssText = `
    width: 56px; height: 56px;
    background: var(--color-primary-alpha, rgba(99,102,241,0.15));
    border-radius: 12px;
    display: flex; align-items:center; justify-content:center;
    font-size: 1.75rem; flex-shrink:0;
  `;
  iconWrap.textContent = '🎓';

  const titleBlock = document.createElement('div');
  const title = document.createElement('h3');
  title.textContent = mod.name;
  title.style.cssText = 'margin:0; font-size:1.2rem; font-weight:600; color: var(--color-text, #fff);';

  const subtitle = document.createElement('p');
  subtitle.textContent = 'Certificado de finalización';
  subtitle.style.cssText = 'margin:0.25rem 0 0; font-size:0.85rem; color: var(--color-text-muted, #888);';

  titleBlock.appendChild(title);
  titleBlock.appendChild(subtitle);
  header.appendChild(iconWrap);
  header.appendChild(titleBlock);
  wrapper.appendChild(header);

  // --- Descripción / intro ---
  if (certData?.intro) {
    const intro = document.createElement('div');
    intro.className = 'cert-intro';
    intro.style.cssText = `
      font-size: 0.9rem;
      color: var(--color-text-muted, #aaa);
      line-height: 1.6;
      padding: 1rem;
      background: var(--color-surface-2, rgba(255,255,255,0.04));
      border-radius: 8px;
      border: 1px solid var(--color-border, #333);
    `;
    intro.innerHTML = sanitizeHtml(certData.intro);
    wrapper.appendChild(intro);
  }

  // --- Status badge ---
  const badge = document.createElement('div');
  badge.style.cssText = `
    display: inline-flex;
    align-items: center;
    gap: 0.5rem;
    padding: 0.5rem 1rem;
    border-radius: 999px;
    font-size: 0.85rem;
    font-weight: 600;
    width: fit-content;
    ${hasIssuance
      ? 'background: rgba(34,197,94,0.15); color: #4ade80; border: 1px solid rgba(34,197,94,0.3);'
      : 'background: rgba(148,163,184,0.1); color: #94a3b8; border: 1px solid rgba(148,163,184,0.2);'
    }
  `;
  badge.innerHTML = hasIssuance
    ? '<span>✅</span><span>Certificado emitido</span>'
    : '<span>⏳</span><span>Aún no emitido</span>';
  wrapper.appendChild(badge);

  // --- Mensaje de requisito pendiente ---
  if (!hasIssuance) {
    const pendingMsg = document.createElement('div');
    pendingMsg.style.cssText = `
      padding: 1rem 1.25rem;
      background: rgba(251,191,36,0.08);
      border: 1px solid rgba(251,191,36,0.25);
      border-radius: 8px;
      font-size: 0.875rem;
      color: #fbbf24;
      line-height: 1.5;
    `;

    // Intentar extraer información de requisito desde certData
    let requisito = null;
    if (certData?.requiredtime && certData.requiredtime > 0) {
      const mins = Math.round(certData.requiredtime / 60);
      requisito = `Debes pasar al menos ${mins} minuto${mins !== 1 ? 's' : ''} en el curso.`;
    }

    pendingMsg.innerHTML = `
      <strong>⚠️ Requisito pendiente</strong><br>
      ${requisito || 'Aún no cumples las condiciones para obtener tu certificado. Completa las actividades requeridas del curso.'}
    `;
    wrapper.appendChild(pendingMsg);
  }

  // --- Acciones ---
  const actions = document.createElement('div');
  actions.style.cssText = 'display:flex; gap:0.75rem; flex-wrap:wrap;';

  // Botón descarga PDF
  const btnDownload = document.createElement('button');
  btnDownload.style.cssText = `
    display: inline-flex;
    align-items: center;
    gap: 0.5rem;
    padding: 0.65rem 1.25rem;
    border-radius: 8px;
    font-size: 0.9rem;
    font-weight: 600;
    cursor: ${hasIssuance ? 'pointer' : 'not-allowed'};
    border: none;
    transition: opacity 0.2s, transform 0.15s;
    ${hasIssuance
      ? 'background: var(--color-primary, #6366f1); color: #fff; opacity: 1;'
      : 'background: var(--color-border, #333); color: var(--color-text-muted, #666); opacity: 0.6;'
    }
  `;
  btnDownload.innerHTML = '<span>⬇</span><span>Descargar PDF</span>';
  btnDownload.disabled = !hasIssuance;
  btnDownload.title = hasIssuance ? 'Descargar tu certificado en PDF' : 'Completa los requisitos del curso para descargar tu certificado';

  if (hasIssuance) {
    btnDownload.addEventListener('mouseenter', () => {
      btnDownload.style.transform = 'translateY(-1px)';
      btnDownload.style.opacity = '0.9';
    });
    btnDownload.addEventListener('mouseleave', () => {
      btnDownload.style.transform = '';
      btnDownload.style.opacity = '1';
    });
    btnDownload.addEventListener('click', async () => {
      btnDownload.disabled = true;
      btnDownload.innerHTML = '<span>⏳</span><span>Descargando…</span>';
      await CertService.downloadPdf(mod);
      btnDownload.disabled = false;
      btnDownload.innerHTML = '<span>⬇</span><span>Descargar PDF</span>';
    });
  }

  actions.appendChild(btnDownload);
  wrapper.appendChild(actions);

  return wrapper;
}
