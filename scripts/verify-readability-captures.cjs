const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const routes = ['/', '/portfolio/', '/sites/', '/projects/localllm/', '/blog/',
  '/writing/tracing-a-kernel-panic-what-actually-happens-when-you-hit-sleep-6e1e2bffa4bd/',
  '/life/', '/games/', '/photos/', '/connect/', '/resume/'];
const widths = [320, 390, 1024, 1440];
const themes = ['dark', 'light'];
const phase = process.argv[2];
assert.ok(['readability-before', 'readability-after'].includes(phase), 'Pass a readability phase');
const records = JSON.parse(fs.readFileSync(`preview/${phase}/metrics.json`, 'utf8'));
const expected = new Set(routes.flatMap(route => widths.flatMap(width => themes.map(theme => `${route}|${width}|${theme}`))));
const seen = new Set();
for (const row of records) {
  const key = `${row.route}|${row.viewport[0]}|${row.theme}`;
  assert.ok(expected.has(key), `Unexpected capture ${key}`);
  assert.ok(!seen.has(key), `Duplicate capture ${key}`);
  seen.add(key);
  assert.equal(row.overflow, 0, `Overflow ${key}`);
  assert.deepEqual(row.brokenImages, [], `Broken images ${key}`);
  assert.deepEqual(row.errors, [], `Page errors ${key}`);
  const file = path.join('preview', phase, path.basename(row.file));
  const png = fs.readFileSync(file);
  assert.deepEqual([...png.subarray(0, 8)], [137, 80, 78, 71, 13, 10, 26, 10]);
  assert.equal(png.readUInt32BE(16), row.viewport[0], `Width mismatch ${key}`);
  assert.equal(png.readUInt32BE(20), row.height, `Height mismatch ${key}`);
}
assert.deepEqual(seen, expected);
console.log(`${phase}: ${seen.size} complete captures; no recorded overflow, broken loaded images or page errors`);
