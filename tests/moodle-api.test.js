import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { MoodleApi } from '../src/services/moodle-api.js';
import { AuthService } from '../src/services/auth.js';

describe('MoodleApi Service', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('call', () => {
    it('throws error when not authenticated and no custom token provided', async () => {
      vi.spyOn(AuthService, 'getToken').mockReturnValue(null);
      await expect(MoodleApi.call('core_course_get_courses')).rejects.toThrow('Not authenticated');
    });

    it('performs POST request and returns data on success', async () => {
      vi.spyOn(AuthService, 'getToken').mockReturnValue('valid-token-123');

      const mockResponseData = [{ id: 1, fullname: 'Curso de Prueba' }];
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => mockResponseData
      });

      const result = await MoodleApi.call('core_course_get_courses', { courseid: 1 });
      expect(result).toEqual(mockResponseData);
      expect(global.fetch).toHaveBeenCalledTimes(1);
    });

    it('handles Moodle exception and logs out if token is invalid', async () => {
      vi.spyOn(AuthService, 'getToken').mockReturnValue('expired-token');
      const logoutSpy = vi.spyOn(AuthService, 'logout').mockImplementation(() => {});

      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
          exception: 'moodle_exception',
          errorcode: 'invalidtoken',
          message: 'Invalid token'
        })
      });

      await expect(MoodleApi.call('core_course_get_courses')).rejects.toThrow('Invalid token');
      expect(logoutSpy).toHaveBeenCalledTimes(1);
    });
  });

  describe('getAutoLoginUrl', () => {
    it('returns formatted autologin url when key is successfully fetched', async () => {
      vi.spyOn(AuthService, 'getUser').mockReturnValue({ userid: 42 });
      vi.spyOn(MoodleApi, 'call').mockResolvedValue({
        key: 'secret-key-abc',
        autologinurl: 'https://moodle.example.com/local/headless/autologin.php'
      });

      const target = 'https://moodle.example.com/mod/quiz/view.php?id=10';
      const result = await MoodleApi.getAutoLoginUrl(target);

      expect(result).toContain('userid=42');
      expect(result).toContain('key=secret-key-abc');
      expect(result).toContain(encodeURIComponent(target));
    });

    it('returns target url directly if autologin key call fails', async () => {
      vi.spyOn(MoodleApi, 'call').mockRejectedValue(new Error('Network error'));
      const target = 'https://moodle.example.com/mod/scorm/player.php?id=5';
      const result = await MoodleApi.getAutoLoginUrl(target);
      expect(result).toBe(target);
    });
  });
});
