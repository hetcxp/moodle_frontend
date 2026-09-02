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
