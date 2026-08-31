export const TENANTS = {
  default: {
    name: 'Moodle Academy',
    moodleUrl: import.meta.env.VITE_MOODLE_URL,
    serviceName: import.meta.env.VITE_SERVICE_NAME || 'moodle_mobile_app',
    colors: {
      primary: '#1a73e8',
      accent: '#ff6d00',
      surface: '#ffffff',
      background: '#f4f5f7'
    },
    logo: 'https://moodle.com/wp-content/uploads/2021/06/22024-Moodle-logo-white.png' // generic placeholder
  }
};

export function getTenantConfig() {
  const params = new URLSearchParams(window.location.search);
  const tenantKey = params.get('tenant') || import.meta.env.VITE_TENANT || 'default';
  const baseConfig = TENANTS[tenantKey] || TENANTS['default'];
  
  if (window.HEADLESS_CONFIG) {
    return {
      ...baseConfig,
      moodleUrl: window.HEADLESS_CONFIG.moodleUrl || baseConfig.moodleUrl,
      serviceName: window.HEADLESS_CONFIG.serviceName || baseConfig.serviceName,
    };
  }
  return baseConfig;
}

export function applyTenantTheme() {
  const config = getTenantConfig();
  const root = document.documentElement;
  
  const params = new URLSearchParams(window.location.search);
  const tenantKey = params.get('tenant') || import.meta.env.VITE_TENANT;
  
  if (tenantKey && tenantKey !== 'default' && config.colors) {
    if (config.colors.primary) root.style.setProperty('--color-primary', config.colors.primary);
    if (config.colors.accent) root.style.setProperty('--color-accent', config.colors.accent);
    if (config.colors.surface) root.style.setProperty('--color-surface', config.colors.surface);
    if (config.colors.background) root.style.setProperty('--color-background', config.colors.background);
  }
  
  return config;
}
