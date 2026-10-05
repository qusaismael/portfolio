# Live-site directory release verification

## Scope and approval

The owner instructed “continue on doing it all in the best way”, then “continue, get it done”, after the two pending portfolio PRs were identified. PR #3's readability pass was merged at `66d7ab6f30d2954cd6f21e1b10387a946c937671`. PR #4 integrates that exact main baseline.

## Conflict decision

`src/sites.html` had one disjoint-intent conflict. Merge commit `67e7e00ebe5a187f640adfc7d062b246f559a577` preserves main's shorter Work introduction and `Tools` section, plus the complete ten-site directory and its page-specific stylesheet. No unrelated copy, article-body, fact, or quotation changes were made.

## Fresh execution (2026-10-05)

- Eleventy build: passed.
- Unit tests: **4/4** passed.
- Site tests: **40/40** passed.
- Browser tests: **29/29** passed, serialized with one worker. Total: **73 tests, zero failures**.
- Directory coverage includes 320/390/700/701/1024/1440px, both themes, two-column row alignment, contiguous phone rows, 44px minimum hit height, unclipped labels, and sequential visible keyboard focus skipping the pending entry.
- Content guards require both `noopener` and `noreferrer`, a screen-reader new-tab cue for external links, and same-tab Portfolio navigation.
- **88/88 final captures** across 11 routes, four widths, and both themes: exact unique-key/count and PNG geometry checks passed; no recorded overflow, broken loaded images, or page errors.
- **24 axe WCAG A/AA scans** across six changed routes, 390/1440px, and both themes: no detected violations. Keyboard mobile-menu Enter/Escape and theme-toggle checks passed.
- Integrated directory captures visually inspected at desktop dark, phone light, and narrow-phone dark. Representative committed frames were cropped from settled full-page screenshots; direct locator screenshots had a capture-only last-row clipping artifact, not reproduced in full-page images or browser layout tests.
- Independent final static review: no confirmed security or logic blocker; both PRs' intents preserved. Runtime evidence above was executed separately by the parent.
- `git diff --check`: passed. Current-main ancestry check: passed.

## Destinations and limitations

Ten directory entries are retained. Nine destinations returned HTTP 200 with normal HTTPS hostname validation. Textify still failed certificate hostname validation, so it remains visibly labeled `HTTPS pending` without a clickable link. Certificate configuration is outside this portfolio code change.

Physical-phone use, assistive-technology evaluation, and actual 200% browser-chrome zoom are not claimed. Responsive and automated accessibility checks do not replace those checks.

Local full capture/audit/review pack: `/opt/data/personal/portfolio-release-20261005/`. Merge, GitHub Pages deployment, and served-byte verification are read back separately after publication; this preparation record alone does not claim those external effects.
