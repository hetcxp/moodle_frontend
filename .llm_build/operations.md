# Operaciones y Entorno Local (.llm_build/operations.md)

Guía de referencia rápida del entorno, rutas del sistema, comandos CLI de Moodle y recetas de delegación MCP para optimización de tokens y ejecución sin exploración redundante.

---

## 1. Mapa de Rutas del Entorno Local

| Recurso | Ruta Absoluta | Notas |
|---|---|---|
| **PHP 8.3 Binario** | `/opt/homebrew/opt/php@8.3/bin/php` | Usar siempre para scripts CLI de Moodle |
| **Moodle Core Root** | `/Users/hectorteran/Dev/moodle-dev` | Directorio raíz de la instalación de Moodle |
| **Moodle Public Root** | `/Users/hectorteran/Dev/moodle-dev/public` | Servido en `http://localhost:8000` |
| **Frontend Workspace** | `/Users/hectorteran/Documents/moodle_frontend` | Proyecto Vite / SPA / Plugins UI |
| **Plugin Headless (Backend)** | `/Users/hectorteran/Documents/moodle_frontend/plugin/headless` | Symlinked a `moodle-dev/local/headless` |
| **Plugin Headless UI** | `/Users/hectorteran/Documents/moodle_frontend/plugin/headlessui` | Symlinked a `moodle-dev/public/local/headlessui` |
| **Extractor AST (.llm_build)** | `/Users/hectorteran/Documents/scripts/extract_schemas.py` | Generador de esquemas AST |

---

## 2. Recetas de Comandos CLI y Scripts NPM

Se configuraron accesos directos en `package.json` para ejecución inmediata con costo de 0 tokens de búsqueda:

```bash
# 1. Upgrade de base de datos Moodle
npm run moodle:upgrade

# 2. Purga de caché Moodle
npm run moodle:purge

# 3. Flujo completo de sincronización (Build UI + Upgrade + Purge)
npm run moodle:sync

# 4. Actualizar AST .llm_build/index.md
npm run moodle:extract

# 5. Tests unitarios
npm test
```

---

## 3. Guía de Delegación MCP (Ahorro de Tokens)

### Cuándo delegar a `gemma4-mac` (4B - Texto / Baja Latencia):
- **Extracción de Comandos y Keywords:** Cuando se requiera buscar un comando CLI específico o filtrar logs extensos de error de Moodle.
- **Traducciones i18n:** Redacción de cadenas en `lang/es/*.php` o `lang/en/*.php`.
- **Patrones de Búsqueda:** Generación de expresiones regulares concisas para búsquedas en código.

### Cuándo delegar a `qwen3-mac` (8B - Código / Lógica):
- **Generación de Tests Unitarios:** Redacción de suites de tests en Vitest (`tests/*.test.js`).
- **Funciones Aisladas:** Creación o refactorización de métodos específicos en servicios o utilidades.
- **Conventional Commits:** Análisis de `git diff` para redactar commits atómicos estructurados.

---

## 4. Plantillas de Prompt para Delegación MCP

### Template para `gemma4-mac` (Filtrado de Logs / Resolución de Comandos):
```json
{
  "messages": [
    {
      "role": "user",
      "content": "Analiza el siguiente error/requerimiento de Moodle y extrae el comando CLI exacto de /Users/hectorteran/Dev/moodle-dev/admin/cli/ necesario: {CONTEXT}"
    }
  ],
  "model": "gemma-4b"
}
```

### Template para `qwen3-mac` (Generación de Tests / Código):
```json
{
  "messages": [
    {
      "role": "user",
      "content": "Genera el test unitario para Vitest para la siguiente función JavaScript usando jsdom: {CODE_SNIPPET}"
    }
  ],
  "model": "qwen3-8b"
}
```
