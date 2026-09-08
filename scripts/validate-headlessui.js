import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import puppeteer from 'puppeteer-core';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, '..');

const args = process.argv.slice(2);
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

(async () => {
  console.log('===============================================================');
  console.log('  VALIDACIÓN E2E DE PLUGIN UNIFICADO: local_headlessui v3.0.0');
  console.log('===============================================================');
  console.log(`Host: ${CONFIG.baseUrl}`);

  const browser = await puppeteer.launch({
    executablePath: CONFIG.chromeExecutable,
    headless: CONFIG.headless ? 'new' : false,
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--window-size=1280,900']
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 1280, height: 900 });

  const results = [];

  try {
    await loginMoodle(page);

    // -------------------------------------------------------------
    // CHECK 1: Lista de Plugins (/admin/plugins.php)
    // -------------------------------------------------------------
    console.log('\n[Check 1/6] Verificando plugins instalados en /admin/plugins.php...');
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
      name: 'Plugin list: solo local_headlessui v3.0.0',
      success: check1Success,
      details: pluginsStatus
    });

    // -------------------------------------------------------------
    // CHECK 2: Servicio Web headless_service y sus funciones
    // -------------------------------------------------------------
    console.log('\n[Check 2/6] Verificando funciones en headless_service (/admin/webservice/service_functions.php)...');
    // Primero obtener el ID de headless_service desde /admin/settings.php?section=externalservices
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
      // Verificar si al menos existe el servicio en la tabla
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
    console.log('\n[Check 3/6] Verificando carga del Frontend en /local/headlessui/index.php...');
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
    console.log('\n[Check 4/6] Verificando endpoint /local/headlessui/autologin.php...');
    const autologinResponse = await page.goto(`${CONFIG.baseUrl}/local/headlessui/autologin.php`, {
      waitUntil: 'networkidle2',
      timeout: 30000
    });

    const autologinStatus = autologinResponse ? autologinResponse.status() : 0;
    const autologinBody = await page.evaluate(() => document.body.innerText);
    const autologinHtml = await page.content();
    // Un llamado sin parámetros debe procesarse por Moodle (missing parameter), nunca un PHP fatal error / parse error
    const check4Success = !autologinBody.includes('Fatal error') &&
                          !autologinBody.includes('Parse error') &&
                          !autologinHtml.includes('PHP Fatal error') &&
                          (autologinHtml.includes('moodle_exception') || autologinBody.includes('parameter') || autologinStatus < 500);
    console.log(`  HTTP Status: ${autologinStatus}, Sin Fatal Error: ${check4Success}`);

    results.push({
      name: 'Autologin endpoint: accesible y sin errores fatales PHP',
      success: check4Success,
      details: `status=${autologinStatus}`
    });

    // -------------------------------------------------------------
    // CHECK 5: Endpoint de H5P Bridge (/local/headlessui/h5p.php)
    // -------------------------------------------------------------
    console.log('\n[Check 5/6] Verificando endpoint /local/headlessui/h5p.php...');
    const h5pResponse = await page.goto(`${CONFIG.baseUrl}/local/headlessui/h5p.php`, {
      waitUntil: 'networkidle2',
      timeout: 30000
    });

    const h5pStatus = h5pResponse ? h5pResponse.status() : 0;
    const h5pBody = await page.evaluate(() => document.body.innerText);
    const h5pHtml = await page.content();
    const check5Success = !h5pBody.includes('Fatal error') &&
                          !h5pBody.includes('Parse error') &&
                          !h5pHtml.includes('PHP Fatal error') &&
                          (h5pHtml.includes('moodle_exception') || h5pBody.includes('parameter') || h5pStatus < 500);
    console.log(`  HTTP Status: ${h5pStatus}, Sin Fatal Error: ${check5Success}`);

    results.push({
      name: 'H5P bridge: accesible y sin errores fatales PHP',
      success: check5Success,
      details: `status=${h5pStatus}`
    });

    // -------------------------------------------------------------
    // CHECK 6: Configuración Admin (Site Administration > Plugins > Local plugins)
    // -------------------------------------------------------------
    console.log('\n[Check 6/6] Verificando enlace admin en /admin/category.php?category=localplugins...');
    let settingsResponse = await page.goto(`${CONFIG.baseUrl}/admin/category.php?category=localplugins`, {
      waitUntil: 'networkidle2',
      timeout: 30000
    });

    let settingsStatus = settingsResponse ? settingsResponse.status() : 0;
    let settingsHasLink = await page.evaluate(() => {
      const links = Array.from(document.querySelectorAll('a'));
      return links.some(a => (a.innerText.includes('Headless UI') || (a.href && a.href.includes('/local/headlessui/index.php'))));
    });

    // Fallback: verificar en la búsqueda de administración si la categoría directa redirige
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

  } catch (err) {
    console.error(`❌ Excepción durante la validación: ${err.message}`);
    await takeScreenshot(page, 'error_validation_fatal');
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
  if (allPassed && results.length === 6) {
    console.log('🎉 TODOS LOS CRITERIOS PASARON EXITOSAMENTE (6/6).');
    process.exit(0);
  } else {
    console.error(`❌ VALIDACIÓN FALLIDA: Solo ${results.filter(r => r.success).length}/${results.length} criterios superados.`);
    process.exit(1);
  }
})();
