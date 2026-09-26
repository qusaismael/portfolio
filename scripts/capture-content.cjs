const fs = require('node:fs');
const crypto = require('node:crypto');
const cheerio = require('cheerio');
const { routes, fileFor } = require('../tests/support/routes.cjs');

const normalize = value => value.replace(/\s+/g, ' ').trim();
const protectedData = ['projects.json', 'writing.json', 'experience.json', 'games.json', 'site.json'];
const contract = { data: {}, pages: {} };
for (const name of protectedData) {
  const file = 'src/_data/' + name;
  contract.data[file] = crypto.createHash('sha256').update(fs.readFileSync(file)).digest('hex');
}
for (const route of routes) {
  const $ = cheerio.load(fs.readFileSync(fileFor(route), 'utf8'));
  contract.pages[route] = $('main').find('h1,h2,h3,p,blockquote,figcaption,li')
    .toArray().map(el => normalize($(el).text())).filter(Boolean);
}
fs.mkdirSync('tests/fixtures', { recursive: true });
fs.writeFileSync('tests/fixtures/content-contract.json', JSON.stringify(contract, null, 2) + '\n');
console.log(`Captured authored content from ${routes.length} canonical pages.`);
