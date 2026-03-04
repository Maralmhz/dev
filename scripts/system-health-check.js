#!/usr/bin/env node

/**
 * System health check for the web app.
 *
 * Runs syntax validation, browser bootstrap checks, checklist flow checks,
 * PDF/WhatsApp function availability checks and table overflow checks.
 *
 * Usage:
 *   node scripts/system-health-check.js [--skip-pdf]
 */

const fs = require('fs/promises');
const path = require('path');
const { spawn } = require('child_process');

const PROJECT_ROOT = path.resolve(__dirname, '..');
const APP_URL = 'http://127.0.0.1:8000/app.html';
const ARTIFACTS_DIR = path.join(PROJECT_ROOT, 'scripts', 'health-check-artifacts');
const STEP_TIMEOUT_MS = 10_000;

const TARGET_FOLDERS = [
  'core',
  'modules',
  'legacy',
  'functions',
  '.',
];

const INCLUDE_FILE_PATTERNS = [/checklist/i, /gestao_oficina/i, /firebase/i];
const EXCLUDED_DIRS = new Set(['node_modules', '.git']);

function parseFlags(argv) {
  return {
    skipPdf: argv.includes('--skip-pdf'),
  };
}

async function withStepTimeout(name, fn, timeoutMs = STEP_TIMEOUT_MS) {
  let timeoutId;
  try {
    return await Promise.race([
      fn(),
      new Promise((_, reject) => {
        timeoutId = setTimeout(() => {
          reject(new Error(`Step "${name}" timed out after ${timeoutMs}ms`));
        }, timeoutMs);
      }),
    ]);
  } finally {
    clearTimeout(timeoutId);
  }
}

async function listJsFiles() {
  const unique = new Set();

  async function walkDir(dirPath) {
    const entries = await fs.readdir(dirPath, { withFileTypes: true });

    for (const entry of entries) {
      const fullPath = path.join(dirPath, entry.name);
      const relPath = path.relative(PROJECT_ROOT, fullPath);

      if (entry.isDirectory()) {
        if (!EXCLUDED_DIRS.has(entry.name)) {
          await walkDir(fullPath);
        }
        continue;
      }

      if (!entry.isFile() || !entry.name.endsWith('.js')) {
        continue;
      }

      const isInTargetFolder = TARGET_FOLDERS.some((folder) => {
        if (folder === '.') {
          return true;
        }

        return relPath === folder || relPath.startsWith(`${folder}${path.sep}`);
      });

      const isRelevantByName = INCLUDE_FILE_PATTERNS.some((pattern) => pattern.test(entry.name));

      if (isInTargetFolder || isRelevantByName) {
        unique.add(relPath);
      }
    }
  }

  await walkDir(PROJECT_ROOT);
  return [...unique].sort();
}

async function runNodeCheck(fileRelativePath) {
  return new Promise((resolve) => {
    const child = spawn(process.execPath, ['--check', fileRelativePath], {
      cwd: PROJECT_ROOT,
      stdio: ['ignore', 'pipe', 'pipe'],
    });

    let stdout = '';
    let stderr = '';

    child.stdout.on('data', (chunk) => {
      stdout += String(chunk);
    });

    child.stderr.on('data', (chunk) => {
      stderr += String(chunk);
    });

    child.on('close', (code) => {
      resolve({
        file: fileRelativePath,
        ok: code === 0,
        output: [stdout.trim(), stderr.trim()].filter(Boolean).join('\n'),
      });
    });
  });
}

async function checkSyntax() {
  const files = await listJsFiles();
  const results = [];

  for (const relPath of files) {
    // eslint-disable-next-line no-await-in-loop
    const result = await runNodeCheck(relPath);
    results.push(result);
  }

  const errors = results.filter((item) => !item.ok);

  return {
    totalFiles: files.length,
    errors,
    warnings: [],
  };
}

async function ensureArtifactsDir() {
  await fs.mkdir(ARTIFACTS_DIR, { recursive: true });
}

