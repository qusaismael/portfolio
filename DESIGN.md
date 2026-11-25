---
version: alpha
name: Quiet Edition — Editorial Monograph
description: Warm espresso-and-paper editorial portfolio system for qusai.pro. Fraunces display voice, self-hosted IBM Plex prose and monospace, one warm signal accent, hairline rules over elevation.
colors:
  primary: "#FAF0E6"
  secondary: "#E8DFD0"
  muted: "#BFB09B"
  background: "#1A0F0A"
  surface: "#271912"
  surface-elevated: "#342319"
  border: "#4F382A"
  accent: "#F0A36B"
  signal: "#FF8A4C"
  light-primary: "#28180F"
  light-secondary: "#33251B"
  light-muted: "#6C5A49"
  light-background: "#FAF7F1"
  light-surface: "#FFFDF8"
  light-surface-elevated: "#EEE5D8"
  light-border: "#D9C9B6"
  light-accent: "#B0401C"
  light-signal: "#C8451B"
typography:
  hero:
    fontFamily: Fraunces
    fontSize: 6.5rem
    fontWeight: 480
    lineHeight: 0.94
    letterSpacing: "-0.05em"
    fontVariation: '"SOFT" 45, "opsz" 144'
  h1:
    fontFamily: Fraunces
    fontSize: 5.25rem
    fontWeight: 480
    lineHeight: 1.02
    letterSpacing: "-0.045em"
    fontVariation: '"SOFT" 40, "opsz" 96'
  h2:
    fontFamily: Fraunces
    fontSize: 2.5rem
    fontWeight: 500
    lineHeight: 1.12
    letterSpacing: "-0.03em"
  h3:
    fontFamily: Fraunces
    fontSize: 1.75rem
    fontWeight: 540
    lineHeight: 1.25
    letterSpacing: "-0.02em"
  lede:
    fontFamily: Fraunces
    fontSize: 1.5rem
    fontWeight: 380
    lineHeight: 1.45
    letterSpacing: "-0.01em"
  body:
    fontFamily: IBM Plex Sans
    fontSize: 1rem
    fontWeight: 400
    lineHeight: 1.7
  article:
    fontFamily: IBM Plex Sans
    fontSize: 1.1875rem
    fontWeight: 400
    lineHeight: 1.75
  meta:
    fontFamily: IBM Plex Mono
    fontSize: 0.8125rem
    fontWeight: 400
    lineHeight: 1.6
    letterSpacing: "0.02em"
rounded:
  frame: 4px
  pill: 999px
spacing:
  xs: 4px
  sm: 8px
  md: 16px
  lg: 24px
  xl: 48px
  section: 80px
components:
  button-primary:
    backgroundColor: "{colors.primary}"
    textColor: "{colors.background}"
    rounded: "{rounded.pill}"
    padding: 12px
  button-primary-hover:
    backgroundColor: "{colors.signal}"
    textColor: "{colors.background}"
    rounded: "{rounded.pill}"
    padding: 12px
  button-primary-light:
    backgroundColor: "{colors.light-primary}"
    textColor: "{colors.light-background}"
    rounded: "{rounded.pill}"
    padding: 12px
  button-primary-light-hover:
    backgroundColor: "{colors.light-signal}"
    textColor: "{colors.light-background}"
    rounded: "{rounded.pill}"
    padding: 12px
  button-secondary:
    backgroundColor: "{colors.background}"
    textColor: "{colors.secondary}"
    rounded: "{rounded.pill}"
    padding: 12px
  button-secondary-light:
    backgroundColor: "{colors.light-background}"
    textColor: "{colors.light-secondary}"
    rounded: "{rounded.pill}"
    padding: 12px
  surface-panel:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.secondary}"
    rounded: "{rounded.frame}"
    padding: 24px
  surface-panel-light:
    backgroundColor: "{colors.light-surface}"
    textColor: "{colors.light-secondary}"
    rounded: "{rounded.frame}"
    padding: 24px
  input-control:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.secondary}"
    rounded: "{rounded.frame}"
    padding: 12px
  input-control-light:
    backgroundColor: "{colors.light-surface}"
    textColor: "{colors.light-secondary}"
    rounded: "{rounded.frame}"
    padding: 12px
  filter-tab:
    backgroundColor: "{colors.background}"
    textColor: "{colors.muted}"
    rounded: "{rounded.frame}"
    padding: 10px
  filter-tab-active:
    backgroundColor: "{colors.background}"
    textColor: "{colors.primary}"
    rounded: "{rounded.frame}"
    padding: 10px
  filter-tab-light:
    backgroundColor: "{colors.light-background}"
    textColor: "{colors.light-muted}"
    rounded: "{rounded.frame}"
    padding: 10px
  filter-tab-active-light:
    backgroundColor: "{colors.light-background}"
    textColor: "{colors.light-primary}"
    rounded: "{rounded.frame}"
    padding: 10px
