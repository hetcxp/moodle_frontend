import { describe, it, expect, beforeEach, vi } from 'vitest';
import { ForumService } from '../src/services/forum.js';
import { MoodleApi } from '../src/services/moodle-api.js';

describe('ForumService', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  describe('getForumId', () => {
    it('returns instanceHint immediately if provided', async () => {
      const result = await ForumService.getForumId(10, 100, 55);
      expect(result).toBe(55);
    });

    it('queries MoodleApi when instanceHint is missing', async () => {
      vi.spyOn(MoodleApi, 'callWithFallback').mockResolvedValue([
        { id: 77, coursemodule: 100 },
        { id: 88, coursemodule: 200 }
      ]);

      const result = await ForumService.getForumId(10, 100, null);
      expect(result).toBe(77);
      expect(MoodleApi.callWithFallback).toHaveBeenCalledWith('mod_forum_get_forums_by_courses', {
        'courseids[0]': 10
      });
    });
  });

  describe('getDiscussions', () => {
    it('fetches discussions with sorting and pagination', async () => {
      vi.spyOn(MoodleApi, 'call').mockResolvedValue({
        discussions: [{ id: 1, name: 'Bienvenida al curso' }],
        warnings: []
      });

      const result = await ForumService.getDiscussions(77, 0, 20);

      expect(MoodleApi.call).toHaveBeenCalledWith('mod_forum_get_forum_discussions', {
        forumid: 77,
        sortorder: -1,
        page: 0,
        perpage: 20
      });
      expect(result.discussions).toHaveLength(1);
      expect(result.discussions[0].name).toBe('Bienvenida al curso');
    });

    it('returns empty array on API error without throwing', async () => {
      vi.spyOn(MoodleApi, 'call').mockRejectedValue(new Error('Network error'));

      const result = await ForumService.getDiscussions(77);
      expect(result).toEqual({ discussions: [], warnings: [] });
    });
  });

  describe('addDiscussion & addPost', () => {
    it('creates new discussion with proper format', async () => {
      vi.spyOn(MoodleApi, 'call').mockResolvedValue({ discussionid: 101 });

      const result = await ForumService.addDiscussion(77, 'Tema de Consulta', 'Tengo una duda...');
      expect(MoodleApi.call).toHaveBeenCalledWith('mod_forum_add_discussion', {
        forumid: 77,
        subject: 'Tema de Consulta',
        message: 'Tengo una duda...',
        messageformat: 1
      });
      expect(result.discussionid).toBe(101);
    });

    it('creates reply post under parent post', async () => {
      vi.spyOn(MoodleApi, 'call').mockResolvedValue({ postid: 202 });

      const result = await ForumService.addPost(101, 50, 'Respuesta a la duda');
      expect(MoodleApi.call).toHaveBeenCalledWith('mod_forum_add_discussion_post', {
        postid: 50,
        message: 'Respuesta a la duda',
        messageformat: 1
      });
      expect(result.postid).toBe(202);
    });
  });
});
