<?php
defined('MOODLE_INTERNAL') || die();

/**
 * Installation hook for local_headlessui.
 * Ensures headless_service enables file downloads and uploads.
 */
function xmldb_local_headlessui_install() {
    global $DB;

    $service = $DB->get_record('external_services', ['shortname' => 'headless_service']);
    if ($service) {
        $service->downloadfiles = 1;
        $service->uploadfiles = 1;
        $DB->update_record('external_services', $service);
    }
}
