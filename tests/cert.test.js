import { describe, it, expect, beforeEach, vi } from 'vitest';
import { CertService } from '../src/services/cert.js';
import { MoodleApi } from '../src/services/moodle-api.js';
import { AuthService } from '../src/services/auth.js';

describe('CertService', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  describe('getCertsByCourses', () => {
    it('fetches certificates by course id', async () => {
      vi.spyOn(MoodleApi, 'callWithFallback').mockResolvedValue({
        customcerts: [{ id: 1, name: 'Certificado de Curso', coursemodule: 99 }]
      });

      const certs = await CertService.getCertsByCourses(5);
      expect(certs).toHaveLength(1);
      expect(certs[0].name).toBe('Certificado de Curso');
      expect(MoodleApi.callWithFallback).toHaveBeenCalledWith('mod_customcert_get_customcerts_by_courses', {
        'courseids[0]': 5
      });
    });

    it('alias getCertsByCoures delegates to getCertsByCourses', async () => {
      vi.spyOn(CertService, 'getCertsByCourses').mockResolvedValue([{ id: 2 }]);
      const result = await CertService.getCertsByCoures(5);
      expect(result).toEqual([{ id: 2 }]);
      expect(CertService.getCertsByCourses).toHaveBeenCalledWith(5);
    });
  });

  describe('getIssuances', () => {
    it('returns empty array if user is not authenticated', async () => {
      vi.spyOn(AuthService, 'getUser').mockReturnValue(null);
      const issuances = await CertService.getIssuances(10);
      expect(issuances).toEqual([]);
    });

    it('fetches issuances for the current authenticated user', async () => {
      vi.spyOn(AuthService, 'getUser').mockReturnValue({ userid: 42 });
      vi.spyOn(MoodleApi, 'call').mockResolvedValue({
        issues: [{ id: 101, code: 'ABC-123', timecreated: 1700000000 }]
      });

      const issuances = await CertService.getIssuances(10);
      expect(issuances).toHaveLength(1);
      expect(issuances[0].code).toBe('ABC-123');
      expect(MoodleApi.call).toHaveBeenCalledWith('mod_customcert_get_issuances', {
        templateid: 10
      });
    });

    it('gracefully handles API errors returning empty array', async () => {
      vi.spyOn(AuthService, 'getUser').mockReturnValue({ userid: 42 });
      vi.spyOn(MoodleApi, 'call').mockRejectedValue(new Error('Permission denied'));

      const issuances = await CertService.getIssuances(10);
      expect(issuances).toEqual([]);
    });
  });
});
