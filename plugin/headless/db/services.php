<?php
// This file is part of Moodle - https://moodle.org/
//
// Moodle is free software: you can redistribute it and/or modify
// it under the terms of the GNU General Public License as published by
// the Free Software Foundation, either version 3 of the License, or
// (at your option) any later version.
//
// Moodle is distributed in the hope that it will be useful,
// but WITHOUT ANY WARRANTY; without even the implied warranty of
// MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
// GNU General Public License for more details.
//
// You should have received a copy of the GNU General Public License
// along with Moodle.  If not, see <https://www.gnu.org/licenses/>.

/**
 * Web service function definitions for local_headless.
 *
 * @package    local_headless
 * @copyright  2024 Hector Teran
 * @license    https://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */

defined('MOODLE_INTERNAL') || die();

$functions = [
    'local_headless_get_autologin_key' => [
        'classname'   => 'local_headless\external',
        'methodname'  => 'get_autologin_key',
        'classpath'   => 'local/headless/classes/external.php',
        'description' => 'Get an autologin key for headless frontend.',
        'type'        => 'read',
        'ajax'        => true,
    ],
    'local_headless_change_password' => [
        'classname'   => 'local_headless\external',
        'methodname'  => 'change_password',
        'classpath'   => 'local/headless/classes/external.php',
        'description' => 'Allows a user with forcepasswordchange flag to set a new password',
        'type'        => 'write',
        'loginrequired' => true,
    ],
    'local_headless_get_user_enrolments' => [
        'classname'   => 'local_headless\external',
        'methodname'  => 'get_user_enrolments',
        'classpath'   => 'local/headless/classes/external.php',
        'description' => 'Get active enrolments and expiration timestamps for a user',
        'type'        => 'read',
        'ajax'        => true,
        'loginrequired' => true,
    ],
];

$services = [
    'Headless Service' => [
        'functions' => [
            'local_headless_get_autologin_key',
            'local_headless_change_password',
            'local_headless_get_user_enrolments',
            'core_webservice_get_site_info',
            'core_enrol_get_users_courses',
            'core_course_search_courses',
            'core_course_get_contents',
            'mod_page_get_pages_by_courses',
            'mod_scorm_get_scorm_attempt_count',
            'core_completion_get_activities_completion_status',
            'core_completion_update_activity_completion_status_manually',
            'mod_h5pactivity_get_h5pactivities_by_courses',
            'mod_assign_get_assignments',
            'mod_customcert_get_customcerts_by_courses',
            'mod_customcert_get_issuances',
            'mod_quiz_get_quizzes_by_courses',
            'mod_quiz_get_user_attempts',
            'mod_quiz_start_attempt',
            'mod_quiz_get_attempt_data',
            'mod_quiz_save_attempt',
            'mod_quiz_process_attempt',
            'mod_quiz_get_attempt_review',
            'mod_quiz_get_attempt_summary',
            'mod_quiz_view_quiz',
            'mod_forum_get_forums_by_courses',
            'mod_forum_get_forum_discussions',
            'mod_forum_get_forum_discussion_posts',
            'mod_forum_add_discussion',
            'mod_forum_add_discussion_post',
        ],
        'restrictedusers' => 0,
        'enabled' => 1,
        'shortname' => 'headless_service',
        'downloadfiles' => 1,
        'uploadfiles' => 1,
    ],
];
