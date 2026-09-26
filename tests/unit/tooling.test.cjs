const test = require('node:test');
const assert = require('node:assert/strict');
const pkg = require('../../package.json');
const path = require('node:path');

test('CI browser-test bootstrap installs Chromium only on the runner', () => {
  assert.equal(pkg.scripts['test:browser'], 'node scripts/install-playwright-if-ci.cjs && playwright test');
  const { ensureBrowserForCI } = require('../../scripts/install-playwright-if-ci.cjs');
  const calls = [];
  const record = (command, args, options) => calls.push({ command, args, options });
  ensureBrowserForCI({ CI: 'true' }, record);
  assert.equal(calls.length, 1);
  assert.equal(calls[0].command, process.execPath);
  assert.deepEqual(calls[0].args, [
    path.join(path.dirname(require.resolve('playwright/package.json')), 'cli.js'),
    'install', '--with-deps', 'chromium'
  ]);
  assert.deepEqual(calls[0].options, { stdio: 'inherit' });
  ensureBrowserForCI({}, record);
  assert.equal(calls.length, 1);
});

test('CI scripts name real test suites', () => {
  assert.equal(pkg.scripts.test, 'node --test tests/unit/*.test.cjs');
  assert.equal(pkg.scripts['test:site'], 'node --test tests/site/*.test.cjs');
  assert.equal(pkg.scripts['test:browser'], 'node scripts/install-playwright-if-ci.cjs && playwright test');
});
