# CLAUDE.md — ISKO Studio Website

This file defines the design system and rules for building the iskostudio.com website.
Follow it on every decision. Do not deviate from the palette, type, or spacing without being asked.

Business knowledge (offer, prices, process, accounts, leads) is not kept in this public repo. It lives
in the owner's private Google Drive folder "ISKO Studio — Ops": read `00 START HERE — ISKO HQ.md` there first.
Standing rule: when something changes that the owner's ISKO Client Journey page or that HQ file covers
(leads, prices, offer, forms, accounts, rules, or this website), tell the owner in one line and offer to
update both.

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
the generic "AI assistant" look). The green dot in the logo is for Isko, the friend the studio
is named after, and the forests of Pilar, Abra, in the Philippines where we grew up.
The one field of colour is the CUTTING MAT (token --mat): every ISKO site is made on one, so a
self-healing cutting mat is the ground of the first screen, "how it works" and the footer.
Mat: --mat #176B55 (dark mode #0F4A3A), white ink on it (6.4:1), muted #DCEBE4 (5.2:1). Its
grid, 45° cutting line, numbered ruler and the soft light through reeded glass are drawn in CSS
(the .mat block in style.css); change the colour with the token only.
Light theme:
- Background:        #FFFFFF
- Surface (cards):   #F4F4F5  (one tone step below the page)
- Ink (headings, buttons, the accent): #0A0A0A
- Body text:         #1C1C1E
- Muted text:        #5F5F66  (6.3:1 on white, 5.8:1 on card grey)
- Borders/hairlines: #E4E4E7
- Tint (bands):      #F4F4F5
- Logo dot:          #1F5C45 forest green on light, #7CC7A0 leaf green on dark (tokens --dot, --dot-on-dark)
Dark contrast sections: panel #161616 (services), panel text #F5F5F5. The footer is on the mat.
Dark mode exists (toggle + system preference): page #0A0A0A, ink #F5F5F5, leaf-green logo dot.
Keep the two dark-mode token blocks identical.
The logo family (31 Oct 2026). The dot is always there.
- Icon "I.": a plain-bar I and the leaf-green dot on a mat-green tile with a faint grid
  (img/favicon.svg, favicon-48.png, apple-touch-icon.png, profile-1080.png for Instagram/Google).
- Wordmark "ISKO.": S K O from Schibsted Grotesk 800 (outlined), a plain-bar I instead of the
  font's slab I, and the font's own full stop as a round dot. Drawn once per page as
  <g id="isko-wordmark"> in a hidden sprite and reused with <use> in the nav, footer and giant
  footer mark; letters are currentColor, the dot is --wm-dot (--dot on light, --dot-on-dark on
  the nav, mat and footer). Files: img/wordmark.svg.
- Full name "ISKO. Studio": the wordmark plus "Studio" in Schibsted Grotesk 500
  (img/logo.svg, logo-white.svg, logo.png). The sharing image img/og-image.png uses it on the mat.
- The source script is not in the repo; regenerate from the outlines in these SVGs if needed.
No accent colour beyond ink. Success/error colours are for form states only.

## Typography
- One family: "Schibsted Grotesk" (Google Fonts, variable 400–800), chosen with the
  design-taste-frontend skill's type system for this direction.
- Display (hero, section titles, prices): weight 800, tracking -0.04 to -0.045em, leading ~1.
- Smaller headings (h3): weight 700, tracking -0.03em. Body: weight 400, line-height 1.6.
- Type scale (desktop): h1 ~8rem (the one big thing; two lines at every width, so keep it to
  about 22 characters), h2 ~3rem, h3 ~1.4rem, body 1.0625rem, small 0.875rem. Nothing under 13px.
- No serif, no monospace, no italics anywhere. The wordmark is drawn from Schibsted Grotesk too.
- Headlines are one colour: no coloured, underlined or italic accent word.

## Layout & spacing
- Max content width ~1100px, centred, with comfortable side padding (clamp for mobile).
- Use a consistent spacing scale: 8, 16, 24, 40, 64, 96, 128px. Sections breathe — big
  vertical rhythm (96–128px between major sections on desktop).
- Mobile-first and fully responsive. Test single-column down to 360px.
- Centred spine: the nav is a centred floating capsule, so the hero and every section
  heading (title, lead) are centred to line up with it. The one exception is the contact
  section: heading, note and form share one two-column card so the form starts beside it. Section BODIES still
  vary: asymmetric two-column about, alternating timeline rows, grids for work and pricing.

