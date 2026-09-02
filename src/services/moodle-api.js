// @ts-check
import { API_CONFIG } from '../config/api.js';
import { AuthService } from './auth.js';

/**
 * @typedef {Object} AutoLoginKeyResponse
 * @property {string} [key]
 * @property {string} [autologinurl]
 */

export const MoodleApi = {
  /**
   * Ejecuta una llamada a la API REST de Moodle usando POST.
   *
   * @template T
   * @param {string} wsfunction - Nombre del web service function de Moodle.
   * @param {Record<string, any>} [params={}] - Parámetros de la consulta.
   * @param {string|null} [customToken=null] - Token específico opcional.
   * @returns {Promise<T>}
   * @throws {Error} Si la petición falla o Moodle retorna una excepción.
   */
  async call(wsfunction, params = {}, customToken = null) {
    const isUsingUserToken = !customToken;
    const token = customToken || AuthService.getToken();
    if (!token) throw new Error('Not authenticated');

    const url = API_CONFIG.baseUrl + API_CONFIG.endpoints.rest;
    
    const bodyParams = new URLSearchParams();
    bodyParams.append('wstoken', token);
    bodyParams.append('wsfunction', wsfunction);
    bodyParams.append('moodlewsrestformat', 'json');
    for (const [key, value] of Object.entries(params)) {
      if (value !== undefined && value !== null) {
        bodyParams.append(key, value);
      }
    }
    
    const res = await fetch(url, { 
      method: 'POST',
      body: bodyParams
    });
    
    if (!res.ok) throw new Error(`API Request failed with status ${res.status}`);
    
    const data = await res.json();
    if (data && (data.exception || data.errorcode)) {
      if (data.errorcode === 'invalidtoken' && isUsingUserToken) {
        AuthService.logout();
      }
      throw new Error(data.message || data.errorcode || 'API Error');
    }
    
    return data;
  },

  /**
   * Ejecuta una llamada tolerante a fallos retornando null en caso de error.
   *
   * @template T
   * @param {string} wsfunction - Nombre del web service function de Moodle.
   * @param {Record<string, any>} [params={}] - Parámetros de la consulta.
   * @returns {Promise<T|null>}
   */
  async callWithFallback(wsfunction, params = {}) {
    try {
      const result = await this.call(wsfunction, params);
      return result ?? null;
    } catch (e) {
      console.warn(`callWithFallback for ${wsfunction} failed:`, e?.message || e);
      return null;
    }
  },

  /**
   * Genera la URL con autologin para Moodle.
   *
   * @param {string} targetUrl - URL destino interna de Moodle.
   * @returns {Promise<string>}
   */
  async getAutoLoginUrl(targetUrl) {
    try {
      const result = await this.call('local_headless_get_autologin_key', {});

      if (result && result.key && result.autologinurl) {
        const finalUrl = new URL(result.autologinurl);
        const user = AuthService.getUser();
        if (user) {
          finalUrl.searchParams.append('userid', String(user.userid));
          finalUrl.searchParams.append('key', result.key);
          finalUrl.searchParams.append('urltogo', targetUrl);
          return finalUrl.toString();
        }
      }
    } catch (e) {
      console.warn('Autologin key fetch failed, fallback to direct url', e);
    }
    return targetUrl;
  }
};

