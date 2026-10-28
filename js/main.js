/* =========================================================
   ISKO Studio — minimal vanilla JS
   1. Sticky header: solid bar on scroll
   2. Mobile nav toggle
   3. Scroll reveal (fade/slide-up), respecting reduced motion
   ========================================================= */
/* The phone's back gesture (and Esc) closes whatever layer is open instead of
   leaving the page. Uses CloseWatcher where the browser has it; elsewhere the
   existing Escape handlers still apply. */
function watchClose(onClose) {
  if (!("CloseWatcher" in window)) return null;
  try {
    var watcher = new CloseWatcher();
    watcher.onclose = onClose;
    return watcher;
  } catch (e) { return null; }
}

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

  var navWatcher = null;

  function closeNav() {
    if (!toggle || !mobileNav) return;
    toggle.setAttribute("aria-expanded", "false");
    toggle.setAttribute("aria-label", "Open menu");
    mobileNav.hidden = true;
    if (navWatcher) { var w = navWatcher; navWatcher = null; w.destroy(); }
  }

  if (toggle && mobileNav) {
    toggle.addEventListener("click", function () {
      if (toggle.getAttribute("aria-expanded") === "true") { closeNav(); return; }
      toggle.setAttribute("aria-expanded", "true");
      toggle.setAttribute("aria-label", "Close menu");
      mobileNav.hidden = false;
      navWatcher = watchClose(closeNav);
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

  /* ---- Cutting mats: number the ruler along the top edge, one mark per
     5-square block, like a real mat. Purely decorative (the mat is aria-hidden). */
  var rulers = document.querySelectorAll(".mat-ruler");
  function numberRulers() {
    Array.prototype.forEach.call(rulers, function (ruler) {
      var block = parseFloat(getComputedStyle(ruler).getPropertyValue("--mat-block")) || 120;
      var count = Math.floor(ruler.clientWidth / block);
      if (ruler.childElementCount === count) return;
      var html = "";
      for (var n = 1; n <= count; n++) html += "<span style=\"left:" + (n * block) + "px\">" + n + "</span>";
      ruler.innerHTML = html;
    });
  }
  if (rulers.length) {
    numberRulers();
    var rulerTimer;
    window.addEventListener("resize", function () {
      clearTimeout(rulerTimer);
      rulerTimer = setTimeout(numberRulers, 150);
    });
  }

  /* ---- Links to an FAQ answer open it, so the reader lands on the answer ---- */
  document.addEventListener("click", function (e) {
    var link = e.target.closest && e.target.closest('a[href^="#faq-"]');
    var item = link && document.getElementById(link.getAttribute("href").slice(1));
    if (item && item.tagName === "DETAILS") item.open = true;
  });

  /* ---- 3. Scroll reveal ---- */
  var reveals = document.querySelectorAll(".reveal");
  var reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  // Cards in a row cascade in: each gets its index (capped at 4) as --i, which
  // the CSS turns into a 60ms-per-item delay.
  Array.prototype.forEach.call(
    document.querySelectorAll(".services-list, .tier-grid, .process-steps, .review-scatter"),
    function (group) {
      Array.prototype.forEach.call(group.children, function (child, i) {
        if (child.classList.contains("reveal")) child.style.setProperty("--i", Math.min(i, 4));
      });
    }
  );

  // Once an element has arrived, drop the reveal classes so its own hover and
  // press transitions apply again (the reveal rule would otherwise override them).
  function settle(el) {
    el.classList.remove("reveal", "is-visible");
    el.style.removeProperty("--i");
  }

  if (reduceMotion || !("IntersectionObserver" in window)) {
    reveals.forEach(settle);
  } else {
    // Reveal as soon as an element crosses ~12% up from the bottom of the
    // viewport, so nothing lingers washed-out once it's a third of the way in.
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        var el = entry.target;
        io.unobserve(el);
        el.classList.add("is-visible");
        var done = false;
        var finish = function () { if (!done) { done = true; settle(el); } };
        el.addEventListener("transitionend", function onEnd(e) {
          if (e.target === el && e.propertyName === "opacity") {
            el.removeEventListener("transitionend", onEnd);
            finish();
          }
        });
        setTimeout(finish, 1200); // fallback if transitionend never fires
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
    var validationNote = document.getElementById("formValidationNote");

    // Inline validation: highlight invalid required fields and name them in
    // a visible, aria-live status message, instead of relying solely on the
    // browser's native validation bubble (easy to miss, especially on mobile).
    function clearFieldError(input) {
      var field = input.closest(".field");
      if (field) field.classList.remove("has-error");
    }

    function markFieldError(input) {
      var field = input.closest(".field");
      if (field) field.classList.add("has-error");
    }

    function fieldLabelText(input) {
      var field = input.closest(".field");
      var label = field && field.querySelector("label");
      if (!label) return input.name || input.id || "a field";
      // strip any "(optional)" style suffix span text
      var clone = label.cloneNode(true);
      Array.prototype.forEach.call(clone.querySelectorAll(".field-optional"), function (el) { el.remove(); });
      return clone.textContent.trim();
    }

    function showValidationNote(invalidInputs) {
      if (!validationNote) return;
      var names = invalidInputs.map(fieldLabelText);
      var list = names.length > 1
        ? names.slice(0, -1).join(", ") + " and " + names[names.length - 1]
        : names[0];
      validationNote.textContent = "Please check: " + list + ".";
      validationNote.hidden = false;
    }

    function hideValidationNote() {
      if (!validationNote) return;
      validationNote.hidden = true;
      validationNote.textContent = "";
    }

    // Clear a field's error state as soon as it becomes valid again.
    Array.prototype.forEach.call(form.querySelectorAll("input, textarea, select"), function (input) {
      input.addEventListener("input", function () {
        if (input.validity.valid) clearFieldError(input);
      });
    });

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

    var sending = false;

    form.addEventListener("submit", function (e) {
      e.preventDefault();
      if (sending) return; // a second tap or Enter while sending would post a duplicate enquiry

      var invalidInputs = Array.prototype.filter.call(
        form.querySelectorAll("input, textarea, select"),
        function (input) { return !input.validity.valid; }
      );

      if (invalidInputs.length) {
        invalidInputs.forEach(markFieldError);
        showValidationNote(invalidInputs);
        invalidInputs[0].focus();
        return;
      }
      hideValidationNote();

      sending = true;
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
            // The form shrinks to one line, so the page gets shorter and the
            // reader would be left looking at the footer: bring the section
            // back into view and move focus to the message so it's announced.
            document.getElementById("contact").scrollIntoView({ block: "start" });
            successMsg.focus({ preventScroll: true });
          } else {
            return res.json().then(function (data) { throw data; });
          }
        })
        .catch(function () {
          sending = false;
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
  const textEl    = document.getElementById('review-modal-text');
  const nameEl    = document.getElementById('review-modal-name');
  const metaEl    = document.getElementById('review-modal-meta');

  function openModal(card) {
    const fullDiv = card.querySelector('.review-full');
    if (!fullDiv) return;

    var nameNode   = card.querySelector('.review-card-name');
    var sourceNode = card.querySelector('.review-card-source');
    var avatarNode = card.querySelector('.review-card-avatar');

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
    watcher = watchClose(closeModal);
  }

  var watcher = null;
  var box = modal.querySelector('.review-modal-box');

  function closeModal() {
    box.classList.remove('is-dragging');
    box.style.transform = '';
    modal.classList.remove('open');
    modal.setAttribute('aria-hidden', 'true');
    document.body.style.overflow = '';
    if (watcher) { var w = watcher; watcher = null; w.destroy(); }
  }

  /* Swipe down to dismiss (phones, where the review is a bottom sheet).
     A quick flick closes it even if it's short; dragging up meets resistance. */
  var handle = modal.querySelector('.sheet-handle');
  var drag = null;
  if (handle) {
    handle.addEventListener('pointerdown', function (e) {
      if (drag || !modal.classList.contains('open')) return; // ignore a second finger
      drag = { id: e.pointerId, y: e.clientY, t: performance.now(), dy: 0 };
      handle.setPointerCapture(e.pointerId);
      box.classList.add('is-dragging');
    });
    handle.addEventListener('pointermove', function (e) {
      if (!drag || e.pointerId !== drag.id) return;
      var dy = e.clientY - drag.y;
      drag.dy = dy;
      var shown = dy >= 0 ? dy : -Math.sqrt(-dy) * 2; // friction past the top
      box.style.transform = 'translateY(' + shown + 'px)';
    });
    var release = function (e) {
      if (!drag || e.pointerId !== drag.id) return;
      var dy = drag.dy, velocity = dy / Math.max(1, performance.now() - drag.t);
      drag = null;
      if (dy > box.offsetHeight * 0.25 || velocity > 0.11) {
        closeModal();
      } else {
        box.classList.remove('is-dragging');
        box.style.transform = '';
      }
    };
    handle.addEventListener('pointerup', release);
    handle.addEventListener('pointercancel', release);
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
