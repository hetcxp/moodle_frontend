import { MoodleApi } from './moodle-api.js';
import { AuthService } from './auth.js';

export const CourseService = {
  async getEnrolledCourses() {
    const user = AuthService.getUser();
    if (!user) return [];
    
    try {
      const courses = await MoodleApi.call('core_enrol_get_users_courses', {
        userid: user.userid
      });
      return Array.isArray(courses) ? courses : [];
    } catch (e) {
      console.error('Failed to fetch enrolled courses', e);
      return [];
    }
  },

  async getAllVisibleCourses() {
    try {
      // search_courses with empty search returns all visible courses
      const result = await MoodleApi.call('core_course_search_courses', {
        criterianame: 'search',
        criteriavalue: ''
      });
      return result.courses || [];
    } catch (e) {
      console.error('Failed to fetch visible courses', e);
      return [];
    }
  },

  async getDashboardCourses() {
    const [enrolled, all] = await Promise.all([
      this.getEnrolledCourses(),
      this.getAllVisibleCourses()
    ]);
    
    const enrolledIds = new Set(enrolled.map(c => c.id));
    
    const active = enrolled.filter(c => !(c.completed === true || c.completed === 1 || c.progress === 100));
    const completed = enrolled.filter(c => (c.completed === true || c.completed === 1 || c.progress === 100));
    
    // Ordenar activos por último acceso (más reciente primero)
    active.sort((a, b) => (b.lastaccess || 0) - (a.lastaccess || 0));
    
    // Ordenar terminados por fecha de término (más reciente primero), fallback a lastaccess
    completed.sort((a, b) => {
      const timeA = a.timecompleted || a.lastaccess || 0;
      const timeB = b.timecompleted || b.lastaccess || 0;
      return timeB - timeA;
    });
    
    const availableRaw = all.filter(c => !enrolledIds.has(c.id));
    
    // Group available by category
    const availableByCategory = availableRaw.reduce((acc, course) => {
      const cat = course.categoryname || 'General';
      if (!acc[cat]) acc[cat] = [];
      acc[cat].push(course);
      return acc;
    }, {});
    
    return {
      active,
      completed,
      availableByCategory
    };
  },

  async getCourseContents(courseId, useAdmin = false) {
    try {
      const customToken = useAdmin ? import.meta.env.VITE_MOODLE_ADMIN_TOKEN : null;
      const contents = await MoodleApi.call('core_course_get_contents', {
        courseid: courseId
      }, customToken);
      return Array.isArray(contents) ? contents : [];
    } catch (e) {
      console.error(`Failed to fetch contents for course ${courseId}`, e);
      return [];
    }
  },

  async getPageContent(courseId, cmId) {
    const response = await MoodleApi.callWithFallback('mod_page_get_pages_by_courses', {
      'courseids[0]': courseId
    });
    if (response && response.pages) {
      return response.pages.find(p => p.coursemodule == cmId) || null;
    }
    return null;
  },

  async getScormAttemptCount(scormId) {
    const user = AuthService.getUser();
    if (!user) return 0;
    
    try {
      const result = await MoodleApi.call('mod_scorm_get_scorm_attempt_count', {
        scormid: scormId,
        userid: user.userid,
        ignoremissingcompletion: 0
      });
      return result.attemptscount !== undefined ? result.attemptscount : (result.attempts || 0);
    } catch (e) {
      console.error(`Failed to fetch SCORM attempt count for scormId ${scormId}`, e);
      return null;
    }
  },

  async getAutoLoginUrl(url) {
    return await MoodleApi.getAutoLoginUrl(url);
  },

  async getActivitiesCompletionStatus(courseId) {
    const user = AuthService.getUser();
    if (!user) return {};
    try {
      const result = await MoodleApi.call('core_completion_get_activities_completion_status', {
        courseid: courseId,
        userid: user.userid
      });
      const map = {};
      (result.statuses || []).forEach(s => { map[s.cmid] = s; });
      return map;
    } catch (e) {
      console.error('Failed to fetch completion status', e);
      return {};
    }
  },

  async markActivityComplete(cmId, completed) {
    try {
      await MoodleApi.call('core_completion_update_activity_completion_status_manually', {
        cmid: cmId,
        completed: completed ? 1 : 0
      });
      return true;
    } catch (e) {
      console.error('Failed to mark activity complete', e);
      return false;
    }
  },

  async getH5pActivityIntro(courseId, cmId) {
    const result = await MoodleApi.callWithFallback('mod_h5pactivity_get_h5pactivities_by_courses', {
      'courseids[0]': courseId
    });
    if (result && result.h5pactivities) {
      const activity = result.h5pactivities.find(a => a.coursemodule == cmId);
      return activity ? activity.intro : null;
    }
    return null;
  },

  async getAssignmentData(courseId, cmId) {
    const data = await MoodleApi.callWithFallback('mod_assign_get_assignments', {
      'courseids[0]': courseId
    });
    if (data && data.courses && data.courses.length > 0) {
      return (data.courses[0].assignments || []).find(a => a.cmid == cmId) || null;
    }
    return null;
  },

  async fetchFileContent(fileUrl) {
    const token = AuthService.getToken();
    if (!token || !fileUrl) return null;
    
    try {
      const joiner = fileUrl.includes('?') ? '&' : '?';
      const urlWithToken = `${fileUrl}${joiner}token=${token}`;
      const response = await fetch(urlWithToken);
      if (response.ok) {
        return await response.text();
      }
    } catch (e) {
      console.error('Failed to fetch file content', e);
    }
    return null;
  }
};
