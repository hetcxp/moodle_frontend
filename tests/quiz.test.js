import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { QuizService } from '../src/services/quiz.js';
import { MoodleApi } from '../src/services/moodle-api.js';
import { AuthService } from '../src/services/auth.js';

describe('QuizService', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('getUserAttempts', () => {
    it('returns empty array if user is not authenticated', async () => {
      vi.spyOn(AuthService, 'getUser').mockReturnValue(null);
      const attempts = await QuizService.getUserAttempts(10);
      expect(attempts).toEqual([]);
    });

    it('fetches user attempts including preview attempts (includepreviews: 1)', async () => {
      vi.spyOn(AuthService, 'getUser').mockReturnValue({ userid: 42 });
      const apiSpy = vi.spyOn(MoodleApi, 'call').mockResolvedValue({
        attempts: [
          { id: 101, attempt: 1, state: 'inprogress', preview: 1 }
        ]
      });

      const attempts = await QuizService.getUserAttempts(5);

      expect(apiSpy).toHaveBeenCalledWith('mod_quiz_get_user_attempts', {
        quizid: 5,
        userid: 42,
        status: 'all',
        includepreviews: 1
      });
      expect(attempts).toHaveLength(1);
      expect(attempts[0].id).toBe(101);
    });

    it('falls back to minimal params with includepreviews: 1 when userid call fails', async () => {
      vi.spyOn(AuthService, 'getUser').mockReturnValue({ userid: 42 });
      const apiSpy = vi.spyOn(MoodleApi, 'call')
        .mockRejectedValueOnce(new Error('Permission denied for userid param'))
        .mockResolvedValueOnce({
          attempts: [
            { id: 202, attempt: 1, state: 'inprogress', preview: 1 }
          ]
        });

      const attempts = await QuizService.getUserAttempts(7);

      expect(apiSpy).toHaveBeenCalledTimes(2);
      expect(apiSpy).toHaveBeenNthCalledWith(2, 'mod_quiz_get_user_attempts', {
        quizid: 7,
        status: 'all',
        includepreviews: 1
      });
      expect(attempts).toHaveLength(1);
      expect(attempts[0].id).toBe(202);
    });
  });

  describe('startAttempt', () => {
    it('starts an attempt and returns attempt object', async () => {
      vi.spyOn(MoodleApi, 'call').mockResolvedValue({
        attempt: { id: 303, quiz: 5, state: 'inprogress' }
      });

      const result = await QuizService.startAttempt(5);
      expect(result).toEqual({ id: 303, quiz: 5, state: 'inprogress' });
    });
  });

  describe('getAttemptData & saveAttempt & processAttempt', () => {
    it('gets attempt data for a specific page', async () => {
      vi.spyOn(MoodleApi, 'call').mockResolvedValue({
        attempt: { id: 101 },
        questions: [{ slot: 1, html: '<p>Q1</p>' }],
        nextpage: 1
      });

      const data = await QuizService.getAttemptData(101, 0);
      expect(data.questions).toHaveLength(1);
      expect(data.nextpage).toBe(1);
    });

    it('saves attempt data array', async () => {
      const apiSpy = vi.spyOn(MoodleApi, 'call').mockResolvedValue({ status: true });

      const res = await QuizService.saveAttempt(101, [
        { name: 'q1:1_answer', value: '1' }
      ]);

      expect(apiSpy).toHaveBeenCalledWith('mod_quiz_save_attempt', {
        attemptid: 101,
        'data[0][name]': 'q1:1_answer',
        'data[0][value]': '1'
      });
      expect(res).toBe(true);
    });

    it('processes attempt and finishes', async () => {
      const apiSpy = vi.spyOn(MoodleApi, 'call').mockResolvedValue({ state: 'finished' });

      const res = await QuizService.processAttempt(101, [{ name: 'q1:1_answer', value: '1' }], true);

      expect(apiSpy).toHaveBeenCalledWith('mod_quiz_process_attempt', {
        attemptid: 101,
        finishattempt: 1,
        timeup: 0,
        'data[0][name]': 'q1:1_answer',
        'data[0][value]': '1'
      });
      expect(res.state).toBe('finished');
    });
  });
});
