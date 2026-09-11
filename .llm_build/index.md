# Codebase Contract & AST Index

> Designed for Frontier LLMs (Architecture reasoning, signature contracts & testing).

## `plugin/headlessui/classes/external.php`
### Classes & Methods
- **class external** [L44]
  - `public get_autologin_key_parameters(): external_function_parameters` [L51]
  - `public get_autologin_key(): array` [L60]
  - `public get_autologin_key_returns(): external_single_structure` [L88]
  - `public change_password_parameters(): external_function_parameters` [L100]
  - `public change_password(string $newpassword): array` [L112]
  - `public change_password_returns(): external_single_structure` [L142]
  - `public get_user_enrolments_parameters(): external_function_parameters` [L154]
  - `public get_user_enrolments(int $userid = 0): array` [L166]
  - `public get_user_enrolments_returns(): external_single_structure` [L202]

## `plugin/headlessui/classes/hook/before_footer.php`
### Classes & Methods
- **class before_footer** [L38]
  - `public execute(before_footer_html_generation $hook): void` [L44]
  - `private generate_h5p_css(array $t): string` [L427]

## `scratch/test-h5p-scraper.js`
### Functions
- `function inspectH5pIframe(page, stepName)` [L23]
- `function run()` [L88]

## `scripts/automation-helper.js`
### Functions
- `export function takeScreenshot(page, prefix, scratchDir = path.resolve(process.cwd(), 'scratch'))` [L11]
- `export function loginMoodle(page, config = {})` [L31]

## `scripts/env-helper.js`
### Functions
- `export function loadEnv(projectRoot)` [L9]

## `scripts/sync-moodle-plugins.js`
### Functions
- `function logStep(step, total, message)` [L44]
- `function getLocalPlugins()` [L51]
- `function scrapeRemotePluginVersions(page, expectedComponents)` [L100]
- `function packagePlugin(plugin)` [L143]
- `function installPluginViaWeb(page, plugin, zipPath)` [L175]

## `scripts/uninstall-moodle-plugin.js`
### Functions
- `function purgeCaches(page)` [L47]
- `function processProgressButtons(page)` [L62]

## `src/components/cert-viewer.js`
### Functions
- `export function createCertViewer({ mod, certData, issuances, courseId })` [L13]

## `src/components/course-card.js`
### Functions
- `export function createCourseCard(course, onClick)` [L4]

## `src/components/course-carousel.js`
### Functions
- `export function createCourseCarousel(courses, onClick)` [L3]

## `src/components/course-grid.js`
### Functions
- `export function createCourseGrid(courses, onClick)` [L3]

## `src/components/forum-viewer.js`
### Functions
- `export function createForumViewer({ mod, courseId })` [L9]

## `src/components/header.js`
### Functions
- `function getThemeIconSvg(iconName)` [L5]
- `export function createThemeSelector()` [L21]
- `export function createHeader()` [L114]

## `src/components/loader.js`
### Functions
- `export function createLoader()` [L1]

## `src/components/modal.js`
### Functions
- `export function createModal(titleText, contentElement)` [L1]

## `src/components/quiz-runner.js`
### Functions
- `export function createQuizRunner(courseId, mod, onCompletionUpdate)` [L7]

## `src/components/tabs.js`
### Functions
- `export function createTabs(tabsData)` [L1]

## `src/config/api.js`
### Functions
- `export function buildRestUrl(wsfunction, params = {})` [L17]

## `src/config/tenant.js`
### Functions
- `export function getTenantConfig()` [L40]
- `export function applyTenantTheme()` [L61]

## `src/main.js`
### Functions
- `function init()` [L67]

## `src/router/index.js`
### Classes & Methods
- **class Router** [L3]
  - `constructor(routes)` [L4]
  - `_safeInvokeCleanup(cleanup)` [L17]
  - `handleHashChange()` [L30]
  - `navigate(path)` [L101]
  - `destroy()` [L105]

## `src/utils/image.js`
### Functions
- `export function normalizeMoodleUrl(rawUrl)` [L7]
- `export function extractCourseRawImageUrl(course)` [L51]
- `export function getDirectCourseImageUrl(course)` [L76]
- `export function getCourseImageUrl(course)` [L92]
- `export function replacePluginfileUrls(html)` [L119]
- `export function replaceRelativeImages(html, contents)` [L139]

## `src/utils/sanitize.js`
### Functions
- `export function escapeHtml(str)` [L13]
- `export function decodeHtml(str)` [L29]
- `function cleanStyle(styleStr)` [L44]
- `export function sanitizeHtml(dirtyHtml, options = {})` [L78]

## `src/utils/theme.js`
### Functions
- `function getThemeCookie()` [L45]
- `function setThemeCookie(val)` [L52]
- `export function getSavedTheme()` [L94]
- `export function setTheme(themeId)` [L141]
- `export function initTheme()` [L169]
- `export function getThemesList()` [L175]
- `export function getThemeTokens(themeId)` [L262]

## `src/views/change-password.js`
### Functions
- `export function renderChangePassword(container)` [L7]

## `src/views/course.js`
### Functions
- `export function renderCourse(container, courseId)` [L17]

## `src/views/course/renderers/assign-renderer.js`
### Functions
- `export function createAssignRenderer({ mod, courseId })` [L14]

## `src/views/course/renderers/book-renderer.js`
### Functions
- `export function createBookRenderer({ mod, mainArea })` [L13]

## `src/views/course/renderers/h5p-renderer.js`
### Functions
- `export function createH5pRenderer({ mod, courseId })` [L16]

## `src/views/course/renderers/resource-renderer.js`
### Functions
- `export function createResourceRenderer({ mod })` [L10]

## `src/views/course/renderers/scorm-renderer.js`
### Functions
- `export function createScormRenderer({ mod, courseId, onCompletionRefresh })` [L15]

## `src/views/dashboard.js`
### Functions
- `export function renderDashboard(container)` [L8]

## `src/views/login.js`
### Functions
- `export function renderLogin(container)` [L6]
