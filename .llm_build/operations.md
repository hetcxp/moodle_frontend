# Operaciones y Entorno Local (.llm_build/operations.md)

> Última actualización: 2026-08-31

Guía de referencia rápida del entorno, rutas del sistema, comandos CLI de Moodle y recetas de delegación MCP para optimización de tokens y ejecución sin exploración redundante.

---

## 1. Mapa de Rutas del Entorno Local

| Recurso | Ruta Absoluta | Propósito | Notas técnicas |
|---|---|---|---|
| **PHP 8.3 Binario** | `/opt/homebrew/opt/php@8.3/bin/php` | Ejecutar scripts CLI de Moodle | Verificar con `php -v` antes de asumir la ruta si hay upgrade de versión |
| **Moodle Core Root** | `/Users/hectorteran/Dev/moodle-dev` | Raíz de la instalación de Moodle | — |
| **Moodle Public Root** | `/Users/hectorteran/Dev/moodle-dev/public` | Servido en `http://localhost:8000` | — |
| **Frontend Workspace** | `/Users/hectorteran/Documents/moodle_frontend` | Proyecto Vite / SPA / Plugins UI | — |
| **Plugin Headless (Backend)** | `/Users/hectorteran/Documents/moodle_frontend/plugin/headless` | Backend del plugin headless | Symlinked a `moodle-dev/local/headless` |
| **Plugin Headless UI** | `/Users/hectorteran/Documents/moodle_frontend/plugin/headlessui` | UI del plugin headless | Symlinked a `moodle-dev/public/local/headlessui` |
| **Extractor AST** | `/Users/hectorteran/Documents/scripts/extract_schemas.py` | Generador de esquemas AST | Output: `.llm_build/index.md` (invocado vía `npm run moodle:extract`) |

---

## 2. Recetas de Comandos CLI y Scripts NPM

Accesos directos configurados en `package.json` para ejecución inmediata con costo de 0 tokens de búsqueda:

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

## 3. Tabla de Delegación MCP (Modelo + Trigger + Template)

| Tarea | Modelo | Cuándo delegar | Template |
|---|---|---|---|
| Extracción de comandos CLI / filtrado de logs | `gemma4-mac` | Buscar un comando específico en `admin/cli/` o filtrar logs extensos de error de Moodle | Ver 3.1 |
| Traducciones i18n | `gemma4-mac` | Redacción de cadenas en `lang/es/*.php` o `lang/en/*.php` | — |
| Patrones de búsqueda | `gemma4-mac` | Generación de regex concisas para búsquedas en código | — |
| Tests unitarios | `qwen3-mac` | Redacción de suites Vitest (`tests/*.test.js`) | Ver 3.2 |
| Funciones aisladas | `qwen3-mac` | Creación/refactor de métodos específicos en servicios o utilidades | — |
| Conventional commits | `qwen3-mac` | Análisis de `git diff` para redactar commits atómicos estructurados | — |
| **Cualquier otra tarea** | **No delegar** | Lógica de negocio compleja, cambios cross-file, o decisiones de arquitectura → resolver directamente, sin pasar por modelos locales | — |

### 3.1 Template `gemma4-mac` (Filtrado de logs / resolución de comandos)
```json
{
  "messages": [
    {
      "role": "user",
      "content": "Analiza el siguiente error/requerimiento de Moodle y extrae el comando CLI exacto de /Users/hectorteran/Dev/moodle-dev/admin/cli/ necesario: {CONTEXT}"
    }
  ],
  "model": "gemma4-mac"
}
```

### 3.2 Template `qwen3-mac` (Generación de tests / código)
```json
{
  "messages": [
    {
      "role": "user",
      "content": "Genera el test unitario para Vitest para la siguiente función JavaScript usando jsdom: {CODE_SNIPPET}"
    }
  ],
  "model": "qwen3-mac"
}
```
