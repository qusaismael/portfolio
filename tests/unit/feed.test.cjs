const test = require('node:test');
const assert = require('node:assert/strict');
const {
  isoDate,
  xmlEscape,
  topicSlug,
  jsonLd,
  blogPostingLd,
  creativeWorkLd
} = require('../../scripts/filters.cjs');

test('isoDate formats ISO dates and handles fallbacks', () => {
  assert.equal(isoDate('2026-04-12'), '2026-04-12T00:00:00Z');
  assert.equal(isoDate('2026-04-12T10:30:00Z'), '2026-04-12T10:30:00Z');
  assert.equal(isoDate(''), '2026-01-01T00:00:00Z');
  assert.equal(isoDate('not-a-date'), '2026-01-01T00:00:00Z');
});

test('xmlEscape escapes all five XML special characters', () => {
  assert.equal(
    xmlEscape(`<a href="x" title='y'>A & B</a>`),
    '&lt;a href=&quot;x&quot; title=&apos;y&apos;&gt;A &amp; B&lt;/a&gt;'
  );
});

test('topicSlug normalizes writing topic labels into stable URL tokens', () => {
  assert.equal(topicSlug('AI'), 'ai');
  assert.equal(topicSlug('Linux & hardware'), 'linux-and-hardware');
  assert.equal(topicSlug('Life'), 'life');
});

test('jsonLd escapes opening angle brackets to prevent script tag breakout', () => {
  const out = jsonLd({ title: 'Test </script><script>alert(1)</script>' });
  assert.ok(!out.includes('</script>'));
  assert.deepEqual(JSON.parse(out), { title: 'Test </script><script>alert(1)</script>' });
});

test('blogPostingLd and creativeWorkLd emit valid schema.org JSON-LD', () => {
  const site = { name: 'Qusai Ismael', url: 'https://www.qusai.pro' };
  const postJson = blogPostingLd(
    { title: 'Sample </script>', excerpt: 'Short summary', date: '2026-04-12', url: 'https://medium.com/p/1' },
    site,
    '/writing/sample/',
    'AI'
  );
  assert.ok(!postJson.includes('</script>'));
  const postData = JSON.parse(postJson);
  assert.equal(postData['@type'], 'BlogPosting');
  assert.equal(postData.datePublished, '2026-04-12T00:00:00Z');
  assert.equal(postData.articleSection, 'AI');
  assert.equal(postData.url, 'https://www.qusai.pro/writing/sample/');

  const workJson = creativeWorkLd(
    { name: 'GRC Check', description: 'Local-first check', tags: ['Compliance'], live: 'https://grc.qusai.pro/' },
    site,
    '/projects/grc-check/',
    '/pics/grc-check.png'
  );
  const workData = JSON.parse(workJson);
  assert.equal(workData['@type'], 'CreativeWork');
  assert.equal(workData.image, 'https://www.qusai.pro/pics/grc-check.png');
  assert.equal(workData.sameAs, 'https://grc.qusai.pro/');
});
