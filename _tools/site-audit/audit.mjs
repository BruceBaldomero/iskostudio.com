#!/usr/bin/env node
// Website findings sheet for prospecting. Loads each site like a phone would,
// checks things a business owner actually cares about, and writes a plain-English
// findings sheet per business. It does not write emails: you read the findings
// and write your own.
//
//   node audit.mjs leads.csv            (CSV with "business,url" header, or one URL per line)
//   node audit.mjs leads.csv --out out  (output folder, default ./out)

import fs from "node:fs";
import path from "node:path";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
function loadPlaywright() {
  const tries = [process.env.PLAYWRIGHT_PATH, "playwright"].filter(Boolean);
  for (const t of tries) { try { return require(t); } catch {} }
  console.error("Playwright not found. Run:  npm install  (inside _tools/site-audit), then  npx playwright install chromium");
  process.exit(1);
}
const { chromium } = loadPlaywright();

const args = process.argv.slice(2);
const input = args.find(a => !a.startsWith("--"));
const outDir = path.resolve(args.includes("--out") ? args[args.indexOf("--out") + 1] : "out");
if (!input) { console.error("Usage: node audit.mjs leads.csv [--out folder]"); process.exit(1); }

function parseLeads(file) {
  const lines = fs.readFileSync(file, "utf8").split(/\r?\n/).map(l => l.trim()).filter(l => l && !l.startsWith("#"));
  if (/^business\s*,\s*url/i.test(lines[0] || "")) lines.shift();
  return lines.map(line => {
    const m = line.match(/^"?([^",]*)"?\s*,\s*"?([^",]+)"?$/);
    let business = m ? m[1].trim() : "";
    let url = (m ? m[2] : line).trim();
    if (!/^https?:\/\//i.test(url)) url = "https://" + url;
    if (!business) business = new URL(url).hostname.replace(/^www\./, "");
    return { business, url };
  });
}

const slug = s => s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 60) || "site";
const kb = n => (n / 1024 >= 1024 ? (n / 1048576).toFixed(1) + " MB" : Math.round(n / 1024) + " KB");
const RANK = { high: 0, medium: 1, low: 2 };

