import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { logger } from '../src/utils/logger.js';

describe('Logger Utility', () => {
  let consoleSpy;

  beforeEach(() => {
    consoleSpy = {
      debug: vi.spyOn(console, 'debug').mockImplementation(() => {}),
      info: vi.spyOn(console, 'info').mockImplementation(() => {}),
      warn: vi.spyOn(console, 'warn').mockImplementation(() => {}),
      error: vi.spyOn(console, 'error').mockImplementation(() => {})
    };
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('exposes debug, info, warn, and error methods', () => {
    expect(typeof logger.debug).toBe('function');
    expect(typeof logger.info).toBe('function');
    expect(typeof logger.warn).toBe('function');
    expect(typeof logger.error).toBe('function');
  });

  it('logs info messages when in development environment', () => {
    logger.info('Test info message', { details: 123 });
    expect(consoleSpy.info).toHaveBeenCalledWith('Test info message', { details: 123 });
  });

  it('logs warn messages when in development environment', () => {
    logger.warn('Test warn message');
    expect(consoleSpy.warn).toHaveBeenCalledWith('Test warn message');
  });

  it('logs error messages when in development environment', () => {
    const error = new Error('Test failure');
    logger.error('Test error message', error);
    expect(consoleSpy.error).toHaveBeenCalledWith('Test error message', error);
  });

  it('logs debug messages when in development environment', () => {
    logger.debug('Debug detail');
    expect(consoleSpy.debug).toHaveBeenCalledWith('Debug detail');
  });
});
