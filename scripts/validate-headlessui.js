import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import puppeteer from 'puppeteer-core';
import { loadEnv } from './env-helper.js';
import { takeScreenshot, loginMoodle } from './automation-helper.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, '..');

// Cargar variables de entorno desde .env si están disponibles
loadEnv(projectRoot);

const args = process.argv.slice(2);
const urlArgIndex = args.indexOf('--url');
const targetUrl = urlArgIndex !== -1 && args[urlArgIndex + 1] ? args[urlArgIndex + 1] : (process.env.MOODLE_URL || 'https://lts.academyfactory.online');

const isLocal = targetUrl.includes('localhost') || targetUrl.includes('127.0.0.1');
const defaultUser = isLocal ? (process.env.MOODLE_LOCAL_USER || 'admin') : 'hteran';

const CONFIG = {
  baseUrl: targetUrl.replace(/\/+$/, ''),
  user: isLocal ? (process.env.MOODLE_LOCAL_USER || 'admin') : (process.env.MOODLE_USER || defaultUser),
  pass: isLocal ? (process.env.MOODLE_LOCAL_PASS || process.env.MOODLE_PASS) : process.env.MOODLE_PASS,
  chromeExecutable: process.env.CHROME_PATH || '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
  headless: process.env.HEADLESS !== 'false'
};

if (!CONFIG.pass) {
  throw new Error('Variable de entorno MOODLE_PASS no configurada. Define MOODLE_PASS en .env o entorno.');
}

const scratchDir = path.resolve(projectRoot, 'scratch');
if (!fs.existsSync(scratchDir)) {
  fs.mkdirSync(scratchDir, { recursive: true });
}



