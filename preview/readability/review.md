# Human-readable pass — review record

Branch: `ux/human-readable` (worktree `/opt/data/repos/portfolio-readable`).

## Commits

- Baseline (proposed diff base): `f995e1cf68a59a4450236e32021faa9db6f9a051` — "fix: restore compact mobile Home photo cards" (Gate A state the owner approved, minus the mobile photo-card revert).
- Proposed code head: `e56bcc5` — "chore: verify and export readability before/after captures" (this record rides in the next commit).

## Tests actually run (2026-09-27)

| Command | Result |
| --- | --- |
| `node --test tests/unit/*.test.cjs` | 4/4 pass |
| `npm run test:site` | 37/37 pass |
| `flock … npm run test:browser -- tests/browser/readability.spec.cjs --workers=1` | 14/14 pass |
| `flock … npm run test:browser -- tests/browser/design.spec.cjs tests/browser/smoke.spec.cjs --workers=1` | 12/12 pass |
| `npm run build` | clean |

Total: 67 tests, 0 failures. Browser runs serialized behind `/opt/data/repos/.site-browser.lock`, one worker (host memory limits).

## Capture evidence

- `preview/readability-before/` and `preview/readability-after/`: each **88/88** captures (11 routes × 4 widths × 2 themes), verified complete by `scripts/verify-readability-captures.cjs`: no horizontal overflow, no broken loaded images, no page errors, PNG dimensions match recorded metrics.
- Comparison pack: `preview/readability/README.md` — 88 matched before/after WebP pairs (`scripts/export-readability-review.cjs`, resumable).
- External feed status: the Behold gallery feed fetched live during the after-capture (Photos renders its full grid, 4648px desktop height, both identical in both themes). No third-party feed failure was present in the recorded run; gallery/map failure paths are separately tested (`gallery failure explains the next action`, `Life stories stay visible when the map script fails`, `photo feed marks readiness only after a result or fallback`).
- Artifact-size decision: the 176-image WebP pack is **29 MB** and stays **local** (gitignored) as a one-time review pack; only this record is committed. Say the word if you want the pack in the branch.

## Independent review findings (deleg_3651a464) — disposition

| Finding | Disposition |
| --- | --- |
| [P1] Cache-version change breaks existing suite (`content.test.cjs:28-37`) | Fixed in `ddb8bf9`; `changed stylesheets use fresh cache keys…` green |
| [P1] Fact guard omitted education/testimonial attribution | Fixed; `education and testimonial attribution remain intact` green |
| [P2] Destination guard misses header/footer + multi-link project cards | Covered by `navigation, footer, and project actions retain distinct links` green |
| [P2] Mobile gallery `.card-title` `.8rem` override | Removed in `ab98e39`; single-column ≤520px added |
| [P2] ClipGuard copy overclaim | Not shipped: description keeps the qualified "built around a simple rule: what you copy **should** stay on your device" (matches `tests/fixtures/readability-project-copy.json`) |
| "One room… one piece of advice" figcaption setup | Restored in `index.html`; `small personal details survive the editorial cut` green |
| Plan's proposed "Explore places →" cue / "the Red Sea" wording | **Intentionally not applied** — new microcopy needs owner approval; original "Explore my map →" and "Jordan, Istanbul and Egypt." kept |
| Egypt photo caption hidden on mobile | Deliberate: it is part of the compact 88px mobile photo-card form the owner explicitly liked (`f995e1c`); caption stays visible on desktop |
| Mobile-card approval needs visual judgment | Visually checked at 320 and 390 in dark and light (clean, no clipping/overlap; `design.spec.cjs` compact-card tests green) |

## Copy changes proposed (all awaiting owner B1/B2 sign-off)

Home hero + section intros; Work (`/sites/`) intro; About (tabs → visible job stories, less throat-clearing); Life intro + visible place stories/setup notes; Photos intro + hover-free captions + honest gallery failure message; Connect directness; Games margin-note removed; project descriptions + `cardNote` caveats; article standfirsts + section outlines. Originals are recoverable from the baseline commit.

## Gates

- **B1 (Home/Work/one project)** — pending owner. Questions: does the shorter copy still sound like Qusai? More modern without losing the warm theme? Compact side-by-side mobile photo cards unchanged? Can a visitor identify what he does, find work/contact, and see prototype caveats in a short scan?
- **B2 (About/reading/Life/Photos)** — pending owner. Automated/manual checks green: ten-second scan, five-second section scan, article measure + outlines, JS-off readability (all jobs, project status, article links, place stories), gallery/map failure fallbacks, print (About + Resume), no new animations (reduced-motion untouched). **Owner items not verifiable here:** real phone look, actual browser zoom at 200%, keyboard walkthrough on a real device.

## Not deployed

No push, no merge, no live deploy. Live site unchanged. PR #2 (https://github.com/qusaismael/portfolio/pull/2) is still the Gate A draft; this branch is un-pushed.
