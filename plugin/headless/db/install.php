<?php
defined('MOODLE_INTERNAL') || die();

/**
 * Auto-register headless functions into moodle_mobile_app service on install.
 */
function xmldb_local_headless_install() {
    global $DB;

    $service = $DB->get_record('external_services', ['shortname' => 'moodle_mobile_app'], 'id');
    if (!$service) {
        return;
    }

    $functions = [
        'local_headless_get_autologin_key',
        'local_headless_change_password',
    ];

    foreach ($functions as $fname) {
        $exists = $DB->record_exists('external_services_functions', [
            'externalserviceid' => $service->id,
            'functionname'      => $fname,
        ]);
        if (!$exists) {
            $DB->insert_record('external_services_functions', [
                'externalserviceid' => $service->id,
                'functionname'      => $fname,
            ]);
        }
    }
}
