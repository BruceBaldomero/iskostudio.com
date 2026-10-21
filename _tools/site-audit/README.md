# Site audit

Give it a list of local business websites. For each one it loads the site the way
a phone visitor would and writes a one-page findings sheet in plain English:
what's wrong, why it matters to the business, and the evidence. It does not write
emails. You read the findings, check them yourself, and write your own email.

This folder starts with `_`, so GitHub Pages doesn't publish it on iskostudio.com.

## One-time setup (on your own computer)

You need Node.js 20 or newer.

```
cd _tools/site-audit
npm install
npx playwright install chromium
```

## Running it

1. Make a file called `leads.csv` in this folder:

   ```
   business,url
   Smith & Sons Plumbing,smithandsonsplumbing.co.uk
   The Corner Cafe,https://thecornercafe.co.uk
   ```

   (A plain list with one website per line also works.)

2. Run:

   ```
   npm run audit -- leads.csv
   ```

3. Open `out/summary.csv` to see every business ranked by what was found, then
   open `out/<business>/findings.md` for the full sheet, plus phone and desktop
   screenshots.

`leads*.csv` and `out/` are git-ignored, so your lead lists never get committed.

## What it checks

- **Mobile:** set up for phones, page sliding sideways, text too small, fiddly links
- **Enquiries:** phone number not tappable, no way to get in touch
- **Speed:** page weight, oversized images, too many files
- **Google:** page title, search description, main heading, local business markup, image descriptions
- **Trust:** secure padlock, old © year in the footer, broken images, no preview picture when shared
- **Reliability:** error pages, background code errors

It measures page weight rather than load time, because load time depends on your
own connection on the day.

## Before you email anyone

- **Check every point yourself.** Open the site on your phone. Automated checks
  can be wrong, and one wrong claim loses the lead.
- **Check who you're allowed to email.** Look the business up on Companies House.
  Under UK PECR rules, limited companies can usually be emailed if you identify
  yourself and offer an easy opt-out. Sole traders and partnerships are treated
  like individuals and generally need consent first. Many salons, therapists and
  trades are sole traders. See the ICO's guidance on electronic marketing.
- **Write it yourself.** Pick one or two findings and keep it to three lines.
  Offer the free homepage concept, then present it on a call.

## Testing

`test/` has a deliberately broken page and a test lead list:

```
npm run audit -- test/leads.csv
```

(Serve the repo root on port 8099 first, e.g. `python3 -m http.server 8099` from the repo root.)
