import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import puppeteer from 'puppeteer-core';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, '..');

// -------------------------------------------------------------
// Configuración y Parámetros
// -------------------------------------------------------------
const args = process.argv.slice(2);
const pluginArgIndex = args.indexOf('--plugin');
const TARGET_PLUGIN = pluginArgIndex !== -1 && args[pluginArgIndex + 1] ? args[pluginArgIndex + 1] : 'local_headless';

const urlArgIndex = args.indexOf('--url');
const targetUrl = urlArgIndex !== -1 && args[urlArgIndex + 1] ? args[urlArgIndex + 1] : (process.env.MOODLE_URL || 'https://lts.academyfactory.online');

const isLocal = targetUrl.includes('localhost') || targetUrl.includes('127.0.0.1');
const defaultUser = isLocal ? 'admin' : 'hteran';

const CONFIG = {
  baseUrl: targetUrl.replace(/\/+$/, ''),
  user: process.env.MOODLE_USER || defaultUser,
  pass: process.env.MOODLE_PASS || '@Rotceh84',
  chromeExecutable: process.env.CHROME_PATH || '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
  headless: process.env.HEADLESS !== 'false'
};

const scratchDir = path.resolve(projectRoot, 'scratch');
if (!fs.existsSync(scratchDir)) {
  fs.mkdirSync(scratchDir, { recursive: true });
}

async function takeScreenshot(page, prefix) {
  const filePath = path.join(scratchDir, `${prefix}_${Date.now()}.png`);
  try {
    await page.screenshot({ path: filePath, fullPage: true });
    console.log(`  📸 Captura diagnóstica guardada: ${filePath}`);
  } catch (err) {
    console.warn(`  ⚠️ No se pudo guardar la captura: ${err.message}`);
  }
}

async function loginMoodle(page) {
  console.log(`  Autenticando en ${CONFIG.baseUrl}/login/index.php como '${CONFIG.user}'...`);
  await page.goto(`${CONFIG.baseUrl}/login/index.php`, { waitUntil: 'networkidle2', timeout: 60000 });

  if (!page.url().includes('/login/index.php')) {
    console.log('  Sesión previamente establecida.');
    return;
  }

  for (let attempt = 1; attempt <= 3; attempt++) {
    await page.waitForSelector('#username', { timeout: 10000 });
    await page.evaluate(() => {
      const u = document.querySelector('#username');
      const p = document.querySelector('#password');
      if (u) u.value = '';
      if (p) p.value = '';
    });
    await page.type('#username', CONFIG.user, { delay: 20 });
    await page.type('#password', CONFIG.pass, { delay: 20 });

    await Promise.all([
      page.click('#loginbtn'),
      page.waitForNavigation({ waitUntil: 'networkidle2', timeout: 60000 })
    ]);

    if (!page.url().includes('/login/index.php')) {
      console.log('  Autenticación exitosa.');
      return;
    }
    console.warn(`  Reintentando login (intento ${attempt}/3)...`);
  }

  const errorMsg = await page.evaluate(() => {
    const err = document.querySelector('.loginerrors, .alert-danger');
    return err ? err.innerText.trim() : 'Error desconocido de credenciales';
  });
  throw new Error(`Fallo de autenticación en Moodle tras reintentos: ${errorMsg}`);
}

async function purgeCaches(page) {
  console.log('  Purgando cachés de Moodle (/admin/purgecaches.php)...');
  await page.goto(`${CONFIG.baseUrl}/admin/purgecaches.php`, { waitUntil: 'networkidle2', timeout: 60000 });
  const purgeBtn = await page.$(
    'form.mform input[type="submit"], #id_submitbutton, input[type="submit"][value*="Purgar"], input[type="submit"][value*="Purge"]'
  );
  if (purgeBtn) {
    await Promise.all([
      purgeBtn.click(),
      page.waitForNavigation({ waitUntil: 'networkidle2', timeout: 60000 }).catch(() => {})
    ]);
    console.log('  Cachés purgadas correctamente.');
  }
}

async function processProgressButtons(page) {
  let loopCount = 0;
  while (loopCount < 8) {
    loopCount++;
    console.log(`  Procesando pantalla post-desinstalación (${loopCount}): ${page.url()}`);

    const progressHandle = await page.evaluateHandle(() => {
      const candidates = Array.from(document.querySelectorAll('button, a.btn, input[type="submit"]'));
      return candidates.find(el => {
        const txt = (el.innerText || el.value || '').trim().toLowerCase();
        return txt === 'continuar' || txt === 'continue' || txt === 'upgrade' || txt.includes('actualizar');
      }) || null;
    });

    const progressBtn = progressHandle.asElement();

    if (progressBtn) {
      const btnText = await page.evaluate(el => el.value || el.innerText, progressBtn);
      console.log(`  Pulsando botón: "${btnText.trim()}"...`);
      await Promise.all([
        progressBtn.click(),
        page.waitForNavigation({ waitUntil: 'networkidle2', timeout: 120000 }).catch(() => {})
      ]);
      await new Promise(r => setTimeout(r, 2000));
    } else {
      break;
    }
  }
}

