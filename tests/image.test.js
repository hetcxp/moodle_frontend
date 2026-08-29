import { describe, it, expect, beforeEach, vi } from 'vitest';
import { getCourseImageUrl, replacePluginfileUrls, replaceRelativeImages } from '../src/utils/image.js';
import { AuthService } from '../src/services/auth.js';

describe('Image and Media URL Utilities', () => {
  beforeEach(() => {
    vi.spyOn(AuthService, 'getToken').mockReturnValue('mock-auth-token-123');
  });

  describe('getCourseImageUrl', () => {
    it('returns processed URL with token when course has courseimage', () => {
      const course = {
        id: 1,
        courseimage: 'https://moodle.example.com/pluginfile.php/123/course/overviewfiles/cover.jpg'
      };
      const result = getCourseImageUrl(course);
      expect(result).toBe('https://moodle.example.com/webservice/pluginfile.php/123/course/overviewfiles/cover.jpg?token=mock-auth-token-123');
    });

    it('returns processed URL with token when course has overviewfiles', () => {
      const course = {
        id: 2,
        overviewfiles: [
          { fileurl: 'https://moodle.example.com/webservice/pluginfile.php/456/course/overviewfiles/image.png?forcedownload=1' }
        ]
      };
      const result = getCourseImageUrl(course);
      expect(result).toBe('https://moodle.example.com/webservice/pluginfile.php/456/course/overviewfiles/image.png?forcedownload=1&token=mock-auth-token-123');
    });

    it('returns fallback generic image when no image fields exist', () => {
      const course = { id: 3 };
      const result = getCourseImageUrl(course);
      expect(result).toContain('generic-course.svg');
    });
  });

  describe('replacePluginfileUrls', () => {
    it('appends token to pluginfile image sources in HTML', () => {
      const inputHtml = '<p><img src="https://moodle.example.com/pluginfile.php/789/mod_page/content/photo.jpg" alt="test"></p>';
      const result = replacePluginfileUrls(inputHtml);
      expect(result).toContain('/webservice/pluginfile.php/789/mod_page/content/photo.jpg?token=mock-auth-token-123');
    });

    it('does not duplicate token if already present in URL', () => {
      const inputHtml = '<img src="https://moodle.example.com/webservice/pluginfile.php/789/mod_page/content/photo.jpg?token=existing-token">';
      const result = replacePluginfileUrls(inputHtml);
      expect(result).toBe(inputHtml);
    });

    it('returns unchanged HTML if empty or null', () => {
      expect(replacePluginfileUrls('')).toBe('');
      expect(replacePluginfileUrls(null)).toBe(null);
    });
  });

  describe('replaceRelativeImages', () => {
    it('maps relative image filenames in HTML to authenticated URLs from file contents', () => {
      const inputHtml = '<div><img src="images/diagram.png"><img src="icon.svg"></div>';
      const contents = [
        { type: 'file', filename: 'diagram.png', fileurl: 'https://moodle.example.com/file.php/1' },
        { type: 'file', filename: 'icon.svg', fileurl: 'https://moodle.example.com/file.php/2' },
        { type: 'file', filename: 'document.pdf', fileurl: 'https://moodle.example.com/file.php/3' }
      ];

      const result = replaceRelativeImages(inputHtml, contents);
      expect(result).toContain('https://moodle.example.com/file.php/1?token=mock-auth-token-123');
      expect(result).toContain('https://moodle.example.com/file.php/2?token=mock-auth-token-123');
    });
  });
});
