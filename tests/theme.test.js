import { describe, it, expect, beforeEach, vi } from 'vitest';
import { THEMES, getSavedTheme, setTheme, initTheme, getThemesList } from '../src/utils/theme.js';
import { createThemeSelector } from '../src/components/header.js';

describe('Theme Management Utility and Selector', () => {
  let mockStorage = {};

  beforeEach(() => {
    mockStorage = {};
    const storageMock = {
      getItem: vi.fn((key) => mockStorage[key] || null),
      setItem: vi.fn((key, value) => { mockStorage[key] = String(value); }),
      removeItem: vi.fn((key) => { delete mockStorage[key]; }),
      clear: vi.fn(() => { mockStorage = {}; })
    };

    Object.defineProperty(globalThis, 'localStorage', {
      value: storageMock,
      writable: true,
      configurable: true
    });
    Object.defineProperty(window, 'localStorage', {
      value: storageMock,
      writable: true,
      configurable: true
    });

    document.documentElement.removeAttribute('data-theme');
  });

  it('provides all five requested themes', () => {
    const list = getThemesList();
    expect(list.length).toBe(5);
    const ids = list.map(t => t.id);
    expect(ids).toEqual(['light', 'dark', 'microsoft', 'gold-teal', 'mint']);
  });

  it('defaults to light theme when nothing is stored in localStorage', () => {
    expect(getSavedTheme()).toBe('light');
  });

  it('applies data-theme attribute on documentElement when setting dark theme', () => {
    const result = setTheme('dark');
    expect(result).toBe('dark');
    expect(document.documentElement.getAttribute('data-theme')).toBe('dark');
    expect(localStorage.getItem('moodle_app_theme')).toBe('dark');
  });

  it('applies data-theme attribute for microsoft, gold-teal, and mint themes', () => {
    setTheme('microsoft');
    expect(document.documentElement.getAttribute('data-theme')).toBe('microsoft');
    expect(localStorage.getItem('moodle_app_theme')).toBe('microsoft');

    setTheme('gold-teal');
    expect(document.documentElement.getAttribute('data-theme')).toBe('gold-teal');
    expect(localStorage.getItem('moodle_app_theme')).toBe('gold-teal');

    setTheme('mint');
    expect(document.documentElement.getAttribute('data-theme')).toBe('mint');
    expect(localStorage.getItem('moodle_app_theme')).toBe('mint');
  });

  it('removes data-theme attribute when reverting to light theme', () => {
    setTheme('dark');
    expect(document.documentElement.getAttribute('data-theme')).toBe('dark');

    setTheme('light');
    expect(document.documentElement.hasAttribute('data-theme')).toBe(false);
    expect(localStorage.getItem('moodle_app_theme')).toBe('light');
  });

  it('dispatches custom event themechange when theme changes', () => {
    const listener = vi.fn();
    window.addEventListener('themechange', listener);

    setTheme('mint');
    expect(listener).toHaveBeenCalledTimes(1);
    expect(listener.mock.calls[0][0].detail).toEqual({ theme: 'mint' });

    window.removeEventListener('themechange', listener);
  });

  it('initTheme restores the stored theme', () => {
    localStorage.setItem('moodle_app_theme', 'mint');
    const applied = initTheme();
    expect(applied).toBe('mint');
    expect(document.documentElement.getAttribute('data-theme')).toBe('mint');
  });

  it('createThemeSelector generates toggle button and options for all themes', () => {
    const selector = createThemeSelector();
    expect(selector.classList.contains('theme-selector-container')).toBe(true);

    const toggleBtn = selector.querySelector('.btn-theme-toggle');
    expect(toggleBtn).not.toBeNull();

    const options = selector.querySelectorAll('.theme-option');
    expect(options.length).toBe(5);

    // Toggle dropdown open
    toggleBtn.click();
    expect(selector.classList.contains('open')).toBe(true);

    // Click on mint option
    const mintOption = options[4]; // mint
    mintOption.click();
    expect(document.documentElement.getAttribute('data-theme')).toBe('mint');
    expect(selector.classList.contains('open')).toBe(false);
  });
});
