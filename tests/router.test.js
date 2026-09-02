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

  it('prevents race conditions when an earlier async route resolves after a fast navigation', async () => {
    let resolveSlowAction;
    const slowCleanup = vi.fn();
    const fastCleanup = vi.fn();

    const slowAction = vi.fn().mockImplementation(() => {
      return new Promise((resolve) => {
        resolveSlowAction = () => resolve(slowCleanup);
      });
    });

    const fastAction = vi.fn().mockReturnValue(fastCleanup);

    router = new Router([
      { path: '/slow', action: slowAction },
      { path: '/fast', action: fastAction }
    ]);

    // 1. Navigate to /slow
    window.location.hash = '#/slow';
    router.handleHashChange();
    expect(slowAction).toHaveBeenCalledTimes(1);

    // 2. Quickly navigate to /fast before /slow resolves
    window.location.hash = '#/fast';
    router.handleHashChange();
    expect(fastAction).toHaveBeenCalledTimes(1);

    // 3. Now slow action finishes later
    resolveSlowAction();
    await new Promise((r) => setTimeout(r, 10));

    // Stale slowCleanup should be immediately discarded/cleaned up and NOT overwrite active router cleanup
    expect(slowCleanup).toHaveBeenCalledTimes(1);
    expect(router.currentCleanup).toBe(fastCleanup);
  });
});