---

## Overview

**Quiet Edition — Editorial Monograph** is the visual and architectural design system for `www.qusai.pro`. It pairs the warmth of an independent print monograph with the restraint of a privacy-first engineering site: zero frameworks, zero runtime third-party font or photo CDNs, full readability with JavaScript disabled, and one unmistakable visual identity shared across dark and light modes.

Every route commits to a clear surface role before styling:

- **Home (`/`)** — Decide / Learn: a composed hero cover, an asymmetric lead case-study spread, three secondary works, recent notes, verified open-source contributions, personal previews, and direct contact.
- **Work (`/sites/`)** — Explore + Decide: asymmetric lead feature + balanced 3-up grid for featured case studies, hairline index for web tools, and two-column live subdomain directory.
- **Writing (`/blog/`, `/writing/*`)** — Explore + Learn: two-column date/title editorial ledger with hairline topic tabs, Atom feed (`/feed.xml`), and long-form reading layout with scroll-tracking sticky outline.
- **About & Résumé (`/portfolio/`, `/resume/`)** — Learn / Document: open chronological narratives and a print-grade résumé obeying paper typography discipline.
- **Life, Games & Photos (`/life/`, `/games/`, `/photos/`)** — Explore: warm globe with expressive per-country wall typography, filterable games shelf, and static local photo archive.
- **Explore & Terminal (`/explore/`, `terminal.njk`)** — Command / Inspect: instant full-site search and bounded keyboard shortcut shell.

## Colors

One warm earth palette anchors both themes; never introduce cool blue-gray, violet, or neon accents.

- **Dark theme (default)**: Deep espresso ground (`#1A0F0A`), roasted umber cards (`#271912`), subtle hover/mat surface (`#342319`), `1px` cocoa hairlines (`#4F382A`), warm ivory headings (`#FAF0E6`), cream body text (`#E8DFD0`, 13.7:1 on `#1A0F0A`), stone-tan muted metadata (`#BFB09B`, 8.6:1 on `#1A0F0A`), warm apricot accent (`#F0A36B`), and burnt-ember signal (`#FF8A4C`, 8.3:1 on `#1A0F0A`).
- **Light theme (`[data-theme="light"]`)**: Warm linen paper (`#FAF7F1`), cream-white elevated surface (`#FFFDF8`), warm parchment secondary (`#EEE5D8`), sand hairlines (`#D9C9B6`), espresso ink headings (`#28180F`), dark walnut body (`#33251B`, 13.9:1 on `#FAF7F1`), warm umber muted text (`#6C5A49`, 6.2:1 on `#FAF7F1`), terracotta accent (`#B0401C`), and kiln-clay signal (`#C8451B`, 4.9:1 on `#FAF7F1`).
- **Accent discipline**: `--signal` has three earned jobs: the page-title full stop (`.page-heading h1 .accent-dot`, `.brand-mark > span`), active navigation/tab underlines and reading progress, and interactive hover/focus emphasis. Section headings (`h2 .accent-dot`) stay plain ink.

## Typography

All typefaces are self-hosted in `src/fonts/` (zero external font requests):

