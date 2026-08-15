<?php
namespace local_headless;

use core_external\external_api;
use core_external\external_function_parameters;
use core_external\external_single_structure;
use core_external\external_value;
use context_system;

defined('MOODLE_INTERNAL') || die();

class external extends external_api {

    public static function get_autologin_key_parameters() {
        return new external_function_parameters([]);
    }

    public static function get_autologin_key() {
        global $USER, $CFG;

        $context = context_system::instance();
        self::validate_context($context);

        require_once($CFG->libdir . '/moodlelib.php');

        // Borrar keys anteriores del mismo usuario para evitar conflictos
        delete_user_key('tool_mobile', $USER->id);

        // Crear key nueva sin IP restriction y TTL de 1 minuto
        $validuntil    = time() + 60;
        $key = create_user_key('tool_mobile', $USER->id, null, null, $validuntil);

        $autologinurl = $CFG->wwwroot . '/local/headless/autologin.php';

        return [
            'key'          => $key,
            'autologinurl' => $autologinurl,
        ];
    }

    public static function get_autologin_key_returns() {
        return new external_single_structure([
            'key'          => new external_value(PARAM_ALPHANUMEXT, 'Auto-login key'),
            'autologinurl' => new external_value(PARAM_URL, 'Auto-login URL'),
        ]);
    }

    public static function change_password_parameters() {
        return new external_function_parameters([
            'newpassword' => new external_value(PARAM_RAW, 'New password')
        ]);
    }

    public static function change_password($newpassword) {
        global $USER;

        $context = context_system::instance();
        self::validate_context($context);

        $params = self::validate_parameters(self::change_password_parameters(), ['newpassword' => $newpassword]);

        if (get_user_preferences('auth_forcepasswordchange', 0, $USER->id) != 1) {
            return ['success' => false, 'errormessage' => 'User is not required to change password'];
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

    public static function change_password_returns() {
        return new external_single_structure([
            'success'      => new external_value(PARAM_BOOL, 'True if password changed successfully'),
            'errormessage' => new external_value(PARAM_TEXT, 'Error message if any'),
        ]);
    }
}
