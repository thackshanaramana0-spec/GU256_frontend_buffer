# README — Thackshana's Frontend Module (GU256)

---

## Repo Structure

```
frontend_gu256/
├── index.html            # Full single-page site, 1009 lines, 10 sections
├── index.css             # Design system + all section styles, 2475 lines
├── index.js              # All interactivity, canvas animations, 1071 lines
├── server.js             # Local Node dev server
├── package.json          # No npm deps — pure vanilla JS
├── generate-manifest.js  # Scans hero-sequence/ and writes manifest.json
├── hero-sequence/
│   ├── manifest.json     # Frame list consumed by index.js
│   └── frame_000 to frame_191 (.webp)  # 192 animation frames
└── ezgif-split.zip       # Source zip the frames were extracted from
```

---

## What the Website Is

A **marketing landing page** for GU256, a proposed unified genomic data standard. The site presents it as a serious technical product with benchmarks, architecture diagrams, and interactive demos. Think Stripe/Vercel-style enterprise SaaS landing page — but for bioinformatics.

---

## How It Looks

- **Theme:** Dark mode only. Deep black (`#05070A`) background with blue (`#3B82F6`) and cyan (`#06B6D4`) as the only accent colors.
- **Typography:** Four-font system — Space Grotesk (brand), Manrope (headings), Plus Jakarta Sans (body), JetBrains Mono (code/terminal).
- **Loading screen:** Full-screen with particle field animation and a progress bar that counts frames being loaded.
- **Hero:** Scroll-driven 192-frame WebP animation plays as you scroll — like a cinematic product reveal. A glassmorphism stats panel floats on the left with benchmark numbers.
- **Navigation:** Sticky transparent header that blurs on scroll + a right-side dot rail that tracks which section you're in.
- **10 content sections:**
  1. Hero (scroll animation)
  2. The Problem (data growth chart + metric cards)
  3. Compression Benchmarks (interactive bar chart, 3 switchable datasets)
  4. Zero-Decompression Search (fake terminal that types out a query result)
  5. Genomic AI (canvas particle animation)
  6. Self-Healing (clickable bit-rot simulator with 64 blocks)
  7. Ecosystem Map (animated SVG node graph)
  8. ARCS Engine (canvas MST graph)
  9. Vision + CTA + Footer

---

## Pros

- Visually impressive for a student/early-stage project — premium dark UI
- Cinematic scroll-driven hero with lerp (smooth interpolation between frames)
- Multiple interactive demos that actually work (benchmark switcher, terminal, bit-rot simulator)
- Clean CSS design system with variables, consistent spacing
- Zero dependencies — pure vanilla HTML/CSS/JS, no framework bloat
- DPR-aware canvas rendering (retina screen support)
- Performance-conscious scroll handling (requestAnimationFrame + ticking flag)
- Responsive media queries at 1200px and 768px

---

## Cons & Faults

**Broken/placeholder links:**
- Every GitHub button links to `https://github.com` (the homepage, not the actual repo)
- Footer links like "Documentation", "Blog", "API Reference", "CLI Interface" all point to `#site-header` — dead ends
- `research@gu256.org` email is a placeholder, domain likely doesn't exist

**Missing mobile nav:**
- At 768px, `main-nav` is hidden with `display: none` but no hamburger menu or replacement was built — navigation completely disappears on mobile

**Canvas API bug:**
- `arcsCtx.strokeStyle = 'var(--accent-blue)'` — CSS variables don't work inside the Canvas 2D API. The ARCS graph canvas renders with no stroke color on this line.

**Missing font:**
- The SVG inside the loading screen uses `font-family="'Outfit', sans-serif"` but Outfit is never imported. It silently falls back to system sans-serif.

**Hero UX problem:**
- Hero section is `height: 400vh` — users must scroll through 4 full screen-heights of animation before reaching any real content. No skip button.
- 192 frames loaded in parallel via 192 separate HTTP requests — memory-heavy, no sprite sheet or video fallback.

**Redundant scroll listeners:**
- 4 separate `window.addEventListener('scroll', ...)` blocks scattered across the JS. Should be unified into one.

**"Impact slider" is not a slider:**
- The section is called `.impact-slider` in CSS and HTML but is just a static CSS grid — no sliding functionality.

---

## AI Slop Assessment

**Verdict: ~65% AI-generated, 35% intentionally designed.**

Signs of AI slop:
- All benchmark numbers are hardcoded and suspiciously clean (`1238×`, `15/15`, `2–4 ms`) — not sourced from real benchmarks
- The CSS comment blocks (`/* 9. Section 1: The Problem Grid */`) are structured exactly how AI models organize code
- CSS header comment says "Inspirations: NVIDIA, Stripe, Apple, Vercel" — a classic AI prompt echo
- The `var(--accent-blue)` canvas bug is a mistake AI models commonly make (not knowing canvas ignores CSS variables)
- The Outfit font reference in SVG is the kind of detail that slips through when code is assembled from multiple AI generations
- Most footer links go nowhere — AI generated the structure but not the destinations

What was clearly designed intentionally:
- The 192-frame scroll sequence (someone sourced/exported these frames manually)
- The font pairing choices are thoughtful
- The 3D CSS layered architecture diagram is non-trivial and works correctly
- The loading screen frame-count preloader is well-implemented
