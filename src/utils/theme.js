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
  },
  {
    id: 'mint',
    name: 'Mint Fresh',
    description: 'Refrescante, limpio y botánico',
    icon: 'leaf',
    colors: ['#f0fbf7', '#059669', '#10b981']
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

export const THEME_TOKENS = {
  light: {
    primary: '#1a73e8',
    primaryHover: '#1557b0',
    surface: '#ffffff',
    background: '#ffffff',
    text: '#111827',
    textSecondary: '#4b5563',
    border: 'rgba(0, 0, 0, 0.1)'
  },
  dark: {
    primary: '#3b82f6',
    primaryHover: '#2563eb',
    surface: '#1e222d',
    background: '#11141d',
    text: '#f3f4f6',
    textSecondary: '#9ca3af',
    border: 'rgba(255, 255, 255, 0.12)'
  },
  microsoft: {
    primary: '#0078d4',
    primaryHover: '#005a9e',
    surface: '#ffffff',
    background: '#edf3f9',
    text: '#18273a',
    textSecondary: '#475a70',
    border: '#d3e0ec'
  },
  'gold-teal': {
    primary: '#e5b84c',
    primaryHover: '#d4a337',
    surface: '#112229',
    background: '#091317',
    text: '#f0fdfa',
    textSecondary: '#8fa8ab',
    border: 'rgba(229, 184, 76, 0.25)'
  },
  mint: {
    primary: '#059669',
    primaryHover: '#047857',
    surface: '#ffffff',
    background: '#f0fbf7',
    text: '#092c23',
    textSecondary: '#3d685c',
    border: 'rgba(5, 150, 105, 0.2)'
  }
};

export function getThemeTokens(themeId) {
  return THEME_TOKENS[themeId] || THEME_TOKENS.light;
}
