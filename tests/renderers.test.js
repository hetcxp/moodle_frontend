import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { createBookRenderer } from '../src/views/course/renderers/book-renderer.js';
import { createScormRenderer } from '../src/views/course/renderers/scorm-renderer.js';
import { createH5pRenderer } from '../src/views/course/renderers/h5p-renderer.js';
import { createAssignRenderer } from '../src/views/course/renderers/assign-renderer.js';
import { createResourceRenderer } from '../src/views/course/renderers/resource-renderer.js';
import { CourseService } from '../src/services/courses.js';
import { AuthService } from '../src/services/auth.js';

describe('Course Activity Renderers', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    sessionStorage.clear();
    sessionStorage.setItem('moodle_token', 'test-user-token-123');
  });

  afterEach(() => {
    vi.restoreAllMocks();
    sessionStorage.clear();
  });

  describe('createBookRenderer', () => {
    it('renders empty state when book has no contents', () => {
      const el = createBookRenderer({ mod: { contents: [] } });
      expect(el.innerHTML).toContain('Este libro no tiene capítulos.');
    });

    it('renders book sidebar with chapters and loads chapter HTML', async () => {
      vi.spyOn(CourseService, 'fetchFileContent').mockResolvedValue('<h1>Capítulo 1: Introducción</h1><p>Contenido del libro</p>');

      const mod = {
        contents: [
          { type: 'file', filename: 'chapter1.html', fileurl: 'https://moodle.example.com/chap1.html' },
          { type: 'file', filename: 'chapter2.html', fileurl: 'https://moodle.example.com/chap2.html' }
        ]
      };

      const el = createBookRenderer({ mod });
      expect(el.querySelector('.book-sidebar')).not.toBeNull();
      expect(el.querySelectorAll('.book-sidebar li')).toHaveLength(2);

      // Wait for async fetch
      await new Promise(r => setTimeout(r, 25));

      expect(el.querySelector('.book-content-area').innerHTML).toContain('Capítulo 1: Introducción');
    });
  });

  describe('createScormRenderer', () => {
    it('renders scorm container with sanitized description and attempt counts', async () => {
      vi.spyOn(CourseService, 'getScormAttemptCount').mockResolvedValue(2);
      vi.spyOn(CourseService, 'getAutoLoginUrl').mockResolvedValue('https://moodle.example.com/autologin-player');

      const mod = {
        instance: 45,
        url: 'https://moodle.example.com/mod/scorm/view.php?id=100',
        description: '<p>Bienvenido al módulo SCORM</p><script>alert("xss")</script>'
      };

      const el = createScormRenderer({ mod, courseId: 10 });
      expect(el.innerHTML).toContain('Bienvenido al módulo SCORM');
      expect(el.innerHTML).not.toContain('<script>');

      await new Promise(r => setTimeout(r, 25));

      expect(el.innerHTML).toContain('<strong>Intentos realizados:</strong> 2');
      expect(el.querySelector('button')).not.toBeNull();
    });
  });

  describe('createH5pRenderer', () => {
    it('renders H5P iframe with auth token and fetches intro asynchronously', async () => {
      vi.spyOn(CourseService, 'getH5pActivityIntro').mockResolvedValue('<p>Instrucciones de la actividad H5P</p>');

      const mod = {
        id: 77,
        url: 'https://moodle.example.com/mod/h5pactivity/view.php?id=77'
      };

      const el = createH5pRenderer({ mod, courseId: 5 });
      const iframe = el.querySelector('iframe.h5p-iframe');

      expect(iframe).not.toBeNull();
      expect(iframe.src).toContain('/local/headless/h5p.php?id=77&token=test-user-token-123');

      await new Promise(r => setTimeout(r, 25));

      expect(el.querySelector('.h5p-description')).not.toBeNull();
      expect(el.querySelector('.h5p-description').textContent).toContain('Instrucciones de la actividad H5P');
    });
  });

  describe('createAssignRenderer', () => {
    it('renders assignment instructions, non-duplicate attachments and submission action', async () => {
      vi.spyOn(CourseService, 'getAssignmentData').mockResolvedValue({
        intro: '<p>Por favor entrega tu ensayo final</p>',
        introfiles: [
          { filename: 'guia.pdf', fileurl: 'https://moodle.example.com/guia.pdf', filesize: 2048 }
        ]
      });
      vi.spyOn(CourseService, 'getAutoLoginUrl').mockResolvedValue('https://moodle.example.com/sso/assign');

      const mod = {
        id: 88,
        url: 'https://moodle.example.com/mod/assign/view.php?id=88',
        contents: [
          { type: 'file', filename: 'guia.pdf', fileurl: 'https://moodle.example.com/guia.pdf', filesize: 2048 },
          { type: 'file', filename: 'rubrica.docx', fileurl: 'https://moodle.example.com/rubrica.docx', filesize: 4096 }
        ]
      };

      const el = await createAssignRenderer({ mod, courseId: 12 });

      expect(el.querySelector('.assign-description').textContent).toContain('Por favor entrega tu ensayo final');
      // Should de-duplicate guia.pdf and include rubrica.docx
      const fileLinks = el.querySelectorAll('ul li a');
      expect(fileLinks).toHaveLength(2);
      expect(el.querySelector('button.btn-primary')).not.toBeNull();
    });
  });

  describe('createResourceRenderer', () => {
    it('renders PDF in an iframe', () => {
      const mod = {
        contents: [
          { type: 'file', filename: 'documento.pdf', fileurl: 'https://moodle.example.com/doc.pdf', mimetype: 'application/pdf' }
        ]
      };
      const el = createResourceRenderer({ mod });
      const iframe = el.querySelector('iframe.pdf-iframe');
      expect(iframe).not.toBeNull();
      expect(iframe.src).toContain('https://moodle.example.com/doc.pdf?token=test-user-token-123');
    });

    it('renders inline image', () => {
      const mod = {
        contents: [
          { type: 'file', filename: 'infografia.png', fileurl: 'https://moodle.example.com/info.png', mimetype: 'image/png' }
        ]
      };
      const el = createResourceRenderer({ mod });
      const img = el.querySelector('img');
      expect(img).not.toBeNull();
      expect(img.src).toContain('https://moodle.example.com/info.png?token=test-user-token-123');
    });

    it('renders HTML5 video player', () => {
      const mod = {
        contents: [
          { type: 'file', filename: 'clase.mp4', fileurl: 'https://moodle.example.com/video.mp4', mimetype: 'video/mp4' }
        ]
      };
      const el = createResourceRenderer({ mod });
      const video = el.querySelector('video');
      expect(video).not.toBeNull();
      expect(video.controls).toBe(true);
      expect(video.src).toContain('https://moodle.example.com/video.mp4?token=test-user-token-123');
    });

    it('renders HTML5 audio player', () => {
      const mod = {
        contents: [
          { type: 'file', filename: 'podcast.mp3', fileurl: 'https://moodle.example.com/audio.mp3', mimetype: 'audio/mp3' }
        ]
      };
      const el = createResourceRenderer({ mod });
      const audio = el.querySelector('audio');
      expect(audio).not.toBeNull();
      expect(audio.controls).toBe(true);
      expect(audio.src).toContain('https://moodle.example.com/audio.mp3?token=test-user-token-123');
    });

    it('renders download button fallback for unsupported binary file formats', () => {
      const mod = {
        contents: [
          { type: 'file', filename: 'datos.zip', fileurl: 'https://moodle.example.com/datos.zip', mimetype: 'application/zip' }
        ]
      };
      const el = createResourceRenderer({ mod });
      const link = el.querySelector('a.btn-primary');
      expect(link).not.toBeNull();
      expect(link.textContent).toContain('Descargar / Abrir datos.zip');
    });

    it('renders empty state when resource has no file contents', () => {
      const el = createResourceRenderer({ mod: { contents: [] } });
      expect(el.innerHTML).toContain('Este recurso no tiene contenido disponible.');
    });

    it('handles undefined contents safely', () => {
      const el = createResourceRenderer({ mod: {} });
      expect(el.innerHTML).toContain('Este recurso no tiene contenido disponible.');
    });
  });

  describe('Additional Renderer Edge Cases', () => {
    it('createBookRenderer handles null contents or fetch errors gracefully', async () => {
      vi.spyOn(CourseService, 'fetchFileContent').mockResolvedValue(null);
      const elNull = createBookRenderer({ mod: {} });
      expect(elNull.innerHTML).toContain('Este libro no tiene capítulos.');

      const elFetchFail = createBookRenderer({
        mod: {
          contents: [{ type: 'file', filename: 'cap1.html', fileurl: 'https://moodle.example.com/cap1.html' }]
        }
      });
      await new Promise(r => setTimeout(r, 25));
      expect(elFetchFail.querySelector('.book-content-area').innerHTML).toContain('No se pudo cargar el capítulo.');
    });

    it('createH5pRenderer handles null activity intro gracefully', async () => {
      vi.spyOn(CourseService, 'getH5pActivityIntro').mockResolvedValue(null);
      const el = createH5pRenderer({ mod: { id: 99, url: 'https://moodle.example.com/mod/h5p/view.php?id=99' }, courseId: 1 });
      await new Promise(r => setTimeout(r, 25));
      expect(el.querySelector('.h5p-description')).toBeNull();
    });

    it('createAssignRenderer handles null assignment data gracefully', async () => {
      vi.spyOn(CourseService, 'getAssignmentData').mockResolvedValue(null);
      const el = await createAssignRenderer({ mod: { id: 101, url: 'https://moodle.example.com/mod/assign/view.php?id=101' }, courseId: 2 });
      expect(el.classList.contains('assign-content')).toBe(true);
      expect(el.querySelector('.assign-description')).toBeNull();
    });
  });
});
