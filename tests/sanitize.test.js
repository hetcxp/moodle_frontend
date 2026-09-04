import { describe, it, expect } from 'vitest';
import { escapeHtml, sanitizeHtml, decodeHtml } from '../src/utils/sanitize.js';

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

    it('cleans conflicting hardcoded background and text colors from inline styles while preserving layout styles', () => {
      const dirty = '<div style="background-color: #ffffff; color: #000000; padding: 20px; text-align: center;"><p style="color: #333333; margin-bottom: 10px;">Texto</p></div>';
      const clean = sanitizeHtml(dirty);
      expect(clean).not.toContain('background-color: #ffffff');
      expect(clean).not.toContain('color: #000000');
      expect(clean).not.toContain('color: #333333');
      expect(clean).toContain('padding: 20px');
      expect(clean).toContain('text-align: center');
      expect(clean).toContain('margin-bottom: 10px');
    });

    it('neutralizes background-image and font-family overrides in inline styles', () => {
      const dirty = '<div style="background-image: url(evil.jpg); font-family: Comic Sans; display: flex;"><p>Content</p></div>';
      const clean = sanitizeHtml(dirty);
      expect(clean).not.toContain('background-image');
      expect(clean).not.toContain('Comic Sans');
      expect(clean).toContain('display: flex');
    });

    it('handles empty or non-string inputs safely', () => {
      expect(sanitizeHtml('')).toBe('');
      expect(sanitizeHtml(null)).toBe('');
      expect(sanitizeHtml(undefined)).toBe('');
    });

    it('neutralizes SVG and MathML script payloads', () => {
      const dirty = '<svg><script>alert("svg-xss")</script><circle cx="50" cy="50" r="40"/></svg>';
      const clean = sanitizeHtml(dirty);
      expect(clean).not.toContain('<script');
      expect(clean).not.toContain('alert');
    });

    it('allows form controls in quiz mode while neutralizing scripts', () => {
      const quizHtml = `
        <div class="qtext">¿Cuál es la respuesta correcta?</div>
        <div class="answer">
          <input type="radio" name="q1" id="q1_a" value="1" onclick="steal()">
          <label for="q1_a">Opción A</label>
        </div>
        <script>alert('pwned')</script>
      `;
      const clean = sanitizeHtml(quizHtml, { allowFormControls: true });
      expect(clean).toContain('<input');
      expect(clean).toContain('type="radio"');
      expect(clean).toContain('<label');
      expect(clean).not.toContain('onclick');
      expect(clean).not.toContain('steal()');
      expect(clean).not.toContain('<script');
      expect(clean).not.toContain('alert');
    });

    it('strips form controls in standard mode', () => {
      const summary = '<p>Curso de prueba</p><input type="text" value="secret"><button>Enviar</button>';
      const clean = sanitizeHtml(summary);
      expect(clean).not.toContain('<input');
      expect(clean).not.toContain('<button');
      expect(clean).toContain('<p>Curso de prueba</p>');
    });
  });

  describe('decodeHtml', () => {
    it('decodes HTML entities into normal characters', () => {
      expect(decodeHtml('Bienvenida &amp; Paso 1 en Negociador Elite')).toBe('Bienvenida & Paso 1 en Negociador Elite');
      expect(decodeHtml('Curso &lt;1&gt; &quot;Avanzado&#039;s&quot;')).toBe('Curso <1> "Avanzado\'s"');
    });

    it('handles null, undefined and empty strings safely', () => {
      expect(decodeHtml(null)).toBe('');
      expect(decodeHtml(undefined)).toBe('');
      expect(decodeHtml('')).toBe('');
    });

    it('preserves clean strings without entities', () => {
      expect(decodeHtml('Diseño Instruccional')).toBe('Diseño Instruccional');
    });
  });
});
