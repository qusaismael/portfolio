const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const crypto = require('node:crypto');
const cheerio = require('cheerio');
const { fileFor } = require('../support/routes.cjs');
const contract = require('../fixtures/content-contract.json');

const normalize = value => value.replace(/\s+/g, ' ').trim();

test('authored data and existing prose remain intact and in order', () => {
  for (const [file, hash] of Object.entries(contract.data)) {
    assert.equal(crypto.createHash('sha256').update(fs.readFileSync(file)).digest('hex'), hash, file);
  }
  for (const [route, expected] of Object.entries(contract.pages)) {
    const $ = cheerio.load(fs.readFileSync(fileFor(route), 'utf8'));
    const actual = $('main').find('h1,h2,h3,p,blockquote,figcaption,li').toArray()
      .map(el => normalize($(el).text())).filter(Boolean);
    let position = 0;
    for (const text of expected) {
      const found = actual.indexOf(text, position);
      assert.notEqual(found, -1, `${route}: missing or reordered prose: ${text}`);
      position = found + 1;
    }
  }
});

test('changed stylesheets use fresh cache keys without loading Home-only CSS elsewhere', () => {
  const home = cheerio.load(fs.readFileSync(fileFor('/'), 'utf8'));
  const work = cheerio.load(fs.readFileSync(fileFor('/sites/'), 'utf8'));
  for (const asset of ['style.css', 'personality.css', 'terminal.css']) {
    assert.equal(home(`link[rel="stylesheet"][href="/css/${asset}?v=soul-gate-a"]`).length, 1, asset);
    assert.equal(work(`link[rel="stylesheet"][href="/css/${asset}?v=soul-gate-a"]`).length, 1, asset);
  }
  assert.equal(home('link[href="/css/life-preview.css?v=soul-gate-a-mobile-cards"]').length, 1);
  assert.equal(work('link[href*="life-preview.css"]').length, 0);
});

test('homepage retains its human-first section order', () => {
  const $ = cheerio.load(fs.readFileSync(fileFor('/'), 'utf8'));
  assert.deepEqual($('main > section').toArray().map(el => $(el).attr('id')),
    ['about', 'life-teasers', 'blog', 'github-pulse', 'experience', 'projects', 'contact']);
});