async function auditSite(browser, lead) {
  const findings = [];
  const add = (severity, area, title, detail, evidence) => findings.push({ severity, area, title, detail, evidence });

  const ctx = await browser.newContext({
    viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true,
    userAgent: "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1",
  });
  const page = await ctx.newPage();
  const consoleErrors = [];
  page.on("console", m => { if (m.type() === "error") consoleErrors.push(m.text().slice(0, 160)); });
  page.on("pageerror", e => consoleErrors.push(String(e.message).slice(0, 160)));

  // Page weight via the DevTools protocol (counts cross-origin files too)
  const cdp = await ctx.newCDPSession(page);
  await cdp.send("Network.enable");
  const reqs = new Map(); let totalBytes = 0;
  cdp.on("Network.responseReceived", e => reqs.set(e.requestId, { url: e.response.url, type: e.type, mime: e.response.mimeType }));
  cdp.on("Network.loadingFinished", e => { totalBytes += e.encodedDataLength; const r = reqs.get(e.requestId); if (r) r.bytes = e.encodedDataLength; });

  let response;
  try {
    response = await page.goto(lead.url, { waitUntil: "load", timeout: 30000 });
    await page.waitForTimeout(1500);
  } catch (err) {
    await ctx.close();
    return { lead, error: String(err.message).split("\n")[0], findings: [] };
  }

  const status = response ? response.status() : 0;
  const finalUrl = page.url();
  if (status >= 400) add("high", "Reliability", `The page returned an error (HTTP ${status})`, "Visitors may see an error page instead of the business.", `HTTP ${status} at ${finalUrl}`);
  if (finalUrl.startsWith("http://")) add("high", "Trust", "No secure padlock (HTTPS)", "Browsers label the site \"Not secure\" next to the address, which puts people off before they've read anything.", `Final address is ${finalUrl}`);

  const d = await page.evaluate(() => {
    const vis = el => { const r = el.getBoundingClientRect(); const s = getComputedStyle(el); return r.width > 0 && r.height > 0 && s.visibility !== "hidden" && s.display !== "none"; };
    const text = document.body ? document.body.innerText : "";
    const meta = n => (document.querySelector(`meta[name="${n}"]`) || {}).content || "";
    const prop = n => (document.querySelector(`meta[property="${n}"]`) || {}).content || "";
    const smallText = Array.from(document.querySelectorAll("p, li, a, span, td, label")).filter(el => {
      if (!vis(el) || !el.textContent.trim() || el.children.length > 3) return false;
      return parseFloat(getComputedStyle(el).fontSize) < 12;
    }).length;
    const tapTargets = Array.from(document.querySelectorAll("a[href], button")).filter(vis);
    const smallTaps = tapTargets.filter(el => { const r = el.getBoundingClientRect(); return r.height < 32 && r.width < 120; }).length;
    const imgs = Array.from(document.images);
    const ld = Array.from(document.querySelectorAll('script[type="application/ld+json"]')).map(s => s.textContent).join(" ");
    const years = (text.match(/(?:©|copyright)\s*(?:\d{4}\s*[-–]\s*)?(\d{4})/gi) || []).map(m => +m.match(/(\d{4})$/)[1]);
    const html = document.documentElement.outerHTML;
    return {
      title: document.title.trim(),
      description: meta("description"),
      viewport: meta("viewport"),
      generator: meta("generator"),
      ogImage: prop("og:image"),
      h1s: Array.from(document.querySelectorAll("h1")).filter(vis).map(h => h.textContent.trim().slice(0, 80)),
      overflow: document.documentElement.scrollWidth - window.innerWidth,
      smallText, smallTaps, tapCount: tapTargets.length,
      imgCount: imgs.length,
      noAlt: imgs.filter(i => !i.hasAttribute("alt")).length,
      broken: imgs.filter(i => i.complete && i.naturalWidth === 0 && i.src).map(i => i.src).slice(0, 5),
      phoneInText: (text.match(/(?:\+44\s?7\d{3}|\(?07\d{3}\)?|\(?0[1-9]\d{1,4}\)?)[\s-]?\d{3,4}[\s-]?\d{3,4}/) || [""])[0],
      telLinks: document.querySelectorAll('a[href^="tel:"]').length,
      mailLinks: document.querySelectorAll('a[href^="mailto:"]').length,
      forms: document.querySelectorAll("form").length,
      bookingWidget: /calendly|cal\.com|fresha|booksy|treatwell|setmore|acuity|square(up)?\.com\/appointments|simplybook/i.test(html),
      localBusinessSchema: /"@type"\s*:\s*"(LocalBusiness|ProfessionalService|Store|Restaurant|HealthAndBeautyBusiness|BeautySalon|HairSalon|DaySpa|Dentist|MedicalClinic|HomeAndConstructionBusiness|[A-Za-z]+Business)"/.test(ld),
      latestYear: years.length ? Math.max(...years) : null,
    };
  });

  // Platform: only technical fingerprints (files loaded, generator tag), never page text,
  // so a page that merely mentions "Squarespace" isn't mislabelled.
  const loaded = [...reqs.values()].map(r => r.url).join(" ") + " " + (d.generator || "");
  d.platform = /wixstatic\.com|parastorage\.com|\bWix\.com/i.test(loaded) ? "Wix"
    : /squarespace(-cdn)?\.com|static1\.squarespace|Squarespace/i.test(loaded) ? "Squarespace"
    : /\/wp-content\/|\/wp-includes\/|WordPress/i.test(loaded) ? "WordPress"
    : /cdn\.shopify\.com|Shopify/i.test(loaded) ? "Shopify"
    : /img1\.wsimg\.com|GoDaddy|Website Builder/i.test(loaded) ? "GoDaddy builder"
    : /webflow\.com|Webflow/i.test(loaded) ? "Webflow" : "";

  // ---- Mobile ----
  if (!d.viewport) add("high", "Mobile", "Not set up for phones", "The site has no mobile viewport setting, so phones show a shrunken desktop page that people have to pinch and zoom.", "No <meta name=\"viewport\"> tag");
  if (d.overflow > 8) add("medium", "Mobile", "Page slides sideways on phones", "Something is wider than the screen, so the page wobbles left and right when people scroll. It feels broken.", `Content is ${d.overflow}px wider than a 390px phone screen`);
  if (d.smallText > 5) add("medium", "Mobile", "Text too small to read on a phone", "Several pieces of text are below a comfortable reading size on mobile.", `${d.smallText} text elements under 12px`);
  if (d.tapCount && d.smallTaps / d.tapCount > 0.3 && d.smallTaps > 8) add("low", "Mobile", "Links and buttons are fiddly to tap", "Many tap targets are smaller than a fingertip, so people mis-tap.", `${d.smallTaps} of ${d.tapCount} links/buttons under 32px tall`);

  // ---- Getting in touch ----
  if (d.phoneInText && d.telLinks === 0) add("high", "Enquiries", "Phone number isn't tappable", `The number (${d.phoneInText.trim()}) is on the page, but on a phone people can't tap it to call; they have to copy it by hand. Many won't bother.`, "Phone number in text, no tel: link");
  if (!d.forms && !d.mailLinks && !d.telLinks && !d.bookingWidget && !d.phoneInText) add("medium", "Enquiries", "No obvious way to get in touch from the homepage", "There's no contact form, tappable phone, email link or booking button on the first page.", "0 forms, 0 tel:, 0 mailto:, no booking widget detected");

  // ---- Speed / weight ----
  const files = [...reqs.values()].filter(r => r.bytes);
  const bigImages = files.filter(r => (r.type === "Image" || /^image\//.test(r.mime || "")) && r.bytes > 400 * 1024).sort((a, b) => b.bytes - a.bytes);
  if (totalBytes > 4 * 1048576) add("high", "Speed", "Very heavy page", `The homepage downloads ${kb(totalBytes)}. On mobile data that's slow to appear and costs visitors their data.`, `${kb(totalBytes)} across ${files.length} files`);
  else if (totalBytes > 2 * 1048576) add("medium", "Speed", "Heavier than it needs to be", `The homepage downloads ${kb(totalBytes)}; a site like this can usually be under 1.5 MB.`, `${kb(totalBytes)} across ${files.length} files`);
  if (bigImages.length) add("medium", "Speed", "Oversized images", "Photos are much larger than they need to be for the screen, which is usually the main cause of a slow site.", bigImages.slice(0, 3).map(r => `${kb(r.bytes)} ${r.url.split("/").pop().split("?")[0].slice(0, 50)}`).join("; "));
  if (files.length > 120) add("low", "Speed", "A lot of separate files to load", "The page pulls in many separate files (scripts, fonts, trackers), which slows it down on phones.", `${files.length} files`);

  // ---- Google / SEO basics ----
  if (!d.title) add("high", "Google", "No page title", "Google has nothing to show as the blue link in search results.", "<title> is empty");
  else if (d.title.length < 15 || /^(home|homepage|welcome)$/i.test(d.title)) add("medium", "Google", "Page title doesn't say what the business does", `The title is "${d.title}". This is the blue link in Google, and it should name the business, what it does and where.`, `<title>${d.title}</title>`);
  else if (d.title.length > 70) add("low", "Google", "Page title gets cut off in Google", "Google trims titles past roughly 60 characters.", `${d.title.length} characters`);
  if (!d.description) add("medium", "Google", "No search description", "Google makes up the grey text under the link from random bits of the page instead of a written pitch.", "No meta description");
  if (d.h1s.length === 0) add("medium", "Google", "No main heading", "The page has no main headline that tells Google (and visitors) what it's about.", "0 visible <h1>");
  if (!d.localBusinessSchema) add("low", "Google", "Not marked up as a local business", "The behind-the-scenes info that helps Google show opening hours, address and reviews isn't there.", "No LocalBusiness structured data");
  if (d.imgCount && d.noAlt / d.imgCount > 0.5 && d.noAlt > 3) add("low", "Google", "Images have no descriptions", "Images without descriptions are invisible to Google image search and to screen readers.", `${d.noAlt} of ${d.imgCount} images missing alt text`);

  // ---- Looks cared for ----
  const thisYear = new Date().getFullYear();
  if (d.latestYear && d.latestYear < thisYear - 1) add("medium", "Trust", `Footer says © ${d.latestYear}`, "An old year in the footer makes the site look unattended, and visitors wonder whether the business is still trading.", `Latest © year on the page: ${d.latestYear}`);
  if (d.broken.length) add("medium", "Trust", "Broken images", "Some images fail to load and show as empty boxes or broken icons.", d.broken.map(s => s.split("/").pop().slice(0, 50)).join("; "));
  if (!d.ogImage) add("low", "Trust", "No preview picture when shared", "When someone shares the link on WhatsApp or Facebook, it shows no image, just a plain link.", "No og:image");
  if (consoleErrors.length >= 3) add("low", "Reliability", "Errors running in the background", "The site's code is throwing errors. Often harmless, but sometimes it's why a form or menu quietly doesn't work.", `${consoleErrors.length} browser errors, e.g. "${consoleErrors[0]}"`);

  // ---- Screenshots ----
  const dir = path.join(outDir, slug(lead.business));
  fs.mkdirSync(dir, { recursive: true });
  await page.evaluate(() => window.scrollTo(0, 0));
  await page.screenshot({ path: path.join(dir, "mobile.png") });
  await page.setViewportSize({ width: 1440, height: 900 }).catch(() => {});
  const desk = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const dp = await desk.newPage();
  try { await dp.goto(finalUrl, { waitUntil: "load", timeout: 30000 }); await dp.waitForTimeout(1000); await dp.screenshot({ path: path.join(dir, "desktop.png") }); } catch {}
  await desk.close();
  await ctx.close();

  findings.sort((a, b) => RANK[a.severity] - RANK[b.severity]);
  return { lead, finalUrl, status, platform: d.platform, weight: totalBytes, files: files.length, findings, dir };
}

function writeSheet(r) {
  const date = new Date().toISOString().slice(0, 10);
  const top = r.findings.slice(0, 3);
  const md = [
    `# ${r.lead.business}: website findings`,
    "",
    `**Site:** ${r.finalUrl}  `,
    `**Checked:** ${date}, as a phone visitor (iPhone-size screen)  `,
    r.platform ? `**Built with:** ${r.platform}  ` : null,
    `**Page weight:** ${kb(r.weight)} across ${r.files} files`,
    "",
    "## Worth mentioning",
    top.length ? top.map((f, i) => `${i + 1}. **${f.title}.** ${f.detail}`).join("\n") : "Nothing significant found. This site is in decent shape; probably not a good lead.",
    "",
    "## Everything found",
    r.findings.length ? "| Severity | Area | Finding | Evidence |\n|---|---|---|---|\n" + r.findings.map(f => `| ${f.severity} | ${f.area} | ${f.title} | ${String(f.evidence).replace(/\|/g, "/")} |`).join("\n") : "_No issues detected._",
    "",
    "## Screenshots",
    "![Mobile](mobile.png)",
    "",
    "![Desktop](desktop.png)",
    "",
    "## Before you email",
    "- Open the site yourself and confirm each point before you mention it. Automated checks can be wrong.",
    "- Check the business type on Companies House. Limited companies can usually be emailed if you identify yourself and offer an opt-out; sole traders and partnerships generally need consent first (UK PECR). See the ICO's guidance on electronic marketing.",
    "- Write the email yourself, about one or two of the points above.",
    "",
  ].filter(l => l !== null).join("\n");
  fs.writeFileSync(path.join(r.dir, "findings.md"), md);
}

const leads = parseLeads(input);
fs.mkdirSync(outDir, { recursive: true });
const browser = await chromium.launch(process.env.CHROME_PATH ? { executablePath: process.env.CHROME_PATH } : {});
const rows = [["business", "url", "platform", "high", "medium", "low", "top_finding", "sheet"]];
for (const lead of leads) {
  process.stdout.write(`Checking ${lead.business} (${lead.url}) ... `);
  const r = await auditSite(browser, lead);
  if (r.error) {
    console.log(`could not load: ${r.error}`);
    rows.push([lead.business, lead.url, "", "", "", "", `Could not load: ${r.error}`, ""]);
    continue;
  }
  writeSheet(r);
  const count = s => r.findings.filter(f => f.severity === s).length;
  console.log(`${count("high")} high, ${count("medium")} medium, ${count("low")} low`);
  rows.push([lead.business, r.finalUrl, r.platform, count("high"), count("medium"), count("low"), r.findings[0] ? r.findings[0].title : "", path.relative(outDir, path.join(r.dir, "findings.md"))]);
}
await browser.close();
const csv = rows.map(r => r.map(v => `"${String(v).replace(/"/g, '""')}"`).join(",")).join("\n");
fs.writeFileSync(path.join(outDir, "summary.csv"), csv + "\n");
console.log(`\nDone. Summary: ${path.join(outDir, "summary.csv")}`);
