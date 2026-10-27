# CLAUDE.md — ISKO Studio Website

This file defines the design system and rules for building the iskostudio.com website.
Follow it on every decision. Do not deviate from the palette, type, or spacing without being asked.

## What this is
A portfolio/marketing site for ISKO Studio — a web design studio that builds clean,
modern websites for small local businesses (beauty, clinics, cafés, trades, any niche).
Built with plain semantic HTML + CSS (minimal vanilla JS), deployed on GitHub Pages.
No frameworks, no build step, no Tailwind. Keep it lightweight and fast.

## Design principle
Minimal, monochrome, confident. The studio's own design is restrained so the CLIENT
work shown on the page provides the colour and personality. Let whitespace and
typography do the work. Avoid the generic "AI website" look: no default blue (#3b82f6),
no Inter-everywhere, no identical rounded cards, no gratuitous gradients, no emoji icons. No multi-colour accents.

## Colour palette (source of truth: the tokens at the top of css/style.css)
Black and white. The page is pure white with neutral greys and near-black ink, so the client
work shown on it brings the colour. Deliberately NOT warm cream/off-white paper (that reads as
the generic "AI assistant" look). The only colour is the green dot in the logo: it is for Isko,
the friend the studio is named after, and the forests of Pilar, Abra, in the Philippines where
we grew up. Nothing else on the site is green.
Light theme:
- Background:        #FFFFFF
- Surface (cards):   #F4F4F5  (one tone step below the page)
- Ink (headings, buttons, the accent): #0A0A0A
- Body text:         #1C1C1E
- Muted text:        #5F5F66  (6.3:1 on white, 5.8:1 on card grey)
- Borders/hairlines: #E4E4E7
- Tint (bands):      #F4F4F5
- Logo dot:          #1F5C45 forest green on light, #7CC7A0 leaf green on dark (tokens --dot, --dot-on-dark)
Dark contrast sections: panel #161616, panel text #F5F5F5; footer #0A0A0A.
Dark mode exists (toggle + system preference): page #0A0A0A, ink #F5F5F5, leaf-green logo dot.
Keep the two dark-mode token blocks identical.
The ISKO logo is the nav wordmark: "ISKO." in Fraunces 600 (the only place Fraunces is used;
the page loads just those five characters), dot in green. The favicon and apple-touch-icon use
the same Fraunces letters (as outlines) with the green dot centred UNDERNEATH. logo.png and
og-image use "ISKO." with the green dot beside it, like the nav.
No accent colour beyond ink. Success/error colours are for form states only.

## Typography
- One family: "Schibsted Grotesk" (Google Fonts, variable 400–800), chosen with the
  design-taste-frontend skill's type system for this direction.
- Display (hero, section titles, prices): weight 800, tracking -0.04 to -0.045em, leading ~1.
- Smaller headings (h3): weight 700, tracking -0.03em. Body: weight 400, line-height 1.6.
- Type scale (desktop): h1 ~3.8rem (two lines down to tablet width), h2 ~3rem, h3 ~1.4rem,
  body 1.0625rem, small 0.875rem.
- No serif, no monospace, no italics in running copy. The logo is the only exception (Fraunces).
- Headlines are one colour: no coloured, underlined or italic accent word.

## Layout & spacing
- Max content width ~1100px, centred, with comfortable side padding (clamp for mobile).
- Use a consistent spacing scale: 8, 16, 24, 40, 64, 96, 128px. Sections breathe — big
  vertical rhythm (96–128px between major sections on desktop).
- Mobile-first and fully responsive. Test single-column down to 360px.
- Centred spine: the nav is a centred floating capsule, so the hero and every section
  heading (eyebrow, title, lead) are centred to line up with it. Section BODIES still
  vary: asymmetric two-column about, alternating timeline rows, grids for work and pricing.

## Motion
- Subtle and purposeful only. Gentle fade/slide-up on scroll (small distance, ~400ms,
  ease-out). Smooth hover transitions (150–200ms) on links/buttons/cards.
- No bouncing, no parallax overload, no autoplaying carousels. Respect
  prefers-reduced-motion.

## Components
- Shape: everything interactive is a full pill (border-radius 999px): buttons, nav CTA,
  tags, chips. Cards and frames use --radius-card (16px); icon tiles and small floating
  cards --radius-tile (12px); inputs and tiny chips --radius (5px).
- Depth: white cards on cream with a hairline border and the soft, wide --shadow-card;
  --shadow-lift on hover. Nothing harsh.
- Corners: where the browser supports `corner-shape: squircle`, cards and tiles get continuous
  corners with slightly larger radii (set once in the @supports block in style.css).
- Touch: every :hover rule lives inside `@media (hover: hover) and (pointer: fine)`; every
  control has an :active press state; small icon buttons get a 44px hit area.
- Buttons: solid near-black pill primary with off-white text; ghost/outline pill
  secondary. Show them as a pair where it makes sense. Subtle hover (darken or lift).
- Cards (work items): image-led, real client screenshots in a browser frame, minimal
  text, hover reveals a small "View" cue. Consistent aspect ratios.
- Links in body: ink, underline on hover.
- Eyebrow labels: small, uppercase, tracked, ink, above section headings.
- Show, don't describe: put real work and real artefacts next to claims. Never invent
  dashboards, stats or results.

## Voice & tone (for copy)
Confident, plain-English, warm but professional. Short sentences. Speak to a busy
small-business owner, not a designer. Benefit-led ("Get found by local customers"),
not feature-led ("Responsive HTML5"). British English spelling.

## Accessibility
Semantic HTML5 landmarks. Alt text on all images. Colour contrast AA minimum (check any
new colour pairing).
Visible focus states. Keyboard navigable.

## Performance
- Optimise/lazy-load images (use width/height attributes, loading="lazy", WebP if possible).
- Load Google Fonts efficiently (preconnect, only the weights listed above).
- Keep JS minimal and defer it.

## Do NOT
- Do not invent fake client logos, fake testimonials, or fake project results.
  Use clearly-labelled placeholders the owner will replace.
- Do not add e-commerce, login, or a CMS unless asked.
- Do not use stock-photo clichés or AI faces.
