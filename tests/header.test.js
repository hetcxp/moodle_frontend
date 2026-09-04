import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { createHeader } from '../src/components/header.js';
import { AuthService } from '../src/services/auth.js';

describe('Header Component', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('renders brand with logo and tenant name', () => {
    vi.spyOn(AuthService, 'isAuthenticated').mockReturnValue(false);
    vi.spyOn(AuthService, 'getUser').mockReturnValue(null);

    const header = createHeader();
    const brand = header.querySelector('.header-brand');
    expect(brand).not.toBeNull();
    expect(header.querySelector('.brand-name').textContent).toContain('Moodle');
  });

  it('navigates to /dashboard if authenticated on brand click', () => {
    vi.spyOn(AuthService, 'isAuthenticated').mockReturnValue(true);
    vi.spyOn(AuthService, 'getUser').mockReturnValue({ fullname: 'Hector T', userid: 1 });

    const header = createHeader();
    const brand = header.querySelector('.header-brand');
    brand.click();
    expect(window.location.hash).toBe('#/dashboard');
  });

  it('navigates to /login if unauthenticated on brand click', () => {
    vi.spyOn(AuthService, 'isAuthenticated').mockReturnValue(false);
    vi.spyOn(AuthService, 'getUser').mockReturnValue(null);

    const header = createHeader();
    const brand = header.querySelector('.header-brand');
    brand.click();
    expect(window.location.hash).toBe('#/login');
  });

  it('renders theme selector toggle in header', () => {
    vi.spyOn(AuthService, 'isAuthenticated').mockReturnValue(false);
    vi.spyOn(AuthService, 'getUser').mockReturnValue(null);

    const header = createHeader();
    const themeSelector = header.querySelector('.theme-selector-container');
    expect(themeSelector).not.toBeNull();
    const toggleBtn = themeSelector.querySelector('.btn-theme-toggle');
    expect(toggleBtn).not.toBeNull();

    // Toggle dropdown
    toggleBtn.click();
    expect(themeSelector.classList.contains('open')).toBe(true);
  });

  it('displays user info and handles logout when user is authenticated', () => {
    const logoutSpy = vi.spyOn(AuthService, 'logout').mockImplementation(() => {});
    vi.spyOn(AuthService, 'isAuthenticated').mockReturnValue(true);
    vi.spyOn(AuthService, 'getUser').mockReturnValue({
      fullname: 'Jane Doe',
      userpictureurl: 'https://example.com/pic.jpg'
    });

    const header = createHeader();
    const userName = header.querySelector('.user-name');
    expect(userName).not.toBeNull();
    expect(userName.textContent).toBe('Jane Doe');

    const logoutBtn = header.querySelector('.btn-logout');
    expect(logoutBtn).not.toBeNull();
    logoutBtn.click();
    expect(logoutSpy).toHaveBeenCalled();
  });
});
