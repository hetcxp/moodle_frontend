import { MoodleApi } from './moodle-api.js';
import { AuthService } from './auth.js';

export const CertService = {
  /**
   * Obtiene todos los customcerts de un curso.
   * Retorna array con metadatos (nombre, intro, coursemodule, id, etc.)
   */
  async getCertsByCourses(courseId) {
    const result = await MoodleApi.callWithFallback('mod_customcert_get_customcerts_by_courses', {
      'courseids[0]': courseId
    });
    return result?.customcerts || [];
  },

  async getCertsByCoures(courseId) {
    return this.getCertsByCourses(courseId);
  },

  /**
   * Obtiene los issuances (certificados emitidos) del usuario actual para un customcert.
   * @param {number} certId - ID interno del customcert (mod.instance)
   */
  async getIssuances(certId) {
    const user = AuthService.getUser();
    if (!user) return [];
    try {
      const result = await MoodleApi.call('mod_customcert_get_issuances', {
        templateid: certId
      });
      return result?.issues || [];
    } catch (e) {
      console.error('CertService.getIssuances failed', e);
      return [];
    }
  },

  /**
   * Intenta descargar el PDF del certificado directamente via fetch+blob.
   * Si falla, abre la URL con autologin en nueva pestaña como fallback.
   * @param {object} mod - Objeto del módulo (necesita mod.id y mod.url)
   */
  async downloadPdf(mod) {
    const token = AuthService.getToken();
    const moodleBase = mod.url ? mod.url.split('/mod/')[0] : import.meta.env.VITE_MOODLE_URL;
    const downloadUrl = `${moodleBase}/mod/customcert/view.php?id=${mod.id}&downloadown=1&token=${token}`;

    try {
      const response = await fetch(downloadUrl);
      const contentType = response.headers.get('content-type') || '';

      if (response.ok && contentType.includes('pdf')) {
        const blob = await response.blob();
        const objectUrl = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = objectUrl;
        a.download = `${mod.name || 'certificado'}.pdf`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(objectUrl);
        return;
      }
    } catch (e) {
      console.warn('CertService.downloadPdf fetch failed, falling back to autologin', e);
    }

    // Fallback: autologin en nueva pestaña
    const fallbackUrl = `${moodleBase}/mod/customcert/view.php?id=${mod.id}&downloadown=1`;
    const autologinUrl = await MoodleApi.getAutoLoginUrl(fallbackUrl);
    window.open(autologinUrl, '_blank');
  }
};
