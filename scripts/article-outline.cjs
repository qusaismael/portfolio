const cheerio = require('cheerio');

module.exports = function articleOutline(body) {
  const $ = cheerio.load(body, null, false);
  const used = new Set($('[id]').toArray().map(el => $(el).attr('id')));
  const items = [];
  let serial = 1;
  $('h2,h3').each((_, el) => {
    const heading = $(el);
    const title = heading.text().replace(/\s+/g, ' ').trim();
    if (!title) return;
    let id = heading.attr('id');
    if (!id) {
      do { id = `article-section-${serial++}`; } while (used.has(id));
      heading.attr('id', id);
      used.add(id);
    }
    items.push({ id, title, level: Number(el.tagName.slice(1)) });
  });
  return { body: $.html(), items };
};
