/* =========================================================
   ISKO Studio — minimal vanilla JS
   1. Sticky header: solid bar on scroll
   2. Mobile nav toggle
   3. Scroll reveal (fade/slide-up), respecting reduced motion
   ========================================================= */
(function () {
  "use strict";

  /* ---- 1. Header state on scroll ---- */
  var header = document.querySelector(".site-header");
  function onScroll() {
    if (!header) return;
    header.classList.toggle("is-scrolled", window.scrollY > 8);
  }
  onScroll();
  window.addEventListener("scroll", onScroll, { passive: true });

  /* ---- 2. Mobile nav ---- */
  var toggle = document.getElementById("navToggle");
  var mobileNav = document.getElementById("mobileNav");

  function closeNav() {
    if (!toggle || !mobileNav) return;
    toggle.setAttribute("aria-expanded", "false");
    toggle.setAttribute("aria-label", "Open menu");
    mobileNav.hidden = true;
  }

  if (toggle && mobileNav) {
    toggle.addEventListener("click", function () {
      var open = toggle.getAttribute("aria-expanded") === "true";
      toggle.setAttribute("aria-expanded", String(!open));
      toggle.setAttribute("aria-label", open ? "Open menu" : "Close menu");
      mobileNav.hidden = open;
    });

    // Close after tapping a link
    mobileNav.addEventListener("click", function (e) {
      if (e.target.closest("a")) closeNav();
    });

    // Close on Escape
    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape") closeNav();
    });

    // Close if resized up to desktop
    window.addEventListener("resize", function () {
      if (window.innerWidth > 860) closeNav();
    });
  }

  /* ---- 3. Scroll reveal ---- */
  var reveals = document.querySelectorAll(".reveal");
  var reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  if (reduceMotion || !("IntersectionObserver" in window)) {
    reveals.forEach(function (el) { el.classList.add("is-visible"); });
  } else {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add("is-visible");
          io.unobserve(entry.target);
        }
      });
    }, { threshold: 0.12, rootMargin: "0px 0px -8% 0px" });

    reveals.forEach(function (el) { io.observe(el); });
  }
  /* ---- 4. Contact form — AJAX submit via Formspree ---- */
  var form = document.getElementById("contactForm");
  var submitBtn = document.getElementById("formSubmit");
  var successMsg = document.getElementById("formSuccess");
  var errorMsg = document.getElementById("formError");

  if (form) {
    form.addEventListener("submit", function (e) {
      e.preventDefault();
      submitBtn.disabled = true;
      submitBtn.textContent = "Sending…";
      successMsg.hidden = true;
      errorMsg.hidden = true;

      fetch(form.action, {
        method: "POST",
        body: new FormData(form),
        headers: { "Accept": "application/json" }
      })
        .then(function (res) {
          if (res.ok) {
            form.reset();
            successMsg.hidden = false;
            submitBtn.textContent = "Sent ✓";
          } else {
            return res.json().then(function (data) { throw data; });
          }
        })
        .catch(function () {
          errorMsg.hidden = false;
          submitBtn.disabled = false;
          submitBtn.textContent = "Send enquiry";
        });
    });
  }

})();
