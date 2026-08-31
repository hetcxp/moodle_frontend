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

const DANGEROUS_TAGS = new Set([
  'script',
  'style',
  'object',
  'embed',
  'link',
  'meta',
  'base',
  'form',
  'input',
  'button',
  'textarea',
  'select'
]);

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
 * @returns {string}
 */
export function sanitizeHtml(dirtyHtml) {
  if (!dirtyHtml || typeof dirtyHtml !== 'string') return '';

  if (typeof window === 'undefined' || typeof DOMParser === 'undefined') {
    return dirtyHtml
      .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
      .replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, '')
      .replace(/\s*on\w+\s*=\s*(?:"[^"]*"|'[^']*'|[^\s>]+)/gi, '')
      .replace(/href\s*=\s*(?:"javascript:[^"]*"|'javascript:[^']*')/gi, 'href="#"')
      .replace(/src\s*=\s*(?:"javascript:[^"]*"|'javascript:[^']*')/gi, 'src=""');
  }

  const parser = new DOMParser();
  const doc = parser.parseFromString(dirtyHtml, 'text/html');

  function cleanNode(node) {
    const toRemove = [];
    for (const child of node.childNodes) {
      if (child.nodeType === 1) { // ELEMENT_NODE
        const tagName = child.tagName.toLowerCase();
        if (DANGEROUS_TAGS.has(tagName)) {
          toRemove.push(child);
          continue;
        }

        // Clean legacy HTML presentation attributes
        if (tagName === 'font') {
          child.removeAttribute('color');
          child.removeAttribute('face');
          child.removeAttribute('size');
        }
        if (child.hasAttribute('bgcolor')) child.removeAttribute('bgcolor');
        if (child.hasAttribute('text')) child.removeAttribute('text');
        if (child.hasAttribute('background')) child.removeAttribute('background');

        const attrs = Array.from(child.attributes);
        for (const attr of attrs) {
          const name = attr.name.toLowerCase();
          const val = attr.value.trim().toLowerCase();
          if (name.startsWith('on')) {
            child.removeAttribute(attr.name);
          } else if ((name === 'href' || name === 'src') && (val.startsWith('javascript:') || val.startsWith('vbscript:'))) {
            child.removeAttribute(attr.name);
          } else if (name === 'style') {
            const cleanedStyle = cleanStyle(child.getAttribute('style') || '');
            if (cleanedStyle) {
              child.setAttribute('style', cleanedStyle);
            } else {
              child.removeAttribute('style');
            }
          }
        }

        cleanNode(child);
      }
    }
    for (const el of toRemove) {
      el.remove();
    }
  }

  cleanNode(doc.body);
  return doc.body.innerHTML;
}