async function startStaticServerIfNeeded() {
  const healthUrl = 'http://127.0.0.1:8000/';

  async function canReach(url) {
    try {
      const controller = new AbortController();
      const id = setTimeout(() => controller.abort(), 1_500);
      const res = await fetch(url, { signal: controller.signal });
      clearTimeout(id);
      return res.ok;
    } catch {
      return false;
    }
  }

  const alreadyRunning = await canReach(healthUrl);
  if (alreadyRunning) {
    return { process: null, startedByScript: false };
  }

  const serverProcess = spawn(process.execPath, ['-e', `
    const http = require('http');
    const fs = require('fs');
    const path = require('path');
    const root = process.cwd();
    const mime = {
      '.html': 'text/html; charset=utf-8',
      '.js': 'text/javascript; charset=utf-8',
      '.css': 'text/css; charset=utf-8',
      '.json': 'application/json; charset=utf-8',
      '.png': 'image/png',
      '.jpg': 'image/jpeg',
      '.jpeg': 'image/jpeg',
      '.svg': 'image/svg+xml',
      '.ico': 'image/x-icon'
    };
    const server = http.createServer((req, res) => {
      const requestPath = decodeURIComponent((req.url || '/').split('?')[0]);
      const cleanPath = requestPath === '/' ? '/index.html' : requestPath;
      const filePath = path.join(root, cleanPath);
      if (!filePath.startsWith(root)) {
        res.statusCode = 403;
        return res.end('Forbidden');
      }
      fs.stat(filePath, (err, stat) => {
        if (err || !stat.isFile()) {
          res.statusCode = 404;
          return res.end('Not Found');
        }
        const ext = path.extname(filePath).toLowerCase();
        res.setHeader('Content-Type', mime[ext] || 'application/octet-stream');
        fs.createReadStream(filePath).pipe(res);
      });
    });
    server.listen(8000, '127.0.0.1', () => {
      process.stdout.write('SERVER_READY\\n');
    });
    process.on('SIGTERM', () => server.close(() => process.exit(0)));
  `], {
    cwd: PROJECT_ROOT,
    stdio: ['ignore', 'pipe', 'pipe'],
  });

  await new Promise((resolve, reject) => {
    let settled = false;

    const timer = setTimeout(() => {
      if (!settled) {
        settled = true;
        reject(new Error('Local static server did not start in time.'));
      }
    }, 5_000);

    serverProcess.stdout.on('data', (chunk) => {
      if (String(chunk).includes('SERVER_READY') && !settled) {
        clearTimeout(timer);
        settled = true;
        resolve();
      }
    });

    serverProcess.once('error', (err) => {
      if (!settled) {
        clearTimeout(timer);
        settled = true;
        reject(err);
      }
    });

    serverProcess.once('exit', (code) => {
      if (!settled) {
        clearTimeout(timer);
        settled = true;
        reject(new Error(`Local static server exited unexpectedly (code ${code}).`));
      }
    });
  });

  return { process: serverProcess, startedByScript: true };
}

async function checkBootMonitor(page) {
  return withStepTimeout('checkBootMonitor', async () => {
    await page.goto(APP_URL, { waitUntil: 'domcontentloaded', timeout: STEP_TIMEOUT_MS });

    const data = await page.evaluate(() => {
      const appContextReady =
        typeof window.AppContext?.isReady === 'function' ? window.AppContext.isReady() : null;

      const hasBootReport = typeof window.bootMonitor?.exportReport === 'function';
      const bootReport = hasBootReport ? window.bootMonitor.exportReport() : null;

      return {
        appContextReady,
        hasBootReport,
        bootReport,
      };
    });

    return data;
  });
}

async function checkChecklistFlow(page) {
  return withStepTimeout('checkChecklistFlow', async () => {
    await page.goto(APP_URL, { waitUntil: 'domcontentloaded', timeout: STEP_TIMEOUT_MS });

    const result = await page.evaluate(() => {
      const lower = (v) => (v || '').toString().toLowerCase();
      const textMatches = (el, tokens) => {
        const source = `${lower(el.id)} ${lower(el.name)} ${lower(el.placeholder)} ${lower(el.className)} ${lower(el.textContent)}`;
        return tokens.some((token) => source.includes(token));
      };

      const inputs = [...document.querySelectorAll('input, textarea')];
      const buttons = [...document.querySelectorAll('button, input[type="button"], input[type="submit"]')];

      const descInput = inputs.find((el) => textMatches(el, ['descri', 'servi', 'item']));
      const priceInput = inputs.find((el) => textMatches(el, ['preço', 'preco', 'valor']));
      const addButton = buttons.find((el) => textMatches(el, ['adicionar', 'add', 'incluir']));

      let enterNavigationOk = false;
      let addButtonClickable = false;
      let focusProgression = 'n/a';

      if (descInput) {
        descInput.focus();
        const enterEvent = new KeyboardEvent('keydown', {
          key: 'Enter',
          code: 'Enter',
          bubbles: true,
          cancelable: true,
        });
        descInput.dispatchEvent(enterEvent);

        const activeAfterDesc = document.activeElement;
        if (activeAfterDesc === priceInput || activeAfterDesc === addButton) {
          enterNavigationOk = true;
          focusProgression = 'description -> next field';
        }
      }

      if (priceInput) {
        priceInput.focus();
        const enterEvent = new KeyboardEvent('keydown', {
          key: 'Enter',
          code: 'Enter',
          bubbles: true,
          cancelable: true,
        });
        priceInput.dispatchEvent(enterEvent);

        const activeAfterPrice = document.activeElement;
        if (activeAfterPrice === addButton || activeAfterPrice === descInput) {
          enterNavigationOk = true;
          focusProgression = 'price -> button/next field';
        }
      }

      if (descInput) {
        descInput.value = 'Item saúde sistema';
        descInput.dispatchEvent(new Event('input', { bubbles: true }));
      }

      if (priceInput) {
        priceInput.value = '150.00';
        priceInput.dispatchEvent(new Event('input', { bubbles: true }));
      }

      if (addButton) {
        addButtonClickable = !addButton.disabled;
      }

      const stickyCandidate = document.querySelector(
        '.sticky-action-bar, .action-bar-sticky, #stickyActionBar, [class*="sticky"][class*="action"], [id*="sticky"][id*="action"]'
      );

      const stickyActionBarOk = Boolean(stickyCandidate);

      const pdfOrWhatsappButtons = buttons.filter((btn) =>
        textMatches(btn, ['pdf', 'whatsapp', 'zap'])
      );

      return {
        enterNavigationOk,
        focusProgression,
        addButtonClickable,
        stickyActionBarOk,
        hasPdfOrWhatsappButton: pdfOrWhatsappButtons.length > 0,
        found: {
          descInput: Boolean(descInput),
          priceInput: Boolean(priceInput),
          addButton: Boolean(addButton),
        },
      };
    });

    return result;
  });
}

