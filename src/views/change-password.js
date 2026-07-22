import { AuthService } from '../services/auth.js';
import { PasswordService } from '../services/password.js';
import { getTenantConfig } from '../config/tenant.js';

export function renderChangePassword(container) {
  const tempSession = AuthService.getTempSession();
  
  if (!tempSession) {
    window.location.hash = '/login';
    return;
  }
  
  const config = getTenantConfig();
  
  container.innerHTML = `
    <div class="login-view">
      <div class="card login-card">
        <div class="login-header">
          <img src="${config.logo}" alt="Logo" class="login-logo" onerror="this.style.display='none'">
          <h1>Actualiza tu contraseña</h1>
          <p>Hola <strong>${tempSession.fullname}</strong>. Tu administrador ha solicitado que establezcas una nueva contraseña para continuar.</p>
        </div>
        
        <div id="change-error" class="error-message"></div>
        
        <form id="change-password-form">
          <div class="input-group">
            <label for="new-password">Nueva Contraseña</label>
            <input type="password" id="new-password" class="input-control" required autocomplete="new-password">
          </div>
          
          <div class="input-group">
            <label for="confirm-password">Confirmar Contraseña</label>
            <input type="password" id="confirm-password" class="input-control" required autocomplete="new-password">
          </div>
          
          <button type="submit" class="btn-primary" id="change-btn">
            Actualizar y continuar
          </button>
        </form>
      </div>
    </div>
  `;

  const form = container.querySelector('#change-password-form');
  const errorDiv = container.querySelector('#change-error');
  const btn = container.querySelector('#change-btn');

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const pass1 = form.querySelector('#new-password').value;
    const pass2 = form.querySelector('#confirm-password').value;
    
    errorDiv.classList.remove('show');
    
    if (pass1 !== pass2) {
      errorDiv.textContent = 'Las contraseñas no coinciden.';
      errorDiv.classList.add('show');
      return;
    }
    
    if (pass1.length < 8) {
      errorDiv.textContent = 'La contraseña debe tener al menos 8 caracteres.';
      errorDiv.classList.add('show');
      return;
    }
    
    btn.disabled = true;
    btn.textContent = 'Actualizando...';
    
    let result;
    try {
      result = await PasswordService.change(pass1);
      
      if (result.success) {
        // Automatically log in with new password
        await AuthService.login(tempSession.username, pass1);
        AuthService.clearTempSession();
        window.location.hash = '/dashboard';
      } else {
        errorDiv.innerHTML = result.errormessage || 'Error al actualizar la contraseña.';
        errorDiv.classList.add('show');
      }
    } catch (err) {
      errorDiv.textContent = err.message || 'Error de conexión.';
      errorDiv.classList.add('show');
    } finally {
      if (!result?.success) {
        btn.disabled = false;
        btn.textContent = 'Actualizar y continuar';
      }
    }
  });
}
