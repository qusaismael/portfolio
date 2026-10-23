const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const cheerio = require('cheerio');
const { routes, fileFor } = require('../support/routes.cjs');

const load = route => cheerio.load(fs.readFileSync(fileFor(route), 'utf8'));

test('only Home preloads the hero portrait; hidden full-size portraits load on demand', () => {
  for (const route of routes) {
    const $ = load(route);
    assert.equal($('link[rel="preload"][as="image"][href="/pfp-440.webp"]').length, route === '/' ? 1 : 0, route);
    assert.equal($('#profile-dialog img').attr('loading'), 'lazy', route);
    assert.equal($('#profile-dialog img').attr('decoding'), 'async', route);
  }
});