async function checkPDFService(page) {
  return withStepTimeout('checkPDFService', async () => {
    await page.goto(APP_URL, { waitUntil: 'domcontentloaded', timeout: STEP_TIMEOUT_MS });

    const result = await page.evaluate(() => {
      const hasGeneratePDF = typeof window.pdfService?.generatePDF === 'function';
      const hasSendPDFToWhatsApp = typeof window.pdfService?.sendPDFToWhatsApp === 'function';

      function isPromiseLike(value) {
        return !!value && typeof value.then === 'function';
      }

      let generateReturnsPromise = false;
      let sendReturnsPromise = false;
      let generateError = null;
      let sendError = null;

      if (hasGeneratePDF) {
        try {
          const maybePromise = window.pdfService.generatePDF({ __healthCheck: true });
          generateReturnsPromise = isPromiseLike(maybePromise);
        } catch (err) {
          generateError = err?.message || String(err);
        }
      }

      if (hasSendPDFToWhatsApp) {
        try {
          const maybePromise = window.pdfService.sendPDFToWhatsApp({ __healthCheck: true });
          sendReturnsPromise = isPromiseLike(maybePromise);
        } catch (err) {
          sendError = err?.message || String(err);
        }
      }

      return {
        hasGeneratePDF,
        hasSendPDFToWhatsApp,
        generateReturnsPromise,
        sendReturnsPromise,
        generateError,
        sendError,
      };
    });

    return result;
  });
}

async function checkTables(page) {
  return withStepTimeout('checkTables', async () => {
    await page.setViewportSize({ width: 375, height: 812 });
    await page.goto(APP_URL, { waitUntil: 'domcontentloaded', timeout: STEP_TIMEOUT_MS });

    return page.evaluate(() => {
      const tables = [...document.querySelectorAll('table')];

      const tableChecks = tables.slice(0, 20).map((table, index) => {
        const wrapper = table.closest('.table-responsive, .overflow-x-auto, [class*="table"], [class*="resumo"], [class*="orcamento"]') || table.parentElement;

        const style = wrapper ? window.getComputedStyle(wrapper) : null;
        const overflowX = style ? style.overflowX : null;
        const scrollable = wrapper ? wrapper.scrollWidth > wrapper.clientWidth : false;

        return {
          index,
          overflowX,
          scrollable,
          wrapperClass: wrapper?.className || null,
          controlledOverflow: ['auto', 'scroll', 'overlay'].includes(overflowX),
        };
      });

      const mobileOverflowControlled = tableChecks.length
        ? tableChecks.every((item) => item.controlledOverflow || !item.scrollable)
        : false;

      return {
        totalTablesChecked: tableChecks.length,
        mobileOverflowControlled,
        details: tableChecks,
      };
    });
  });
}

async function takeScreenshots(page) {
  await ensureArtifactsDir();

  await withStepTimeout('desktopScreenshot', async () => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto(APP_URL, { waitUntil: 'domcontentloaded', timeout: STEP_TIMEOUT_MS });
    await page.screenshot({ path: path.join(ARTIFACTS_DIR, 'app-desktop.png'), fullPage: true });
  });

  await withStepTimeout('mobileScreenshot', async () => {
    await page.setViewportSize({ width: 375, height: 812 });
    await page.goto(APP_URL, { waitUntil: 'domcontentloaded', timeout: STEP_TIMEOUT_MS });
    await page.screenshot({ path: path.join(ARTIFACTS_DIR, 'app-mobile.png'), fullPage: true });
  });

  return {
    desktop: path.relative(PROJECT_ROOT, path.join(ARTIFACTS_DIR, 'app-desktop.png')),
    mobile: path.relative(PROJECT_ROOT, path.join(ARTIFACTS_DIR, 'app-mobile.png')),
  };
}

