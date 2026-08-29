<?php
// This file is part of Moodle - http://moodle.org/

defined('MOODLE_INTERNAL') || die();

// Solo los administradores pueden ver esta opción en el menú de configuración
if ($hassiteconfig) {
    // Agregamos un enlace externo a nuestra UI en Site Administration > Plugins > Local plugins
    $ADMIN->add('localplugins', new admin_externalpage(
        'local_headlessui_app',
        get_string('pluginname', 'local_headlessui'),
        new moodle_url('/local/headlessui/index.php'),
        'moodle/site:config'
    ));
}
