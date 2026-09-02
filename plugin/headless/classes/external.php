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
 * External Web Service API definitions for local_headless.
 *
 * @package    local_headless
 * @copyright  2024 Hector Teran
 * @license    https://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */

namespace local_headless;

defined('MOODLE_INTERNAL') || die();

use context_system;
use core_external\external_api;
use core_external\external_function_parameters;
use core_external\external_multiple_structure;
use core_external\external_single_structure;
use core_external\external_value;

/**
 * External Web Service API implementation for local_headless.
 *
 * @package    local_headless
 * @category   external
 * @copyright  2024 Hector Teran
 * @license    https://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */
class external extends external_api {

    /**
     * Parameter definition for get_autologin_key external function.
     *
     * @return external_function_parameters
     */
    public static function get_autologin_key_parameters(): external_function_parameters {
        return new external_function_parameters([]);
    }

    /**
     * Generate a short-lived auto-login key for seamless Moodle authentication.
     *
     * @return array Array containing the generated key and the autologin url.
     */
    public static function get_autologin_key(): array {
        global $USER, $CFG;

        $context = context_system::instance();
        self::validate_context($context);

        require_once($CFG->libdir . '/moodlelib.php');

        // Borrar keys anteriores del mismo usuario para evitar conflictos
        delete_user_key('tool_mobile', $USER->id);

        // Crear key nueva sin IP restriction y TTL de 1 minuto
        $validuntil = time() + 60;
        $key = create_user_key('tool_mobile', $USER->id, null, null, $validuntil);

        $autologinurl = $CFG->wwwroot . '/local/headless/autologin.php';

        return [
            'key'          => $key,
            'autologinurl' => $autologinurl,
        ];
    }

    /**
     * Return definition for get_autologin_key external function.
     *
     * @return external_single_structure
     */
    public static function get_autologin_key_returns(): external_single_structure {
        return new external_single_structure([
            'key'          => new external_value(PARAM_ALPHANUMEXT, 'Auto-login key'),
            'autologinurl' => new external_value(PARAM_URL, 'Auto-login URL'),
        ]);
    }

    /**
     * Parameter definition for change_password external function.
     *
     * @return external_function_parameters
     */
    public static function change_password_parameters(): external_function_parameters {
        return new external_function_parameters([
            'newpassword' => new external_value(PARAM_RAW, 'New user password')
        ]);
    }

    /**
     * Change user password when forced password change preference is set.
     *
     * @param string $newpassword The new password to set.
     * @return array Result status and error message if any.
     */
    public static function change_password(string $newpassword): array {
        global $USER;

        $context = context_system::instance();
        self::validate_context($context);

        $params = self::validate_parameters(self::change_password_parameters(), ['newpassword' => $newpassword]);

        if (get_user_preferences('auth_forcepasswordchange', 0, $USER->id) != 1) {
            return ['success' => false, 'errormessage' => get_string('errornotrequiredtopasswordchange', 'local_headless')];
        }

        $errmsg = '';
        $valid = check_password_policy($params['newpassword'], $errmsg);

        if (!$valid) {
            return ['success' => false, 'errormessage' => $errmsg];
        }

        update_internal_user_password($USER, $params['newpassword']);
        unset_user_preference('auth_forcepasswordchange', $USER->id);

        return ['success' => true, 'errormessage' => ''];
    }

    /**
     * Return definition for change_password external function.
     *
     * @return external_single_structure
     */
    public static function change_password_returns(): external_single_structure {
        return new external_single_structure([
            'success'      => new external_value(PARAM_BOOL, 'True if password changed successfully'),
            'errormessage' => new external_value(PARAM_TEXT, 'Error message if any'),
        ]);
    }

    /**
     * Parameter definition for get_user_enrolments external function.
     *
     * @return external_function_parameters
     */
    public static function get_user_enrolments_parameters(): external_function_parameters {
        return new external_function_parameters([
            'userid' => new external_value(PARAM_INT, 'User ID (0 for current user)', VALUE_DEFAULT, 0),
        ]);
    }

    /**
     * Get active enrolments with expiration timestamps (timestart, timeend) for a user.
     *
     * @param int $userid
     * @return array
     */
    public static function get_user_enrolments(int $userid = 0): array {
        global $DB, $USER;

        $context = context_system::instance();
        self::validate_context($context);

        $params = self::validate_parameters(self::get_user_enrolments_parameters(), ['userid' => $userid]);
        $targetuserid = empty($params['userid']) ? $USER->id : (int)$params['userid'];

        if ($targetuserid != $USER->id) {
            require_capability('moodle/user:viewdetails', $context);
        }

        $sql = "SELECT ue.id, e.courseid, ue.timestart, ue.timeend
                  FROM {user_enrolments} ue
                  JOIN {enrol} e ON e.id = ue.enrolid
                 WHERE ue.userid = :userid AND ue.status = 0 AND e.status = 0";
        $records = $DB->get_records_sql($sql, ['userid' => $targetuserid]);

        $enrolments = [];
        foreach ($records as $r) {
            $enrolments[] = [
                'courseid'  => (int)$r->courseid,
                'timestart' => (int)$r->timestart,
                'timeend'   => (int)$r->timeend,
            ];
        }

        return ['enrolments' => $enrolments];
    }

    /**
     * Return definition for get_user_enrolments external function.
     *
     * @return external_single_structure
     */
    public static function get_user_enrolments_returns(): external_single_structure {
        return new external_single_structure([
            'enrolments' => new external_multiple_structure(
                new external_single_structure([
                    'courseid'  => new external_value(PARAM_INT, 'Course ID'),
                    'timestart' => new external_value(PARAM_INT, 'Enrolment start timestamp'),
                    'timeend'   => new external_value(PARAM_INT, 'Enrolment end / expiration timestamp'),
                ]),
                'List of active user enrolments'
            )
        ]);
    }
}