(async () => {
  console.log('===============================================================');
  console.log('  VALIDACIÓN E2E DE PLUGIN UNIFICADO: local_headlessui v3.0.3');
  console.log('===============================================================');
  console.log(`Host: ${CONFIG.baseUrl}`);

  const browser = await puppeteer.launch({
    executablePath: CONFIG.chromeExecutable,
    headless: CONFIG.headless ? 'new' : false,
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--window-size=1280,900']
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 1280, height: 900 });

  const pageErrors = [];
  page.on('pageerror', err => {
    pageErrors.push(err.message);
  });

  const results = [];

  try {
    await loginMoodle(page, CONFIG);

    // -------------------------------------------------------------
    // CHECK 1: Lista de Plugins (/admin/plugins.php)
    // -------------------------------------------------------------
    console.log('\n[Check 1/8] Verificando plugins instalados en /admin/plugins.php...');
    await page.goto(`${CONFIG.baseUrl}/admin/plugins.php`, { waitUntil: 'networkidle2', timeout: 60000 });

    const pluginsStatus = await page.evaluate(() => {
      const rows = Array.from(document.querySelectorAll('tr'));
      const headlessUiRow = rows.find(r => r.innerText.includes('local_headlessui') || r.innerText.includes('Headless UI'));
      const oldHeadlessRow = rows.find(r => r.innerText.includes('local_headless') && !r.innerText.includes('local_headlessui'));

      return {
        headlessUi: headlessUiRow ? headlessUiRow.innerText.replace(/\s+/g, ' ').trim() : null,
        oldHeadless: oldHeadlessRow ? oldHeadlessRow.innerText.replace(/\s+/g, ' ').trim() : null
      };
    });

    const check1Success = !!pluginsStatus.headlessUi && !pluginsStatus.oldHeadless;
    console.log(`  local_headlessui detectado: ${pluginsStatus.headlessUi ? 'SÍ (' + pluginsStatus.headlessUi + ')' : 'NO'}`);
    console.log(`  local_headless detectado:   ${pluginsStatus.oldHeadless ? 'PRESENTE: ' + pluginsStatus.oldHeadless : 'NO (Eliminado)'}`);

    results.push({
      name: 'Plugin list: solo local_headlessui activo',
      success: check1Success,
      details: pluginsStatus
    });

    // -------------------------------------------------------------
    // CHECK 2: Servicio Web headless_service y sus funciones
    // -------------------------------------------------------------
    console.log('\n[Check 2/8] Verificando funciones en headless_service (/admin/webservice/service_functions.php)...');
    await page.goto(`${CONFIG.baseUrl}/admin/settings.php?section=externalservices`, { waitUntil: 'networkidle2', timeout: 60000 });

    const serviceFunctionsUrl = await page.evaluate(() => {
      const links = Array.from(document.querySelectorAll('a'));
      const functionsLink = links.find(a => a.href.includes('service_functions.php') && (
        a.closest('tr')?.innerText.includes('Headless Service') ||
        a.closest('tr')?.innerText.includes('headless_service')
      ));
      return functionsLink ? functionsLink.href : null;
    });

    let check2Success = false;
    let serviceDetails = '';

    if (serviceFunctionsUrl) {
      console.log(`  Accediendo a: ${serviceFunctionsUrl}`);
      await page.goto(serviceFunctionsUrl, { waitUntil: 'networkidle2', timeout: 60000 });

      const functionsFound = await page.evaluate(() => {
        const bodyText = document.body.innerText;
        return {
          autologin: bodyText.includes('local_headlessui_get_autologin_key'),
          password: bodyText.includes('local_headlessui_change_password'),
          enrolments: bodyText.includes('local_headlessui_get_user_enrolments'),
          oldAutologin: bodyText.includes('local_headless_get_autologin_key')
        };
      });

      check2Success = functionsFound.autologin && functionsFound.password && functionsFound.enrolments && !functionsFound.oldAutologin;
      serviceDetails = JSON.stringify(functionsFound);
      console.log(`  Funciones encontradas: ${serviceDetails}`);
    } else {
      console.warn('  ⚠️ No se pudo localizar el enlace directo a headless_service en la lista de servicios.');
      const hasHeadlessService = await page.evaluate(() => document.body.innerText.includes('Headless Service'));
      serviceDetails = `Headless Service presente en tabla: ${hasHeadlessService}`;
      check2Success = hasHeadlessService;
    }

    results.push({
      name: 'Web service: headless_service con funciones local_headlessui_*',
      success: check2Success,
      details: serviceDetails
    });

    // -------------------------------------------------------------
    // CHECK 3: Carga de App Frontend (/local/headlessui/index.php)
    // -------------------------------------------------------------
    console.log('\n[Check 3/8] Verificando carga del Frontend en /local/headlessui/index.php...');
    const appResponse = await page.goto(`${CONFIG.baseUrl}/local/headlessui/index.php`, {
      waitUntil: 'networkidle2',
      timeout: 60000
    });

    const appStatus = appResponse ? appResponse.status() : 0;
    const hasAppRoot = await page.evaluate(() => {
      return !!document.getElementById('app') || !!document.querySelector('#app');
    });

    const check3Success = (appStatus === 200 && hasAppRoot);
    console.log(`  HTTP Status: ${appStatus}, <div id="app">: ${hasAppRoot ? 'PRESENTE' : 'NO'}`);

    results.push({
      name: 'App Frontend: HTTP 200 y montado en #app',
      success: check3Success,
      details: `status=${appStatus}, hasAppRoot=${hasAppRoot}`
    });

    // -------------------------------------------------------------
    // CHECK 4: Endpoint de Autologin (/local/headlessui/autologin.php)
    // -------------------------------------------------------------
    console.log('\n[Check 4/8] Verificando endpoint /local/headlessui/autologin.php...');
    const autologinResponse = await page.goto(`${CONFIG.baseUrl}/local/headlessui/autologin.php`, {
      waitUntil: 'networkidle2',
      timeout: 30000
    });

    const autologinStatus = autologinResponse ? autologinResponse.status() : 0;
    const autologinBody = await page.evaluate(() => document.body.innerText);
    const autologinHtml = await page.content();

    // Verificación estricta: NO debe ser un 404 de Nginx/Apache ni un PHP fatal error. Debe provenir de Moodle.
    const isMoodleResponse4 = (autologinHtml.includes('moodle') || autologinHtml.includes('yui') || autologinHtml.includes('navbar') || autologinBody.includes('Moodle'));
    const isNginxOrWebServer404_4 = autologinHtml.includes('nginx') && autologinStatus === 404;
    const hasFatalPhp4 = autologinBody.includes('Fatal error') || autologinBody.includes('Parse error') || autologinHtml.includes('PHP Fatal error');
    const check4Success = isMoodleResponse4 && !isNginxOrWebServer404_4 && !hasFatalPhp4;

    console.log(`  HTTP Status: ${autologinStatus}, Moodle Response: ${isMoodleResponse4}, Sin Fatal: ${!hasFatalPhp4}, No Nginx 404: ${!isNginxOrWebServer404_4}`);

    results.push({
      name: 'Autologin endpoint: procesado por Moodle y sin errores fatales',
      success: check4Success,
      details: `status=${autologinStatus}, isMoodle=${isMoodleResponse4}`
    });

    // -------------------------------------------------------------
    // CHECK 5: Endpoint de H5P Bridge (/local/headlessui/h5p.php)
    // -------------------------------------------------------------
    console.log('\n[Check 5/8] Verificando endpoint /local/headlessui/h5p.php...');
    const h5pResponse = await page.goto(`${CONFIG.baseUrl}/local/headlessui/h5p.php`, {
      waitUntil: 'networkidle2',
      timeout: 30000
    });

    const h5pStatus = h5pResponse ? h5pResponse.status() : 0;
    const h5pBody = await page.evaluate(() => document.body.innerText);
    const h5pHtml = await page.content();

    const isMoodleResponse5 = (h5pHtml.includes('moodle') || h5pHtml.includes('yui') || h5pHtml.includes('navbar') || h5pBody.includes('Moodle'));
    const isNginxOrWebServer404_5 = h5pHtml.includes('nginx') && h5pStatus === 404;
    const hasFatalPhp5 = h5pBody.includes('Fatal error') || h5pBody.includes('Parse error') || h5pHtml.includes('PHP Fatal error');
    const check5Success = isMoodleResponse5 && !isNginxOrWebServer404_5 && !hasFatalPhp5;

    console.log(`  HTTP Status: ${h5pStatus}, Moodle Response: ${isMoodleResponse5}, Sin Fatal: ${!hasFatalPhp5}, No Nginx 404: ${!isNginxOrWebServer404_5}`);

    results.push({
      name: 'H5P bridge: procesado por Moodle y sin errores fatales',
      success: check5Success,
      details: `status=${h5pStatus}, isMoodle=${isMoodleResponse5}`
    });

    // -------------------------------------------------------------
    // CHECK 6: Configuración Admin
    // -------------------------------------------------------------
    console.log('\n[Check 6/8] Verificando enlace admin en /admin/category.php?category=localplugins...');
    let settingsResponse = await page.goto(`${CONFIG.baseUrl}/admin/category.php?category=localplugins`, {
      waitUntil: 'networkidle2',
      timeout: 30000
    });

    let settingsStatus = settingsResponse ? settingsResponse.status() : 0;
    let settingsHasLink = await page.evaluate(() => {
      const links = Array.from(document.querySelectorAll('a'));
      return links.some(a => (a.innerText.includes('Headless UI') || (a.href && a.href.includes('/local/headlessui/index.php'))));
    });

    if (!settingsHasLink) {
      console.log('  Buscando enlace en /admin/search.php?query=Headless+UI...');
      await page.goto(`${CONFIG.baseUrl}/admin/search.php?query=Headless+UI`, {
        waitUntil: 'networkidle2',
        timeout: 30000
      });
      settingsHasLink = await page.evaluate(() => {
        return document.body.innerText.includes('Headless UI') ||
               !!document.querySelector('a[href*="/local/headlessui/index.php"]');
      });
    }

    const check6Success = settingsHasLink;
    console.log(`  Enlace/Texto encontrado en Administración: ${settingsHasLink}`);

    results.push({
      name: 'Settings Admin: página de configuración accesible',
      success: check6Success,
      details: `status=${settingsStatus}, settingsHasLink=${settingsHasLink}`
    });

    // -------------------------------------------------------------
    // CHECK 7: Auditoría de Rutas en Bundle Compilado
    // -------------------------------------------------------------
    console.log('\n[Check 7/8] Auditando bundle compilado para detectar rutas legadas (/local/headless/)...');
    const assetsDir = path.resolve(projectRoot, 'plugin', 'headlessui', 'app', 'assets');
    let hasLegacyRoute = false;
    let checkedAssetsCount = 0;

    if (fs.existsSync(assetsDir)) {
      const assetFiles = fs.readdirSync(assetsDir);
      for (const file of assetFiles) {
        if (file.endsWith('.js') || file.endsWith('.css')) {
          checkedAssetsCount++;
          const content = fs.readFileSync(path.join(assetsDir, file), 'utf8');
          // Buscar "/local/headless/" sin "ui"
          const legacyMatch = content.match(/\/local\/headless\/(?!ui)/);
          if (legacyMatch) {
            hasLegacyRoute = true;
            console.error(`  ❌ Ruta legada encontrada en asset ${file}: ${legacyMatch[0]}`);
          }
        }
      }
    }

    const check7Success = !hasLegacyRoute && checkedAssetsCount > 0;
    console.log(`  Assets analizados: ${checkedAssetsCount}, Sin rutas obsoletas: ${!hasLegacyRoute}`);

    results.push({
      name: 'Auditoría de bundle: sin referencias a /local/headless/',
      success: check7Success,
      details: `checked=${checkedAssetsCount}, hasLegacyRoute=${hasLegacyRoute}`
    });

    // -------------------------------------------------------------
    // CHECK 8: Navegación SPA y Renderers en Cliente
    // -------------------------------------------------------------
    console.log('\n[Check 8/8] Verificando navegación SPA y ausencia de errores JS en runtime...');
    pageErrors.length = 0; // reset
    const testCourseRoute = isLocal ? '/local/headlessui/index.php#/course/43' : '/local/headlessui/index.php#/course/276';
    
    await page.goto(`${CONFIG.baseUrl}${testCourseRoute}`, {
      waitUntil: 'networkidle2',
      timeout: 45000
    });

    await new Promise(r => setTimeout(r, 2000));

    const spaMounted = await page.evaluate(() => {
      return !!document.querySelector('#app') &&
             (!!document.querySelector('.course-layout') || !!document.querySelector('.dashboard') || !!document.querySelector('header'));
    });

    const hasNoCriticalJsErrors = pageErrors.length === 0;
    if (!hasNoCriticalJsErrors) {
      console.warn(`  ⚠️ Errores de consola en navegación SPA: ${pageErrors.join(' | ')}`);
    }

    const check8Success = spaMounted && hasNoCriticalJsErrors;
    console.log(`  SPA Montado: ${spaMounted}, Sin errores de consola: ${hasNoCriticalJsErrors}`);

    results.push({
      name: 'Navegación SPA: vista cargada sin errores de consola',
      success: check8Success,
      details: `spaMounted=${spaMounted}, errors=${pageErrors.length}`
    });

  } catch (err) {
    console.error(`❌ Excepción durante la validación: ${err.message}`);
    await takeScreenshot(page, 'error_validation_fatal', scratchDir);
  } finally {
    await browser.close();
  }

  // -------------------------------------------------------------
  // RESUMEN Y REPORTE FINAL
  // -------------------------------------------------------------
  console.log('\n===============================================================');
  console.log('  REPORTE FINAL DE VALIDACIÓN');
  console.log('===============================================================');

  let allPassed = true;
  for (const r of results) {
    const icon = r.success ? '✅' : '❌';
    console.log(`${icon} ${r.name}`);
    if (!r.success) {
      allPassed = false;
      console.log(`   Detalles: ${typeof r.details === 'object' ? JSON.stringify(r.details) : r.details}`);
    }
  }

  console.log('===============================================================');
  if (allPassed && results.length === 8) {
    console.log('🎉 TODOS LOS CRITERIOS PASARON EXITOSAMENTE (8/8).');
    process.exit(0);
  } else {
    console.error(`❌ VALIDACIÓN FALLIDA: Solo ${results.filter(r => r.success).length}/${results.length} criterios superados.`);
    process.exit(1);
  }
})();
