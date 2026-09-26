const { execFileSync } = require('node:child_process');
const path = require('node:path');

function ensureBrowserForCI(env = process.env, run = execFileSync) {
  if (env.CI !== 'true') return;
  const cli = path.join(path.dirname(require.resolve('playwright/package.json')), 'cli.js');
  run(process.execPath, [cli, 'install', '--with-deps', 'chromium'], { stdio: 'inherit' });
}

if (require.main === module) ensureBrowserForCI();

module.exports = { ensureBrowserForCI };
