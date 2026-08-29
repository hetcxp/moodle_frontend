# 🚀 Next-Gen Moodle Frontend

¡Bienvenido al futuro del aprendizaje! **Next-Gen Moodle Frontend** es una experiencia de usuario completamente rediseñada para Moodle. Desacoplamos el backend (Moodle) del frontend (lo que ves) para ofrecer una plataforma increíblemente rápida, moderna y parecida a las aplicaciones que usas todos los días.

---

## 🌟 Para Todo el Mundo (Resumen Ejecutivo)

¿Cansado de la interfaz tradicional de Moodle? Nosotros también. 

Hemos construido esta plataforma pensando en el estudiante moderno:
- **⚡ Ultrarrápida:** Carga instantánea. No más esperas entre pantallas.
- **📱 Experiencia de App (PWA):** Funciona y se siente como una aplicación móvil nativa. ¡Incluso puedes instalarla en tu teléfono!
- **🎨 Diseño Premium:** Interfaz limpia, intuitiva y estéticamente atractiva. Adiós al desorden.
- **🎓 Todo lo que necesitas:** Soporte completo para **Cursos, Cuestionarios (Quizzes), Foros interactivos y Visualizador de Certificados**. Todo fluye sin interrupciones.
- **🌙 Tema Oscuro & Personalización:** Preparado para adaptarse a la identidad visual de tu institución o empresa (Tenant config).

Nuestro objetivo es simple: **Que aprender sea la única tarea difícil, no usar la plataforma.**

---

## 💻 Para Desarrolladores (Technical Overview)

Este proyecto es una **Single Page Application (SPA)** moderna, construida con **Vanilla JavaScript** y empaquetada con **Vite**. Se comunica con un backend de Moodle utilizando su API RESTful (Headless Moodle).

### 🛠 Tech Stack
- **Core:** HTML5, CSS3, ES6+ (Vanilla JS - *Zero framework bloat!*)
- **Build Tool & Dev Server:** [Vite](https://vitejs.dev/) ⚡
- **PWA Support:** `vite-plugin-pwa` para caching offline, service workers y app manifest.
- **Arquitectura de UI:** Componentes modulares basados en funciones (ej. `course-card.js`, `quiz-runner.js`, `forum-viewer.js`).
- **Routing:** Enrutador SPA propio (`src/router/index.js`).

### 📂 Estructura del Proyecto

```text
moodle_frontend/
├── src/
│   ├── components/    # Componentes reutilizables de UI (Quiz, Forum, Headers, Cards)
│   ├── views/         # Páginas principales (Dashboard, Login, Course, ChangePassword)
│   ├── router/        # Lógica de navegación SPA y gestión de estado de URL
│   ├── services/      # Lógica de negocio (Llamadas a la API REST de Moodle)
│   ├── config/        # Configuraciones globales (Endpoints de API, Tenant Theming)
│   ├── utils/         # Utilidades de transformación (URLs de imágenes locales/remotas)
│   ├── styles/        # CSS modular (Dashboard, Carousel, Quiz, Login)
│   ├── main.js        # Punto de entrada de la aplicación
│   └── style.css      # Estilos globales y variables
├── index.html         # Plantilla HTML principal
├── package.json       # Dependencias y scripts
└── vite.config.js     # (Si aplica) Configuración de build de Vite y PWA
```

### 🚀 Getting Started (Desarrollo Local)

1. **Clonar e instalar dependencias:**
   ```bash
   git clone <tu-repo>
   cd moodle_frontend
   npm install
   ```

2. **Ejecutar el servidor de desarrollo:**
   ```bash
   npm run dev
   ```
   *Vite levantará el servidor ultrarrápido con Hot Module Replacement (HMR).*

3. **Build para producción:**
   ```bash
   npm run build
   ```
   *Los archivos compilados, minificados y optimizados se generarán en la carpeta `/dist`.*

4. **Deploy (GitHub Pages):**
   ```bash
   npm run deploy
   ```

### 🔌 Conexión con Moodle (Headless)
El frontend requiere un plugin local o configuración en Moodle que exponga los Webservices necesarios. Asegúrate de configurar la URL base de tu Moodle en `src/config/api.js` o mediante variables de entorno para que el router y los servicios puedan comunicarse mediante tokens JWT / WebService Tokens.

---

*Desarrollado con ❤️ para revolucionar el e-learning.*
