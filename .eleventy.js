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
  // Optional: you can add an alias for layouts
  eleventyConfig.addLayoutAlias('base', 'base.njk');
  eleventyConfig.setNunjucksEnvironmentOptions({ autoescape: true });

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
