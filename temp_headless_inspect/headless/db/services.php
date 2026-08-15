<?php
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
];

$services = [
    'Headless Service' => [
        'functions' => [
            'local_headless_get_autologin_key',
            'local_headless_change_password',
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
        ],
        'restrictedusers' => 0,
        'enabled' => 1,
        'shortname' => 'headless_service',
    ],
];
