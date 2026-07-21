import { AuthService } from '../services/auth.js';
import { getTenantConfig } from '../config/tenant.js';

export function createHeader() {
  const header = document.createElement('header');
  header.className = 'app-header';
  
  const config = getTenantConfig();
  const user = AuthService.getUser();
  
  // Brand
  const brand = document.createElement('div');
  brand.className = 'header-brand';
  brand.style.cursor = 'pointer';
  brand.innerHTML = `
    <img src="${config.logo}" alt="Logo" onerror="this.style.display='none'">
    <span class="brand-name">${config.name}</span>
  `;
  brand.onclick = () => {
    window.location.hash = AuthService.isAuthenticated() ? '/dashboard' : '/login';
  };

  // Navigation
  const nav = document.createElement('nav');
  nav.className = 'header-nav';
  
  if (AuthService.isAuthenticated()) {
    const homeLink = document.createElement('a');
    homeLink.href = '#/dashboard';
    homeLink.className = 'header-nav-link';
    homeLink.title = 'Dashboard';
    homeLink.innerHTML = `
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="7" height="7"></rect><rect x="14" y="3" width="7" height="7"></rect><rect x="14" y="14" width="7" height="7"></rect><rect x="3" y="14" width="7" height="7"></rect></svg>
      <span class="nav-text">Dashboard</span>
    `;
    nav.appendChild(homeLink);
  }
  
  // User Info
  const userSection = document.createElement('div');
  userSection.className = 'header-user';
  
  if (user) {
    const userInfo = document.createElement('div');
    userInfo.className = 'header-user-info';
    
    // Check if user has a picture, use generic if not
    const pictureUrl = user.userpictureurl && !user.userpictureurl.includes('f1.png')
      ? user.userpictureurl 
      : `https://ui-avatars.com/api/?name=${encodeURIComponent(user.fullname)}&background=random`;
      
    userInfo.innerHTML = `
      <span class="user-name">${user.fullname}</span>
      <img src="${pictureUrl}" alt="Avatar">
    `;
    
    const logoutBtn = document.createElement('button');
    logoutBtn.className = 'btn-logout';
    logoutBtn.title = 'Cerrar sesión';
    logoutBtn.innerHTML = `
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path><polyline points="16 17 21 12 16 7"></polyline><line x1="21" y1="12" x2="9" y2="12"></line></svg>
      <span class="logout-text">Cerrar sesión</span>
    `;
    logoutBtn.addEventListener('click', () => {
      AuthService.logout();
    });
    
    userSection.appendChild(userInfo);
    userSection.appendChild(logoutBtn);
  }
  
  header.appendChild(brand);
  header.appendChild(nav);
  header.appendChild(userSection);
  
  return header;
}
