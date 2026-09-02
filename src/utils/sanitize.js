import DOMPurify from 'dompurify';

/**
 * DOM Sanitization and HTML Escaping Utilities
 * Protects frontend views from XSS when rendering Moodle HTML contents.
 */

/**
 * Escapes special HTML characters in text.
 * @param {string|null|undefined} str
 * @returns {string}
 */
export function escapeHtml(str) {
  if (str === null || str === undefined) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

/**
 * Decodes HTML entities in a string (e.g. &amp; -> &, &#039; -> ').
 * Safe for use in text fields such as course titles.
 * @param {string|null|undefined} str
 * @returns {string}
 */
export function decodeHtml(str) {
  if (str === null || str === undefined) return '';
  if (typeof window === 'undefined' || typeof DOMParser === 'undefined') {
    return String(str)
      .replace(/&amp;/g, '&')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&quot;/g, '"')
      .replace(/&#039;/g, "'")
      .replace(/&#39;/g, "'");
  }
  const doc = new DOMParser().parseFromString(String(str), 'text/html');
  return doc.body.textContent || '';
}

function cleanStyle(styleStr) {
  if (!styleStr) return '';
  const declarations = styleStr.split(';').map(d => d.trim()).filter(Boolean);
  const retained = [];

  for (const decl of declarations) {
    const colonIdx = decl.indexOf(':');
    if (colonIdx === -1) continue;
    const prop = decl.substring(0, colonIdx).trim().toLowerCase();

    // Neutralize any inline background, text color or font family overrides from Moodle rich-text
    // to guarantee 100% consistent theming and contrast
    if (
      prop === 'background' ||
      prop === 'background-color' ||
      prop === 'background-image' ||
      prop === 'color' ||
      prop === 'font-family'
    ) {
      continue;
    }

    retained.push(decl);
  }

  return retained.join('; ');
}

/**
 * Sanitizes dirty HTML string by stripping unsafe elements and attributes.
 * @param {string} dirtyHtml
 * @param {{ allowFormControls?: boolean }} [options]
 * @returns {string}
 */
export function sanitizeHtml(dirtyHtml, options = {}) {
  if (!dirtyHtml || typeof dirtyHtml !== 'string') return '';

  const purify = typeof DOMPurify.sanitize === 'function' 
    ? DOMPurify 
    : (typeof window !== 'undefined' ? DOMPurify(window) : null);

  if (purify) {
    const config = {
      USE_PROFILES: { html: true, svg: false, mathMl: false },
      FORBID_TAGS: options.allowFormControls 
        ? ['script', 'object', 'embed', 'link', 'meta', 'base', 'iframe', 'applet']
        : ['script', 'object', 'embed', 'link', 'meta', 'base', 'form', 'input', 'button', 'textarea', 'select', 'iframe', 'applet'],
      FORBID_ATTR: ['onerror', 'onload', 'onclick', 'onmouseover', 'onfocus', 'onblur', 'onchange', 'onsubmit'],
      ALLOW_DATA_ATTR: false
    };

    const clean = purify.sanitize(dirtyHtml, config);

    // Apply cleanStyle if DOMParser is available to harmonize Moodle inline styles
    if (typeof window !== 'undefined' && typeof DOMParser !== 'undefined') {
      const doc = new DOMParser().parseFromString(clean, 'text/html');
      const styledElements = doc.body.querySelectorAll('[style]');
      styledElements.forEach(el => {
        const cleaned = cleanStyle(el.getAttribute('style') || '');
        if (cleaned) {
          el.setAttribute('style', cleaned);
        } else {
          el.removeAttribute('style');
        }
      });
      return doc.body.innerHTML;
    }
    return clean;
  }

  // Fallback regex sanitizer
  return dirtyHtml
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    .replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, '')
    .replace(/\s*on\w+\s*=\s*(?:"[^"]*"|'[^']*'|[^\s>]+)/gi, '')
    .replace(/href\s*=\s*(?:"javascript:[^"]*"|'javascript:[^']*')/gi, 'href="#"')
    .replace(/src\s*=\s*(?:"javascript:[^"]*"|'javascript:[^']*')/gi, 'src=""');
}
