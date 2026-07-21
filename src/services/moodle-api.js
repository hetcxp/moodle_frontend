import { API_CONFIG, buildRestUrl } from '../config/api.js';
import { AuthService } from './auth.js';

export const MoodleApi = {
  async call(wsfunction, params = {}, customToken = null) {
    const token = customToken || AuthService.getToken();
    if (!token) throw new Error('Not authenticated');

    const url = buildRestUrl(wsfunction, { ...params, wstoken: token });
    
    const res = await fetch(url, { method: 'POST' });
    if (!res.ok) throw new Error('API Request failed');
    
    const data = await res.json();
    if (data.exception) {
      if (data.errorcode === 'invalidtoken') {
        AuthService.logout();
      }
      throw new Error(data.message || 'API Error');
    }
    
    return data;
  },

  async getAutoLoginUrl(targetUrl) {
    try {
      const result = await this.call('local_headless_get_autologin_key', {});

      if (result && result.key && result.autologinurl) {
        const finalUrl = new URL(result.autologinurl);
        // The API returns the autologin url. We need to append the key, userid, and urltogo
        const user = AuthService.getUser();
        if (user) {
          finalUrl.searchParams.append('userid', user.userid);
          finalUrl.searchParams.append('key', result.key);
          finalUrl.searchParams.append('urltogo', targetUrl);
          return finalUrl.toString();
        }
      }
    } catch (e) {
      console.error('Autologin key fetch failed', e);
    }
    return targetUrl;
  }
};
