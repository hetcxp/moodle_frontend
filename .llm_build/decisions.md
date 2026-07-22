# Project Decisions Log
_Decisiones de diseño y arquitectura relevantes para el LLM._

## 2026-07-15 Autologin y H5P
- **Contexto**: Las actividades H5P requieren sesión de Moodle para registrar completion y xAPI.
- **Decisión**: Se implementa un plugin local `local_headless` con un script de autologin y un wrapper H5P personalizado (`h5p.php`) que redirige al player embebido nativo del core de Moodle.
- **Impacto**: Afecta a `src/services/moodle-api.js` y `src/views/course.js` al interactuar con H5P e iframe integration.

## 2026-07-21 Estrategia de Despliegue y Entornos
- **Contexto**: Necesidad de mantener un entorno local para pruebas rápidas y un entorno en la nube para usuarios externos.
- **Decisión**: Se utilizará Vite para manejar automáticamente dos entornos. 
  1. `.env`: Contiene las credenciales del Moodle local (ej: `VITE_MOODLE_URL=/moodle` apuntando a `localhost:8000`). Este archivo es usado automáticamente por el comando `npm run dev`.
  2. `.env.production`: Contiene las credenciales del Moodle en producción (ej: `VITE_MOODLE_URL=https://lts.academyfactory.online`). Vite usa automáticamente este archivo al compilar para producción con `npm run build`.
- **Despliegue**: Se utiliza el paquete `gh-pages` con el comando `npm run deploy` para compilar el código (inyectando `.env.production`) y subir el resultado estático a la rama `gh-pages` de GitHub.

## 2026-07-22 Integración Nativa de Foros
- **Contexto**: Las discusiones y posts de los foros de Moodle deben poder interactuar de forma nativa en la UI del frontend.
- **Decisión**: Se implementa un servicio dedicado `ForumService` (`src/services/forum.js`) para manejar las llamadas a los web services de foros (`mod_forum_*`) y un componente nativo `createForumViewer` (`src/components/forum-viewer.js`) con soporte de estados para listados, hilos y creación de discusiones/respuestas.
- **Impacto**: Se integra dinámicamente en `src/views/course.js` al renderizar módulos de tipo `forum`.

## 2026-07-22 Carrusel de Cursos por Categoría
- **Contexto**: Mostrar todos los cursos disponibles por categoría en cuadrículas verticales estáticas reducía la usabilidad en pantallas pequeñas y aumentaba la altura de la página de forma excesiva.
- **Decisión**: Implementar un componente interactivo de carrusel horizontal (`src/components/course-carousel.js`) al estilo Netflix con scroll horizontal suave, ocultando la barra de scroll y usando botones flotantes de navegación en desktop, desactivándolos en mobile a favor del scroll táctil nativo.
- **Impacto**: Afecta a `src/views/dashboard.js` al renderizar los cursos disponibles por categoría mediante `createCourseCarousel`.
