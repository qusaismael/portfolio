---
name: Creative Pretext Upgrade
overview: Rewrite the ASCII Q to be fully animated with scramble/glitch/mouse effects, add an ASCII cat that walks across sections and bats at text using Pretext reflow, add scroll-triggered heading scramble reveals, a footer wave animation, and magnetic hover typography on cards.
todos:
  - id: animated-q-v2
    content: Rewrite initAsciiQ with scramble entrance, mouse proximity glow, periodic glitch pulses, higher opacity, and breathing animation
    status: completed
  - id: cat-disruptor
    content: "Build initCatDisruptor: ASCII cat walks across #about, reflows text around itself with layoutNextLine(), bats at characters, settles down"
    status: completed
  - id: heading-scramble
    content: "Build initHeadingScramble: scroll-triggered h2 character scramble using prepareWithSegments for fixed-width spans"
    status: completed
  - id: footer-wave
    content: "Build initFooterWave: continuous sine-wave character animation on footer title with Pretext-measured widths"
    status: completed
  - id: magnetic-titles
    content: "Build initMagneticTitles: mouse-proximity character displacement on project card titles"
    status: completed
  - id: css-and-markup
    content: Add all CSS for new features and the cat layer div in index.html
    status: completed
isProject: false
---

# Creative Pretext.js Upgrade -- Phase 2

All changes live in `[pretext-effects.js](pretext-effects.js)` and `[style.css](style.css)`. No new HTML files needed; only a small markup addition in `[index.html](index.html)` for the cat container. Every feature is progressive enhancement and respects `prefers-reduced-motion`.

---

## 1. Animated Q v2 (rewrite `initAsciiQ`)

Current state: faint static characters with a barely visible wave. Boring.

New behavior (rewrite the function entirely in `[pretext-effects.js](pretext-effects.js)` lines 53-188):

- **Scramble entrance** -- All cells start as random characters from the density ramp. Over ~2.5 seconds they resolve one-by-one into the correct Q shape (center-out radial order). Creates a "decrypting" feel.
- **Mouse proximity glow** -- Track mouse position over the header. Characters within ~80px of the cursor get 3x brighter and cycle through random characters rapidly, creating a "flashlight revealing code" effect.
- **Periodic glitch pulses** -- Every ~4 seconds, a random cluster of 8-15 cells briefly flicker to different characters for 200ms then snap back. Gives it life.
- **Higher visibility** -- Bump max opacity from 0.11 to 0.18. The effect should be *seen*, not guessed at.
- **Breathing** -- Slow sinusoidal opacity modulation radiating from center (already partially there, but make it more pronounced).

---

## 2. ASCII Cat Text Disruptor

The centerpiece new feature. A small ASCII cat walks across the `#about` section and physically disrupts the text.

**Cat rendering:**

- A `<canvas>` element positioned absolutely inside `#about`
- The cat is a small ASCII sprite (~6 chars wide): idle `=^..^=`, walking cycle alternates between `/\_/\` frames
- Drawn on canvas using `fillText` with Pretext-measured character widths for precise positioning

**Walk cycle:**

- Triggered when user scrolls `#about` into view (IntersectionObserver)
- Cat enters from the left edge, walks across the section width over ~8 seconds
- While walking, text in the `#about` paragraphs reflows around the cat using `layoutNextLine()` with a variable-width exclusion zone (the cat's bounding box)
- The exclusion zone is a rectangular area around the cat's current position
- As the cat moves past each line, that line's width narrows then expands back

**Text batting:**

- At 2-3 random points during the walk, the cat "bats" at the text
- A "paw swipe" animation: 3-5 characters near the cat's paw position fly outward (CSS-animated absolutely-positioned spans) then float back after 600ms
- Character positions for the swipe are calculated using `walkLineRanges()` to know exactly which characters are at the cat's x-position

**Settling:**

- When the cat reaches ~80% across, it sits down (changes to idle sprite), curls up, and stays
- A tiny `zzz` appears above it using canvas fillText
- The text around it remains slightly reflowed (a small permanent indent) so the cat "lives" in the text

**Files:** New function `initCatDisruptor(P)` in `[pretext-effects.js](pretext-effects.js)`. Add a `<div id="pretext-cat-layer">` in `#about` section in `[index.html](index.html)`. CSS in `[style.css](style.css)` for the layer positioning.

---

## 3. Section Heading Scramble Reveal

Every `h2` on the page gets a scroll-triggered text scramble effect.

- When an `h2` scrolls into view (IntersectionObserver, threshold 0.3), its text content scrambles
- Using `prepareWithSegments()`, measure the exact width of each character
- Replace the `h2` innerHTML with individual `<span>` elements, one per character
- Each span starts showing a random character, then resolves to the real character over 40-80ms staggered delay (left-to-right with slight randomness)
- The key Pretext.js role: because this is a proportional font, each character has a different width. The span widths are set to the *target* character's measured width (via Pretext), so the text never shifts or reflows during the scramble -- it holds its final layout from frame one
- Only triggers once per element (track with `data-pretext-revealed`)

**Files:** New function `initHeadingScramble(P)` in `[pretext-effects.js](pretext-effects.js)`.

---

## 4. Footer Wave Text

The `qusai.pro` footer title gets a continuous character wave.

- On page load, split "qusai.pro" into individual `<span>` elements
- Each span gets a vertical offset animated by a sine wave: `translateY(sin(time + charIndex * 0.4) * 3)px`
- Pretext.js measures each character's width so spans are positioned with pixel-perfect spacing (no gaps or overlaps in proportional font)
- Subtle: only 3px amplitude, slow speed
- `requestAnimationFrame` loop, paused when footer is not visible (IntersectionObserver)

**Files:** New function `initFooterWave(P)` in `[pretext-effects.js](pretext-effects.js)`, CSS for `.pretext-wave-char` spans.

---

## 5. Magnetic Hover Typography

When hovering over project card titles (`.project-header h3`), characters magnetically spread from the cursor.

- On mouseenter, split the title into per-character `<span>` elements (widths measured by Pretext)
- On mousemove, for each character span, compute distance from cursor
- Characters within ~60px shift away from cursor (up to 2px displacement)
- Creates a subtle "magnetic repulsion" that makes the text feel alive
- On mouseleave, all characters animate back to origin
- Restore original innerHTML on mouseleave for clean DOM

**Files:** New function `initMagneticTitles(P)` in `[pretext-effects.js](pretext-effects.js)`, CSS for `.pretext-mag-char` spans.

---

## Summary of Changes

`**[pretext-effects.js](pretext-effects.js)`** -- Rewrite/add 5 functions:

- `initAsciiQ` -- complete rewrite with scramble/glitch/mouse/breathing
- `initCatDisruptor` -- new, the cat feature
- `initHeadingScramble` -- new, scroll-triggered h2 scramble
- `initFooterWave` -- new, footer character wave
- `initMagneticTitles` -- new, hover effect on card titles
- Update `initCreativeShell` to call all five new functions

`**[index.html](index.html)**` -- Add `<div id="pretext-cat-layer"></div>` inside `#about` section

`**[style.css](style.css)**` -- Add styles for:

- `#pretext-cat-layer` positioning
- `.pretext-wave-char` footer wave spans
- `.pretext-mag-char` magnetic hover spans
- `.pretext-scramble-char` heading scramble spans
- `.pretext-bat-char` flying character animation keyframes