## Motion
- Subtle and purposeful only. Gentle fade/slide-up on scroll (small distance, ~400ms,
  ease-out). Smooth hover transitions (150–200ms) on links/buttons/cards.
- No bouncing, no parallax overload, no autoplaying carousels. Respect
  prefers-reduced-motion.
- The light on the mat sways slowly (one CSS animation per mat, stopped for reduced motion).
- Two pinned scroll scenes, built with CSS scroll-driven animations (no GSAP, no Three.js):
  the hero (the work rises to fill the mat) and how it works (one step at a time, the 45° cut).
  They only switch on with @supports (animation-timeline: view()), motion allowed, and a
  viewport at least 900px wide and 620px tall; everyone else gets the normal layout, which
  must always read complete on its own. Text that has faded out is also visibility: hidden.
- Page-level overflow uses `overflow-x: clip`, never `hidden`: hidden breaks position: sticky
  (the nav and both scenes).

## Components
- Shape: everything interactive is a full pill (border-radius 999px): buttons, nav CTA,
  tags, chips. Cards and frames use --radius-card (16px); icon tiles and small floating
  cards --radius-tile (12px); inputs and tiny chips --radius (5px).
- Depth: no shadows and no 1px outlines on things at rest. Cards are a fill one tone off the
  page (#F4F4F5 on white). Only the sticky nav, the open mobile menu, the dialog and the cookie card cast a shadow.
- Corners: where the browser supports `corner-shape: squircle`, cards and tiles get continuous
  corners with slightly larger radii (set once in the @supports block in style.css).
- Touch: every :hover rule lives inside `@media (hover: hover) and (pointer: fine)`; every
  control has an :active press state; small icon buttons get a 44px hit area.
- Buttons: solid near-black pill primary with white text (white with ink text on the mat);
  the secondary is a quiet grey-filled pill or a text link with an arrow. Subtle hover.
- Cards (work items): image-led, real client screenshots in a browser frame, minimal
  text, hover reveals a small "View" cue. Consistent aspect ratios.
- Links in body: ink, underline on hover.
- No eyebrow labels, pill badges or "Step 01" numbers above headings, no small uppercase tracked
  labels, no icons in tinted squares, no star characters. Put the information in the heading or
  the first sentence. Check changes with the design-taste-frontend skill's lint and inspect scripts.
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
- Stylesheet and scripts are linked with a version query (css/style.css?v=YYYYMMDD). Bump it
  on EVERY page whenever css/ or js/ changes, so visitors never get new HTML with old CSS.
- Homepage budget today: about 350 KB and 15 requests; main content in ~1.8s on a throttled
  phone; layout shift ~0. Keep it there.
- Optimise/lazy-load images (use width/height attributes, loading="lazy", WebP if possible).
  Small images ship a phone-sized copy via srcset (the Mukha page thumbs have -320.webp, the phone
  screenshot -300.webp); keep the sizes attribute in step with the layout.
- 404.html is served at whatever missing URL was asked for, so every path in it starts with "/".
- Links and buttons outside running text are at least 24px tall to tap (footer links get 4px
  padding top and bottom).
- Load Google Fonts efficiently (preconnect, only the weights listed above).
- Keep JS minimal and defer it.

## Do NOT
- Do not invent fake client logos, fake testimonials, or fake project results.
  Use clearly-labelled placeholders the owner will replace.
- Do not add e-commerce, login, or a CMS unless asked.
- Do not use stock-photo clichés or AI faces.

## Cookies & analytics
- js/consent.js holds the GA4 Measurement ID: G-M3T1QPVGNV (property iskostudio.com, created on the
  ISKO Google account iskostudio.inbox@gmail.com, 30 Oct 2026). Google Analytics loads only after the
  visitor presses Accept; "Cookie settings" in every footer lets them change their mind. If GA_ID is
  emptied, the card and the footer link disappear and nothing loads.
- privacy.html sections 2, 3, 4 and 6 (#cookies) describe the analytics. Change them in the same
  commit as anything that changes what is collected. "Google products and services" data sharing is
  off in the GA account; the policy says so.
- Test links set window.ISKO_CONSENT_PREVIEW = true: the card shows but Analytics never loads.
- Accept and Decline stay the same size and weight. No pre-ticked choices, no "accept to continue".
