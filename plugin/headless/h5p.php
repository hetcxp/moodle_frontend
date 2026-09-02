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
 * H5P embed bridge endpoint for headless frontend.
 *
 * @package    local_headless
 * @copyright  2024 Hector Teran
 * @license    https://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */

$config_paths = [
    __DIR__ . '/../../config.php',
];
if (isset($_SERVER['SCRIPT_FILENAME'])) {
    $config_paths[] = dirname(dirname(dirname($_SERVER['SCRIPT_FILENAME']))) . '/config.php';
    $config_paths[] = dirname(dirname($_SERVER['SCRIPT_FILENAME'])) . '/config.php';
    $config_paths[] = dirname($_SERVER['SCRIPT_FILENAME']) . '/config.php';
}
if (isset($_SERVER['DOCUMENT_ROOT'])) {
    $config_paths[] = $_SERVER['DOCUMENT_ROOT'] . '/../config.php';
    $config_paths[] = $_SERVER['DOCUMENT_ROOT'] . '/config.php';
}
foreach ($config_paths as $path) {
    if (file_exists($path)) {
        require_once($path);
        break;
    }
}

$id = required_param('id', PARAM_INT); // Course module ID
$token = optional_param('token', '', PARAM_ALPHANUMEXT);

if (!empty($token)) {
    global $DB, $CFG;
    $usertoken = $DB->get_record('external_tokens', ['token' => $token]);
    if ($usertoken && ($usertoken->validuntil == 0 || $usertoken->validuntil > time())) {
        $user = core_user::get_user($usertoken->userid);
        if ($user) {
            core_user::require_active_user($user, true, true);
            complete_user_login($user);
            \core\session\manager::apply_concurrent_login_limit($user->id, session_id());
            
            // Force the session cookie to be SameSite=None and Secure for third-party iframe support
            $sessionname = session_name();
            $sessionid = session_id();
            $cookiepath = $CFG->sessioncookiepath;
            $cookiedomain = $CFG->sessioncookiedomain;
            
            if (PHP_VERSION_ID >= 70300) {
                setcookie($sessionname, $sessionid, [
                    'expires' => 0,
                    'path' => $cookiepath,
                    'domain' => $cookiedomain,
                    'secure' => true,
                    'httponly' => true,
                    'samesite' => 'None'
                ]);
            }
        }
    }
}

try {
    list($course, $cm) = get_course_and_cm_from_cmid($id, 'h5pactivity');
    require_login($course, true, $cm);

    $context = context_module::instance($cm->id);

    $fs = get_file_storage();
    $files = $fs->get_area_files($context->id, 'mod_h5pactivity', 'package', 0, 'id', false);
    if (empty($files)) {
        print_error('filenotfound');
    }
    $file = reset($files);
    $fileurl = moodle_url::make_pluginfile_url(
        $file->get_contextid(),
        $file->get_component(),
        $file->get_filearea(),
        $file->get_itemid(),
        $file->get_filepath(),
        $file->get_filename(),
        false
    );

    $_GET['url'] = $fileurl->out(false);
    $_GET['component'] = 'mod_h5pactivity';

    require_once($CFG->dirroot . '/h5p/embed.php');
    exit;
} catch (Exception $e) {
    print_error('error', 'local_headless', '', $e->getMessage());
}
