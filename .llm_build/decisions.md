# Project Decisions Log
_Decisiones de diseño y arquitectura relevantes para el LLM._

## 2026-07-15 Autologin y H5P
- **Contexto**: Las actividades H5P requieren sesión de Moodle para registrar completion y xAPI.
- **Decisión**: Se implementa un plugin local `local_headless` con un script de autologin y un wrapper H5P personalizado (`h5p.php`) que redirige al player embebido nativo del core de Moodle.
- **Impacto**: Afecta a `src/services/moodle-api.js` y `src/views/course.js` al interactuar con H5P e iframe integration.
