import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { AuthService } from '../src/services/auth.js';

describe('AuthService', () => {
  beforeEach(() => {
    sessionStorage.clear();
    vi.restoreAllMocks();
  });

  afterEach(() => {
    sessionStorage.clear();
    vi.restoreAllMocks();
  });

  describe('login', () => {
    it('sends username and password in POST body and not in query string', async () => {
      let loginRequest = null;
      let infoRequest = null;

      vi.spyOn(globalThis, 'fetch').mockImplementation((url, options) => {
        const urlStr = String(url);
        if (urlStr.includes('/login/token.php')) {
          loginRequest = { url: urlStr, options };
          return Promise.resolve({
            ok: true,
            json: () => Promise.resolve({ token: 'mock-valid-token-xyz' })
          });
        }
        if (urlStr.includes('/webservice/rest/server.php')) {
          infoRequest = { url: urlStr, options };
          return Promise.resolve({
            ok: true,
            json: () => Promise.resolve({
              userid: 10,
              fullname: 'Estudiante Demo',
              userpictureurl: 'https://moodle.example.com/pic.jpg',
              sitename: 'Plataforma Moodle'
            })
          });
        }
        return Promise.reject(new Error('Unknown URL: ' + urlStr));
      });

      const result = await AuthService.login('demo_user', 'mock_password_123');

      expect(result).toBe(true);
      expect(loginRequest).not.toBeNull();
      // Ensure password is NOT in URL query params
      expect(loginRequest.url).not.toContain('mock_password_123');
      expect(loginRequest.url).not.toContain('demo_user');
      
      // Ensure password is in POST body (URLSearchParams)
      expect(loginRequest.options.method).toBe('POST');
      expect(loginRequest.options.body).toBeInstanceOf(URLSearchParams);
      expect(loginRequest.options.body.get('username')).toBe('demo_user');
      expect(loginRequest.options.body.get('password')).toBe('mock_password_123');

      // Check session storage
      expect(AuthService.getToken()).toBe('mock-valid-token-xyz');
      expect(AuthService.getUser()).toEqual({
        userid: 10,
        fullname: 'Estudiante Demo',
        userpictureurl: 'https://moodle.example.com/pic.jpg',
        sitename: 'Plataforma Moodle'
      });
      expect(AuthService.isAuthenticated()).toBe(true);
    });

    it('handles force password change preference', async () => {
      vi.spyOn(globalThis, 'fetch').mockImplementation((url) => {
        const urlStr = String(url);
        if (urlStr.includes('/login/token.php')) {
          return Promise.resolve({
            ok: true,
            json: () => Promise.resolve({ token: 'forced-pwd-token' })
          });
        }
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({
            userid: 25,
            fullname: 'Usuario Pendiente',
            userisforcedpasswordchange: 1
          })
        });
      });

      await expect(AuthService.login('user_pwd', 'old_pass')).rejects.toEqual({
        type: 'FORCE_PASSWORD_CHANGE'
      });

      expect(AuthService.getTempSession()).toEqual({
        token: 'forced-pwd-token',
        username: 'user_pwd',
        userid: 25,
        fullname: 'Usuario Pendiente'
      });
      expect(AuthService.isAuthenticated()).toBe(false);
    });
  });

  describe('loginWithToken', () => {
    it('sends wstoken in POST body and not in query string', async () => {
      let infoRequest = null;

      vi.spyOn(globalThis, 'fetch').mockImplementation((url, options) => {
        const urlStr = String(url);
        if (urlStr.includes('/webservice/rest/server.php')) {
          infoRequest = { url: urlStr, options };
          return Promise.resolve({
            ok: true,
            json: () => Promise.resolve({
              userid: 88,
              fullname: 'SSO User',
              userpictureurl: 'https://moodle.example.com/user88.jpg',
              sitename: 'Campus Virtual'
            })
          });
        }
        return Promise.reject(new Error('Unknown URL: ' + urlStr));
      });

      const result = await AuthService.loginWithToken('mock_sso_token');

      expect(result).toBe(true);
      expect(infoRequest).not.toBeNull();
      // Ensure token is NOT in URL query string
      expect(infoRequest.url).not.toContain('mock_sso_token');
      expect(infoRequest.url).not.toContain('wstoken');

      // Ensure token is in POST body
      expect(infoRequest.options.method).toBe('POST');
      expect(infoRequest.options.body).toBeInstanceOf(URLSearchParams);
      expect(infoRequest.options.body.get('wstoken')).toBe('mock_sso_token');
      expect(infoRequest.options.body.get('wsfunction')).toBe('core_webservice_get_site_info');

      // Check session storage
      expect(AuthService.getToken()).toBe('mock_sso_token');
      expect(AuthService.getUser().userid).toBe(88);
      expect(AuthService.isAuthenticated()).toBe(true);
    });
  });

  describe('logout', () => {
    it('clears session and temporary session data', () => {
      sessionStorage.setItem('moodle_token', 'token-to-clear');
      sessionStorage.setItem('moodle_user', JSON.stringify({ userid: 1 }));
      sessionStorage.setItem('moodle_temp_session', JSON.stringify({ userid: 1 }));

      AuthService.logout();

      expect(AuthService.getToken()).toBeNull();
      expect(AuthService.getUser()).toBeNull();
      expect(AuthService.getTempSession()).toBeNull();
      expect(AuthService.isAuthenticated()).toBe(false);
    });
  });
});
