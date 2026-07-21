# Project Context Map
_Last updated: 2026-07-15T19:24:00-03:00_

## Tech Stack
- Lenguajes: JavaScript (Vanilla/ES6), HTML, CSS, PHP (Moodle Plugin)
- Frameworks: Vite (^8.1.1)
- Dependencias clave: Ninguna dependencia externa de JS pesada (Vanilla JS)
- Gestor de paquetes: npm

## Arquitectura & Patrones
- **Frontend**: SPA Vanilla JS con enrutador personalizado (`src/router/index.js`). Diseño modular con servicios (`src/services/`) y vistas (`src/views/`).
- **Moodle Backend Integration**: Usa Web Services de Moodle mediante REST (JSON) y un plugin local personalizado (`local_headless`) para autologin y visualización optimizada de H5P.

## Entry Points & Key Files
- [src/main.js](file:///Users/hectorteran/Documents/moodle_frontend/src/main.js) — Inicialización de rutas y aplicación. ⭐
- [src/services/moodle-api.js](file:///Users/hectorteran/Documents/moodle_frontend/src/services/moodle-api.js) — Cliente para llamadas Web Services de Moodle. ⭐
- [local_headless.zip](file:///Users/hectorteran/Documents/moodle_frontend/local_headless.zip) — Plugin Moodle necesario para el backend. ⭐

## Directory Structure & Signatures
### src/
- `main.js`: Setup de rutas (`/login`, `/dashboard`, `/course/:id`) y theme de tenants.
- `services/auth.js`: Servicio de login (`AuthService.login`), token y persistencia en sessionStorage.
- `services/moodle-api.js`: Cliente de llamadas API `MoodleApi.call` y token integration.
- `services/courses.js`: Métodos para traer cursos y contenidos.
- `config/api.js`: Endpoint helper para Moodle REST.
- `config/tenant.js`: Configuración dinámica del tenant y estilos visuales.

### Moodle local_headless Plugin (local/headless/)
- `version.php`: Versión 2023101001, Moodle requiere >= 2022041900.
- `autologin.php`: Script para autenticación automática vía web tokens.
- `h5p.php`: Renderizador/redirección para actividades H5P.
- `db/services.php`: Registra el web service `headless_service` y sus funciones.
- `classes/external.php`: Implementación externa del web service `get_autologin_key`.

## Exclusiones Aplicadas
- node_modules, .git, dist, package-lock.json
