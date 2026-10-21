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
Light theme:
- Background:        #F6F3EC  (warm cream, so white cards lift off it)
- Surface (cards):   #FFFFFF
- Headings (ink):    #1F1D1A  (warm near-black, not pure black)
- Body text:         #2B2824
- Muted text:        #5C574F  (passes AA on cream)
- Borders/hairlines: #E6E1D6
- Accent:            #C25E33  (burnt terracotta — the ONE accent. Large text, icons, marks,
                     decorative lines only: it fails AA for small text)
- Accent text/hover: #A8481F  (terracotta that passes AA for small text on light)
- Accent on dark:    #D97A52
Dark contrast sections (inset dark panels and the footer):
- Panel:             #23211D, panel text #F4F1EA
- Footer:            #1A1A1A
Dark mode exists (toggle + system preference): warm near-black #161412 with the same
terracotta family. Keep the two dark-mode token blocks identical.
No second accent colour. Success/error colours are for form states only.

## Typography
- Display / headings: a refined serif — use "Fraunces" (Google Fonts), weights 400 & 600.
- Body / UI:          a clean grotesque sans — use "Inter Tight" or "Plus Jakarta Sans"
                      (Google Fonts) for body, weights 400 & 500. (NOT plain Inter.)
- Type scale (desktop): h1 ~3.9rem, h2 ~2.875rem, h3 ~1.4rem, body 1.0625rem, small 0.875rem.
- Generous line-height on body (1.6). Tight line-height on large headings (1.05–1.15).
- Letter-spacing: slightly negative on big serif headings (-0.02 to -0.025em). Small uppercase
  eyebrow labels can use +0.12em tracking.

## Layout & spacing
- Max content width ~1100px, centred, with comfortable side padding (clamp for mobile).
- Use a consistent spacing scale: 8, 16, 24, 40, 64, 96, 128px. Sections breathe — big
  vertical rhythm (96–128px between major sections on desktop).
- Mobile-first and fully responsive. Test single-column down to 360px.
- Vary section layouts — do NOT make every section a centred hero. Mix: full-width hero,
  asymmetric two-column, a horizontal scroll or grid for work, an offset about section.

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
- Buttons: solid near-black pill primary with off-white text; ghost/outline pill
  secondary. Show them as a pair where it makes sense. Subtle hover (darken or lift).
- Cards (work items): image-led, real client screenshots in a browser frame, minimal
  text, hover reveals a small "View" cue. Consistent aspect ratios.
- Links in body: terracotta (--accent-hover), underline on hover.
- Eyebrow labels: small, uppercase, tracked, terracotta, above section headings.
- Show, don't describe: put real work and real artefacts next to claims. Never invent
  dashboards, stats or results.

## Voice & tone (for copy)
Confident, plain-English, warm but professional. Short sentences. Speak to a busy
small-business owner, not a designer. Benefit-led ("Get found by local customers"),
not feature-led ("Responsive HTML5"). British English spelling.

## Accessibility
Semantic HTML5 landmarks. Alt text on all images. Colour contrast AA minimum (check
terracotta on cream for small text — use #A8481F or near-black for small text, reserve #C25E33 for large text and accents).
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
