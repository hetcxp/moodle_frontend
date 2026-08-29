import { describe, it, expect } from 'vitest';
import { escapeHtml, sanitizeHtml } from '../src/utils/sanitize.js';

describe('Sanitize & Escape Utilities', () => {
  describe('escapeHtml', () => {
    it('escapes special characters', () => {
      const input = '<script>alert("xss" & \'test\')</script>';
      const expected = '&lt;script&gt;alert(&quot;xss&quot; &amp; &#39;test&#39;)&lt;/script&gt;';
      expect(escapeHtml(input)).toBe(expected);
    });

    it('handles null, undefined and empty strings', () => {
      expect(escapeHtml(null)).toBe('');
      expect(escapeHtml(undefined)).toBe('');
      expect(escapeHtml('')).toBe('');
    });

    it('preserves plain alphanumeric strings', () => {
      expect(escapeHtml('Hello World 123!')).toBe('Hello World 123!');
    });
  });

  describe('sanitizeHtml', () => {
    it('strips <script> tags and malicious payloads', () => {
      const dirty = '<p>Bienvenido</p><script>alert("hacked")</script>';
      const clean = sanitizeHtml(dirty);
      expect(clean).not.toContain('<script');
      expect(clean).not.toContain('alert');
      expect(clean).toContain('<p>Bienvenido</p>');
    });

    it('strips inline event handlers (onerror, onclick, onload)', () => {
      const dirty = '<img src="x" onerror="alert(1)"><a href="https://example.com" onclick="steal()">Link</a>';
      const clean = sanitizeHtml(dirty);
      expect(clean).not.toContain('onerror');
      expect(clean).not.toContain('onclick');
      expect(clean).not.toContain('alert(1)');
      expect(clean).not.toContain('steal()');
      expect(clean).toContain('src="x"');
      expect(clean).toContain('href="https://example.com"');
    });

    it('strips javascript: and vbscript: URIs', () => {
      const dirty = '<a href="javascript:alert(document.cookie)">Click me</a>';
      const clean = sanitizeHtml(dirty);
      expect(clean).not.toContain('javascript:');
      expect(clean).not.toContain('alert');
      expect(clean).toContain('Click me');
    });

    it('preserves safe formatting elements, classes, and styles', () => {
      const safe = '<div class="topic-summary"><p><strong>Modulo 1:</strong> Introducción con <em>énfasis</em> y <a href="https://moodle.org">enlace</a>.</p><ul><li>Item 1</li></ul></div>';
      const clean = sanitizeHtml(safe);
      expect(clean).toContain('<strong>Modulo 1:</strong>');
      expect(clean).toContain('<em>énfasis</em>');
      expect(clean).toContain('href="https://moodle.org"');
      expect(clean).toContain('<ul><li>Item 1</li></ul>');
    });

    it('handles empty or non-string inputs safely', () => {
      expect(sanitizeHtml('')).toBe('');
      expect(sanitizeHtml(null)).toBe('');
      expect(sanitizeHtml(undefined)).toBe('');
    });
  });
});
