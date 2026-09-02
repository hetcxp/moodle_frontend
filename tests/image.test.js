import { describe, it, expect, beforeEach, vi } from 'vitest';
import { 
  getCourseImageUrl, 
  getDirectCourseImageUrl, 
  normalizeMoodleUrl, 
  replacePluginfileUrls, 
  replaceRelativeImages 
} from '../src/utils/image.js';
import { AuthService } from '../src/services/auth.js';

describe('Image and Media URL Utilities', () => {
  beforeEach(() => {
    vi.spyOn(AuthService, 'getToken').mockReturnValue('mock-auth-token-123');
  });

  describe('normalizeMoodleUrl', () => {
    it('strips forcedownload=1 to enable inline display', () => {
      const url = 'https://moodle.example.com/webservice/pluginfile.php/123/course/overviewfiles/cover.jpg?forcedownload=1';
      expect(normalizeMoodleUrl(url)).toBe('https://moodle.example.com/webservice/pluginfile.php/123/course/overviewfiles/cover.jpg');
    });

    it('handles relative URLs by prepending origin/baseUrl', () => {
      const url = '/pluginfile.php/123/course/overviewfiles/cover.jpg';
      const result = normalizeMoodleUrl(url);
      expect(result).toContain('/pluginfile.php/123/course/overviewfiles/cover.jpg');
      expect(result.startsWith('http')).toBe(true);
    });
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

    it('returns processed URL with token and cleans forcedownload when course has overviewfiles', () => {
      const course = {
        id: 2,
        overviewfiles: [
          { fileurl: 'https://moodle.example.com/webservice/pluginfile.php/456/course/overviewfiles/image.png?forcedownload=1' }
        ]
      };
      const result = getCourseImageUrl(course);
      expect(result).toBe('https://moodle.example.com/webservice/pluginfile.php/456/course/overviewfiles/image.png?token=mock-auth-token-123');
    });

    it('returns fallback generic image when no image fields exist', () => {
      const course = { id: 3 };
      const result = getCourseImageUrl(course);
      expect(result).toContain('generic-course.svg');
    });
  });

  describe('getDirectCourseImageUrl', () => {
    it('returns standard /pluginfile.php URL without token for session-based fallback', () => {
      const course = {
        id: 1,
        courseimage: 'https://moodle.example.com/webservice/pluginfile.php/123/course/overviewfiles/cover.jpg?token=existing-token'
      };
      const result = getDirectCourseImageUrl(course);
      expect(result).toBe('https://moodle.example.com/pluginfile.php/123/course/overviewfiles/cover.jpg');
    });

    it('returns fallback generic image when course has no images', () => {
      const course = { id: 4 };
      const result = getDirectCourseImageUrl(course);
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

    it('handles image filenames with special regex characters safely', () => {
      const inputHtml = '<div><img src="diagram (1)+v2[final].png"></div>';
      const contents = [
        { type: 'file', filename: 'diagram (1)+v2[final].png', fileurl: 'https://moodle.example.com/file.php/special' }
      ];

      const result = replaceRelativeImages(inputHtml, contents);
      expect(result).toContain('https://moodle.example.com/file.php/special?token=mock-auth-token-123');
    });
  });
});