- **Display (`Fraunces`)**: Variable optical serif (`100–900`, normal + italic) with subtle softness (`"SOFT" 45` on hero, `"SOFT" 40` on page H1s) for headings, ledes, pull quotes, and the `QI.` monogram.
- **Body & UI (`IBM Plex Sans` + `IBM Plex Sans Arabic`)**: Humanist-engineered sans unifying `www.qusai.pro` with sibling tools (`grc.qusai.pro`, `clipguard.qusai.pro`, `privacy.qusai.pro`) and providing native Arabic shaping for `القصي` and `توجيهي علمي`.
- **Metadata & Code (`IBM Plex Mono`)**: Reserved strictly for dates, coordinates, reading times, GPG fingerprints, URLs, and the shortcut terminal — never body prose.
- **Country Wall exception (`/life/`)**: Each country retains its bespoke self-hosted display face (`Reem Kufi`, `Duru Sans`, `Almarai`, `Cinzel`, `Big Shoulders Display`, `Jost`, `Playfair Display`, `Zen Old Mincho`) as a single deliberate expressive accent on the travel wall.
- **Measure & scale**: Body `>= 16px` (`1.7` line-height), article prose `19px` (`1.75` line-height, `<= 68ch` / `720px` max width), metadata `>= 13px` (`0.8125rem`).

## Layout

- **Shared edge**: Header, main content container, next-step band, and footer align to a single `min(1120px, calc(100% - 64px))` column (`calc(100% - 40px)` on `<= 767px`, `calc(100% - 32px)` on `<= 374px`).
- **Section rhythm**: Major sections separate via `1px solid var(--border-color)` top rules and `80px` desktop (`56px` mobile) vertical breathing room.
- **Asymmetric work hierarchy**: On desktop (`>= 900px`), the first featured project renders as a full-width two-column lead spread (`1.35fr / 1fr`), while the remaining three featured projects form a balanced 3-column shelf (`>= 1024px`) or 2-column grid (`761px–1039px`), stacking cleanly to 1 column on phones.
- **Compact mobile life previews**: Below `580px`, Home's three "Off the keyboard" cards lock to the signature `88px` side-by-side compact rail (`grid-template-columns: 88px minmax(0, 1fr)`), never clipping descriptions.
- **Touch targets**: Every interactive control, link, and tab exposes a minimum `44px × 44px` hit area.

## Elevation & Depth

Quiet Edition replaces drop shadows, glassmorphism, and backdrop blur with **structural `1px` hairlines** and subtle tonal shifts (`--background-color` → `--card-background` → `--secondary-color`). Depth is reserved exclusively for modal dialogs (`#profile-dialog`, `#memory-dialog`, `#command-dialog`, `#photo-modal`) over dark scrims.

## Shapes

Strictly two border radii exist across the site:

- **Frames & controls (`--radius-frame: 4px`)**: Media previews, photos, inputs, selects, panels, status boxes, and dialogs.
- **Primary actions (`--radius-pill: 999px`)**: `.button` CTAs and the header `Say hi ↗` action.
- **Portrait exception**: Circular (`50%`) on Home and Contact identity lockups; `4px` editorial frame on About.

## Components

- **Navigation**: Sticky `76px` desktop (`64px` mobile) header with subtle `2px` signal scroll-progress hairline and bottom-bar active indicator (`aria-current="page"`).
- **Hairline Filter Tabs**: Borderless bottom-rule tabs on `/blog/` (mirroring `#main-nav` underlines) with `aria-live="polite"` result announcements and URL query sync (`?topic=`).
- **Lead Project Spread & Cards**: Open borderless editorial layout — 16:9 media frame, eyebrow type label, Fraunces title, honest caveat note, and plain text action links. Zero card hover lift or drop-shadow animations.
- **Print Résumé (`/resume/`)**: Clean white paper (`#FFF` / `#111`), thin `#AAA` horizontal rules, zero pill badges or decorative callouts, `break-inside: avoid` per entry.
- **Warm Globe (`/life/`)**: Both WebGL COBE and Canvas 2D fallback share the warm espresso / linen + apricot / signal palette and sync live on theme toggle.

## Do's and Don'ts

- **Do** establish hierarchy through Fraunces scale, italic contrast, whitespace, and hairline rules before adding boxes or borders.
- **Do** keep every page readable and navigable with JavaScript disabled; JS enhances filters, search, lightboxes, scroll-spy, and the globe.
- **Do** state limitations honestly in plain text (`Research prototype`, `Self-assessment only`) rather than marketing hype or colored status badges.
- **Don't** introduce indigo/violet gradients, glassmorphic `backdrop-filter` cards, left-border callout stripes, or icon-topper feature tiles.
- **Don't** add third-party font CDNs, external image feeds, or analytics scripts at runtime.
- **Don't** hide essential copy behind hover overlays or CSS line-clamping (`-webkit-line-clamp` / `text-overflow: ellipsis`).
