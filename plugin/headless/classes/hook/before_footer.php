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
 * Hook handler for before_footer_html_generation in local_headless.
 *
 * @package    local_headless
 * @copyright  2024 Hector Teran
 * @license    https://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */

namespace local_headless\hook;

defined('MOODLE_INTERNAL') || die();

use core\hook\output\before_footer_html_generation;

/**
 * Hook callback implementation for before_footer_html_generation.
 *
 * @package    local_headless
 * @copyright  2024 Hector Teran
 * @license    https://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */
class before_footer {
    /**
     * Callback for the before_footer_html_generation hook.
     *
     * @param before_footer_html_generation $hook
     */
    public static function execute(before_footer_html_generation $hook): void {
        global $PAGE;

        $isembed = false;
        if (isset($PAGE) && $PAGE->url) {
            $isembed = (strpos($PAGE->url->get_path(), '/h5p/embed.php') !== false);
        } else {
            $isembed = (strpos($_SERVER['SCRIPT_NAME'], '/h5p/embed.php') !== false);
        }

        if ($isembed) {
            $js = <<<JS
<script>
document.addEventListener('DOMContentLoaded', () => {
    let attempts = 0;
    const interval = setInterval(() => {
        if (window.H5P && window.H5P.externalDispatcher) {
            clearInterval(interval);
            window.H5P.externalDispatcher.on('xAPI', function (event) {

                // Send a message to the parent window with targeted origin
                const targetOrigin = (document.referrer) ? new URL(document.referrer).origin : window.location.origin;
                window.parent.postMessage({
                    type: 'h5p_xapi',
                    verb: event.getVerb()
                }, targetOrigin);
            });
        }
        attempts++;
        if (attempts > 100) { // Stop checking after 10 seconds
            clearInterval(interval);
        }
    }, 100);
});
</script>
JS;
            $hook->add_html($js);
        }
    }
}
