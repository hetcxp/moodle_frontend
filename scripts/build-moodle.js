import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Rutas
const uiDir = path.resolve(__dirname, '..', 'plugin', 'headlessui');
const srcPluginDir = path.resolve(__dirname, '..', 'src_moodle_plugin');
const appDir = path.join(uiDir, 'app');

function copyRecursiveSync(src, dest) {
  const exists = fs.existsSync(src);
  const stats = exists && fs.statSync(src);
  const isDirectory = exists && stats.isDirectory();
  if (isDirectory) {
    if (!fs.existsSync(dest)) fs.mkdirSync(dest, { recursive: true });
    fs.readdirSync(src).forEach(childItemName => {
      copyRecursiveSync(path.join(src, childItemName), path.join(dest, childItemName));
    });
  } else {
    fs.copyFileSync(src, dest);
  }
}

try {
  // 1. Asegurarnos de que el build en app/ fue exitoso
  if (!fs.existsSync(appDir)) {
    console.error(`Error: No se encontró la compilación en ${appDir}. ¿Falló Vite?`);
    process.exit(1);
  }

  // 2. Verificar existencia de index.php y version.php del plugin
  const requiredFiles = ['index.php', 'version.php'];
  for (const file of requiredFiles) {
    if (!fs.existsSync(path.join(uiDir, file))) {
      console.warn(`Advertencia: Falta archivo requerido en plugin: ${file}`);
    }
  }

  console.log('✅ UI para Moodle compilada y empaquetada exitosamente en plugin/headlessui/');
} catch (error) {
  console.error('❌ Error durante el post-build para Moodle:', error);
  process.exit(1);
}
