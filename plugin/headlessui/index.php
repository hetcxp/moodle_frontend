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
 * Frontend app host page for local_headlessui.
 *
 * @package    local_headlessui
 * @copyright  2024 Hector Teran
 * @license    https://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */

$config_paths = [
    __DIR__ . '/../../config.php',
];
if (isset($_SERVER['SCRIPT_FILENAME'])) {
    $config_paths[] = dirname(dirname(dirname($_SERVER['SCRIPT_FILENAME']))) . '/config.php';
    $config_paths[] = dirname(dirname($_SERVER['SCRIPT_FILENAME'])) . '/config.php';
    $config_paths[] = dirname($_SERVER['SCRIPT_FILENAME']) . '/config.php';
}
if (isset($_SERVER['DOCUMENT_ROOT'])) {
    $config_paths[] = $_SERVER['DOCUMENT_ROOT'] . '/../config.php';
    $config_paths[] = $_SERVER['DOCUMENT_ROOT'] . '/config.php';
}

$loaded = false;
foreach ($config_paths as $path) {
    if (file_exists($path)) {
        require_once($path);
        $loaded = true;
        break;
    }
}

if (!$loaded) {
    die("Error: No se pudo encontrar config.php. El plugin debe estar instalado en /local/headlessui/ dentro de Moodle.");
}

// 1. Auth + capability check
require_login();
$context = context_system::instance();

// 2. Page setup — embedded = fullscreen, sin sidebar Moodle
$PAGE->set_url(new moodle_url('/local/headlessui/index.php'));
$PAGE->set_context($context);
$PAGE->set_pagelayout('embedded');
$PAGE->set_title(get_string('apptitle', 'local_headlessui'));

// 3. Generar wstoken para el usuario actual
global $DB, $USER, $CFG, $OUTPUT;
require_once($CFG->libdir . '/externallib.php');

$service = $DB->get_record('external_services', ['shortname' => 'headless_service']);
if (!$service) {
    throw new moodle_exception('servicenotavailable', 'error', '', null, get_string('servicenotconfigured', 'local_headlessui'));
}

// Buscar token existente o crear uno nuevo
$token = external_generate_token(
    EXTERNAL_TOKEN_PERMANENT,
    $service,
    $USER->id,
    $context
);

// 4. Cargar recursos desde manifest.json generado por Vite (o fallback a assets)
$appdir = __DIR__ . '/app';
$manifestfile = $appdir . '/.vite/manifest.json';
if (!file_exists($manifestfile)) {
    $manifestfile = $appdir . '/manifest.json';
}

$cssfiles = [];
$jsfile = '';
$preloads = [];

if (file_exists($manifestfile)) {
    $manifest = json_decode(file_get_contents($manifestfile), true);
    if (isset($manifest['index.html'])) {
        $entry = $manifest['index.html'];
        $jsfile = $entry['file'] ?? '';
        $cssfiles = $entry['css'] ?? [];
        if (!empty($entry['dynamicImports'])) {
            foreach ($entry['dynamicImports'] as $importKey) {
                if (isset($manifest[$importKey]['file'])) {
                    $preloads[] = $manifest[$importKey]['file'];
                }
            }
        }
    }
} else {
    // Fallback de contingencia si no existe el manifiesto
    $assetsdir = $appdir . '/assets';
    if (is_dir($assetsdir)) {
        foreach (scandir($assetsdir) as $file) {
            if (str_starts_with($file, 'index-') && str_ends_with($file, '.css')) {
                $cssfiles[] = 'assets/' . $file;
            }
            if (str_starts_with($file, 'index-') && str_ends_with($file, '.js')) {
                $jsfile = 'assets/' . $file;
            }
            if (str_ends_with($file, '.js') && !str_starts_with($file, 'index-')) {
                $preloads[] = 'assets/' . $file;
            }
        }
    }
}

// 5. Render
header('Content-Type: text/html; charset=utf-8');

echo '<!DOCTYPE html>
<html lang="' . current_language() . '">
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>' . s(get_string('apptitle', 'local_headlessui')) . '</title>';

foreach ($cssfiles as $css) {
    echo '<link rel="stylesheet" href="' .
         (new moodle_url("/local/headlessui/app/{$css}"))->out() . '">';
}

echo '<script>
window.HEADLESS_CONFIG = {
    token: ' . json_encode($token) . ',
    moodleUrl: ' . json_encode($CFG->wwwroot) . ',
    serviceName: "headless_service",
    embedded: true
};
</script>';

foreach ($preloads as $preload) {
    echo '<link rel="modulepreload" href="' .
         (new moodle_url("/local/headlessui/app/{$preload}"))->out() . '">';
}

echo '</head>
<body>
    <div id="app"></div>';

if ($jsfile) {
    echo '<script type="module" src="' .
         (new moodle_url("/local/headlessui/app/{$jsfile}"))->out() . '"></script>';
}

echo '</body>
</html>';
