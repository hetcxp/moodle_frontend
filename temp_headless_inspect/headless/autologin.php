<?php
require_once(__DIR__ . '/../../config.php');

$userid = required_param('userid', PARAM_INT);
$key = required_param('key', PARAM_ALPHANUMEXT);
$urltogo = optional_param('urltogo', $CFG->wwwroot, PARAM_URL);
$urltogo = $urltogo ?: $CFG->wwwroot;

$context = context_system::instance();
$PAGE->set_context($context);

if (isloggedin() and !isguestuser()) {
    delete_user_key('tool_mobile', $userid);
    if ($USER->id == $userid) {
        redirect($urltogo);
    } else {
        throw new moodle_exception('alreadyloggedin', 'error', '', format_string(fullname($USER)));
    }
}

// Custom check for local plugin, skipping the strict HTTPS check of the mobile app
$key = validate_user_key($key, 'tool_mobile', null);
delete_user_key('tool_mobile', $userid);

if ($key->userid != $userid) {
    throw new moodle_exception('invalidkey');
}

$user = core_user::get_user($key->userid, '*', MUST_EXIST);
core_user::require_active_user($user, true, true);

if (!$user = get_complete_user_data('id', $user->id)) {
    throw new moodle_exception('cannotfinduser', '', '', $user->id);
}

complete_user_login($user);
\core\session\manager::apply_concurrent_login_limit($user->id, session_id());
redirect($urltogo);
