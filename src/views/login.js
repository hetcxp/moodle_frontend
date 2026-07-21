import { AuthService } from '../services/auth.js';
import { getTenantConfig } from '../config/tenant.js';

export function renderLogin(container) {
  const config = getTenantConfig();
  
  container.innerHTML = `
    <div class="login-view">
      <div class="card login-card">
        <div class="login-header">
          <img src="${config.logo}" alt="Logo" class="login-logo" onerror="this.style.display='none'">
          <h1>Bienvenido a ${config.name}</h1>
          <p>Ingresa tus credenciales para continuar</p>
        </div>
        
        <div id="login-error" class="error-message"></div>
        
        <form id="login-form">
          <div class="input-group">
            <label for="username">Usuario</label>
            <input type="text" id="username" class="input-control" required autocomplete="username">
          </div>
          
          <div class="input-group">
            <label for="password">Contraseña</label>
            <input type="password" id="password" class="input-control" required autocomplete="current-password">
          </div>
          
          <button type="submit" class="btn-primary" id="login-btn">
            Iniciar Sesión
          </button>
        </form>
      </div>
    </div>
  `;

  const form = container.querySelector('#login-form');
  const errorDiv = container.querySelector('#login-error');
  const btn = container.querySelector('#login-btn');

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const user = form.username.value;
    const pass = form.password.value;
    
    errorDiv.classList.remove('show');
    btn.disabled = true;
    btn.textContent = 'Verificando...';
    
    try {
      await AuthService.login(user, pass);
      window.location.hash = '/dashboard';
    } catch (err) {
      errorDiv.textContent = err.message || 'Error de autenticación';
      errorDiv.classList.add('show');
    } finally {
      btn.disabled = false;
      btn.textContent = 'Iniciar Sesión';
    }
  });
}
