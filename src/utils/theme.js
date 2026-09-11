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

// In-memory theme cache
let inMemoryTheme = null;

// Helper to safely get cookie
function getThemeCookie() {
  if (typeof document === 'undefined' || !document.cookie) return null;
  const match = document.cookie.match(new RegExp('(?:^|; )' + THEME_STORAGE_KEY + '=([^;]*)'));
  return match ? decodeURIComponent(match[1]) : null;
}

// Helper to safely set cookie
function setThemeCookie(val) {
  if (typeof document === 'undefined') return;
  try {
    document.cookie = `${THEME_STORAGE_KEY}=${encodeURIComponent(val)}; path=/; max-age=31536000; SameSite=Lax`;
  } catch (e) {}
}

// Protect localStorage.clear from wiping application keys in same-origin environments (e.g. Moodle Core storage_validation)
if (typeof window !== 'undefined' && window.localStorage) {
  try {
    const origClear = window.localStorage.clear.bind(window.localStorage);
    window.localStorage.clear = function() {
      const preserved = {};
      try {
        for (let i = 0; i < window.localStorage.length; i++) {
          const k = window.localStorage.key(i);
          if (k && k.startsWith('moodle_app_')) {
            preserved[k] = window.localStorage.getItem(k);
          }
        }
      } catch (e) {}

      origClear();

      try {
        for (const [k, v] of Object.entries(preserved)) {
          window.localStorage.setItem(k, v);
        }
      } catch (e) {}
    };

    // Auto-restore theme if wiped by an external same-origin iframe call
    window.addEventListener('storage', (e) => {
      if ((e.key === null || e.key === THEME_STORAGE_KEY) && !e.newValue && inMemoryTheme) {
        try {
          window.localStorage.setItem(THEME_STORAGE_KEY, inMemoryTheme);
        } catch (err) {}
      }
    });
  } catch (e) {}
}

export function getSavedTheme() {
  // Layer 1: localStorage
  try {
    const saved = localStorage.getItem(THEME_STORAGE_KEY);
    if (saved && THEMES.some(t => t.id === saved)) {
      inMemoryTheme = saved;
      return saved;
    }
  } catch (e) {}

  // Layer 2: sessionStorage (immune to Moodle core LocalStorage.clean)
  try {
    const sessionSaved = sessionStorage.getItem(THEME_STORAGE_KEY);
    if (sessionSaved && THEMES.some(t => t.id === sessionSaved)) {
      inMemoryTheme = sessionSaved;
      try { localStorage.setItem(THEME_STORAGE_KEY, sessionSaved); } catch (err) {}
      return sessionSaved;
    }
  } catch (e) {}

  // Layer 3: documentElement data-theme attribute
  if (typeof document !== 'undefined' && document.documentElement) {
    const attrTheme = document.documentElement.getAttribute('data-theme');
    if (attrTheme && THEMES.some(t => t.id === attrTheme)) {
      inMemoryTheme = attrTheme;
      try { localStorage.setItem(THEME_STORAGE_KEY, attrTheme); } catch (err) {}
      return attrTheme;
    }
  }

  // Layer 4: In-memory cache
  if (inMemoryTheme && THEMES.some(t => t.id === inMemoryTheme)) {
    try { localStorage.setItem(THEME_STORAGE_KEY, inMemoryTheme); } catch (err) {}
    return inMemoryTheme;
  }

  // Layer 5: Cookie fallback
  const cookieSaved = getThemeCookie();
  if (cookieSaved && THEMES.some(t => t.id === cookieSaved)) {
    inMemoryTheme = cookieSaved;
    try { localStorage.setItem(THEME_STORAGE_KEY, cookieSaved); } catch (err) {}
    return cookieSaved;
  }

  return 'light';
}