function normalizeBootReport(bootReportData) {
  const report = bootReportData || {};
  return {
    uptime: report.uptime ?? 'n/a',
    memory: report.memory ?? 'n/a',
    steps: Array.isArray(report.steps) ? report.steps.length : report.steps ?? 'n/a',
    status: report.status ?? 'n/a',
  };
}

function generateReport(results) {
  const syntaxErrorCount = results.syntax.errors.length;

  const report = {
    summary: {
      jsFilesChecked: results.syntax.totalFiles,
      syntaxErrors: syntaxErrorCount,
      appContextReady: results.boot.appContextReady,
      bootMonitorAvailable: results.boot.hasBootReport,
      checklistEnterNavigationOk: results.checklist.enterNavigationOk,
      stickyActionBarOk: results.checklist.stickyActionBarOk,
      pdfWhatsAppFunctionsOk: results.pdf
        ? results.pdf.hasGeneratePDF &&
          results.pdf.hasSendPDFToWhatsApp &&
          results.pdf.generateReturnsPromise &&
          results.pdf.sendReturnsPromise
        : 'skipped',
      tablesOverflowControlledOnMobile: results.tables.mobileOverflowControlled,
    },
    bootMonitor: normalizeBootReport(results.boot.bootReport),
    syntaxErrors: results.syntax.errors,
    checklist: results.checklist,
    pdf: results.pdf,
    tables: results.tables,
    screenshots: results.screenshots,
  };

  console.log('\n========================================');
  console.log('SYSTEM HEALTH CHECK REPORT');
  console.log('========================================\n');

  console.log('Summary:');
  console.table(report.summary);

  console.log('Boot monitor details:');
  console.table(report.bootMonitor);

  if (report.syntaxErrors.length > 0) {
    console.log('Syntax errors found:');
    for (const err of report.syntaxErrors) {
      console.log(`- ${err.file}`);
      if (err.output) {
        console.log(err.output);
      }
    }
  } else {
    console.log('No syntax errors found by node --check.');
  }

  console.log('\nChecklist check:');
  console.log(JSON.stringify(report.checklist, null, 2));

  console.log('\nPDF/WhatsApp check:');
  console.log(JSON.stringify(report.pdf, null, 2));

  console.log('\nTable overflow check:');
  console.log(JSON.stringify(report.tables, null, 2));

  console.log('\nScreenshots:');
  console.log(`- Desktop: ${report.screenshots.desktop}`);
  console.log(`- Mobile: ${report.screenshots.mobile}`);

  console.log('\n========================================\n');

  return report;
}

function loadPlaywrightChromium() {
  try {
    // eslint-disable-next-line global-require
    return require('playwright').chromium;
  } catch (error) {
    throw new Error(
      'Dependency "playwright" is required. Install with: npm install --save-dev playwright'
    );
  }
}

async function run() {
  const flags = parseFlags(process.argv.slice(2));

  const syntaxResults = await checkSyntax();
  const serverState = await startStaticServerIfNeeded();

  let browser;
  try {
    const chromium = loadPlaywrightChromium();
    browser = await chromium.launch({ headless: true });
    const context = await browser.newContext();
    const page = await context.newPage();
    page.setDefaultTimeout(STEP_TIMEOUT_MS);

    const screenshots = await takeScreenshots(page);
    const boot = await checkBootMonitor(page);
    const checklist = await checkChecklistFlow(page);
    const tables = await checkTables(page);
    const pdf = flags.skipPdf ? null : await checkPDFService(page);

    const report = generateReport({
      syntax: syntaxResults,
      boot,
      checklist,
      tables,
      pdf,
      screenshots,
    });

    const hasFailures =
      syntaxResults.errors.length > 0 ||
      boot.appContextReady === null ||
      !boot.hasBootReport ||
      !checklist.enterNavigationOk ||
      !checklist.stickyActionBarOk ||
      !tables.mobileOverflowControlled ||
      (!flags.skipPdf &&
        (!pdf.hasGeneratePDF ||
          !pdf.hasSendPDFToWhatsApp ||
          !pdf.generateReturnsPromise ||
          !pdf.sendReturnsPromise));

    process.exitCode = hasFailures ? 1 : 0;
    return report;
  } finally {
    if (browser) {
      await browser.close();
    }

    if (serverState.process && serverState.startedByScript) {
      serverState.process.kill('SIGTERM');
    }
  }
}

run().catch((error) => {
  console.error('Health check failed with unexpected error:');
  console.error(error);
  process.exitCode = 1;
});
