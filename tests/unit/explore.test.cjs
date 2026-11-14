const test = require('node:test');
const assert = require('node:assert/strict');
const projects = require('../../src/_data/projects.json');
const writing = require('../../src/_data/writing.json');
const entries = require('../../src/_data/explore.js');

test('explore covers all writing and featured project stories exactly once', () => {
  assert.equal(entries.length, writing.length + projects.filter(p => p.featured).length);
  assert.equal(new Set(entries.map(e => e.href)).size, entries.length);
  for (const entry of entries) {
    assert.match(entry.href, /^\/(writing|projects)\/[a-z0-9-]+\/$/);
    assert.ok(entry.title && entry.summary && entry.search);
    assert.ok(['writing', 'projects'].includes(entry.kind));
  }
});

test('article HTML becomes searchable plain text, not markup', () => {
  const article = writing.find(p => /<h3/.test(p.body));
  const entry = entries.find(e => e.href === `/writing/${article.slug}/`);
  assert.ok(entry.search.includes(article.title.toLowerCase()));
  assert.ok(!entry.search.includes('<h3'));
});