export function setTheme(themeId) {
  const validTheme = THEMES.find(t => t.id === themeId) ? themeId : 'light';
  inMemoryTheme = validTheme;

  if (typeof document !== 'undefined' && document.documentElement) {
    if (validTheme === 'light') {
      document.documentElement.removeAttribute('data-theme');
    } else {
      document.documentElement.setAttribute('data-theme', validTheme);
    }
  }

  try {
    localStorage.setItem(THEME_STORAGE_KEY, validTheme);
  } catch (e) {}

  try {
    sessionStorage.setItem(THEME_STORAGE_KEY, validTheme);
  } catch (e) {}

  setThemeCookie(validTheme);

  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('themechange', { detail: { theme: validTheme } }));
  }
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
    primaryText: '#ffffff',
    surface: '#ffffff',
    background: '#ffffff',
    text: '#111827',
    textSecondary: '#4b5563',
    border: 'rgba(0, 0, 0, 0.1)',
    alternativeBase: '#f8fafc',
    alternativeHover: '#e2e8f0',
    feedbackCorrectMain: '#15803d',
    feedbackCorrectSecondary: 'rgba(34, 197, 94, 0.12)',
    feedbackIncorrectMain: '#b91c1c',
    feedbackIncorrectSecondary: 'rgba(239, 68, 68, 0.12)'
  },
  dark: {
    primary: '#3b82f6',
    primaryHover: '#2563eb',
    primaryText: '#ffffff',
    surface: '#1e222d',
    background: '#11141d',
    text: '#f3f4f6',
    textSecondary: '#d1d5db',
    border: 'rgba(255, 255, 255, 0.12)',
    alternativeBase: '#1e222d',
    alternativeHover: '#2d3444',
    feedbackCorrectMain: '#4ade80',
    feedbackCorrectSecondary: 'rgba(34, 197, 94, 0.2)',
    feedbackIncorrectMain: '#f87171',
    feedbackIncorrectSecondary: 'rgba(239, 68, 68, 0.2)'
  },
  microsoft: {
    primary: '#0078d4',
    primaryHover: '#005a9e',
    primaryText: '#ffffff',
    surface: '#ffffff',
    background: '#edf3f9',
    text: '#18273a',
    textSecondary: '#475a70',
    border: '#d3e0ec',
    alternativeBase: '#ffffff',
    alternativeHover: '#e4eef7',
    feedbackCorrectMain: '#107c41',
    feedbackCorrectSecondary: 'rgba(16, 124, 65, 0.12)',
    feedbackIncorrectMain: '#a80000',
    feedbackIncorrectSecondary: 'rgba(168, 0, 0, 0.12)'
  },
  'gold-teal': {
    primary: '#e5b84c',
    primaryHover: '#d4a337',
    primaryText: '#091317',
    surface: '#112229',
    background: '#091317',
    text: '#f0fdfa',
    textSecondary: '#99f6e4',
    border: 'rgba(229, 184, 76, 0.25)',
    alternativeBase: '#112229',
    alternativeHover: '#1c323d',
    feedbackCorrectMain: '#2dd4bf',
    feedbackCorrectSecondary: 'rgba(45, 212, 191, 0.2)',
    feedbackIncorrectMain: '#f87171',
    feedbackIncorrectSecondary: 'rgba(239, 68, 68, 0.2)'
  },
  mint: {
    primary: '#059669',
    primaryHover: '#047857',
    primaryText: '#ffffff',
    surface: '#ffffff',
    background: '#f0fbf7',
    text: '#092c23',
    textSecondary: '#3d685c',
    border: 'rgba(5, 150, 105, 0.2)',
    alternativeBase: '#ffffff',
    alternativeHover: '#e2f6ee',
    feedbackCorrectMain: '#047857',
    feedbackCorrectSecondary: 'rgba(5, 150, 105, 0.12)',
    feedbackIncorrectMain: '#b91c1c',
    feedbackIncorrectSecondary: 'rgba(239, 68, 68, 0.12)'
  }
};

export function getThemeTokens(themeId) {
  return THEME_TOKENS[themeId] || THEME_TOKENS.light;
}
