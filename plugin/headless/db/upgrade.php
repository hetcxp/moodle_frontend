<?php
defined('MOODLE_INTERNAL') || die();

function xmldb_local_headless_upgrade($oldversion) {
    global $DB;

    if ($oldversion < 2026072203) {
        // Ensure headless functions are in moodle_mobile_app.
        $service = $DB->get_record('external_services', ['shortname' => 'moodle_mobile_app'], 'id');
        if ($service) {
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
        upgrade_plugin_savepoint(true, 2026072203, 'local', 'headless');
    }

    return true;
}
