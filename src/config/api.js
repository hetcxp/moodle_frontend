import { getTenantConfig } from './tenant.js';

const config = getTenantConfig();

export const API_CONFIG = {
  baseUrl: config.moodleUrl,
  serviceName: config.serviceName,
  endpoints: {
    login: '/login/token.php',
    rest: '/webservice/rest/server.php',
    pluginfile: '/webservice/pluginfile.php'
  }
};

export const buildRestUrl = (wsfunction, params = {}) => {
  const url = new URL(API_CONFIG.baseUrl + API_CONFIG.endpoints.rest, window.location.origin);
  url.searchParams.append('moodlewsrestformat', 'json');
  url.searchParams.append('wsfunction', wsfunction);
  
  for (const [key, value] of Object.entries(params)) {
    url.searchParams.append(key, value);
  }
  return url.toString();
};
