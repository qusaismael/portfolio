# Human-readable pass — review record

Branch: `ux/human-readable` (worktree `/opt/data/repos/portfolio-readable`).

## Commits

- Original readability diff base: `f995e1cf68a59a4450236e32021faa9db6f9a051` — "fix: restore compact mobile Home photo cards". This commit **is** the compact-card restore and the merge commit for Gate A PR #2.
- Current integrated baseline: `7121ef4341c7bde7ed6e6be65d23f9f62a6954e2` (`origin/main` when integrated on 2026-09-27), including the compact mobile Games-card fix and capture-metric verification.
- Proposed integrated code head: `df9314c` — "test: preserve intentional Games teaser clamp after main merge" (this record rides in the follow-up docs commit).

## Tests actually run (2026-09-27, after final fixes)

| Command | Result |
| --- | --- |
| `node --test tests/unit/*.test.cjs` | 4/4 pass |
| `npm run test:site` | 38/38 pass |
| `flock … test:browser -- tests/browser/readability.spec.cjs --workers=1` | 15/15 pass |
| `flock … test:browser -- tests/browser/design.spec.cjs tests/browser/smoke.spec.cjs --workers=1` | 12/12 pass |
| `npm run build` | clean |

The earlier narrative reported 70 tests (4 unit, 39 site, 27 browser), but the historical table above recorded only 38 site tests. That one-test discrepancy is not used as release evidence. The fresh execution below establishes the verified counts. Browser runs are serialized behind `/opt/data/repos/.site-browser.lock`, one worker.

## Capture evidence

- `preview/readability-before/`: **88/88** fresh baseline captures generated from integrated `origin/main` commit `7121ef4` in an isolated worktree. `preview/readability-after/`: **88/88** captures generated from the integrated readability branch. Each set covers 11 routes × 4 widths × 2 themes.
- Both sets pass `scripts/verify-readability-captures.cjs`: no horizontal overflow, no broken loaded images, no page errors, and PNG dimensions match recorded metrics.
- Comparison pack regenerated after integration: `preview/readability/README.md` — 88 matched current-main/proposed WebP pairs (`scripts/export-readability-review.cjs`, resumable).
- External feeds: the Behold gallery feed fetched live during the after-capture; no feed failure in the recorded run. Failure paths are tested separately (gallery fallback, map-script failure, feed-readiness gating).
- Artifact-size decision: the 176-image WebP pack is **29 MB**, kept **local** (gitignored) as a one-time review pack; only this record is committed.

## Independent review findings — disposition

First batch (deleg_3651a464):

| Finding | Disposition |
| --- | --- |
| [P1] Cache-version change breaks existing suite | Fixed (`ddb8bf9`); cache-key test green |
| [P1] Fact guard omitted education/testimonial attribution | Fixed; `education and testimonial attribution remain intact` green |
| [P2] Destination guard misses header/footer + multi-link cards | Covered by `navigation, footer, and project actions retain distinct links` green |
| [P2] Mobile gallery `.card-title` `.8rem` override | Removed (`ab98e39`) |
| [P2] ClipGuard copy overclaim | Not shipped; copy keeps "built around a simple rule: what you copy **should** stay on your device" |
| Plan's proposed "Explore places →" cue / "the Red Sea" wording | Not applied (see teaser table: other teaser strings were drafted and await sign-off) |
| Egypt photo caption hidden on mobile | Deliberate: part of the compact 88px mobile photo-card form the owner explicitly liked (`f995e1c`); caption stays visible on desktop |
| Mobile-card visual judgment | Checked at 320/390, dark+light: compact form clean, no clipping/overlap; `design.spec.cjs` compact-card tests green |

Second batch (deleg_889401b0 code + visual audit):

| Finding | Disposition |
| --- | --- |
| [P2] Prior review.md falsely claimed teaser strings were originals | **Corrected in this revision** — see the drafted-copy table |
| [P2] `A small fix still counts.` kept against plan; test flipped to match | **Fixed** (`0999db9`): note removed per plan (Task 04 lines 391/408), test asserts the plan's exact expectations, content-contract snapshot updated with a reviewed 1-line diff |
| [P2] Project-copy fixture encodes kept originals for 30-days/rss-ai/token-speed/clipguard | Deliberate preservation: plan's proposed rewrites of owner copy not applied; owner originals kept. Fixture freezes implemented copy; owner can approve plan versions at B1 |
| [P2] About has 4 paragraphs vs plan's 3; interior ledes differ from plan strings | Unapproved drafts — listed for owner sign-off |
| [P3] Duplicate figcaption assertion | Fixed (single assertion; drafted teasers moved to their own honestly-named freeze test) |
| [P3] Readiness test race (300ms heuristic) | Fixed: deterministic promise-gated route |
| [P3] No-clip guard missed job bullets; ellipsis would pass | Fixed: `.experience-entry li` in scope; flat `text-overflow:ellipsis` ban + horizontal `scrollWidth>clientWidth` check on essential text |
| [P3] Gallery `aria-label` ignored visible caption (WCAG 2.5.3) | Fixed (`6afc2b4`): accessible name = visible label, verified by new test |
| [P3] Article nav landmark duplicated its heading | Fixed: `aria-label="Article sections"`; visible heading "In this article" stays |
| [Visual] Two typos in kernel-panic article ("a your", "memroy") | **Not fixed** — article bodies are frozen published copy; owner decision (below) |
| [Visual] About Education→Training gap "noticeably larger" | **False lead, dismissed with evidence**: DOM geometry at 390px shows all four section gaps exactly 77px (38+39 around each border); pixel-band scan agrees (heading-to-heading 115–119px, uniform) |
| [Visual] Work light-theme labels/tags "borderline contrast" | **False lead, measured**: `#6c5a49` on `#fffdf8` = **6.47:1**, passes WCAG AA for small text |
| [Visual] Photos at 320 = long single-column scroll | Deliberate (visible captions need full width). Option: 2-up at ≤320 — owner taste question (below) |

