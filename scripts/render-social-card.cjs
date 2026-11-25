#!/usr/bin/env node
// Deterministic Quiet Edition 1200x630 social card renderer using Playwright
// over an ephemeral local HTTP server so @font-face WOFF2 files never hit file:// CORS blocks.
const http = require('node:http');
const fs = require('node:fs');
const path = require('node:path');
const { chromium } = require('@playwright/test');

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.woff2': 'font/woff2',
  '.webp': 'image/webp',
  '.png': 'image/png',
  '.svg': 'image/svg+xml'
};

function startStaticServer(root) {
  return new Promise((resolve, reject) => {
    const server = http.createServer((req, res) => {
      const cleanPath = decodeURIComponent(String(req.url || '/').split('?')[0]);
      const fullPath = path.resolve(root, '.' + cleanPath);
      if (!fullPath.startsWith(root + path.sep) && fullPath !== root) {
        res.writeHead(403).end('Forbidden');
        return;
      }
      fs.readFile(fullPath, (err, data) => {
        if (err) {
          res.writeHead(404).end('Not found');
          return;
        }
        const ext = path.extname(fullPath).toLowerCase();
        res.writeHead(200, { 'Content-Type': MIME[ext] || 'application/octet-stream' });
        res.end(data);
      });
    });
    server.on('error', reject);
    server.listen(0, '127.0.0.1', () => {
      const { port } = server.address();
      resolve({ server, origin: `http://127.0.0.1:${port}` });
    });
  });
}

(async () => {
  const root = path.resolve(__dirname, '..');
  const outPath = path.join(root, 'src/pics/social-card.png');
  const { server, origin } = await startStaticServer(root);
  let browser;
  try {
    browser = await chromium.launch();
    const page = await browser.newPage({ viewport: { width: 1200, height: 630 }, deviceScaleFactor: 1 });
    await page.goto(`${origin}/tools/social-card-src.html`, { waitUntil: 'networkidle' });
    const ready = await page.evaluate(async () => {
      await document.fonts.ready;
      const imgs = [...document.images];
      await Promise.all(imgs.map(img => img.decode().catch(() => {})));
      return {
        fraunces: document.fonts.check('480 86px "Fraunces"'),
        plexSans: document.fonts.check('400 18px "IBM Plex Sans"'),
        plexMono: document.fonts.check('400 18px "IBM Plex Mono"'),
        imagesOk: imgs.every(img => img.complete && img.naturalWidth > 0)
      };
    });
    if (!ready.fraunces || !ready.imagesOk) {
      throw new Error(`Social card assets failed to load: ${JSON.stringify(ready)}`);
    }
    await page.screenshot({ path: outPath, type: 'png' });
    console.log('Wrote 1200x630 Quiet Edition social card:', outPath, ready);
  } finally {
    await browser?.close();
    server.close();
  }
})().catch(error => {
  console.error(error);
  process.exitCode = 1;
});
