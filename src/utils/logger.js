/**
 * Centralized application logger.
 * Suppresses debug and informational logs in production builds while allowing
 * controlled handling of errors and warnings.
 */

const isDev = Boolean(import.meta.env?.DEV);

export const logger = {
  debug(...args) {
    if (isDev) {
      console.debug(...args);
    }
  },

  info(...args) {
    if (isDev) {
      console.info(...args);
    }
  },

  warn(...args) {
    if (isDev) {
      console.warn(...args);
    }
  },

  error(...args) {
    if (isDev) {
      console.error(...args);
    }
  }
};

export default logger;
