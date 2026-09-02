<?php
// This file is part of Moodle - http://moodle.org/

namespace local_headless\hook;

use core\hook\output\before_footer_html_generation;

defined('MOODLE_INTERNAL') || die();

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
