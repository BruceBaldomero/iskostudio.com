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
    // Reveal as soon as an element crosses ~20% up from the bottom of the
    // viewport. rootMargin trims 20% off the bottom edge so the trigger point
    // sits well before an element reaches the middle of the screen — nothing
    // should ever linger washed-out once it's a third of the way in. once:true
    // via unobserve.
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add("is-visible");
          io.unobserve(entry.target);
        }
      });
    }, { threshold: 0, rootMargin: "0px 0px -12% 0px" });

    reveals.forEach(function (el) { io.observe(el); });
  }
  /* ---- 4. Start a project form — pill toggle + AJAX submit via Formspree ---- */
  var form = document.getElementById("contactForm");

  if (form) {
    var submitBtn = document.getElementById("formSubmit");
    var successMsg = document.getElementById("formSuccess");
    var errorMsg = document.getElementById("formError");

    // Pill groups: single-select (data-mode="single") acts like radios,
    // otherwise multi-select toggle. Value stored in a paired hidden field.
    function wirePillGroup(groupId, inputId) {
      var group = document.getElementById(groupId);
      var input = document.getElementById(inputId);
      if (!group || !input) return;

      var single = group.dataset.mode === "single";
      var pills = Array.prototype.slice.call(group.querySelectorAll(".pill"));

      pills.forEach(function (pill) {
        pill.addEventListener("click", function () {
          if (single) {
            var wasSelected = pill.classList.contains("is-selected");
            pills.forEach(function (p) { p.classList.remove("is-selected"); });
            if (!wasSelected) pill.classList.add("is-selected");
            input.value = wasSelected ? "" : pill.dataset.value;
          } else {
            pill.classList.toggle("is-selected");
            var selected = pills
              .filter(function (p) { return p.classList.contains("is-selected"); })
              .map(function (p) { return p.dataset.value; });
            input.value = selected.join(", ");
          }
        });
      });
    }

    wirePillGroup("serviceTypeGroup", "serviceTypeInput");
    wirePillGroup("biggestChallengeGroup", "biggestChallengeInput");

    // Deep links (e.g. the Fix-Up band CTA) can preselect a service pill.
    Array.prototype.forEach.call(document.querySelectorAll("[data-preselect]"), function (link) {
      link.addEventListener("click", function () {
        var val = link.getAttribute("data-preselect");
        var group = document.getElementById("serviceTypeGroup");
        var input = document.getElementById("serviceTypeInput");
        if (!group || !input) return;
        Array.prototype.forEach.call(group.querySelectorAll(".pill"), function (p) {
          p.classList.toggle("is-selected", p.dataset.value === val);
        });
        input.value = val;
      });
    });

    form.addEventListener("submit", function (e) {
      e.preventDefault();
      if (!form.checkValidity()) {
        form.reportValidity();
        return;
      }

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
            Array.prototype.forEach.call(form.children, function (child) {
              if (child !== successMsg && child !== errorMsg) child.hidden = true;
            });
            successMsg.hidden = false;
          } else {
            return res.json().then(function (data) { throw data; });
          }
        })
        .catch(function () {
          errorMsg.hidden = false;
          submitBtn.disabled = false;
          submitBtn.textContent = "Send it over →";
        });
    });
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
