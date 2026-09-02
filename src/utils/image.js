import { API_CONFIG } from '../config/api.js';
import { AuthService } from '../services/auth.js';

/**
 * Normalizes Moodle file URLs (handles forcedownload, relative paths, https).
 */
export function normalizeMoodleUrl(rawUrl) {
  if (!rawUrl || typeof rawUrl !== 'string') return '';

  let url = rawUrl.trim();

  // If URL is relative, prepend baseUrl/origin
  if (url.startsWith('/')) {
    let base = window?.HEADLESS_CONFIG?.moodleUrl || API_CONFIG?.baseUrl || '';
    const origin = typeof window !== 'undefined' && window.location?.origin && window.location.origin !== 'null'
      ? window.location.origin
      : 'http://localhost';

    if (!base || base === '/') {
      base = origin;
    } else if (base.startsWith('/')) {
      base = `${origin}${base}`;
    }
    url = `${base.replace(/\/+$/, '')}${url}`;
  }

  // Prevent mixed-content if current origin is https
  if (typeof window !== 'undefined' && window.location.protocol === 'https:' && url.startsWith('http://')) {
    const currentHost = window.location.host;
    try {
      const parsed = new URL(url);
      if (parsed.host === currentHost) {
        url = url.replace(/^http:\/\//i, 'https://');
      }
    } catch {
      // Ignore URL parse error
    }
  }

  // Disable forcedownload to enable inline rendering in <img>
  url = url.replace(/([?&])forcedownload=1(&|$)/g, (match, prefix, suffix) => {
    return suffix === '&' ? prefix : '';
  });

  return url;
}

/**
 * Gets the raw course image URL from course object (courseimage or overviewfiles).
 */
export function extractCourseRawImageUrl(course) {
  if (!course) return null;

  if (course.courseimage && typeof course.courseimage === 'string') {
    return course.courseimage;
  }

  if (Array.isArray(course.overviewfiles) && course.overviewfiles.length > 0) {
    // Prefer image mimetypes or file extensions if multiple files exist
    const imgFile = course.overviewfiles.find(f => 
      (f.mimetype && f.mimetype.startsWith('image/')) ||
      (f.filename && f.filename.match(/\.(png|jpg|jpeg|gif|svg|webp)$/i))
    ) || course.overviewfiles[0];

    if (imgFile && imgFile.fileurl) {
      return imgFile.fileurl;
    }
  }

  return null;
}

/**
 * Returns direct /pluginfile.php URL (session-based / public) without webservice token.
 */
export function getDirectCourseImageUrl(course) {
  const rawUrl = extractCourseRawImageUrl(course);
  if (!rawUrl) return `${import.meta.env.BASE_URL}generic-course.svg`;

  let cleanUrl = normalizeMoodleUrl(rawUrl);
  // Ensure standard pluginfile.php without /webservice/
  cleanUrl = cleanUrl.replace(/\/webservice\/pluginfile\.php/, '/pluginfile.php');
  // Remove token query param if present
  cleanUrl = cleanUrl.replace(/([?&])token=[^&]*(&|$)/g, '$1').replace(/[?&]$/, '');

  return cleanUrl;
}

/**
 * Returns authenticated /webservice/pluginfile.php URL for courses.
 */
export function getCourseImageUrl(course) {
  const rawUrl = extractCourseRawImageUrl(course);
  if (!rawUrl) {
    return `${import.meta.env.BASE_URL}generic-course.svg`;
  }

  let cleanUrl = normalizeMoodleUrl(rawUrl);
  const token = AuthService.getToken();

  // If no token is available, return direct URL
  if (!token) {
    return cleanUrl.replace(/\/webservice\/pluginfile\.php/, '/pluginfile.php');
  }

  // Ensure /webservice/pluginfile.php
  cleanUrl = cleanUrl.replace(/\/webservice\/pluginfile\.php/, '/pluginfile.php');
  const wsUrl = cleanUrl.replace(/\/pluginfile\.php/, '/webservice/pluginfile.php');

  // Check if URL already has token
  if (wsUrl.includes('token=')) {
    return wsUrl;
  }

  const joiner = wsUrl.includes('?') ? '&' : '?';
  return `${wsUrl}${joiner}token=${token}`;
}

export function replacePluginfileUrls(html) {
  if (!html) return html;
  const token = AuthService.getToken();
  if (!token) return html;

  // Busca cualquier pluginfile.php (con o sin webservice/ previo)
  return html.replace(/src="([^"]*?pluginfile\.php[^"]*)"/g, (match, url) => {
    let cleanUrl = normalizeMoodleUrl(url);
    cleanUrl = cleanUrl.replace(/\/webservice\/pluginfile\.php/, '/pluginfile.php');
    cleanUrl = cleanUrl.replace(/\/pluginfile\.php/, '/webservice/pluginfile.php');
    
    if (!cleanUrl.includes('token=')) {
      const joiner = cleanUrl.includes('?') ? '&' : '?';
      cleanUrl = `${cleanUrl}${joiner}token=${token}`;
    }
    
    return `src="${cleanUrl}"`;
  });
}

export function replaceRelativeImages(html, contents) {
  if (!html || !contents) return html;
  const token = AuthService.getToken();
  if (!token) return html;

  let processedHtml = html;

  contents.forEach(file => {
    if (file.type === 'file' && file.filename.match(/\.(png|jpg|jpeg|gif|svg|webp)$/i)) {
      const cleanUrl = normalizeMoodleUrl(file.fileurl);
      const joiner = cleanUrl.includes('?') ? '&' : '?';
      const authUrl = `${cleanUrl}${joiner}token=${token}`;
      
      const escapedFilename = file.filename.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      const regex = new RegExp(`src=["'][^"']*?${escapedFilename}["']`, 'gi');
      processedHtml = processedHtml.replace(regex, `src="${authUrl}"`);
    }
  });

  return processedHtml;
}