## Copy changes on the branch (all pending owner sign-off)

**Drafted (originals frozen in `tests/site/readability.test.cjs` comments and the baseline commit):**

| Location | Drafted | Was |
| --- | --- | --- |
| Home travel teaser title | `Places I've been.` | `A little further from home.` |
| Home travel teaser note | `Jordan, Istanbul and Egypt.` | `From Amman's hills to a week in Istanbul. The places, and the bits I remember.` |
| Home photos teaser note | `Trips and graduation, from my camera roll.` | `Graduation, trips, and whatever made it onto my Instagram.` |
| Home photos teaser action | `View photos →` | `Take a look around →` |
| About opening | 4 paragraphs, first one rewritten (`I work in privacy and GRC…`) | plan's exact 3-paragraph replacement not fully applied |
| Interior ledes (/sites/, /blog/, /life/, /photos/, /connect/) | shortened drafts on each page | longer originals |
| Gallery failure message | `The gallery could not load. You can still view the photos on Instagram.` | longer variant |

**Kept-original (deliberately unchanged):** figcaption `One room. A lot of freshmen. One piece of advice.`, `Explore my map →` action, `The camera roll.` title, project descriptions for 30-days/rss-ai/token-speed/clipguard, all article bodies, all experience/games/site data.

**Removed per plan:** blog/projects eyebrow preambles, contributions eyebrow + `A small fix still counts.`, Games margin-note, About throat-clearing, experience tabs (visible job stories instead).

## Owner decisions still open

1. **Two typos in the kernel-panic article body** (`src/_data/writing.json`): "a direct threat to **a your** workflow" (extra "a") and "Cannot allocate **memroy**". Bodies are frozen by policy — say the word and I'll fix exactly these two tokens, nothing else.
2. **Teaser drafts above** — approve, or send any row back to its original (one command each).
3. **Photos at 320:** keep single-column or go 2-up?

## Gates

- **B1 (Home/Work/one project)** — pending owner: does the shorter copy still sound like Qusai? More modern without losing the warm theme? Compact side-by-side mobile photo cards unchanged? Prototype caveats visible in a short scan?
- **B2 (About/reading/Life/Photos)** — pending owner. Automated/manual checks green: ten-second scan, five-second scan, article measure + outlines, JS-off readability, failure fallbacks, print (About + Resume), no new animations. **Not verifiable here:** real phone, actual 200% browser zoom, on-device keyboard walkthrough.

## Historical release state (2026-09-27)

PR #2 (https://github.com/qusaismael/portfolio/pull/2) was merged at `2026-09-27T07:22:57Z`; it contains Gate A, not this readability branch. This branch was published as **draft PR #3** (https://github.com/qusaismael/portfolio/pull/3). CI run [36322754699](https://github.com/qusaismael/portfolio/actions/runs/36322754699) passed. At that time the branch was unmerged and deployment awaited owner approval.

## Release authorization and fresh verification (2026-10-05)

After being told that PRs #3 and #4 were the remaining unpublished-to-production work, the owner instructed: **“continue on doing it all in the best way”**. This authorizes completing review, integration, merge, and deployment of the existing proposals; it supersedes the pending release/copy gates above. The implemented teaser drafts and single-column phone Photos layout are retained. Published article bodies, facts, quotations, and destinations remain frozen; the two article typos are not silently rewritten.

Fresh verification at application head `20212dc7f5e79e672b983bbfe9b127e21b18d322`, against current-main baseline `7121ef4341c7bde7ed6e6be65d23f9f62a6954e2`:

- `npm run build`: passed.
- `npm test`: **4/4** unit tests passed.
- `npm run test:site`: **39/39** site tests passed.
- Browser readability suite: **15/15** passed; design + smoke: **12/12** passed. Total: **70 tests, 0 failures**.
- **88 baseline + 88 proposed** screenshots regenerated across 11 routes, 320/390/1024/1440px, and both themes. Exact key/count and PNG geometry checks passed, with no recorded overflow, broken loaded images, or page errors. Proposed Photos captures waited for feed readiness; baseline has the older capture harness. Live external content is not claimed to be pixel-identical.
- Representative matched Home/Work/article screenshots and About/Life/Photos theme captures visually inspected, with no confirmed visual breakage.
- **24 axe WCAG A/AA scans** across six changed routes, 390/1440px, and both themes: no detected violations. Keyboard mobile-menu Enter/Escape and theme-toggle checks passed.
- Independent read-only review of all 42 changed files: no confirmed security/logic blocker; protected data/facts/quotes/destinations preserved. Historical test-count inconsistency clarified above. A broader rendered-article DOM guard remains a nonblocking test-hardening suggestion, not evidence of lost content.
- Real physical-phone use, assistive-technology evaluation, and actual 200% browser chrome zoom are **not claimed**. Responsive browser automation is not a substitute for those checks.

Local comparison/audit artifacts: `/opt/data/personal/portfolio-release-20261005/`. GitHub PR state and deployment are verified separately after publication; this preparation record does not itself claim a merge or live release.
