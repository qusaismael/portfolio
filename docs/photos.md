# Local photo archive

`npm run photos:sync` is an explicit maintenance command, not part of the build.
It downloads the current feed and writes local WebP card/full images to
`src/pics/photos/` and metadata to `src/_data/photos.json`. Review new images and
replace generated fallback alt descriptions in the metadata with visual
descriptions before committing. Existing edited alt text is preserved on sync.

If this host cannot resolve the image service, opt in to a verified address:

```sh
BEHOLD_RESOLVE=185.111.111.155 npm run photos:sync
```

The override only affects `behold.pictures`; normal DNS is the default. The
script tries available sized images and original image/thumbnail URLs and
reports failures. It preserves previously archived images/posts on partial
failures or upstream removal; a failed/empty feed leaves the archive untouched.
It never deletes old images automatically. Review deliberate removals manually.

After syncing, run `npm run build`, `npm run test:site`, `npm test`, and
`npm run test:browser`. Commit the metadata and images together. The built photos
page works without JavaScript and makes no external requests; JavaScript only
enhances the local links with the keyboard-accessible viewer. Video posts are
archived as still previews, with a link to the original post.
