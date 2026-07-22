import { MoodleApi } from './moodle-api.js';
import { AuthService } from './auth.js';

export const ForumService = {
  async getForumId(courseId, cmId, instanceHint) {
    if (instanceHint) return instanceHint;
    try {
      const res = await MoodleApi.call('mod_forum_get_forums_by_courses', {
        'courseids[0]': courseId,
      });
      const forums = Array.isArray(res) ? res : (res.forums || []);
      const forum = forums.find(f => f.coursemodule == cmId);
      return forum ? forum.id : null;
    } catch (e) {
      console.error('ForumService.getForumId error', e);
      return null;
    }
  },

  async getDiscussions(forumId, page = 0, perPage = 20) {
    try {
      const res = await MoodleApi.call('mod_forum_get_forum_discussions', {
        forumid: forumId,
        sortorder: -1,
        page,
        perpage: perPage,
      });
      return {
        discussions: res.discussions || [],
        warnings: res.warnings || [],
      };
    } catch (e) {
      console.error('ForumService.getDiscussions error', e);
      return { discussions: [], warnings: [] };
    }
  },

  async getPosts(discussionId) {
    try {
      const res = await MoodleApi.call('mod_forum_get_forum_discussion_posts', {
        discussionid: discussionId,
      });
      return res.posts || [];
    } catch (e) {
      console.error('ForumService.getPosts error', e);
      return [];
    }
  },

  async addDiscussion(forumId, subject, message) {
    try {
      const res = await MoodleApi.call('mod_forum_add_discussion', {
        forumid: forumId,
        subject,
        message,
        messageformat: 1,
      });
      return res;
    } catch (e) {
      console.error('ForumService.addDiscussion error', e);
      throw e;
    }
  },

  async addPost(discussionId, parentPostId, message) {
    try {
      const res = await MoodleApi.call('mod_forum_add_discussion_post', {
        postid: parentPostId,
        message,
        messageformat: 1,
      });
      return res;
    } catch (e) {
      console.error('ForumService.addPost error', e);
      throw e;
    }
  },

  getCurrentUser() {
    return AuthService.getUser();
  },
};
