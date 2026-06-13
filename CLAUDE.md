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
no Inter-everywhere, no identical rounded cards, no gratuitous gradients, no emoji icons.

## Colour palette (use these exact values)
- Background:        #FAFAF8  (warm off-white / paper)
- Surface (cards):   #FFFFFF
- Text primary:      #1A1A1A  (near-black, not pure black)
- Text secondary:    #6B6B6B  (muted grey for sub-text)
- Borders/hairlines: #E5E4DF
- Accent:            #B8884D  (muted warm gold — use SPARINGLY: links, small marks, hover)
- Accent hover:      #9A7240
Dark sections (optional, for contrast bands like the footer or a single feature strip):
- Dark bg:           #1A1A1A
- Dark text:         #FAFAF8

## Typography
- Display / headings: a refined serif — use "Fraunces" (Google Fonts), weights 400 & 600.
- Body / UI:          a clean grotesque sans — use "Inter Tight" or "Plus Jakarta Sans"
                      (Google Fonts) for body, weights 400 & 500. (NOT plain Inter.)
- Type scale (desktop): h1 ~3.5rem, h2 ~2.25rem, h3 ~1.4rem, body 1.0625rem, small 0.875rem.
- Generous line-height on body (1.6). Tight line-height on large headings (1.05–1.15).
- Letter-spacing: slightly negative on big serif headings (-0.02em). Small uppercase
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
- Buttons: solid near-black primary with off-white text; ghost/outline secondary.
  Subtle hover (slight darken or lift). Square-ish corners (4–6px radius), not pill.
- Cards (work items): image-led, thin hairline border or none, minimal text, hover
  reveals the project name + a small "View" cue. Consistent aspect ratios.
- Links in body: gold accent, underline on hover.
- Eyebrow labels: small, uppercase, tracked, muted grey above section headings.

## Voice & tone (for copy)
Confident, plain-English, warm but professional. Short sentences. Speak to a busy
small-business owner, not a designer. Benefit-led ("Get found by local customers"),
not feature-led ("Responsive HTML5"). British English spelling.

## Accessibility
Semantic HTML5 landmarks. Alt text on all images. Colour contrast AA minimum (check
gold on off-white for small text — use near-black for body, reserve gold for accents).
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
