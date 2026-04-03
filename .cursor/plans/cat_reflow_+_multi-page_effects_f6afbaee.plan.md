---
name: Cat Reflow + Multi-Page Effects
overview: Replace the 3 orbs with an ASCII cat obstacle in the editorial reflow, add community-inspired effects to all pages (404 particle text, portfolio timeline cascade, recommendation tight-wrap quotes, photo caption wave, blog card height prediction), and keep the existing particle Q and heading cascade.
todos:
  - id: cat-reflow
    content: "Replace 3 orbs with ASCII cat obstacle in initEditorialReflow: rectangular bounding box, walk animation, settle, mouse push, canvas-drawn sprite"
    status: completed
  - id: 404-particles
    content: "New init404Particles: particle spring physics on '404' text in .error-container h1, same pattern as particle Q"
    status: completed
  - id: timeline-cascade
    content: "New initTimelineCascade: spring-cascade on .timeline-title elements in portfolio, staggered by entry"
    status: completed
  - id: tight-quotes
    content: "New initTightQuotes: binary-search tight-wrap on recommendation quote paragraphs"
    status: completed
  - id: caption-wave
    content: "New initCaptionWave: one-shot sine-wave entrance on .photo-quote elements"
    status: completed
  - id: blog-accordion
    content: "Enhance initNoShiftLoading: predict card heights post-load, smooth max-height transition entrance"
    status: completed
  - id: css-polish
    content: Add CSS for new effects (.pretext-404-canvas, .pretext-caption-char, .pretext-card-measured, reduced-motion)
    status: completed
isProject: false
---

# Cat Reflow + Multi-Page Creative Effects

## Change 1: Cat replaces orbs in editorial reflow (index `#about`)

The `layoutNextLine()` reflow engine stays -- it is the showstopper. But the 3 generic circles become a single ASCII cat that walks across the section and text parts around it.

**In `initEditorialReflow` in [pretext-effects.js](pretext-effects.js):**

- Remove the 3 `orbs` array and all circular intersection math
- Add a single `cat` object with: `{ x, y, vx, width: ~90, height: ~48, settled: false }`
- The cat walks from left to right across the section at a gentle pace
- Render the cat as ASCII art on the same canvas (`fillText` the 3-line sprite: `/\_/\`, `( o.o )`, `> ^ <` alternating feet)
- For text reflow, the cat is a **rectangular** obstacle instead of circular: if a line's y-range overlaps the cat's y-range, subtract the cat's x-range from available width (simpler math than circles -- just interval clamping)
- When the cat reaches ~78% across, it settles: switches to sitting sprite (`( -.- )`, `z z z`), stops moving, text stays reflowed around it permanently
- Mouse still pushes the cat (nudge velocity on proximity) -- the cat drifts and text reflows in real time

**The interval math change** (current circle code at lines 301-314 of [pretext-effects.js](pretext-effects.js)):

```js
// Before: circle intersection per orb
const dy = lineMid - o.y;
if (Math.abs(dy) >= o.r) continue;
const half = Math.sqrt(o.r * o.r - dy * dy);

// After: simple rectangle test for cat
if (lineMid < cat.y || lineMid > cat.y + cat.height) continue;
slotL/slotR clamped by [cat.x, cat.x + cat.width]
```

## Change 2: 404 particle text (404.html)

Inspired by **Typographic ASCII Art** demo. The "404" heading becomes a particle field.

**New function `init404Particles(P)` in [pretext-effects.js](pretext-effects.js):**

- Targets `.error-container h1` (the big "404")
- Same particle approach as the header Q: sample "404" on offscreen canvas, bright pixels become spring-physics particles
- Characters from the density ramp fill the shape
- Mouse repels particles, they spring back
- On a page with almost no other content, this single effect is dramatic
- One rAF loop, pauses off-screen (though 404 is always visible, the pattern stays consistent)
- The original `h1` text is hidden via CSS class, canvas overlays it

## Change 3: Portfolio timeline cascade

**New function `initTimelineCascade(P)` in [pretext-effects.js](pretext-effects.js):**

- Targets `.timeline-entry-container` elements on portfolio.html
- On scroll-into-view (IntersectionObserver), the `.timeline-title` text does the same spring-cascade animation as `h2` headings
- Staggered by entry: each timeline block's title cascades 100ms after the previous
- One-shot animation, stops after settle (< 1 second per heading)
- Uses existing `charWidth()` cache and spring physics from `initCharCascade`

## Change 4: Recommendation tight-wrap quotes

Inspired by **Tight Chat Bubbles** demo -- binary search for minimum width that keeps same line count.

**New function `initTightQuotes(P)` in [pretext-effects.js](pretext-effects.js):**

- Targets `.recommendation-item p` and `.recommendation-content p` on recommendations.html
- For each quote paragraph:
  1. `prepare()` the text
  2. `layout()` at current width to get `lineCount`
  3. Binary search (like existing `binaryTighten`) to find the tightest width that preserves that line count
  4. Apply as `max-width` with a CSS class for a subtle inset effect
- One-shot on load, recalculates on resize
- Makes quote blocks look intentionally typeset rather than ragged

## Change 5: Photo caption wave

Inspired by **Text Flow Animation** and the old footer wave (but done right).

**New function `initCaptionWave(P)` in [pretext-effects.js](pretext-effects.js):**

- Targets `.photo-quote` elements on photos.html
- On scroll-into-view, split quote text into Pretext-measured `<span>`s
- Brief sine-wave entrance: characters arrive with staggered vertical offset, settle to 0 over 0.8s
- NOT a permanent animation -- just a one-shot entrance wave, then spans go static
- Lightweight: no rAF after settle

## Change 6: Blog card height prediction

Inspired by **Variable-Height Virtual Scroll** and **Accordion Heights** demos.

**Enhance existing `initNoShiftLoading` in [pretext-effects.js](pretext-effects.js):**

- After Medium posts load (MutationObserver already watches), measure each `.blog-post` card's text using `prepare()` + `layout()` to predict content height
- Apply smooth CSS `max-height` transition from the predicted height, creating an accordion-style entrance rather than a hard pop-in
- Add `.pretext-card-measured` class with `transition: max-height 0.4s ease`

## What stays unchanged

- **Particle Q** (header) -- already working and performant
- **Heading cascade** (h2 on all pages) -- already works site-wide
- **Balanced text** -- practical, runs everywhere
- **Tight blog headlines** -- practical
- **No-shift loading** -- enhanced, not replaced

## Performance notes

- The cat reflow is **lighter** than 3 orbs: 1 rectangular obstacle vs 3 circular ones, simpler intersection math
- 404 particles only run on the 404 page (no other rAF loops on that page)
- Timeline cascade, tight quotes, caption wave are all **one-shot** (no permanent loops)
- Blog height prediction is one-shot with transition

## Files changed

- [pretext-effects.js](pretext-effects.js) -- modify `initEditorialReflow` (cat replaces orbs), add `init404Particles`, `initTimelineCascade`, `initTightQuotes`, `initCaptionWave`, enhance `initNoShiftLoading`
- [style.css](style.css) -- add `.pretext-404-canvas`, `.pretext-caption-char`, `.pretext-card-measured` styles; update reduced-motion rules

