const fs = require('node:fs');
const crypto = require('node:crypto');
const { execFileSync } = require('node:child_process');
const cheerio = require('cheerio');
const { routes, fileFor } = require('../tests/support/routes.cjs');
const norm = s => s.replace(/\s+/g, ' ').trim();
const hash = file => crypto.createHash('sha256').update(fs.readFileSync(file)).digest('hex');
const protectedFiles = [
  'src/_data/site.json', 'src/_data/experience.json', 'src/_data/games.json',
  'src/_data/writing.json', 'src/_includes/cat.njk', 'src/_includes/terminal.njk',
  'src/js/terminal.js', 'src/js/personality.js', 'src/css/terminal.css'
];
const result = {
  commit: execFileSync('git', ['rev-parse', 'HEAD'], { encoding: 'utf8' }).trim(),
  hashes: Object.fromEntries(protectedFiles.map(file => [file, hash(file)])),
  projects: JSON.parse(fs.readFileSync('src/_data/projects.json', 'utf8')),
  pages: {}
};
for (const route of routes) {
  const $ = cheerio.load(fs.readFileSync(fileFor(route), 'utf8'));
  result.pages[route] = {
    hrefs: [...new Set($('main a[href]').toArray().map(el => $(el).attr('href')))].sort(),
    placeFacts: $('#globe-visited-chips .globe-chip').toArray().map(el =>
      Object.fromEntries(['id','city','country','flag','lat','lon','desc'].map(key => [key, $(el).attr(`data-${key}`)]))),
    protectedText: $('.reference-card blockquote,.fact-body,.personal-moment blockquote')
      .toArray().map(el => norm($(el).text()))
  };
}
fs.writeFileSync('tests/fixtures/readability-baseline.json', JSON.stringify(result, null, 2) + '\n', { flag: 'wx' });
console.log(`Frozen readability baseline for ${routes.length} routes.`);
