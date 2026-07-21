# Guía de Instalación y Actualización de Moodle Headless Frontend

Este documento detalla los pasos para conectar y desplegar este frontend contra cualquier instancia de Moodle compatible.

---

## 1. Configuración del Moodle (Backend)

El frontend requiere el plugin local `local_headless` instalado en Moodle para gestionar el autologin de actividades integradas (SCORM, H5P) y xAPI tracking.

### Paso 1.1: Instalar el plugin
1. Localiza el archivo `local_headless.zip` en la raíz de este proyecto.
2. Descomprímelo en el directorio `local/` de tu instalación de Moodle:
   ```bash
   # Debería quedar en:
   moodle/local/headless/
   ```
3. Ejecuta la actualización de la base de datos de Moodle:
   * **Por terminal (Recomendado)**:
     ```bash
     php admin/cli/upgrade.php
     ```
   * **Por interfaz web**: Accede a `/admin/index.php` en tu Moodle con una cuenta de administrador y sigue los pasos en pantalla.

### Paso 1.2: Habilitar Web Services en Moodle
1. Ve a **Site administration** > **Advanced features**.
2. Activa la opción **Enable web services** y guarda los cambios.
3. Ve a **Site administration** > **Server** > **Web services** > **Manage protocols**.
4. Habilita el protocolo **REST protocol** (clic en el ojo para activarlo).

### Paso 1.3: Habilitar Autenticación Móvil (Requerido para Token Generation)
Para que los usuarios puedan autenticarse a través del login del frontend:
1. Ve a **Site administration** > **Plugins** > **Web services** > **Mobile**.
2. Habilita la casilla **Enable web services for mobile devices**.
3. Guarda los cambios.

### Paso 1.4: Configuración del Web Service `headless_service`
El plugin `local_headless` crea automáticamente un servicio web llamado `Headless Service` (shortname: `headless_service`).
1. Ve a **Site administration** > **Server** > **Web services** > **External services**.
2. Asegúrate de que **Headless Service** está en la lista y activo.
3. Si deseas permitir que los usuarios generen tokens para este servicio específico mediante `/login/token.php`, valida que sus capacidades y roles tengan el permiso `moodle/webservice:createtoken`.

---

## 2. Configuración del Frontend

El frontend está desarrollado sobre Vite y Vanilla JS.

### Paso 2.1: Instalar dependencias
En la carpeta raíz del frontend, ejecuta:
```bash
npm install
```

### Paso 2.2: Configurar variables de entorno
1. Crea un archivo `.env` en la raíz del proyecto copiando el archivo de ejemplo:
   ```bash
   cp .env.example .env
   ```
2. Modifica las variables en `.env` según tu entorno:
   * `VITE_MOODLE_URL`: La dirección absoluta de tu servidor Moodle (ej. `http://localhost:8080` o `https://mi-moodle.com`). **Nota**: Debe incluir el protocolo (`http://` o `https://`) y no debe finalizar con barra `/`.
   * `VITE_SERVICE_NAME`: Define el servicio que se usará para obtener el token. Usa `headless_service` para habilitar todas las funciones del plugin local (incluyendo el autologin de H5P/SCORM).
   * `VITE_TENANT`: Identificador para aplicar configuraciones y estilos personalizados (ej. `default`).

### Paso 2.3: Ejecución en desarrollo
Para levantar el servidor local de desarrollo:
```bash
npm run dev
```
Accede a la URL indicada (usualmente `http://localhost:5173`).

### Paso 2.4: Compilación para producción (Build)
Para compilar y minificar los archivos listos para el despliegue:
```bash
npm run build
```
Los archivos de distribución se generarán en la carpeta `dist/`. Sube el contenido de esa carpeta a tu servidor web (Nginx, Apache, S3, etc.).

---

## 3. Proceso de Actualización

### 3.1 Actualizar el Frontend
1. Obtén el último código (vía git merge, pull o reemplazo de archivos).
2. Instala dependencias nuevas si el `package.json` cambió:
   ```bash
   npm install
   ```
3. Genera un nuevo build de producción:
   ```bash
   npm run build
   ```
4. Sube la carpeta `dist/` resultante a tu servidor de hosting o CDN.

### 3.2 Actualizar el Plugin en Moodle
Si el plugin `local_headless` recibe actualizaciones:
1. Reemplaza el directorio `local/headless/` de Moodle por la nueva versión.
2. Ejecuta la actualización de base de datos desde la línea de comandos de Moodle:
   ```bash
   php admin/cli/upgrade.php
   ```
3. Limpia la caché de Moodle para asegurar que los nuevos servicios web y hooks se carguen correctamente:
   ```bash
   php admin/cli/purge_caches.php
   ```

---

## 4. Validación de la Conexión

Una vez completado el setup, puedes validar el funcionamiento de la siguiente forma:

1. Levanta el frontend en local (`npm run dev`).
2. Abre la consola de desarrollo del navegador.
3. Intenta iniciar sesión con un usuario activo de Moodle.
4. Si la conexión es exitosa:
   * El frontend obtendrá el token mediante `POST /login/token.php`.
   * Se consultará la información del sitio vía `POST /webservice/rest/server.php?wsfunction=core_webservice_get_site_info`.
   * Serás redireccionado al dashboard donde verás tus cursos.
