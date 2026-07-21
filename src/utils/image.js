import { API_CONFIG } from '../config/api.js';
import { AuthService } from '../services/auth.js';

export function getCourseImageUrl(course) {
  // 1. If course has direct courseimage field (Moodle 4.0+ enrol endpoint)
  if (course.courseimage) {
    if (course.courseimage.includes('?')) {
      return `${course.courseimage}&token=${AuthService.getToken()}`;
    }
    return `${course.courseimage}?token=${AuthService.getToken()}`;
  }

  // 2. If course has overviewfiles array (Moodle search endpoint)
  if (course.overviewfiles && course.overviewfiles.length > 0) {
    const file = course.overviewfiles[0];
    if (file.fileurl) {
      if (file.fileurl.includes('?')) {
        return `${file.fileurl}&token=${AuthService.getToken()}`;
      }
      return `${file.fileurl}?token=${AuthService.getToken()}`;
    }
  }

  // 3. Fallback generic image
  return '/generic-course.svg';
}
