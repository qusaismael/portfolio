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
  for (const asset of ['personality.css', 'terminal.css']) {
    assert.equal(home(`link[rel="stylesheet"][href="/css/${asset}?v=soul-gate-a"]`).length, 1, asset);
    assert.equal(work(`link[rel="stylesheet"][href="/css/${asset}?v=soul-gate-a"]`).length, 1, asset);
  }
  assert.equal(home('link[href="/css/style.css?v=20260926-readability"]').length, 1);
  assert.equal(work('link[href="/css/style.css?v=20260926-readability"]').length, 1);
  assert.equal(home('link[href="/css/life-preview.css?v=20260926-readability"]').length, 1);
  assert.equal(work('link[href*="life-preview.css"]').length, 0);
});

test('Work page gives all ten named sites a compact directory without linking broken HTTPS', () => {
  const $ = cheerio.load(fs.readFileSync(fileFor('/sites/'), 'utf8'));
  const expected = [
    ['Portfolio', 'www.qusai.pro'],
    ['Textify', 'textify.qusai.pro'],
    ['GRC Check', 'grc.qusai.pro'],
    ['30 Days From Today', '30daysfromtoday.qusai.pro'],
    ['Local LLM', 'localllm.qusai.pro'],
    ['ClipGuard', 'clipguard.qusai.pro'],
    ['RSS + AI', 'rss.qusai.pro'],
    ['Privacy Check', 'privacy.qusai.pro'],
    ['SecureChat', 'securebot.qusai.pro'],
    ['Token Speed', 'token.qusai.pro']
  ];
  const entries = $('#live-sites .site-directory-list > li');
  assert.equal(entries.length, expected.length);
  entries.each((index, entry) => {
    const [name, host] = expected[index];
    const item = $(entry);
    assert.equal(normalize(item.find('.site-name').text()), name);
    assert.equal(normalize(item.find('.site-domain').text()), host);
    const link = item.find('a');
    if (name === 'Textify') {
      assert.equal(link.length, 0, 'do not send visitors to an invalid TLS certificate');
      assert.match(item.text(), /HTTPS pending/);
    } else {
      assert.equal(link.length, 1);
      assert.equal(link.attr('href'), `https://${host}/`);
      if (name !== 'Portfolio') {
        assert.equal(link.attr('target'), '_blank');
        assert.deepEqual((link.attr('rel') || '').split(/\s+/).filter(Boolean).sort(), ['noopener', 'noreferrer']);
        assert.match(normalize(link.find('.sr-only').text()), /opens in a new tab/i);
      } else {
        assert.equal(link.attr('target'), undefined, 'Portfolio stays in the current tab');
        assert.equal(link.find('.sr-only').length, 0);
      }
    }
  });
  assert.deepEqual($('main > section').toArray().map(el => $(el).attr('id')),
    ['selected-work', 'sites', 'live-sites', 'contact']);
  assert.equal($('link[href="/css/site-directory.css?v=20260911"]').length, 1);
});

test('homepage retains its human-first section order', () => {
  const $ = cheerio.load(fs.readFileSync(fileFor('/'), 'utf8'));
  assert.deepEqual($('main > section').toArray().map(el => $(el).attr('id')),
    ['about', 'life-teasers', 'blog', 'github-pulse', 'experience', 'projects', 'contact']);
});