(async () => {
  console.log('===============================================================');
  console.log('  MOODLE PLUGIN UNINSTALLER (PUPPETEER)');
  console.log('===============================================================');
  console.log(`Destino: ${CONFIG.baseUrl}`);
  console.log(`Plugin:  ${TARGET_PLUGIN}`);

  const browser = await puppeteer.launch({
    executablePath: CONFIG.chromeExecutable,
    headless: CONFIG.headless ? 'new' : false,
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--window-size=1280,900']
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 1280, height: 900 });

  try {
    await loginMoodle(page);

    console.log(`  Navegando a vista general de plugins (/admin/plugins.php)...`);
    await page.goto(`${CONFIG.baseUrl}/admin/plugins.php`, {
      waitUntil: 'networkidle2',
      timeout: 60000
    });

    // Buscar enlace de desinstalación para TARGET_PLUGIN
    const uninstallHref = await page.evaluate((pluginName) => {
      const rows = Array.from(document.querySelectorAll('tr'));
      const targetRow = rows.find(r => r.innerText.includes(pluginName));
      if (!targetRow) return null;

      // Buscar enlaces dentro de la fila
      const links = Array.from(targetRow.querySelectorAll('a'));
      const uninstallLink = links.find(a => {
        const text = (a.innerText || '').toLowerCase().trim();
        const href = a.href || '';
        return text.includes('desinstalar') ||
               text.includes('uninstall') ||
               href.includes('action=uninstall') ||
               href.includes('uninstall.php');
      });

      if (uninstallLink) return uninstallLink.href;

      // Buscar forms con botón dentro de la fila
      const form = targetRow.querySelector('form');
      if (form) {
        const btn = form.querySelector('button, input[type="submit"]');
        if (btn && ((btn.innerText || btn.value || '').toLowerCase().includes('desinstalar') || (btn.innerText || btn.value || '').toLowerCase().includes('uninstall'))) {
          return form.action;
        }
      }

      return null;
    }, TARGET_PLUGIN);

    if (!uninstallHref) {
      console.log(`ℹ️ No se encontró enlace de desinstalación para "${TARGET_PLUGIN}".`);
      console.log(`  Verificando si el plugin ya no está instalado...`);
      const isInstalled = await page.evaluate((pluginName) => {
        return document.body.innerText.includes(pluginName);
      }, TARGET_PLUGIN);

      if (!isInstalled) {
        console.log(`✅ El plugin "${TARGET_PLUGIN}" ya no está instalado en ${CONFIG.baseUrl}.`);
        await browser.close();
        process.exit(0);
      } else {
        console.warn(`⚠️ El plugin figura en la página pero no ofrece enlace directo de desinstalación.`);
        await takeScreenshot(page, `no_uninstall_link_${TARGET_PLUGIN}`);
      }
    } else {
      console.log(`  Enlace de desinstalación encontrado: ${uninstallHref}`);
      await page.goto(uninstallHref, { waitUntil: 'networkidle2', timeout: 60000 });

      // Pantalla de confirmación de desinstalación
      console.log('  Confirmando desinstalación...');
      await new Promise(r => setTimeout(r, 1000));
      await takeScreenshot(page, `confirm_uninstall_${TARGET_PLUGIN}`);

      const confirmHandle = await page.evaluateHandle(() => {
        const candidates = Array.from(document.querySelectorAll('button, a.btn, input[type="submit"]'));
        return candidates.find(el => {
          const txt = (el.innerText || el.value || '').trim().toLowerCase();
          return txt === 'continuar' || txt === 'continue';
        }) || null;
      });

      const confirmBtn = confirmHandle.asElement();
      if (confirmBtn) {
        console.log('  Botón de confirmación encontrado, haciendo clic...');
        await Promise.all([
          confirmBtn.click(),
          page.waitForNavigation({ waitUntil: 'networkidle2', timeout: 120000 }).catch(() => {})
        ]);
        await new Promise(r => setTimeout(r, 2000));
      } else {
        console.warn('  ⚠️ No se detectó botón de confirmación estándar, procesando posibles pantallas...');
      }

      // Procesar pantallas intermedias
      await processProgressButtons(page);

      // Purgar cachés
      await purgeCaches(page);
    }

    // Verificación final en /admin/plugins.php
    await page.goto(`${CONFIG.baseUrl}/admin/plugins.php`, {
      waitUntil: 'networkidle2',
      timeout: 60000
    });

    const statusAfter = await page.evaluate((pluginName) => {
      const rows = Array.from(document.querySelectorAll('tr'));
      const foundRow = rows.find(r => r.innerText.includes(pluginName));
      if (!foundRow) return { present: false };
      return {
        present: true,
        text: foundRow.innerText.replace(/\s+/g, ' ').trim()
      };
    }, TARGET_PLUGIN);

    if (!statusAfter.present) {
      console.log(`✅ Desinstalación exitosa: "${TARGET_PLUGIN}" ya no existe en la lista de plugins.`);
    } else {
      console.log(`ℹ️ Estado final de "${TARGET_PLUGIN}": ${statusAfter.text}`);
      if (statusAfter.text.toLowerCase().includes('missing from disk') || statusAfter.text.toLowerCase().includes('falta del disco')) {
        console.log(`✅ El plugin ya fue desinstalado de la BD.`);
      }
    }

    await browser.close();
    process.exit(0);
  } catch (err) {
    console.error(`❌ Error durante la desinstalación: ${err.message}`);
    await takeScreenshot(page, 'error_uninstall_fatal');
    await browser.close();
    process.exit(1);
  }
})();
