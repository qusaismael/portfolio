const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const cheerio = require('cheerio');
const { routes, legacy, fileFor } = require('../support/routes.cjs');
const site = require('../../src/_data/site.json');

test('all canonical routes have a title, main, description, and canonical', () => {
  assert.equal(new Set(routes).size, routes.length);
  for (const route of routes) {
    const $ = cheerio.load(fs.readFileSync(fileFor(route), 'utf8'));
    assert.equal($('main#main-content').length, 1, route);
    assert.equal($('h1').length, 1, route);
    assert.ok($('title').text().trim(), route);
    assert.ok($('meta[name="description"]').attr('content')?.trim(), route);
    assert.equal($('link[rel="canonical"]').attr('href'), site.url + route, route);
  }
});

test('legacy URLs point to preserved destinations', () => {
  for (const route of legacy) {
    const html = fs.readFileSync('_site' + route.from, 'utf8');
    assert.ok(html.includes(route.to), route.from);
  }
  assert.ok(fs.existsSync('_site/404.html'));
});
