import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { getTenantConfig, applyTenantTheme, TENANTS } from '../src/config/tenant.js';

describe('Tenant Configuration & Theming', () => {
  const originalLocation = window.location;
  const originalHeadlessConfig = window.HEADLESS_CONFIG;

  beforeEach(() => {
    delete window.HEADLESS_CONFIG;
  });

  afterEach(() => {
    window.HEADLESS_CONFIG = originalHeadlessConfig;
    document.documentElement.removeAttribute('style');
  });

  it('returns default tenant configuration when no overrides are present', () => {
    const config = getTenantConfig();
    expect(config).toBeDefined();
    expect(config.name).toBe(TENANTS.default.name);
    expect(config.serviceName).toBe(TENANTS.default.serviceName);
  });

  it('overrides config with window.HEADLESS_CONFIG if present', () => {
    window.HEADLESS_CONFIG = {
      moodleUrl: 'https://custom.moodle.com',
      serviceName: 'custom_service'
    };

    const config = getTenantConfig();
    expect(config.moodleUrl).toBe('https://custom.moodle.com');
    expect(config.serviceName).toBe('custom_service');
  });

  it('applies tenant colors to documentElement when custom tenant is set', () => {
    // Add custom tenant for testing
    TENANTS.customBrand = {
      name: 'Custom Brand',
      serviceName: 'custom_service',
      colors: {
        primary: '#ff0000',
        accent: '#00ff00',
        surface: '#ffffff',
        background: '#000000'
      }
    };

    const oldSearch = window.location.search;
    window.history.replaceState({}, '', '?tenant=customBrand');

    applyTenantTheme();

    expect(document.documentElement.style.getPropertyValue('--color-primary')).toBe('#ff0000');
    expect(document.documentElement.style.getPropertyValue('--color-accent')).toBe('#00ff00');
    expect(document.documentElement.style.getPropertyValue('--color-surface')).toBe('#ffffff');
    expect(document.documentElement.style.getPropertyValue('--color-background')).toBe('#000000');

    // Clean up
    delete TENANTS.customBrand;
    window.history.replaceState({}, '', oldSearch || '/');
  });
});
