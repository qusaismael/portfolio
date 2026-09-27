const test = require('node:test');
const assert = require('node:assert/strict');
const cheerio = require('cheerio');
const outline = require('../../scripts/article-outline.cjs');

test('outline preserves prose links and existing IDs while labeling sections', () => {
  const input = '<h2>Why?</h2><p>Original <a href="https://example.org/source">source</a>.</p><h3 id="kept">How</h3><pre><code>x &lt; y</code></pre>';
  const result = outline(input);
  assert.deepEqual(result.items, [
    { id: 'article-section-1', title: 'Why?', level: 2 },
    { id: 'kept', title: 'How', level: 3 }
  ]);
  const before = cheerio.load(input, null, false);
  const after = cheerio.load(result.body, null, false);
  assert.equal(after.root().text(), before.root().text());
  assert.equal(after('a').attr('href'), 'https://example.org/source');
  assert.equal(after('pre').text(), 'x < y');
  assert.equal(after('html,body').length, 0);
});

test('outline avoids collisions and handles articles without headings', () => {
  const result = outline('<div id="article-section-1"></div><h2>A</h2><h2>A</h2>');
  assert.deepEqual(result.items.map(x => x.id), ['article-section-2', 'article-section-3']);
  assert.deepEqual(outline('<p>A short note.</p>').items, []);
});
