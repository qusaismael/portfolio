const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const crypto = require('node:crypto');
const cheerio = require('cheerio');
const frozen = require('../fixtures/readability-baseline.json');
const { routes, fileFor } = require('../support/routes.cjs');
const norm = s => s.replace(/\s+/g, ' ').trim();
const facts = project => {
  const { description, cardNote, ...rest } = project;
  return rest;
};
test('editorial work preserves facts quotations and existing destinations', () => {
  for (const [file, expected] of Object.entries(frozen.hashes)) {
    const actual = crypto.createHash('sha256').update(fs.readFileSync(file)).digest('hex');
    assert.equal(actual, expected, file);
  }
  const current = JSON.parse(fs.readFileSync('src/_data/projects.json', 'utf8'));
  assert.deepEqual(current.map(facts), frozen.projects.map(facts));
  assert.deepEqual(Object.keys(frozen.pages).sort(), [...routes].sort());
  for (const [route, before] of Object.entries(frozen.pages)) {
    const $ = cheerio.load(fs.readFileSync(fileFor(route), 'utf8'));
    const hrefs = new Set($('main a[href]').toArray().map(el => $(el).attr('href')));
    for (const href of before.hrefs) assert.ok(hrefs.has(href), `${route}: lost ${href}`);
    const placeFacts = $('#globe-visited-chips .globe-chip').toArray().map(el =>
      Object.fromEntries(['id','city','country','flag','lat','lon','desc'].map(key => [key, $(el).attr(`data-${key}`)])));
    assert.deepEqual(placeFacts, before.placeFacts, `${route}: changed map identity or story`);
    const body = norm($('main').text());
    for (const text of before.protectedText) assert.ok(body.includes(text), `${route}: changed quotation/story`);
  }
});
