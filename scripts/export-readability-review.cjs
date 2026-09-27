const fs = require('node:fs/promises');
const path = require('node:path');
const sharp = require('sharp');
sharp.concurrency(1);
sharp.cache(false);
(async () => {
  const target = 'preview/readability';
  await fs.mkdir(target, { recursive: true });
  const phases = ['readability-before', 'readability-after'];
  const rows = new Map();
  for (const phase of phases) {
    const metrics = JSON.parse(await fs.readFile(`preview/${phase}/metrics.json`, 'utf8'));
    for (const row of metrics) {
      const key = `${row.route}|${row.viewport[0]}|${row.theme}`;
      const stem = path.basename(row.file, '.png');
      const out = `${phase}-${stem}.webp`;
      const source = path.join('preview', phase, path.basename(row.file));
      const destination = path.join(target, out);
      const [sourceStat, outputStat] = await Promise.all([
        fs.stat(source), fs.stat(destination).catch(() => null)
      ]);
      if (!outputStat || outputStat.mtimeMs < sourceStat.mtimeMs) {
        await sharp(source).webp({ quality: 84 }).toFile(destination);
      }
      const pair = rows.get(key) || { route: row.route, width: row.viewport[0], theme: row.theme };
      pair[phase] = out;
      rows.set(key, pair);
    }
  }
  let doc = '# Readability review\n\nMatched captures; click an image to inspect full size. These are branch previews, not deployment evidence.\n';
  for (const row of [...rows.values()].sort((a, b) => a.route.localeCompare(b.route) || a.width - b.width || a.theme.localeCompare(b.theme))) {
    if (!row['readability-before'] || !row['readability-after']) throw new Error('Unmatched capture');
    doc += `\n## ${row.route} — ${row.width}px — ${row.theme}\n\n| Before | Proposed |\n| --- | --- |\n| ![Before](${row['readability-before']}) | ![Proposed](${row['readability-after']}) |\n`;
  }
  await fs.writeFile(path.join(target, 'README.md'), doc);
  console.log(`Exported ${rows.size} matched comparisons to ${target}/README.md`);
})().catch(error => { console.error(error); process.exitCode = 1; });
