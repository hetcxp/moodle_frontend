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
 * Hook handler for before_footer_html_generation in local_headlessui.
 *
 * @package    local_headlessui
 * @copyright  2024 Hector Teran
 * @license    https://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */

namespace local_headlessui\hook;

defined('MOODLE_INTERNAL') || die();

use core\hook\output\before_footer_html_generation;

/**
 * Hook callback implementation for before_footer_html_generation.
 *
 * @package    local_headlessui
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
            $path = $PAGE->url->get_path();
            $isembed = (strpos($path, '/h5p/embed.php') !== false) ||
                       (strpos($path, '/local/headlessui/h5p.php') !== false);
        } else {
            $script = $_SERVER['SCRIPT_NAME'] ?? '';
            $isembed = (strpos($script, '/h5p/embed.php') !== false) ||
                       (strpos($script, '/local/headlessui/h5p.php') !== false);
        }

        if ($isembed) {
            $theme = optional_param('theme', 'light', PARAM_ALPHANUMEXT);
            $presets = [
                'light' => [
                    'primary' => '#1a73e8',
                    'primaryHover' => '#1557b0',
                    'primaryText' => '#ffffff',
                    'surface' => '#ffffff',
                    'background' => '#ffffff',
                    'text' => '#111827',
                    'textSecondary' => '#4b5563',
                    'border' => 'rgba(0,0,0,0.1)',
                    'alternativeBase' => '#f8fafc',
                    'alternativeHover' => '#e2e8f0',
                    'feedbackCorrectMain' => '#15803d',
                    'feedbackCorrectSecondary' => 'rgba(34, 197, 94, 0.12)',
                    'feedbackIncorrectMain' => '#b91c1c',
                    'feedbackIncorrectSecondary' => 'rgba(239, 68, 68, 0.12)',
                ],
                'dark' => [
                    'primary' => '#3b82f6',
                    'primaryHover' => '#2563eb',
                    'primaryText' => '#ffffff',
                    'surface' => '#1e222d',
                    'background' => '#11141d',
                    'text' => '#f3f4f6',
                    'textSecondary' => '#d1d5db',
                    'border' => 'rgba(255,255,255,0.12)',
                    'alternativeBase' => '#1e222d',
                    'alternativeHover' => '#2d3444',
                    'feedbackCorrectMain' => '#4ade80',
                    'feedbackCorrectSecondary' => 'rgba(34, 197, 94, 0.2)',
                    'feedbackIncorrectMain' => '#f87171',
                    'feedbackIncorrectSecondary' => 'rgba(239, 68, 68, 0.2)',
                ],
                'microsoft' => [
                    'primary' => '#0078d4',
                    'primaryHover' => '#005a9e',
                    'primaryText' => '#ffffff',
                    'surface' => '#ffffff',
                    'background' => '#edf3f9',
                    'text' => '#18273a',
                    'textSecondary' => '#475a70',
                    'border' => '#d3e0ec',
                    'alternativeBase' => '#ffffff',
                    'alternativeHover' => '#e4eef7',
                    'feedbackCorrectMain' => '#107c41',
                    'feedbackCorrectSecondary' => 'rgba(16, 124, 65, 0.12)',
                    'feedbackIncorrectMain' => '#a80000',
                    'feedbackIncorrectSecondary' => 'rgba(168, 0, 0, 0.12)',
                ],
                'gold-teal' => [
                    'primary' => '#e5b84c',
                    'primaryHover' => '#d4a337',
                    'primaryText' => '#091317',
                    'surface' => '#112229',
                    'background' => '#091317',
                    'text' => '#f0fdfa',
                    'textSecondary' => '#99f6e4',
                    'border' => 'rgba(229,184,76,0.25)',
                    'alternativeBase' => '#112229',
                    'alternativeHover' => '#1c323d',
                    'feedbackCorrectMain' => '#2dd4bf',
                    'feedbackCorrectSecondary' => 'rgba(45, 212, 191, 0.2)',
                    'feedbackIncorrectMain' => '#f87171',
                    'feedbackIncorrectSecondary' => 'rgba(239, 68, 68, 0.2)',
                ],
                'mint' => [
                    'primary' => '#059669',
                    'primaryHover' => '#047857',
                    'primaryText' => '#ffffff',
                    'surface' => '#ffffff',
                    'background' => '#f0fbf7',
                    'text' => '#092c23',
                    'textSecondary' => '#3d685c',
                    'border' => 'rgba(5,150,105,0.2)',
                    'alternativeBase' => '#ffffff',
                    'alternativeHover' => '#e2f6ee',
                    'feedbackCorrectMain' => '#047857',
                    'feedbackCorrectSecondary' => 'rgba(5, 150, 105, 0.12)',
                    'feedbackIncorrectMain' => '#b91c1c',
                    'feedbackIncorrectSecondary' => 'rgba(239, 68, 68, 0.12)',
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

    // Protect application storage keys from Moodle core storage_validation
    try {
        if (window.localStorage) {
            var origClear = window.localStorage.clear.bind(window.localStorage);
            window.localStorage.clear = function() {
                var preserved = {};
                try {
                    for (var i = 0; i < window.localStorage.length; i++) {
                        var k = window.localStorage.key(i);
                        if (k && k.indexOf('moodle_app_') === 0) {
                            preserved[k] = window.localStorage.getItem(k);
                        }
                    }
                } catch (e) {}
                origClear();
                try {
                    for (var pk in preserved) {
                        window.localStorage.setItem(pk, preserved[pk]);
                    }
                } catch (e) {}
            };
        }
    } catch (e) {}

    function generateCss(t) {
        if (!t) return '';
        var pHover = t.primaryHover || t.primary;
        var tSec = t.textSecondary || t.text;
        var altBase = t.alternativeBase || t.surface || '#ffffff';
        var altHover = t.alternativeHover || pHover;
        var fbCorrMain = t.feedbackCorrectMain || '#22c55e';
        var fbCorrSec = t.feedbackCorrectSecondary || 'rgba(34, 197, 94, 0.15)';
        var fbIncorrMain = t.feedbackIncorrectMain || '#ef4444';
        var fbIncorrSec = t.feedbackIncorrectSecondary || 'rgba(239, 68, 68, 0.15)';
        var ctaText = t.primaryText || (t.primary === '#e5b84c' ? '#091317' : '#ffffff');
        var border = t.border || 'rgba(0,0,0,0.1)';
        return ':root{' +
            '--h5p-theme-main-cta-base:' + t.primary + ' !important;' +
            '--h5p-theme-main-cta-light:' + pHover + ' !important;' +
            '--h5p-theme-main-cta-dark:' + pHover + ' !important;' +
            '--h5p-theme-contrast-cta:' + ctaText + ' !important;' +
            '--h5p-theme-contrast-cta-white:' + t.primary + ' !important;' +
            '--h5p-theme-focus:' + t.primary + ' !important;' +
            '--h5p-theme-background:' + t.background + ' !important;' +
            '--h5p-theme-ui-base:' + t.surface + ' !important;' +
            '--h5p-theme-text-primary:' + t.text + ' !important;' +
            '--h5p-theme-text-secondary:' + tSec + ' !important;' +
            '--h5p-theme-font-name:"Inter", sans-serif !important;' +
            '--h5p-theme-alternative-base:' + altBase + ' !important;' +
            '--h5p-theme-alternative-light:' + altHover + ' !important;' +
            '--h5p-theme-alternative-dark:' + altHover + ' !important;' +
            '--h5p-theme-alternative-darker:' + altHover + ' !important;' +
            '--h5p-theme-secondary-cta-base:' + altBase + ' !important;' +
            '--h5p-theme-secondary-cta-light:' + altHover + ' !important;' +
            '--h5p-theme-secondary-cta-dark:' + altBase + ' !important;' +
            '--h5p-theme-stroke-1:' + border + ' !important;' +
            '--h5p-theme-stroke-2:' + border + ' !important;' +
            '--h5p-theme-stroke-3:' + border + ' !important;' +
            '--h5p-theme-feedback-correct-main:' + fbCorrMain + ' !important;' +
            '--h5p-theme-feedback-correct-secondary:' + fbCorrSec + ' !important;' +
            '--h5p-theme-feedback-incorrect-main:' + fbIncorrMain + ' !important;' +
            '--h5p-theme-feedback-incorrect-secondary:' + fbIncorrSec + ' !important;' +
        '}' +
        'html.h5p-iframe, body, .h5p-content, .h5p-container, .h5p-iframe-wrapper{' +
            'background-color:' + t.background + ' !important;' +
            'color:' + t.text + ' !important;' +
            'font-family:"Inter", system-ui, -apple-system, sans-serif !important;' +
        '}' +
        '.h5p-question, .h5p-multichoice > .h5p-question, .questionset .h5p-question, .questionset, .questionset-results, .h5p-question-content, .h5p-question-inner, .intro-page, .h5p-single-choice-set, .h5p-sc-set, .h5p-sc-question{' +
            'background-color:transparent !important;' +
            'background:transparent !important;' +
            'filter:none !important;' +
            'border-color:' + border + ' !important;' +
            'color:' + t.text + ' !important;' +
        '}' +
        '.h5p-sub-title, .h5p-question-introduction, .h5p-question-title, .h5p-question-introduction p, .h5p-question-introduction *, .h5p-question-title *, .h5p-sub-title *{' +
            'color:' + t.text + ' !important;' +
        '}' +
        '.h5p-sub-title{' +
            'border-bottom:1px solid ' + border + ' !important;' +
        '}' +
        '.h5p-multichoice .h5p-answers li, .h5p-multichoice .h5p-alternative-container, .h5p-sc-alternatives li.h5p-sc-alternative, .h5p-sc-alternative, .h5p-true-false-answers .h5p-true-false-answer, .h5p-multichoice .h5p-answer:not(.h5p-correct):not(.h5p-wrong) .h5p-alternative-container{' +
            'background-color:' + altBase + ' !important;' +
            'background:' + altBase + ' !important;' +
            'color:' + t.text + ' !important;' +
            'border:1px solid ' + border + ' !important;' +
            'border-radius:8px !important;' +
            'transition:background-color 0.2s ease, border-color 0.2s ease, transform 0.15s ease !important;' +
        '}' +
        '.h5p-multichoice .h5p-alternative-container *, .h5p-sc-alternatives li.h5p-sc-alternative *, .h5p-sc-alternative *, .h5p-true-false-answers .h5p-true-false-answer *{' +
            'color:' + t.text + ' !important;' +
        '}' +
        '.h5p-multichoice .h5p-answer:hover:not([aria-disabled="true"]):not(.h5p-correct):not(.h5p-wrong) .h5p-alternative-container, .h5p-sc-alternatives:not(.h5p-sc-selected) li.h5p-sc-alternative:hover, .h5p-true-false-answers .h5p-true-false-answer:hover:not(.h5p-correct):not(.h5p-wrong){' +
            'background-color:' + altHover + ' !important;' +
            'background:' + altHover + ' !important;' +
            'border-color:' + t.primary + ' !important;' +
            'transform:translateY(-1px) !important;' +
        '}' +
        '.h5p-multichoice .h5p-answer .h5p-alternative-container:before, .h5p-sc-alternatives li.h5p-sc-alternative:before, .h5p-true-false-answer:before{' +
            'color:' + t.primary + ' !important;' +
        '}' +
        '.h5p-multichoice .h5p-answer[role="radio"][aria-checked="true"] .h5p-alternative-container, .h5p-multichoice .h5p-answer[role="checkbox"][aria-checked="true"] .h5p-alternative-container, .h5p-sc-alternatives.h5p-sc-selected li.h5p-sc-alternative{' +
            'border-color:' + t.primary + ' !important;' +
            'background-color:' + altHover + ' !important;' +
        '}' +
        '.h5p-multichoice .h5p-answers .h5p-answer.h5p-correct .h5p-alternative-container, .h5p-sc-alternatives.h5p-sc-selected li.h5p-sc-alternative.h5p-sc-reveal-correct, .h5p-true-false-answers .h5p-true-false-answer.h5p-correct{' +
            'background-color:' + fbCorrSec + ' !important;' +
            'border-color:' + fbCorrMain + ' !important;' +
            'color:' + fbCorrMain + ' !important;' +
        '}' +
        '.h5p-multichoice .h5p-answers .h5p-answer.h5p-correct .h5p-alternative-container *, .h5p-sc-alternatives.h5p-sc-selected li.h5p-sc-alternative.h5p-sc-reveal-correct *{' +
            'color:' + fbCorrMain + ' !important;' +
        '}' +
        '.h5p-multichoice .h5p-answers .h5p-answer.h5p-wrong .h5p-alternative-container, .h5p-sc-alternatives.h5p-sc-selected li.h5p-sc-alternative.h5p-sc-reveal-wrong, .h5p-true-false-answers .h5p-true-false-answer.h5p-wrong{' +
            'background-color:' + fbIncorrSec + ' !important;' +
            'border-color:' + fbIncorrMain + ' !important;' +
            'color:' + fbIncorrMain + ' !important;' +
        '}' +
        '.h5p-multichoice .h5p-answers .h5p-answer.h5p-wrong .h5p-alternative-container *, .h5p-sc-alternatives.h5p-sc-selected li.h5p-sc-alternative.h5p-sc-reveal-wrong *{' +
            'color:' + fbIncorrMain + ' !important;' +
        '}' +
        '.joubel-ui-button, .h5p-joubelui-button, .h5p-question-buttons .joubel-ui-button, .h5p-theme-button, .h5p-core-button, .h5p-enable-solution, .h5p-show-solution-button, .h5p-question-check-answer{' +
            'background-color:' + t.primary + ' !important;' +
            'color:' + ctaText + ' !important;' +
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
            'border-color:' + border + ' !important;' +
            'background-color:' + t.surface + ' !important;' +
            'border-radius:6px !important;' +
        '}' +
        '.dots-container .progress-dot{' +
            'background-color:' + border + ' !important;' +
            'border:1px solid ' + border + ' !important;' +
        '}' +
        '.dots-container .progress-dot.current{' +
            'background-color:' + t.primary + ' !important;' +
            'border-color:' + t.primary + ' !important;' +
            'transform:scale(1.25) !important;' +
        '}' +
        '.dots-container .progress-dot.answered{' +
            'background-color:' + t.primary + ' !important;' +
            'opacity:0.6 !important;' +
        '}' +
        '.h5p-input, input.h5p-text-input, .h5p-blanks input{' +
            'background-color:' + t.surface + ' !important;' +
            'color:' + t.text + ' !important;' +
            'border:1px solid ' + border + ' !important;' +
            'border-radius:4px !important;' +
            'padding:4px 8px !important;' +
        '}' +
        '.h5p-question-feedback, .h5p-feedback-content, .questionset-results{' +
            'background-color:' + t.surface + ' !important;' +
            'color:' + t.text + ' !important;' +
            'border:1px solid ' + border + ' !important;' +
            'border-radius:8px !important;' +
        '}' +
        '.h5p-question-feedback *, .questionset-results *{' +
            'color:' + t.text + ' !important;' +
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

    // Check parent window theme directly if accessible (same-origin fallback)
    try {
        if (window.parent && window.parent !== window) {
            var pDoc = window.parent.document;
            var parentTheme = (pDoc && pDoc.documentElement) ? pDoc.documentElement.getAttribute('data-theme') : null;
            if (!parentTheme && window.parent.localStorage) {
                parentTheme = window.parent.localStorage.getItem('moodle_app_theme');
            }
            if (parentTheme && presets[parentTheme]) {
                currentCss = generateCss(presets[parentTheme]);
            }
        }
    } catch (e) {}

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
        $altBase = $t['alternativeBase'] ?? ($t['surface'] ?? '#ffffff');
        $altHover = $t['alternativeHover'] ?? $pHover;
        $fbCorrMain = $t['feedbackCorrectMain'] ?? '#22c55e';
        $fbCorrSec = $t['feedbackCorrectSecondary'] ?? 'rgba(34, 197, 94, 0.15)';
        $fbIncorrMain = $t['feedbackIncorrectMain'] ?? '#ef4444';
        $fbIncorrSec = $t['feedbackIncorrectSecondary'] ?? 'rgba(239, 68, 68, 0.15)';
        $ctaText = $t['primaryText'] ?? (($t['primary'] ?? '') === '#e5b84c' ? '#091317' : '#ffffff');
        $border = $t['border'] ?? 'rgba(0,0,0,0.1)';

        return "
:root {
    --h5p-theme-main-cta-base: {$t['primary']} !important;
    --h5p-theme-main-cta-light: {$pHover} !important;
    --h5p-theme-main-cta-dark: {$pHover} !important;
    --h5p-theme-contrast-cta: {$ctaText} !important;
    --h5p-theme-contrast-cta-white: {$t['primary']} !important;
    --h5p-theme-focus: {$t['primary']} !important;
    --h5p-theme-background: {$t['background']} !important;
    --h5p-theme-ui-base: {$t['surface']} !important;
    --h5p-theme-text-primary: {$t['text']} !important;
    --h5p-theme-text-secondary: {$tSec} !important;
    --h5p-theme-font-name: 'Inter', sans-serif !important;
    --h5p-theme-alternative-base: {$altBase} !important;
    --h5p-theme-alternative-light: {$altHover} !important;
    --h5p-theme-alternative-dark: {$altHover} !important;
    --h5p-theme-alternative-darker: {$altHover} !important;
    --h5p-theme-secondary-cta-base: {$altBase} !important;
    --h5p-theme-secondary-cta-light: {$altHover} !important;
    --h5p-theme-secondary-cta-dark: {$altBase} !important;
    --h5p-theme-stroke-1: {$border} !important;
    --h5p-theme-stroke-2: {$border} !important;
    --h5p-theme-stroke-3: {$border} !important;
    --h5p-theme-feedback-correct-main: {$fbCorrMain} !important;
    --h5p-theme-feedback-correct-secondary: {$fbCorrSec} !important;
    --h5p-theme-feedback-incorrect-main: {$fbIncorrMain} !important;
    --h5p-theme-feedback-incorrect-secondary: {$fbIncorrSec} !important;
}
html.h5p-iframe, body, .h5p-content, .h5p-container, .h5p-iframe-wrapper {
    background-color: {$t['background']} !important;
    color: {$t['text']} !important;
    font-family: 'Inter', system-ui, -apple-system, sans-serif !important;
}
.h5p-question, .h5p-multichoice > .h5p-question, .questionset .h5p-question, .questionset, .questionset-results, .h5p-question-content, .h5p-question-inner, .intro-page, .h5p-single-choice-set, .h5p-sc-set, .h5p-sc-question {
    background-color: transparent !important;
    background: transparent !important;
    filter: none !important;
    border-color: {$border} !important;
    color: {$t['text']} !important;
}
.h5p-sub-title, .h5p-question-introduction, .h5p-question-title, .h5p-question-introduction p, .h5p-question-introduction *, .h5p-question-title *, .h5p-sub-title * {
    color: {$t['text']} !important;
}
.h5p-sub-title {
    border-bottom: 1px solid {$border} !important;
}
.h5p-multichoice .h5p-answers li, .h5p-multichoice .h5p-alternative-container, .h5p-sc-alternatives li.h5p-sc-alternative, .h5p-sc-alternative, .h5p-true-false-answers .h5p-true-false-answer, .h5p-multichoice .h5p-answer:not(.h5p-correct):not(.h5p-wrong) .h5p-alternative-container {
    background-color: {$altBase} !important;
    background: {$altBase} !important;
    color: {$t['text']} !important;
    border: 1px solid {$border} !important;
    border-radius: 8px !important;
    transition: background-color 0.2s ease, border-color 0.2s ease, transform 0.15s ease !important;
}
.h5p-multichoice .h5p-alternative-container *, .h5p-sc-alternatives li.h5p-sc-alternative *, .h5p-sc-alternative *, .h5p-true-false-answers .h5p-true-false-answer * {
    color: {$t['text']} !important;
}
.h5p-multichoice .h5p-answer:hover:not([aria-disabled=\"true\"]):not(.h5p-correct):not(.h5p-wrong) .h5p-alternative-container, .h5p-sc-alternatives:not(.h5p-sc-selected) li.h5p-sc-alternative:hover, .h5p-true-false-answers .h5p-true-false-answer:hover:not(.h5p-correct):not(.h5p-wrong) {
    background-color: {$altHover} !important;
    background: {$altHover} !important;
    border-color: {$t['primary']} !important;
    transform: translateY(-1px) !important;
}
.h5p-multichoice .h5p-answer .h5p-alternative-container:before, .h5p-sc-alternatives li.h5p-sc-alternative:before, .h5p-true-false-answer:before {
    color: {$t['primary']} !important;
}
.h5p-multichoice .h5p-answer[role=\"radio\"][aria-checked=\"true\"] .h5p-alternative-container, .h5p-multichoice .h5p-answer[role=\"checkbox\"][aria-checked=\"true\"] .h5p-alternative-container, .h5p-sc-alternatives.h5p-sc-selected li.h5p-sc-alternative {
    border-color: {$t['primary']} !important;
    background-color: {$altHover} !important;
}
.h5p-multichoice .h5p-answers .h5p-answer.h5p-correct .h5p-alternative-container, .h5p-sc-alternatives.h5p-sc-selected li.h5p-sc-alternative.h5p-sc-reveal-correct, .h5p-true-false-answers .h5p-true-false-answer.h5p-correct {
    background-color: {$fbCorrSec} !important;
    border-color: {$fbCorrMain} !important;
    color: {$fbCorrMain} !important;
}
.h5p-multichoice .h5p-answers .h5p-answer.h5p-correct .h5p-alternative-container *, .h5p-sc-alternatives.h5p-sc-selected li.h5p-sc-alternative.h5p-sc-reveal-correct * {
    color: {$fbCorrMain} !important;
}
.h5p-multichoice .h5p-answers .h5p-answer.h5p-wrong .h5p-alternative-container, .h5p-sc-alternatives.h5p-sc-selected li.h5p-sc-alternative.h5p-sc-reveal-wrong, .h5p-true-false-answers .h5p-true-false-answer.h5p-wrong {
    background-color: {$fbIncorrSec} !important;
    border-color: {$fbIncorrMain} !important;
    color: {$fbIncorrMain} !important;
}
.h5p-multichoice .h5p-answers .h5p-answer.h5p-wrong .h5p-alternative-container *, .h5p-sc-alternatives.h5p-sc-selected li.h5p-sc-alternative.h5p-sc-reveal-wrong * {
    color: {$fbIncorrMain} !important;
}
.joubel-ui-button, .h5p-joubelui-button, .h5p-question-buttons .joubel-ui-button, .h5p-theme-button, .h5p-core-button, .h5p-enable-solution, .h5p-show-solution-button, .h5p-question-check-answer {
    background-color: {$t['primary']} !important;
    color: {$ctaText} !important;
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
    border-color: {$border} !important;
    background-color: {$t['surface']} !important;
    border-radius: 6px !important;
}
.dots-container .progress-dot {
    background-color: {$border} !important;
    border: 1px solid {$border} !important;
}
.dots-container .progress-dot.current {
    background-color: {$t['primary']} !important;
    border-color: {$t['primary']} !important;
    transform: scale(1.25) !important;
}
.dots-container .progress-dot.answered {
    background-color: {$t['primary']} !important;
    opacity: 0.6 !important;
}
.h5p-input, input.h5p-text-input, .h5p-blanks input {
    background-color: {$t['surface']} !important;
    color: {$t['text']} !important;
    border: 1px solid {$border} !important;
    border-radius: 4px !important;
    padding: 4px 8px !important;
}
.h5p-question-feedback, .h5p-feedback-content, .questionset-results {
    background-color: {$t['surface']} !important;
    color: {$t['text']} !important;
    border: 1px solid {$border} !important;
    border-radius: 8px !important;
}
.h5p-question-feedback *, .questionset-results * {
    color: {$t['text']} !important;
}
";
    }
}
