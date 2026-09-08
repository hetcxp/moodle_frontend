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
 * Installation callbacks for local_headlessui.
 *
 * @package    local_headlessui
 * @copyright  2024 Hector Teran
 * @license    https://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */

defined('MOODLE_INTERNAL') || die();

/**
 * Installation hook for local_headlessui.
 * Configures headless_service and registers functions in moodle_mobile_app.
 */
function xmldb_local_headlessui_install() {
    global $DB;

    // Configurar permisos de archivos en headless_service
    $service = $DB->get_record('external_services', ['shortname' => 'headless_service']);
    if ($service) {
        $service->downloadfiles = 1;
        $service->uploadfiles = 1;
        $DB->update_record('external_services', $service);
    }

    // Registrar funciones en moodle_mobile_app
    $mobileservice = $DB->get_record('external_services', ['shortname' => 'moodle_mobile_app'], 'id');
    if ($mobileservice) {
        $functions = [
            'local_headlessui_get_autologin_key',
            'local_headlessui_change_password',
            'local_headlessui_get_user_enrolments',
        ];

        foreach ($functions as $fname) {
            $exists = $DB->record_exists('external_services_functions', [
                'externalserviceid' => $mobileservice->id,
                'functionname'      => $fname,
            ]);
            if (!$exists) {
                $DB->insert_record('external_services_functions', [
                    'externalserviceid' => $mobileservice->id,
                    'functionname'      => $fname,
                ]);
            }
        }
    }
}
