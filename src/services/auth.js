import { API_CONFIG } from '../config/api.js';

export const AuthService = {
  getToken() {
    return sessionStorage.getItem('moodle_token');
  },
  
  getUser() {
    const userStr = sessionStorage.getItem('moodle_user');
    return userStr ? JSON.parse(userStr) : null;
  },
  
  isAuthenticated() {
    return !!this.getToken() && !!this.getUser();
  },

  async login(username, password) {
    const tokenUrl = new URL(API_CONFIG.baseUrl + API_CONFIG.endpoints.login, window.location.origin);
    tokenUrl.searchParams.append('username', username);
    tokenUrl.searchParams.append('password', password);
    tokenUrl.searchParams.append('service', API_CONFIG.serviceName);

    const res = await fetch(tokenUrl.toString(), {
      method: 'POST'
    });
    
    if (!res.ok) throw new Error('Network error during login');
    
    const data = await res.json();
    if (data.error) throw new Error(data.error);
    if (!data.token) throw new Error('Invalid credentials');
    
    const token = data.token;
    
    // 2. Get user info
    const infoUrl = new URL(API_CONFIG.baseUrl + API_CONFIG.endpoints.rest, window.location.origin);
    infoUrl.searchParams.append('wstoken', token);
    infoUrl.searchParams.append('wsfunction', 'core_webservice_get_site_info');
    infoUrl.searchParams.append('moodlewsrestformat', 'json');
    
    const infoRes = await fetch(infoUrl.toString(), { method: 'POST' });
    const infoData = await infoRes.json();
    
    if (infoData.exception) throw new Error(infoData.message);
    
    // Save session
    sessionStorage.setItem('moodle_token', token);
    
    sessionStorage.setItem('moodle_user', JSON.stringify({
      userid: infoData.userid,
      fullname: infoData.fullname,
      userpictureurl: infoData.userpictureurl,
      sitename: infoData.sitename
    }));
    
    return true;
  },

  logout() {
    sessionStorage.removeItem('moodle_token');
    sessionStorage.removeItem('moodle_user');
    window.location.hash = '/login';
  }
};
