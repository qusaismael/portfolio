const test = require('node:test');
const assert = require('node:assert/strict');
const pkg = require('../../package.json');

test('CI scripts name real test suites', () => {
  assert.equal(pkg.scripts.test, 'node --test tests/unit/*.test.cjs');
  assert.equal(pkg.scripts['test:site'], 'node --test tests/site/*.test.cjs');
  assert.equal(pkg.scripts['test:browser'], 'playwright test');
});
