import { MoodleApi } from './moodle-api.js';
import { AuthService } from './auth.js';
import { logger } from '../utils/logger.js';

export const QuizService = {
  async getQuiz(courseId, mod) {
    const response = await MoodleApi.callWithFallback('mod_quiz_get_quizzes_by_courses', {
      'courseids[0]': courseId
    });
    if (response && response.quizzes) {
      return response.quizzes.find(q => q.coursemodule == mod.id || q.id == mod.instance) || null;
    }
    return null;
  },

  async getUserAttempts(quizId) {
    const user = AuthService.getUser();
    if (!user) return [];
    try {
      const response = await MoodleApi.call('mod_quiz_get_user_attempts', {
        quizid: quizId,
        userid: user.userid,
        status: 'all',
        includepreviews: 1
      });
      return response.attempts || [];
    } catch (e) {
      logger.warn(`Attempt fetching with userid failed for quizId ${quizId}, retrying with minimal params:`, e);
      try {
        const fallback = await MoodleApi.call('mod_quiz_get_user_attempts', {
          quizid: quizId,
          status: 'all',
          includepreviews: 1
        });
        return fallback.attempts || [];
      } catch (e2) {
        logger.error(`Failed to fetch user attempts for quizId ${quizId}:`, e2);
        return [];
      }
    }
  },

  async startAttempt(quizId) {
    try {
      const response = await MoodleApi.call('mod_quiz_start_attempt', {
        quizid: quizId
      });
      return response.attempt || null;
    } catch (e) {
      logger.error(`Error starting attempt for quizId ${quizId}:`, e);
      throw e;
    }
  },

  async getAttemptData(attemptId, page = 0) {
    try {
      const response = await MoodleApi.call('mod_quiz_get_attempt_data', {
        attemptid: attemptId,
        page: page
      });
      return response;
    } catch (e) {
      logger.error(`Error getting attempt data for attemptId ${attemptId}, page ${page}:`, e);
      throw e;
    }
  },

  async saveAttempt(attemptId, dataArray = []) {
    try {
      const params = {
        attemptid: attemptId
      };
      dataArray.forEach((item, i) => {
        params[`data[${i}][name]`] = item.name;
        params[`data[${i}][value]`] = item.value;
      });
      const response = await MoodleApi.call('mod_quiz_save_attempt', params);
      return response.status || false;
    } catch (e) {
      logger.error(`Error saving attempt ${attemptId}:`, e);
      return false;
    }
  },

  async processAttempt(attemptId, dataArray = [], finishAttempt = false) {
    try {
      const params = {
        attemptid: attemptId,
        finishattempt: finishAttempt ? 1 : 0,
        timeup: 0
      };
      dataArray.forEach((item, i) => {
        params[`data[${i}][name]`] = item.name;
        params[`data[${i}][value]`] = item.value;
      });
      const response = await MoodleApi.call('mod_quiz_process_attempt', params);
      return response;
    } catch (e) {
      logger.error(`Error processing attempt ${attemptId}:`, e);
      throw e;
    }
  },

  async getAttemptReview(attemptId) {
    try {
      const response = await MoodleApi.call('mod_quiz_get_attempt_review', {
        attemptid: attemptId,
        page: -1
      });
      return response;
    } catch (e) {
      logger.error(`Error fetching attempt review for attemptId ${attemptId}:`, e);
      return null;
    }
  }
};
