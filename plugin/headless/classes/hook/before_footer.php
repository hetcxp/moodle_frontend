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
            $isembed = (strpos($_SERVER['SCRIPT_NAME'] ?? '', '/h5p/embed.php') !== false);
        }

        if ($isembed) {
            $theme = optional_param('theme', 'light', PARAM_ALPHANUMEXT);
            $presets = [
                'light' => [
                    'primary' => '#1a73e8',
                    'primaryHover' => '#1557b0',
                    'surface' => '#ffffff',
                    'background' => '#ffffff',
                    'text' => '#111827',
                    'textSecondary' => '#4b5563',
                    'border' => 'rgba(0,0,0,0.1)',
                ],
                'dark' => [
                    'primary' => '#3b82f6',
                    'primaryHover' => '#2563eb',
                    'surface' => '#1e222d',
                    'background' => '#11141d',
                    'text' => '#f3f4f6',
                    'textSecondary' => '#9ca3af',
                    'border' => 'rgba(255,255,255,0.12)',
                ],
                'microsoft' => [
                    'primary' => '#0078d4',
                    'primaryHover' => '#005a9e',
                    'surface' => '#ffffff',
                    'background' => '#edf3f9',
                    'text' => '#18273a',
                    'textSecondary' => '#475a70',
                    'border' => '#d3e0ec',
                ],
                'gold-teal' => [
                    'primary' => '#e5b84c',
                    'primaryHover' => '#d4a337',
                    'surface' => '#112229',
                    'background' => '#091317',
                    'text' => '#f0fdfa',
                    'textSecondary' => '#8fa8ab',
                    'border' => 'rgba(229,184,76,0.25)',
                ],
                'mint' => [
                    'primary' => '#059669',
                    'primaryHover' => '#047857',
                    'surface' => '#ffffff',
                    'background' => '#f0fbf7',
                    'text' => '#092c23',
                    'textSecondary' => '#3d685c',
                    'border' => 'rgba(5,150,105,0.2)',
                ],
            ];

            $tokens = $presets[$theme] ?? $presets['light'];
            $css = self::generate_h5p_css($tokens);
            $jsonpresets = json_encode($presets);

            $html = <<<HTML
<style id="h5p-theme-custom-style">
{$css}
</style>
<script>
(function() {
    var presets = {$jsonpresets};

    function generateCss(t) {
        if (!t) return '';
        var pHover = t.primaryHover || t.primary;
        var tSec = t.textSecondary || t.text;
        return ':root{' +
            '--h5p-theme-main-cta-base:' + t.primary + ' !important;' +
            '--h5p-theme-main-cta-light:' + pHover + ' !important;' +
            '--h5p-theme-main-cta-dark:' + pHover + ' !important;' +
            '--h5p-theme-contrast-cta-white:' + t.primary + ' !important;' +
            '--h5p-theme-focus:' + t.primary + ' !important;' +
            '--h5p-theme-background:' + t.background + ' !important;' +
            '--h5p-theme-ui-base:' + t.surface + ' !important;' +
            '--h5p-theme-text-primary:' + t.text + ' !important;' +
            '--h5p-theme-text-secondary:' + tSec + ' !important;' +
            '--h5p-theme-font-name:"Inter", sans-serif !important;' +
        '}' +
        'html.h5p-iframe, body, .h5p-content, .h5p-container, .h5p-iframe-wrapper{' +
            'background-color:' + t.background + ' !important;' +
            'color:' + t.text + ' !important;' +
            'font-family:"Inter", system-ui, -apple-system, sans-serif !important;' +
        '}' +
        '.joubel-ui-button, .h5p-joubelui-button, .h5p-question-buttons .joubel-ui-button, .h5p-theme-button, .h5p-core-button, .h5p-enable-solution, .h5p-show-solution-button, .h5p-question-check-answer{' +
            'background-color:' + t.primary + ' !important;' +
            'color:#ffffff !important;' +
            'border-color:' + t.primary + ' !important;' +
            'border-radius:8px !important;' +
            'box-shadow:0 2px 6px rgba(0,0,0,0.12) !important;' +
            'transition:all 0.2s ease !important;' +
        '}' +
        '.joubel-ui-button:hover, .h5p-joubelui-button:hover, .h5p-question-buttons .joubel-ui-button:hover, .h5p-core-button:hover, .h5p-enable-solution:hover, .h5p-show-solution-button:hover, .h5p-question-check-answer:hover{' +
            'background-color:' + pHover + ' !important;' +
            'border-color:' + pHover + ' !important;' +
            'transform:translateY(-1px) !important;' +
        '}' +
        '.h5p-progressbar-fill, .h5p-joubelui-score-bar-fill, .h5p-joubelui-progress-fill, .h5p-summary-bar-fill, .h5p-time-range-pointer{' +
            'background-color:' + t.primary + ' !important;' +
        '}' +
        '.h5p-joubelui-score-bar, .h5p-progressbar{' +
            'border-color:' + t.border + ' !important;' +
            'background-color:' + t.surface + ' !important;' +
            'border-radius:6px !important;' +
        '}' +
        '.h5p-sub-title, .h5p-question-introduction, .h5p-question-title{' +
            'color:' + t.text + ' !important;' +
        '}' +
        '.h5p-sub-title{' +
            'border-bottom:1px solid ' + t.border + ' !important;' +
        '}';
    }

    function syncTheme(targetDoc, css) {
        if (!targetDoc) return;
        try {
            var head = targetDoc.head || targetDoc.getElementsByTagName('head')[0] || targetDoc.documentElement;
            if (!head) return;
            var style = targetDoc.getElementById('h5p-theme-custom-style');
            if (!style) {
                style = targetDoc.createElement('style');
                style.id = 'h5p-theme-custom-style';
                head.appendChild(style);
            }
            if (style.textContent !== css) {
                style.textContent = css;
            }
        } catch (e) {}
    }

    function applyAll(css) {
        syncTheme(document, css);
        var iframes = document.querySelectorAll('iframe.h5p-iframe, .h5p-iframe-wrapper iframe');
        for (var i = 0; i < iframes.length; i++) {
            try {
                var iDoc = iframes[i].contentDocument;
                if (iDoc && (iDoc.head || iDoc.body)) {
                    syncTheme(iDoc, css);
                }
            } catch (e) {}
        }
    }

    var currentCss = document.getElementById('h5p-theme-custom-style') ? document.getElementById('h5p-theme-custom-style').textContent : '';

    // Apply periodically during iframe bootstrap (max 25 attempts, 5 seconds, stops completely)
    var attempts = 0;
    var timer = setInterval(function() {
        attempts++;
        applyAll(currentCss);
        if (attempts >= 25) {
            clearInterval(timer);
        }
    }, 200);

    // Bind to H5P lifecycle events if available
    var h5pAttempts = 0;
    var h5pInterval = setInterval(function() {
        h5pAttempts++;
        if (window.H5P && window.H5P.externalDispatcher) {
            clearInterval(h5pInterval);
            window.H5P.externalDispatcher.on('initialized', function() {
                applyAll(currentCss);
            });
            window.H5P.externalDispatcher.on('domChanged', function() {
                applyAll(currentCss);
            });
            window.H5P.externalDispatcher.on('xAPI', function(event) {
                var targetOrigin = (document.referrer) ? new URL(document.referrer).origin : window.location.origin;
                window.parent.postMessage({
                    type: 'h5p_xapi',
                    verb: event.getVerb()
                }, targetOrigin);
            });
        }
        if (h5pAttempts > 100) {
            clearInterval(h5pInterval);
        }
    }, 100);

    // Listen for live theme changes from parent window
    window.addEventListener('message', function(event) {
        if (event.data && event.data.type === 'set_h5p_theme') {
            var tokens = event.data.tokens || presets[event.data.theme] || presets.light;
            currentCss = generateCss(tokens);
            applyAll(currentCss);
        }
    });
})();
</script>
HTML;
            $hook->add_html($html);
        }
    }

    /**
     * Generate CSS string for H5P styling.
     */
    private static function generate_h5p_css(array $t): string {
        $pHover = $t['primaryHover'] ?? $t['primary'];
        $tSec = $t['textSecondary'] ?? $t['text'];
        return "
:root {
    --h5p-theme-main-cta-base: {$t['primary']} !important;
    --h5p-theme-main-cta-light: {$pHover} !important;
    --h5p-theme-main-cta-dark: {$pHover} !important;
    --h5p-theme-contrast-cta-white: {$t['primary']} !important;
    --h5p-theme-focus: {$t['primary']} !important;
    --h5p-theme-background: {$t['background']} !important;
    --h5p-theme-ui-base: {$t['surface']} !important;
    --h5p-theme-text-primary: {$t['text']} !important;
    --h5p-theme-text-secondary: {$tSec} !important;
    --h5p-theme-font-name: 'Inter', sans-serif !important;
}
html.h5p-iframe, body, .h5p-content, .h5p-container, .h5p-iframe-wrapper {
    background-color: {$t['background']} !important;
    color: {$t['text']} !important;
    font-family: 'Inter', system-ui, -apple-system, sans-serif !important;
}
.joubel-ui-button, .h5p-joubelui-button, .h5p-question-buttons .joubel-ui-button, .h5p-theme-button, .h5p-core-button, .h5p-enable-solution, .h5p-show-solution-button, .h5p-question-check-answer {
    background-color: {$t['primary']} !important;
    color: #ffffff !important;
    border-color: {$t['primary']} !important;
    border-radius: 8px !important;
    box-shadow: 0 2px 6px rgba(0,0,0,0.12) !important;
    transition: all 0.2s ease !important;
}
.joubel-ui-button:hover, .h5p-joubelui-button:hover, .h5p-question-buttons .joubel-ui-button:hover, .h5p-core-button:hover, .h5p-enable-solution:hover, .h5p-show-solution-button:hover, .h5p-question-check-answer:hover {
    background-color: {$pHover} !important;
    border-color: {$pHover} !important;
    transform: translateY(-1px) !important;
}
.h5p-progressbar-fill, .h5p-joubelui-score-bar-fill, .h5p-joubelui-progress-fill, .h5p-summary-bar-fill, .h5p-time-range-pointer {
    background-color: {$t['primary']} !important;
}
.h5p-joubelui-score-bar, .h5p-progressbar {
    border-color: {$t['border']} !important;
    background-color: {$t['surface']} !important;
    border-radius: 6px !important;
}
.h5p-sub-title, .h5p-question-introduction, .h5p-question-title {
    color: {$t['text']} !important;
}
.h5p-sub-title {
    border-bottom: 1px solid {$t['border']} !important;
}
";
    }
}
