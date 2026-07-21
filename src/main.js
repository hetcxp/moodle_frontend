import './styles/index.css';
import { applyTenantTheme } from './config/tenant.js';
import { Router } from './router/index.js';
import { AuthService } from './services/auth.js';
import { renderLogin } from './views/login.js';
import { renderDashboard } from './views/dashboard.js';
import { renderCourse } from './views/course.js';

const appContainer = document.getElementById('app');

const routes = [
  {
    path: '/login',
    guard: () => {
      if (AuthService.isAuthenticated()) {
        window.location.hash = '/dashboard';
        return false; // Prevent further execution for this route
      }
      return true;
    },
    action: () => renderLogin(appContainer)
  },
  {
    path: '/dashboard',
    guard: () => {
      if (!AuthService.isAuthenticated()) {
        window.location.hash = '/login';
        return false;
      }
      return true;
    },
    action: () => renderDashboard(appContainer)
  },
  {
    path: '/course/:id',
    guard: () => {
      if (!AuthService.isAuthenticated()) {
        window.location.hash = '/login';
        return false;
      }
      return true;
    },
    action: (params) => renderCourse(appContainer, params.id)
  },
  {
    path: '*', // Fallback
    action: () => {
      window.location.hash = AuthService.isAuthenticated() ? '/dashboard' : '/login';
    }
  }
];

function init() {
  applyTenantTheme();
  const router = new Router(routes);
}

init();
