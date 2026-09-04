/**
 * @typedef {Object} TenantColors
 * @property {string} primary - Primary accent color hex.
 * @property {string} accent - Secondary highlight color hex.
 * @property {string} surface - Card and modal background color hex.
 * @property {string} background - App background color hex.
 */

/**
 * @typedef {Object} TenantConfig
 * @property {string} name - Brand/tenant display name.
 * @property {string} [moodleUrl] - Base Moodle server URL.
 * @property {string} serviceName - Web service shortname.
 * @property {TenantColors} colors - Palette color configuration.
 * @property {string} [logo] - URL to brand logo image.
 */

/** @type {Record<string, TenantConfig>} */
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

/**
 * Resolves current tenant configuration merging URL parameters, environment defaults,
 * and optional injected runtime window.HEADLESS_CONFIG.
 *
 * @returns {TenantConfig} Resolved tenant configuration object.
 */
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

/**
 * Injects tenant CSS custom properties into :root element if an active non-default
 * tenant with custom color palettes is selected.
 *
 * @returns {TenantConfig} The active tenant config that was applied.
 */
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
