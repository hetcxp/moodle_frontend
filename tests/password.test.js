import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { PasswordService } from '../src/services/password.js';
import { AuthService } from '../src/services/auth.js';
import { MoodleApi } from '../src/services/moodle-api.js';
import { renderChangePassword } from '../src/views/change-password.js';

describe('PasswordService & ChangePassword View', () => {
  let container;

  beforeEach(() => {
    sessionStorage.clear();
    vi.restoreAllMocks();
    container = document.createElement('div');
    document.body.appendChild(container);
  });

  afterEach(() => {
    sessionStorage.clear();
    vi.restoreAllMocks();
    container.remove();
  });

  describe('PasswordService', () => {
    it('returns error when there is no active temporary session', async () => {
      vi.spyOn(AuthService, 'getTempSession').mockReturnValue(null);
      const res = await PasswordService.change('NewPass123!');
      expect(res.success).toBe(false);
      expect(res.errormessage).toContain('No hay sesión temporal activa');
    });

    it('calls local_headless_change_password with temp token and new password', async () => {
      vi.spyOn(AuthService, 'getTempSession').mockReturnValue({
        token: 'temp-token-999',
        username: 'estudiante_temp',
        userid: 15,
        fullname: 'Estudiante Temporal'
      });

      const apiSpy = vi.spyOn(MoodleApi, 'call').mockResolvedValue({
        success: true,
        message: 'Password changed successfully'
      });

      const res = await PasswordService.change('NewSuperSecret123!');

      expect(apiSpy).toHaveBeenCalledWith(
        'local_headless_change_password',
        { newpassword: 'NewSuperSecret123!' },
        'temp-token-999'
      );
      expect(res.success).toBe(true);
    });

    it('gracefully catches API exceptions and returns error response', async () => {
      vi.spyOn(AuthService, 'getTempSession').mockReturnValue({
        token: 'temp-token-999',
        username: 'estudiante_temp'
      });

      vi.spyOn(MoodleApi, 'call').mockRejectedValue(new Error('Password policy check failed'));

      const res = await PasswordService.change('weak');
      expect(res.success).toBe(false);
      expect(res.errormessage).toBe('Password policy check failed');
    });
  });

  describe('renderChangePassword view', () => {
    it('redirects to /login if no tempSession is present', () => {
      vi.spyOn(AuthService, 'getTempSession').mockReturnValue(null);
      window.location.hash = '/change-password';

      renderChangePassword(container);

      expect(window.location.hash).toBe('#/login');
      expect(container.innerHTML).toBe('');
    });

    it('renders form and rejects submission when passwords do not match', async () => {
      vi.spyOn(AuthService, 'getTempSession').mockReturnValue({
        token: 'temp-token-123',
        username: 'student1',
        fullname: 'Estudiante Seguro'
      });

      renderChangePassword(container);

      const pass1 = container.querySelector('#new-password');
      const pass2 = container.querySelector('#confirm-password');
      const form = container.querySelector('#change-password-form');
      const errorDiv = container.querySelector('#change-error');

      pass1.value = 'Password123!';
      pass2.value = 'DifferentPass123!';

      form.dispatchEvent(new Event('submit', { cancelable: true }));

      expect(errorDiv.textContent).toBe('Las contraseñas no coinciden.');
      expect(errorDiv.classList.contains('show')).toBe(true);
    });

    it('rejects passwords shorter than 8 characters', async () => {
      vi.spyOn(AuthService, 'getTempSession').mockReturnValue({
        token: 'temp-token-123',
        username: 'student1',
        fullname: 'Estudiante'
      });

      renderChangePassword(container);

      const pass1 = container.querySelector('#new-password');
      const pass2 = container.querySelector('#confirm-password');
      const form = container.querySelector('#change-password-form');
      const errorDiv = container.querySelector('#change-error');

      pass1.value = 'short';
      pass2.value = 'short';

      form.dispatchEvent(new Event('submit', { cancelable: true }));

      expect(errorDiv.textContent).toBe('La contraseña debe tener al menos 8 caracteres.');
      expect(errorDiv.classList.contains('show')).toBe(true);
    });

    it('submits successfully, logs in automatically and redirects to /dashboard', async () => {
      vi.spyOn(AuthService, 'getTempSession').mockReturnValue({
        token: 'temp-token-123',
        username: 'student1',
        fullname: 'Estudiante Aprobado'
      });

      vi.spyOn(PasswordService, 'change').mockResolvedValue({ success: true });
      const loginSpy = vi.spyOn(AuthService, 'login').mockResolvedValue(true);
      const clearSpy = vi.spyOn(AuthService, 'clearTempSession');

      renderChangePassword(container);

      const pass1 = container.querySelector('#new-password');
      const pass2 = container.querySelector('#confirm-password');
      const form = container.querySelector('#change-password-form');

      pass1.value = 'ValidPassword2026!';
      pass2.value = 'ValidPassword2026!';

      form.dispatchEvent(new Event('submit', { cancelable: true }));

      // Wait for async handler
      await new Promise(r => setTimeout(r, 20));

      expect(loginSpy).toHaveBeenCalledWith('student1', 'ValidPassword2026!');
      expect(clearSpy).toHaveBeenCalled();
      expect(window.location.hash).toBe('#/dashboard');
    });

    it('neutralizes malicious XSS in fullname and API error message', async () => {
      vi.spyOn(AuthService, 'getTempSession').mockReturnValue({
        token: 'temp-token-123',
        username: 'student_xss',
        fullname: '<script>alert("xss-fullname")</script>Hack'
      });

      vi.spyOn(PasswordService, 'change').mockResolvedValue({
        success: false,
        errormessage: 'Política inválida <img src=x onerror=alert("err-xss")>'
      });

      renderChangePassword(container);

      expect(container.innerHTML).not.toContain('<script>alert("xss-fullname")</script>');
      expect(container.textContent).toContain('<script>alert("xss-fullname")</script>Hack');

      const pass1 = container.querySelector('#new-password');
      const pass2 = container.querySelector('#confirm-password');
      const form = container.querySelector('#change-password-form');
      const errorDiv = container.querySelector('#change-error');

      pass1.value = 'ValidPassword2026!';
      pass2.value = 'ValidPassword2026!';

      form.dispatchEvent(new Event('submit', { cancelable: true }));
      await new Promise(r => setTimeout(r, 20));

      expect(errorDiv.innerHTML).not.toContain('onerror');
      expect(errorDiv.innerHTML).not.toContain('alert');
      expect(errorDiv.innerHTML).toContain('src="x"');
    });
  });
});
