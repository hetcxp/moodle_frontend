export const THEMES = [
  {
    id: 'light',
    name: 'Claro',
    description: 'Blanco limpio y luminoso',
    icon: 'sun',
    colors: ['#ffffff', '#1a73e8', '#f4f5f7']
  },
  {
    id: 'dark',
    name: 'Oscuro',
    description: 'Moderno y descansado',
    icon: 'moon',
    colors: ['#11141d', '#3b82f6', '#1e222d']
  },
  {
    id: 'microsoft',
    name: 'Microsoft Blue',
    description: 'Estilo Fluent corporativo',
    icon: 'grid',
    colors: ['#edf3f9', '#0078d4', '#ffffff']
  },
  {
    id: 'gold-teal',
    name: 'Gold & Teal',
    description: 'Edición Luxe Premium',
    icon: 'crown',
    colors: ['#091317', '#e5b84c', '#112229']
  }
];

const THEME_STORAGE_KEY = 'moodle_app_theme';

export function getSavedTheme() {
  try {
    const saved = localStorage.getItem(THEME_STORAGE_KEY);
    if (saved && THEMES.some(t => t.id === saved)) {
      return saved;
    }
  } catch (e) {
    // localStorage might be blocked or unavailable
  }
  return 'light';
}

export function setTheme(themeId) {
  const validTheme = THEMES.find(t => t.id === themeId) ? themeId : 'light';
  
  if (validTheme === 'light') {
    document.documentElement.removeAttribute('data-theme');
  } else {
    document.documentElement.setAttribute('data-theme', validTheme);
  }

  try {
    localStorage.setItem(THEME_STORAGE_KEY, validTheme);
  } catch (e) {
    // ignore storage error
  }

  window.dispatchEvent(new CustomEvent('themechange', { detail: { theme: validTheme } }));
  return validTheme;
}

export function initTheme() {
  const current = getSavedTheme();
  setTheme(current);
  return current;
}

export function getThemesList() {
  return [...THEMES];
}
