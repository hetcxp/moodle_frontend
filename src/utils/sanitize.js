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

        const attrs = Array.from(child.attributes);
        for (const attr of attrs) {
          const name = attr.name.toLowerCase();
          const val = attr.value.trim().toLowerCase();
          if (name.startsWith('on')) {
            child.removeAttribute(attr.name);
          } else if ((name === 'href' || name === 'src') && (val.startsWith('javascript:') || val.startsWith('vbscript:'))) {
            child.removeAttribute(attr.name);
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
