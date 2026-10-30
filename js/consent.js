/* =========================================================
   Cookie consent + Google Analytics
   Analytics only loads after the visitor presses Accept. Until a GA4
   Measurement ID is set below, nothing shows and nothing loads: there are
   no cookies to ask about.
   ========================================================= */
(function () {
  "use strict";

  var GA_ID = "G-M3T1QPVGNV"; // GA4 Measurement ID (property iskostudio.com, ISKO Google account)
  var KEY = "isko-consent";
  var ASK_AGAIN_AFTER = 1000 * 60 * 60 * 24 * 182; // about six months

  var preview = window.ISKO_CONSENT_PREVIEW === true; // test links: show the card, never load Analytics
  if (!GA_ID && !preview) return;

  function readChoice() {
    try {
      var c = JSON.parse(localStorage.getItem(KEY));
      if (c && (c.v === "granted" || c.v === "denied") && Date.now() - c.t < ASK_AGAIN_AFTER) return c.v;
    } catch (e) {}
    return null;
  }
  function saveChoice(v) {
    try { localStorage.setItem(KEY, JSON.stringify({ v: v, t: Date.now() })); } catch (e) {}
  }

  var loaded = false;
  function loadAnalytics() {
    if (loaded || !GA_ID || preview) return;
    loaded = true;
    var start = function () {
      window.dataLayer = window.dataLayer || [];
      window.gtag = function () { window.dataLayer.push(arguments); };
      window.gtag("js", new Date());
      window.gtag("config", GA_ID);
      var s = document.createElement("script");
      s.async = true;
      s.src = "https://www.googletagmanager.com/gtag/js?id=" + encodeURIComponent(GA_ID);
      document.head.appendChild(s);
    };
    // A page prerendered on hover hasn't been seen yet: count it when it is.
    if (document.prerendering) {
      document.addEventListener("prerenderingchange", start, { once: true });
    } else {
      start();
    }
  }

  // Removing consent: clear Google's cookies on this domain and its parent.
  function clearAnalyticsCookies() {
    var host = location.hostname;
    var domains = ["", host, "." + host, "." + host.replace(/^www\./, "")];
    document.cookie.split(";").forEach(function (part) {
      var name = part.split("=")[0].trim();
      if (name === "_ga" || name.indexOf("_ga_") === 0 || name === "_gid") {
        domains.forEach(function (d) {
          document.cookie = name + "=; Max-Age=0; path=/" + (d ? "; domain=" + d : "");
        });
      }
    });
  }

  var banner = null;
  function buildBanner() {
    banner = document.createElement("div");
    banner.className = "consent";
    banner.setAttribute("role", "region");
    banner.setAttribute("aria-label", "Cookie choice");
    banner.innerHTML =
      '<p class="consent-text"><strong>Can I count your visit?</strong> ' +
      "I use Google Analytics to see how many people visit and which pages help. " +
      'Nothing is set unless you say yes. <a href="/privacy.html#cookies">Privacy policy</a></p>' +
      '<div class="consent-actions">' +
      '<button type="button" class="consent-btn" data-consent="denied">Decline</button>' +
      '<button type="button" class="consent-btn consent-btn-accept" data-consent="granted">Accept</button>' +
      "</div>";
    banner.addEventListener("click", function (e) {
      var btn = e.target.closest("[data-consent]");
      if (!btn) return;
      choose(btn.getAttribute("data-consent"));
    });
    document.body.appendChild(banner);
  }

  function showBanner() {
    if (!banner) buildBanner();
    banner.hidden = false;
    requestAnimationFrame(function () { banner.classList.add("is-open"); });
  }
  function hideBanner() {
    if (!banner) return;
    banner.classList.remove("is-open");
    var b = banner;
    setTimeout(function () { b.hidden = true; }, 250);
  }

  function choose(v) {
    var was = readChoice();
    saveChoice(v);
    hideBanner();
    if (v === "granted") {
      loadAnalytics();
    } else if (was === "granted" || loaded) {
      clearAnalyticsCookies();
      location.reload(); // the analytics script is already running; a reload stops it
    }
  }

  function init() {
    // "Cookie settings" in the footer lets people change their mind.
    Array.prototype.forEach.call(document.querySelectorAll("[data-consent-open]"), function (btn) {
      btn.hidden = false;
      btn.addEventListener("click", showBanner);
    });

    var choice = readChoice();
    if (choice === "granted") loadAnalytics();
    else if (choice === null) showBanner();
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init);
  else init();
})();
