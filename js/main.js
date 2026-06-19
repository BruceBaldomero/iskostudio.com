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
  /* ---- 4. Contact form — multi-step + AJAX submit via Formspree ---- */
  var form = document.getElementById("contactForm");

  if (form) {
    var steps = Array.prototype.slice.call(form.querySelectorAll(".form-step"));
    var total = steps.length;
    var current = 0;

    var progressBar = document.getElementById("formProgressBar");
    var stepCurrent = document.getElementById("stepCurrent");
    var backBtn = document.getElementById("formBack");
    var nextBtn = document.getElementById("formNext");
    var submitBtn = document.getElementById("formSubmit");
    var successMsg = document.getElementById("formSuccess");
    var errorMsg = document.getElementById("formError");

    function showStep(i, focus) {
      steps.forEach(function (s, idx) { s.classList.toggle("is-active", idx === i); });
      progressBar.style.width = ((i + 1) / total) * 100 + "%";
      stepCurrent.textContent = String(i + 1);
      backBtn.hidden = i === 0;
      var last = i === total - 1;
      nextBtn.hidden = last;
      submitBtn.hidden = !last;
      if (focus) {
        var firstField = steps[i].querySelector("input, textarea, select");
        if (firstField) firstField.focus();
      }
    }

    // Validate the visible step; show native messages if invalid
    function validateStep(i) {
      var required = steps[i].querySelectorAll("[required]");
      for (var j = 0; j < required.length; j++) {
        if (!required[j].checkValidity()) {
          required[j].reportValidity();
          return false;
        }
      }
      return true;
    }

    nextBtn.addEventListener("click", function () {
      if (!validateStep(current)) return;
      if (current < total - 1) { current++; showStep(current, true); }
    });

    backBtn.addEventListener("click", function () {
      if (current > 0) { current--; showStep(current, true); }
    });

    // Enter advances instead of submitting (except on the last step)
    form.addEventListener("keydown", function (e) {
      if (e.key === "Enter" && current < total - 1) {
        var tag = e.target.tagName;
        if (tag === "INPUT") { e.preventDefault(); nextBtn.click(); }
      }
    });

    form.addEventListener("submit", function (e) {
      e.preventDefault();
      if (!validateStep(current)) return;

      submitBtn.disabled = true;
      submitBtn.textContent = "Sending…";
      errorMsg.hidden = true;

      fetch(form.action, {
        method: "POST",
        body: new FormData(form),
        headers: { "Accept": "application/json" }
      })
        .then(function (res) {
          if (res.ok) {
            form.querySelector(".form-progress").hidden = true;
            document.querySelector(".form-step-count").hidden = true;
            steps.forEach(function (s) { s.classList.remove("is-active"); });
            document.querySelector(".form-nav").hidden = true;
            document.querySelector(".form-note").hidden = true;
            successMsg.hidden = false;
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

    showStep(0, false);
  }

})();

/* =========================================================
   Review scatter modal
   ========================================================= */
(function () {
  "use strict";

  const modal     = document.getElementById('review-modal');
  if (!modal) return;

  const backdrop  = document.getElementById('review-modal-backdrop');
  const closeBtn  = document.getElementById('review-modal-close');
  const starsEl   = document.getElementById('review-modal-stars');
  const textEl    = document.getElementById('review-modal-text');
  const nameEl    = document.getElementById('review-modal-name');
  const metaEl    = document.getElementById('review-modal-meta');

  function openModal(card) {
    const fullDiv = card.querySelector('.review-full');
    if (!fullDiv) return;

    var starsNode  = card.querySelector('.review-card-stars');
    var nameNode   = card.querySelector('.review-card-name');
    var sourceNode = card.querySelector('.review-card-source');
    var avatarNode = card.querySelector('.review-card-avatar');

    starsEl.textContent = starsNode  ? starsNode.textContent  : '★★★★★';
    nameEl.textContent  = nameNode   ? nameNode.textContent   : '';
    metaEl.textContent  = sourceNode ? sourceNode.textContent : '';

    /* Replicate avatar in modal header */
    var existingAvatar = modal.querySelector('.review-modal-avatar');
    if (existingAvatar) existingAvatar.remove();
    if (avatarNode) {
      var modalAvatar = document.createElement('div');
      modalAvatar.className = 'review-modal-avatar review-card-avatar';
      modalAvatar.setAttribute('aria-hidden', 'true');
      modalAvatar.textContent = avatarNode.textContent;
      nameEl.parentNode.insertBefore(modalAvatar, nameEl);
    }

    textEl.innerHTML = '';
    Array.from(fullDiv.children).forEach(function (child) {
      var p = document.createElement('p');
      p.textContent = child.textContent;
      textEl.appendChild(p);
    });

    modal.classList.add('open');
    modal.setAttribute('aria-hidden', 'false');
    document.body.style.overflow = 'hidden';
    closeBtn.focus();
  }

  function closeModal() {
    modal.classList.remove('open');
    modal.setAttribute('aria-hidden', 'true');
    document.body.style.overflow = '';
  }

  document.querySelectorAll('.review-card').forEach(function (card) {
    card.addEventListener('click', function () { openModal(card); });
    card.setAttribute('tabindex', '0');
    card.setAttribute('role', 'button');
    card.addEventListener('keydown', function (e) {
      if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); openModal(card); }
    });
  });

  backdrop && backdrop.addEventListener('click', closeModal);
  closeBtn  && closeBtn.addEventListener('click',  closeModal);
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape' && modal.classList.contains('open')) closeModal();
  });
})();
