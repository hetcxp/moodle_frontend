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
 * Installation callbacks for local_headless.
 *
 * @package    local_headless
 * @copyright  2024 Hector Teran
 * @license    https://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */

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
