module.exports = function(eleventyConfig) {
  // Passthrough copy for static assets
  eleventyConfig.addPassthroughCopy("src/css");
  eleventyConfig.addPassthroughCopy("src/js");
  eleventyConfig.addPassthroughCopy("src/pics");
  eleventyConfig.addPassthroughCopy("src/script.js");
  eleventyConfig.addPassthroughCopy("src/gallery.js");
  eleventyConfig.addPassthroughCopy("src/pfp.webp");
  eleventyConfig.addPassthroughCopy("src/pfp-440.webp");
  eleventyConfig.addPassthroughCopy("src/robots.txt");
  eleventyConfig.addPassthroughCopy("src/CNAME");
  eleventyConfig.addPassthroughCopy("src/fonts");
  // Optional: you can add an alias for layouts
  eleventyConfig.addLayoutAlias('base', 'base.njk');
  eleventyConfig.setNunjucksEnvironmentOptions({ autoescape: true });
  eleventyConfig.addFilter('relatedWriting', (posts, slug, topics) => {
    const at = posts.findIndex(post => post.slug === slug);
    const rest = [...posts.slice(at + 1), ...posts.slice(0, at)];
    const same = rest.filter(post => topics[post.slug] === topics[slug]);
    const other = rest.filter(post => topics[post.slug] !== topics[slug]);
    return [...same.slice(0, 1), ...other.slice(0, 1)];
  });
  eleventyConfig.addFilter('readingTime', html => Math.max(1, Math.round(String(html || '').replace(/<[^>]+>/g, ' ').split(/\s+/).filter(Boolean).length / 220)));
  eleventyConfig.addFilter('articleOutline', require('./scripts/article-outline.cjs'));

  // Country wall: visited places grouped by country, one typeface each.
  eleventyConfig.addGlobalData('wallCountries', () => {
    const places = require('./src/_data/visitedPlaces.json');
    const groups = [
      { id: 'jordan', name: 'Jordan', font: 'reem-kufi', match: 'Jordan' },
      { id: 'turkey', name: 'Türkiye', font: 'duru-sans', match: 'Turkey' },
      { id: 'saudi', name: 'Saudi Arabia', font: 'almarai', match: 'Saudi Arabia' },
      { id: 'egypt', name: 'Egypt', font: 'cinzel', match: 'Egypt' }
    ];
    return groups.map(group => ({
      ...group,
      cities: places.filter(place => place.country.startsWith(group.match))
    }));
  });

  return {
    dir: {
      input: "src",
      output: "_site",
      includes: "_includes",
      data: "_data"
    },
    templateFormats: ["html", "njk", "md"],
    htmlTemplateEngine: "njk",
    markdownTemplateEngine: "njk"
  };
};
