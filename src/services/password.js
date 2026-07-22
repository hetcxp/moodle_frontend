import { MoodleApi } from './moodle-api.js';
import { AuthService } from './auth.js';

export const PasswordService = {
  async change(newpassword) {
    const tempSession = AuthService.getTempSession();
    if (!tempSession || !tempSession.token) {
      return { success: false, errormessage: 'No hay sesión temporal activa' };
    }

    try {
      const response = await MoodleApi.call('local_headless_change_password', { 
        newpassword 
      }, tempSession.token);
      
      return response;
    } catch (e) {
      console.error('Failed to change password', e);
      return { success: false, errormessage: e.message || 'Error de conexión' };
    }
  }
};
