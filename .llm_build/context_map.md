# Project Context Map
_Last updated: 2026-08-18T11:00:00-03:00_

## Tech Stack
- Lenguajes: JavaScript (Vanilla/ES6), HTML, CSS, PHP (Moodle Plugin)
- Frameworks: Vite (^8.1.1)
- Dependencias clave: gh-pages (^6.3.0), vite-plugin-pwa (^1.3.0)
- Gestor de paquetes: npm

## Arquitectura & Patrones
- **Frontend**: SPA Vanilla JS con enrutador personalizado (`src/router/index.js`). Diseño modular con servicios (`src/services/`), componentes (`src/components/`) y vistas (`src/views/`).
- **Moodle Backend Integration**: Usa Web Services de Moodle mediante REST (JSON) y un plugin local personalizado (`local_headless`) para autologin, cambio de contraseña y visualización optimizada de H5P y foros.
- **Despliegue**: `npm run deploy` compila con `.env.production` y publica en GitHub Pages vía `gh-pages`.

## Entry Points & Key Files
- [src/main.js](file:///Users/hectorteran/Documents/moodle_frontend/src/main.js) — Inicialización de rutas y aplicación. ⭐
- [src/services/moodle-api.js](file:///Users/hectorteran/Documents/moodle_frontend/src/services/moodle-api.js) — Cliente para llamadas Web Services de Moodle. ⭐
- [src/views/course.js](file:///Users/hectorteran/Documents/moodle_frontend/src/views/course.js) — Vista principal de curso (~38KB), renderiza todos los tipos de módulos. ⭐
- [local_headless.zip](file:///Users/hectorteran/Documents/moodle_frontend/local_headless.zip) — Plugin Moodle necesario para el backend. ⭐

## Directory Structure & Signatures

### src/router/
- `index.js`: `class Router` — Enrutador hash-based con soporte de params (`:id`) y guards.

### src/services/
- `auth.js`: `AuthService` — Login, token (sessionStorage), `getTempSession()` para flujo de cambio de contraseña.
- `moodle-api.js`: `MoodleApi.call(wsfunction, params, customToken?)` — Cliente REST genérico + `getAutoLoginUrl()`.
- `courses.js`: `CourseService` — `getEnrolledCourses()`, `getDashboardCourses()` (separa active/completed, ordena por `lastaccess` y `timecompleted`), `getCourseContents()`, `getPageContent()`, `getScormAttemptCount()`, `getActivitiesCompletionStatus()`, `markActivityComplete()`, `getH5pActivityIntro()`, `getAssignmentData()`, `fetchFileContent()`.
- `forum.js`: `ForumService` — Interacción con discusiones y posts del foro (`mod_forum_*`).
- `cert.js`: `CertService` — `getCertsByCoures(courseId)`, `getIssuances(certId)`, `downloadPdf(mod)` con fallback a autologin.
- `quiz.js`: `QuizService` — `getQuizByCmId()`, `getUserAttempts()`, `startAttempt()`, `getAttemptData()`, `saveAttempt()`, `processAttempt()`, `getAttemptReview()`.
- `password.js`: `PasswordService` — `change(newpassword)` via `local_headless_change_password`.

### src/components/
- `header.js`: `createHeader()` — Header con nombre del usuario y botón de logout.
- `course-card.js`: `createCourseCard(course, onClick)` — Tarjeta de curso con imagen, categoría, título y **barra de progreso** (si `course.progress` existe).
- `course-carousel.js`: `createCourseCarousel(courses, onClick)` — Carrusel horizontal tipo Netflix con scroll suave y botones de navegación.
- `course-grid.js`: `createCourseGrid(courses, onClick)` — Grid estático de cursos (legacy/alternativo).
- `forum-viewer.js`: `createForumViewer({ mod, courseId })` — Renderizado nativo de foros con soporte de hilos y respuestas.
- `cert-viewer.js`: `createCertViewer({ mod, certData, issuances, courseId })` — Vista nativa de customcert con descarga PDF.
- `quiz-runner.js`: `createQuizRunner(courseId, mod, onCompletionUpdate)` — Ejecutor nativo de quizzes con timer, navegación de páginas y revisión.
- `tabs.js`: `createTabs(tabsData)` — Componente de pestañas genérico.
- `modal.js`: `createModal(title, bodyElement)` — Modal con overlay y cierre.
- `loader.js`: `createLoader()` — Spinner de carga.

### src/views/
- `login.js`: `renderLogin(container)` — Pantalla de login con detección de `forcepasswordchange`.
- `dashboard.js`: `renderDashboard(container)` — Dashboard con secciones: "Mis Cursos Activos" (con barra de progreso, ordenados por último acceso), "Cursos Terminados" (debajo, ordenados por fecha de terminación), y "Cursos Disponibles" (agrupados por categoría con modal de estructura).
- `course.js`: `renderCourse(container, courseId)` — Vista detallada de curso, renderiza módulos por tipo (page, scorm, h5pactivity, forum, customcert, quiz, assign, url, resource, label).
- `change-password.js`: `renderChangePassword(container)` — Flujo de cambio de contraseña obligatorio.

### src/config/
- `api.js`: Endpoint helper para Moodle REST.
- `tenant.js`: Configuración dinámica del tenant y estilos visuales (`applyTenantTheme()`, `getTenantConfig()`).

### src/utils/
- `image.js`: `getCourseImageUrl(course)` — Extrae y normaliza URL de imagen de curso.

### src/styles/
- `index.css`: Importa todos los demás CSS.
- `carousel.css`: Estilos responsive de carrusel tipo Netflix.
- `components.css`: Estilos de componentes (cards, modal, header).
- `dashboard.css`: Estilos de la vista dashboard.
- `extensions.css`: Estilos para módulos embebidos (scorm, h5p, quiz, cert, forum).
- `login.css`: Estilos de la pantalla de login.
- `quiz.css`: Estilos extensos del quiz runner.

### Rutas registradas (main.js)
| Ruta | Vista | Guard |
|---|---|---|
| `/login` | `renderLogin` | Redirige a `/dashboard` si autenticado |
| `/dashboard` | `renderDashboard` | Redirige a `/login` si no autenticado |
| `/course/:id` | `renderCourse` | Redirige a `/login` si no autenticado |
| `/change-password` | `renderChangePassword` | Requiere `tempSession` |
| `*` | Fallback | Redirige según estado de auth |

### Moodle local_headless Plugin (local/headless/)
- `version.php`: Versión 2023101001, Moodle requiere >= 2022041900.
- `autologin.php`: Script para autenticación automática vía web tokens.
- `h5p.php`: Renderizador/redirección para actividades H5P.
- `db/services.php`: Registra el web service `headless_service` y sus funciones (incluye `local_headless_change_password`).
- `classes/external.php`: Implementación externa del web service `get_autologin_key` y `change_password`.

## Exclusiones Aplicadas
- node_modules, .git, dist, package-lock.json
