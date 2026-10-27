/* Light/dark theme toggle. The page follows the system setting until the
   visitor picks one; the choice is remembered. A tiny inline script in each
   page's <head> applies a saved choice before first paint to avoid a flash. */
(function () {
  "use strict";

  var root = document.documentElement;
  var media = window.matchMedia ? window.matchMedia("(prefers-color-scheme: dark)") : null;
  var COLORS = { light: "#F3F5F1", dark: "#0E1311" };

  function current() {
    var set = root.getAttribute("data-theme");
    if (set === "dark" || set === "light") return set;
    return media && media.matches ? "dark" : "light";
  }

  function syncUI() {
    var theme = current();
    Array.prototype.forEach.call(document.querySelectorAll(".theme-toggle"), function (btn) {
      btn.setAttribute("aria-pressed", String(theme === "dark"));
      btn.setAttribute("aria-label", theme === "dark" ? "Switch to light mode" : "Switch to dark mode");
    });
    Array.prototype.forEach.call(document.querySelectorAll('meta[name="theme-color"]'), function (m) {
      m.setAttribute("content", COLORS[theme]);
    });
  }

  function choose(theme) {
    root.setAttribute("data-theme", theme);
    try { localStorage.setItem("theme", theme); } catch (e) {}
    syncUI();
  }

  Array.prototype.forEach.call(document.querySelectorAll(".theme-toggle"), function (btn) {
    btn.addEventListener("click", function () {
      var next = current() === "dark" ? "light" : "dark";
      // cross-fade the whole page between themes where the browser supports it
      var still = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      if (document.startViewTransition && !still) {
        document.startViewTransition(function () { choose(next); });
      } else {
        choose(next);
      }
    });
  });

  if (media) {
    var onChange = function () { if (!root.hasAttribute("data-theme")) syncUI(); };
    if (media.addEventListener) media.addEventListener("change", onChange);
    else if (media.addListener) media.addListener(onChange);
  }

  syncUI();
})();
