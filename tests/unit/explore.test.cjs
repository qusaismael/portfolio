const test = require('node:test');
const assert = require('node:assert/strict');
const projects = require('../../src/_data/projects.json');
const writing = require('../../src/_data/writing.json');
const entries = require('../../src/_data/explore.js');

test('explore covers all writing, featured project stories, and web tools exactly once', () => {
  const featured = projects.filter(p => p.featured);
  const tools = projects.filter(p => !p.featured && p.live);
  assert.equal(entries.length, writing.length + featured.length + tools.length);
  assert.equal(new Set(entries.map(e => e.href)).size, entries.length);
  for (const entry of entries) {
    assert.ok(entry.title && entry.summary && entry.search);
    assert.ok(['writing', 'projects', 'tools'].includes(entry.kind));
    if (entry.kind === 'tools') {
      assert.equal(entry.external, true);
      assert.match(entry.href, /^https:\/\/[a-z0-9.-]+\/$/);
    } else {
      assert.equal(entry.external, false);
      assert.match(entry.href, /^\/(writing|projects)\/[a-z0-9-]+\/$/);
    }
  }
});

test('article HTML becomes searchable plain text, not markup', () => {
  const article = writing.find(p => /<h3/.test(p.body));
  const entry = entries.find(e => e.href === `/writing/${article.slug}/`);
  assert.ok(entry.search.includes(article.title.toLowerCase()));
  assert.ok(!entry.search.includes('<h3'));
});
