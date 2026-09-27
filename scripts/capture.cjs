const { chromium } = require('@playwright/test');
const { spawn } = require('node:child_process');
const fs = require('node:fs/promises');
const path = require('node:path');
const { randomUUID } = require('node:crypto');
const { waitForReady, stopServer, verifyCaptureResponse } = require('./capture-server.cjs');
const { publishCapture, verifyCaptureMetrics } = require('./capture-files.cjs');

const origin = 'http://127.0.0.1:4173';
const article = '/writing/tracing-a-kernel-panic-what-actually-happens-when-you-hit-sleep-6e1e2bffa4bd/';
const coreRoutes = ['/', '/sites/', article];
const fullRoutes = ['/', '/portfolio/', '/sites/', '/projects/localllm/', '/blog/', article,
  '/life/', '/games/', '/photos/', '/connect/', '/resume/'];
(async () => {
  const phase = process.argv[2];
  if (!['before', 'after', 'readability-before', 'readability-after'].includes(phase)) {
    throw new Error('Use: node scripts/capture.cjs before|after|readability-before|readability-after [--full]');
  }
  const routes = process.argv.includes('--full') ? fullRoutes : coreRoutes;
  const directory = path.join('preview', phase);
  const marker = randomUUID();

  // Only the child we spawned may declare readiness; an unrelated 200 is insufficient.
  const server = spawn(process.execPath, ['scripts/serve-site.cjs'], {
    stdio: ['inherit', 'inherit', 'inherit', 'ipc'],
    env: { ...process.env, PORTFOLIO_CAPTURE_RUN: marker }
  });
  let browser;
  let staging;
  const metrics = [];
  try {
    await waitForReady(server);
    await fs.mkdir('preview', { recursive: true });
    staging = await fs.mkdtemp(path.join('preview', `.capture-${phase}-`));
    browser = await chromium.launch();
    for (const viewport of [{ width: 1440, height: 900 }, { width: 1024, height: 768 },
      { width: 390, height: 844 }, { width: 320, height: 740 }]) {
      for (const theme of ['dark', 'light']) {
        const context = await browser.newContext({ viewport, reducedMotion: 'reduce' });
        await context.addInitScript(value => localStorage.setItem('theme', value), theme);
        try {
          for (const route of routes) {
            const page = await context.newPage();
            try {
              const errors = [];
              const unowned = [];
              page.on('pageerror', error => errors.push(error.message));
              page.on('response', response => {
                if (!response.url().startsWith(origin + '/')) return;
                try { verifyCaptureResponse(response, marker); }
                catch (error) { unowned.push(error.message); }
              });
              const response = await page.goto(origin + route, { waitUntil: 'domcontentloaded', timeout: 60000 });
              verifyCaptureResponse(response, marker);
              if (!response.ok()) throw new Error(`${route}: HTTP ${response.status()}`);
              if (route === '/photos/') {
                await page.locator('#photo-gallery[data-feed-ready="true"]').waitFor({ timeout: 15000 });
              }
              await page.evaluate(async () => {
                await document.fonts.ready;
                const pause = ms => new Promise(resolve => setTimeout(resolve, ms));
                for (let y = 0; y < document.documentElement.scrollHeight; y += innerHeight) {
                  scrollTo(0, y); await pause(120);
                }
                await Promise.all([...document.images].filter(img => img.currentSrc && img.getBoundingClientRect().width)
                  .map(img => Promise.race([img.decode().catch(() => {}), pause(8000)])));
                scrollTo(0, 0);
              });
              const name = route === '/' ? 'home' : route.split('/').filter(Boolean).join('-');
              const filename = `${name}-${viewport.width}-${theme}.png`;
              const file = path.join(directory, filename);
              let state;
              for (let attempt = 0; attempt < 3; attempt++) {
                const png = await page.screenshot({ path: path.join(staging, filename), fullPage: true, animations: 'disabled' });
                state = await page.evaluate(() => ({
                  viewport: [innerWidth, innerHeight],
                  height: document.documentElement.scrollHeight,
                  overflow: document.documentElement.scrollWidth - document.documentElement.clientWidth,
                  brokenImages: [...document.images].filter(img => img.currentSrc && img.getBoundingClientRect().width &&
                    img.complete && !img.naturalWidth).map(img => img.currentSrc)
                }));
                if (png.readUInt32BE(16) === state.viewport[0] && png.readUInt32BE(20) === state.height) break;
                if (attempt === 2) throw new Error(`${route}: page geometry did not settle during capture`);
                await page.evaluate(async () => {
                  await document.fonts.ready;
                  const pause = ms => new Promise(resolve => setTimeout(resolve, ms));
                  await Promise.all([...document.images].filter(img => img.currentSrc && img.getBoundingClientRect().width)
                    .map(img => Promise.race([img.decode().catch(() => {}), pause(8000)])));
                });
              }
              if (unowned.length) throw new Error(unowned.join('; '));
              if (server.exitCode !== null || server.signalCode !== null) throw new Error('Preview server exited during capture');
              metrics.push({ route, theme, file, ...state, errors });
              await fs.writeFile(path.join(staging, 'metrics.json'), JSON.stringify(metrics, null, 2) + '\n');
              console.log(`Captured ${file} (${state.height}px high, overflow ${state.overflow}px)`);
            } finally {
              await page.close();
            }
          }
        } finally {
          await context.close();
        }
      }
    }
    if (server.exitCode !== null || server.signalCode !== null) throw new Error('Preview server exited before publication');
    await verifyCaptureMetrics(staging);
    await publishCapture(staging, directory);
    staging = undefined;
    console.log(`Captured ${metrics.length} page/theme/viewport combinations in ${directory}`);
  } finally {
    try {
      await browser?.close();
    } finally {
      try {
        await stopServer(server);
      } finally {
        if (staging) await fs.rm(staging, { recursive: true, force: true });
      }
    }
  }
})().catch(error => { console.error(error); process.exitCode = 1; });
