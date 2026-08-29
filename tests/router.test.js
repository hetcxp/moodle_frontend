import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { Router } from '../src/router/index.js';

describe('Router Lifecycle and Navigation', () => {
  let router = null;

  beforeEach(() => {
    window.location.hash = '';
  });

  afterEach(() => {
    if (router) {
      router.destroy();
      router = null;
    }
  });

  it('matches static routes and calls action', () => {
    const dashboardAction = vi.fn();
    router = new Router([
      { path: '/dashboard', action: dashboardAction }
    ]);

    window.location.hash = '#/dashboard';
    router.handleHashChange();

    expect(dashboardAction).toHaveBeenCalledTimes(1);
  });

  it('extracts route params accurately', () => {
    const courseAction = vi.fn();
    router = new Router([
      { path: '/course/:id', action: courseAction }
    ]);

    window.location.hash = '#/course/42';
    router.handleHashChange();

    expect(courseAction).toHaveBeenCalledWith({ id: '42' });
  });

  it('executes cleanup destructor on route change', () => {
    const cleanupMock = vi.fn();
    const action1 = vi.fn().mockReturnValue(cleanupMock);
    const action2 = vi.fn();

    router = new Router([
      { path: '/page1', action: action1 },
      { path: '/page2', action: action2 }
    ]);

    window.location.hash = '#/page1';
    router.handleHashChange();
    expect(action1).toHaveBeenCalledTimes(1);
    expect(cleanupMock).not.toHaveBeenCalled();

    window.location.hash = '#/page2';
    router.handleHashChange();
    expect(cleanupMock).toHaveBeenCalledTimes(1);
    expect(action2).toHaveBeenCalledTimes(1);
  });

  it('respects route guards preventing action execution', () => {
    const guardedAction = vi.fn();
    const guard = vi.fn().mockReturnValue(false);

    router = new Router([
      { path: '/secret', guard, action: guardedAction }
    ]);

    window.location.hash = '#/secret';
    router.handleHashChange();

    expect(guard).toHaveBeenCalled();
    expect(guardedAction).not.toHaveBeenCalled();
  });
});
