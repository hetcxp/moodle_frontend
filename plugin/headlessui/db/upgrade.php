<?php
defined('MOODLE_INTERNAL') || die();

/**
 * Upgrade hook for local_headlessui.
 *
 * @param int $oldversion The version we are upgrading from.
 * @return bool Always true on success.
 */
function xmldb_local_headlessui_upgrade($oldversion) {
    global $DB;

    // Future upgrades for local_headlessui will be defined here.

    return true;
}
