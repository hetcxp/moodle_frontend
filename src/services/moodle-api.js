import { API_CONFIG } from '../config/api.js';
import { AuthService } from './auth.js';

export const MoodleApi = {
  /**
   * Ejecuta una llamada a la API REST de Moodle usando POST.
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
   * Ejecuta una llamada con fallback al admin token si el token de usuario falla.
   */
  async callWithFallback(wsfunction, params = {}) {
    const userToken = AuthService.getToken();
    if (userToken) {
      try {
        const result = await this.call(wsfunction, params, userToken);
        if (result !== null && result !== undefined) {
          return result;
        }
      } catch (e) {
        // Fallback silencioso a admin token
      }
    }

    const adminToken = import.meta.env.VITE_MOODLE_ADMIN_TOKEN;
    if (adminToken && adminToken !== userToken) {
      try {
        return await this.call(wsfunction, params, adminToken);
      } catch (e) {
        console.warn(`Admin fallback for ${wsfunction} failed:`, e);
      }
    }

    return null;
  },

  /**
   * Genera la URL con autologin para Moodle.
   */
  async getAutoLoginUrl(targetUrl) {
    try {
      const result = await this.call('local_headless_get_autologin_key', {});

      if (result && result.key && result.autologinurl) {
        const finalUrl = new URL(result.autologinurl);
        const user = AuthService.getUser();
        if (user) {
          finalUrl.searchParams.append('userid', user.userid);
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
