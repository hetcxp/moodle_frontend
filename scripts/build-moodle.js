import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Rutas
const uiDir = path.resolve(__dirname, '..', 'plugin', 'headlessui');
const appDir = path.join(uiDir, 'app');

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

  // 3. Quality Gate: Verificar manifest.json y assets no vacíos
  const manifestFile = fs.existsSync(path.join(appDir, '.vite', 'manifest.json'))
    ? path.join(appDir, '.vite', 'manifest.json')
    : path.join(appDir, 'manifest.json');

  if (!fs.existsSync(manifestFile)) {
    console.error(`❌ Error crítico: No se encontró manifest.json en ${appDir}`);
    process.exit(1);
  }

  const assetsDir = path.join(appDir, 'assets');
  if (!fs.existsSync(assetsDir)) {
    console.error(`❌ Error crítico: Directorio de assets no encontrado en ${assetsDir}`);
    process.exit(1);
  }

  // 4. Quality Gate: Escaneo de rutas legadas (/local/headless/ sin ui)
  const assetFiles = fs.readdirSync(assetsDir);
  let foundLegacy = false;
  for (const file of assetFiles) {
    if (file.endsWith('.js') || file.endsWith('.css')) {
      const fullPath = path.join(assetsDir, file);
      const stat = fs.statSync(fullPath);
      if (stat.size === 0) {
        console.error(`❌ Error: Asset generado está vacío: ${file}`);
        process.exit(1);
      }
      const content = fs.readFileSync(fullPath, 'utf8');
      const legacyMatch = content.match(/\/local\/headless\/(?!ui)/);
      if (legacyMatch) {
        console.error(`❌ Quality Gate: Ruta legada detectada en bundle ${file}: ${legacyMatch[0]}`);
        foundLegacy = true;
      }
    }
  }

  if (foundLegacy) {
    console.error('❌ Build abortado: se detectaron referencias a /local/headless/ en los assets compilados.');
    process.exit(1);
  }

  console.log('✅ UI para Moodle compilada, auditada y empaquetada exitosamente en plugin/headlessui/');
} catch (error) {
  console.error('❌ Error durante el post-build para Moodle:', error);
  process.exit(1);
}
