import { AuthService } from '../services/auth.js';
import { getTenantConfig } from '../config/tenant.js';
import { getSavedTheme, setTheme, getThemesList } from '../utils/theme.js';

function getThemeIconSvg(iconName) {
  switch (iconName) {
    case 'moon':
      return `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path></svg>`;
    case 'grid':
      return `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="7" height="7"></rect><rect x="14" y="3" width="7" height="7"></rect><rect x="14" y="14" width="7" height="7"></rect><rect x="3" y="14" width="7" height="7"></rect></svg>`;
    case 'crown':
      return `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M2 4l3 12h14l3-12-6 7-4-7-4 7-6-7zm3 16h14v2H5v-2z"></path></svg>`;
    case 'sun':
    default:
      return `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="5"></circle><line x1="12" y1="1" x2="12" y2="3"></line><line x1="12" y1="21" x2="12" y2="23"></line><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"></line><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"></line><line x1="1" y1="12" x2="3" y2="12"></line><line x1="21" y1="12" x2="23" y2="12"></line><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"></line><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"></line></svg>`;
  }
}

export function createThemeSelector() {
  const container = document.createElement('div');
  container.className = 'theme-selector-container';

  const themes = getThemesList();
  let currentThemeId = getSavedTheme();
  let currentTheme = themes.find(t => t.id === currentThemeId) || themes[0];

  const toggleBtn = document.createElement('button');
  toggleBtn.className = 'btn-theme-toggle';
  toggleBtn.type = 'button';
  toggleBtn.setAttribute('aria-label', 'Seleccionar tema');
  toggleBtn.title = `Tema: ${currentTheme.name}`;

  const renderToggleContent = () => {
    toggleBtn.innerHTML = `
      <span class="theme-icon">${getThemeIconSvg(currentTheme.icon)}</span>
      <span class="theme-name-text">${currentTheme.name}</span>
      <svg class="theme-chevron" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="6 9 12 15 18 9"></polyline></svg>
    `;
  };
  renderToggleContent();

  const dropdown = document.createElement('div');
  dropdown.className = 'theme-dropdown';

  const header = document.createElement('div');
  header.className = 'theme-dropdown-header';
  header.textContent = 'Apariencia';
  dropdown.appendChild(header);

  const optionElements = [];

  themes.forEach(t => {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = `theme-option ${t.id === currentThemeId ? 'active' : ''}`;
    btn.innerHTML = `
      <div class="theme-swatches">
        ${t.colors.map(c => `<span class="theme-swatch-dot" style="background-color: ${c};"></span>`).join('')}
      </div>
      <div class="theme-option-info">
        <span class="theme-option-name">${t.name}</span>
        <span class="theme-option-desc">${t.description}</span>
      </div>
      <svg class="theme-check-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>
    `;

    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      currentThemeId = t.id;
      currentTheme = t;
      setTheme(t.id);
      renderToggleContent();

      optionElements.forEach(opt => {
        opt.el.classList.toggle('active', opt.id === t.id);
      });

      container.classList.remove('open');
    });

    dropdown.appendChild(btn);
    optionElements.push({ id: t.id, el: btn });
  });

  toggleBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    container.classList.toggle('open');
  });

  const closeDropdown = (e) => {
    if (!document.contains(container)) {
      document.removeEventListener('click', closeDropdown);
      return;
    }
    if (!container.contains(e.target)) {
      container.classList.remove('open');
    }
  };

  document.addEventListener('click', closeDropdown);

  container.destroy = () => {
    document.removeEventListener('click', closeDropdown);
  };

  container.appendChild(toggleBtn);
  container.appendChild(dropdown);

  return container;
}

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
  
  // User Section + Theme Selector
  const userSection = document.createElement('div');
  userSection.className = 'header-user';

  // Always append the theme selector
  userSection.appendChild(createThemeSelector());
  
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

