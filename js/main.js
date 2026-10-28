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

  /* ---- Hero intro: misted glass the visitor wipes clear, once per visit ---- */
  var root = document.documentElement;
  var fog = document.querySelector(".hero-fog");
  var maskOk = window.CSS && CSS.supports &&
    (CSS.supports("mask-image", "url(a.png)") || CSS.supports("-webkit-mask-image", "url(a.png)")) &&
    (CSS.supports("backdrop-filter", "blur(1px)") || CSS.supports("-webkit-backdrop-filter", "blur(1px)"));

  // A page prerendered in the background (see the speculation rules in <head>)
  // runs its scripts before anyone sees it, so the glass waits until it's shown.
  function startIntro() {
    if (root.classList.contains("intro") && fog && !maskOk) {
      root.classList.add("fog-clear");
      fog.classList.add("is-done");
    } else if (root.classList.contains("intro") && fog) {
      try { sessionStorage.setItem("introSeen", "1"); } catch (e) {}

      var hero = fog.parentNode;
      var SCALE = 8;     // the mask is drawn at 1/8 size; stretching it back up softens the brush edge
      var BRUSH = 64;    // cursor brush radius in CSS px
      var mask = document.createElement("canvas");
      var ctx = mask.getContext("2d", { willReadFrequently: true });
      var finePointer = window.matchMedia("(hover: hover) and (pointer: fine)").matches;
      var last = null, dirty = false, applies = 0, moved = false, cleared = false, selfWiping = false;
      var idleTimer, hintTimer;

      var size = hero.getBoundingClientRect();
      mask.width = Math.ceil(size.width / SCALE);
      mask.height = Math.ceil(size.height / SCALE);
      ctx.fillStyle = "#fff";
      ctx.fillRect(0, 0, mask.width, mask.height);

      var applyMask = function () {
        var url = "url(" + mask.toDataURL() + ")";
        fog.style.webkitMaskImage = url;
        fog.style.maskImage = url;
      };
      applyMask();

      // Share of the glass already wiped, sampled from the mask's alpha.
      var wipedShare = function () {
        var px = ctx.getImageData(0, 0, mask.width, mask.height).data, clear = 0;
        for (var i = 3; i < px.length; i += 4) if (px[i] < 128) clear++;
        return clear / (px.length / 4);
      };

      var frame = function () {
        if (!dirty || cleared) return;
        dirty = false;
        applyMask();
        // the 40% shortcut is for people wiping by hand; the self-wipe plays out in full
        if (!selfWiping && ++applies % 6 === 0 && wipedShare() > 0.4) clearAll();
      };

      var dab = function (x, y, r) {
        var g = ctx.createRadialGradient(x, y, 0, x, y, r);
        g.addColorStop(0, "rgba(0,0,0,1)");
        g.addColorStop(0.6, "rgba(0,0,0,0.85)");
        g.addColorStop(1, "rgba(0,0,0,0)");
        ctx.fillStyle = g;
        ctx.beginPath();
        ctx.arc(x, y, r, 0, Math.PI * 2);
        ctx.fill();
      };

      // Wipe from the previous point to this one (both in hero px), dabbing along the way.
      var stroke = function (x, y, radius) {
        var r = radius / SCALE, mx = x / SCALE, my = y / SCALE;
        ctx.globalCompositeOperation = "destination-out";
        if (!last) last = { x: mx, y: my };
        var dx = mx - last.x, dy = my - last.y;
        var steps = Math.max(1, Math.ceil(Math.sqrt(dx * dx + dy * dy) / (r / 3)));
        for (var i = 1; i <= steps; i++) dab(last.x + dx * i / steps, last.y + dy * i / steps, r);
        last = { x: mx, y: my };
        if (!dirty) { dirty = true; requestAnimationFrame(frame); }
      };

      var events = ["keydown", "wheel", "pointerdown"];
      // Phones fire small scroll events on their own while loading (address bar,
      // scroll restoration), so only a real scroll away from the top counts.
      var onScrollAway = function () { if (window.scrollY > 40) clearAll(); };
      var clearAll = function () {
        if (cleared) return;
        cleared = true;
        clearTimeout(idleTimer);
        clearTimeout(hintTimer);
        hero.removeEventListener("pointermove", onMove);
        window.removeEventListener("scroll", onScrollAway);
        events.forEach(function (t) { window.removeEventListener(t, clearAll); });
        fog.classList.remove("show-hint");
        fog.classList.add("is-clearing");
        root.classList.add("fog-clear");
        var done = function () { fog.classList.add("is-done"); };
        fog.addEventListener("transitionend", function (e) { if (e.target === fog) done(); });
        setTimeout(done, 900);
      };

      // A hand that wipes the glass by itself: three sweeping passes, then the rest fades.
      var selfWipe = function () {
        if (cleared || moved) return;
        selfWiping = true;
        fog.classList.remove("show-hint");
        var w = size.width, h = size.height, r = Math.max(70, h / 5);
        var pts = [[-0.05, 0.3], [1.05, 0.36], [1.05, 0.5], [-0.05, 0.56], [-0.05, 0.7], [1.05, 0.76]]
          .map(function (p) { return [p[0] * w, p[1] * h]; });
        var lens = [], total = 0;
        for (var i = 1; i < pts.length; i++) {
          var l = Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]);
          lens.push(l); total += l;
        }
        var start = performance.now(), DURATION = finePointer ? 1400 : 1700;
        last = null;
        var tick = function (now) {
          if (cleared) return;
          var t = Math.min(1, (now - start) / DURATION);
          var d = (0.5 - Math.cos(Math.PI * t) / 2) * total; // ease-in-out (sine)
          for (var j = 0; j < lens.length && d > lens[j]; j++) d -= lens[j];
          j = Math.min(j, lens.length - 1);
          var k = Math.min(1, d / lens[j]);
          stroke(pts[j][0] + (pts[j + 1][0] - pts[j][0]) * k, pts[j][1] + (pts[j + 1][1] - pts[j][1]) * k, r);
          if (t < 1) requestAnimationFrame(tick); else setTimeout(clearAll, 150);
        };
        requestAnimationFrame(tick);
      };

      var onMove = function (e) {
        if (e.pointerType === "touch") return;
        var rect = hero.getBoundingClientRect();
        if (!moved) { moved = true; last = null; fog.classList.remove("show-hint"); }
        stroke(e.clientX - rect.left, e.clientY - rect.top, BRUSH);
        clearTimeout(idleTimer);
        idleTimer = setTimeout(clearAll, 2200); // stopped wiping: finish the job
      };

      events.forEach(function (t) { window.addEventListener(t, clearAll, { passive: true }); });
      window.addEventListener("scroll", onScrollAway, { passive: true });
      if (finePointer) {
        hero.addEventListener("pointermove", onMove);
        hintTimer = setTimeout(function () { if (!moved) fog.classList.add("show-hint"); }, 700);
        idleTimer = setTimeout(selfWipe, 3500); // never touched the mouse: wipe it for them
      } else {
        idleTimer = setTimeout(selfWipe, 1100);
      }
    }
  }
  if (document.prerendering) {
    document.addEventListener("prerenderingchange", startIntro, { once: true });
  } else {
    startIntro();
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

  /* ---- 3. Scroll reveal ---- */
  var reveals = document.querySelectorAll(".reveal");
  var reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  // Cards in a row cascade in: each gets its index (capped at 4) as --i, which
  // the CSS turns into a 60ms-per-item delay.
  Array.prototype.forEach.call(
    document.querySelectorAll(".value-grid, .services-list, .tier-grid, .process-steps, .review-scatter"),
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
  // How it works: the connecting line draws itself once the steps scroll into view
  var timeline = document.querySelector(".timeline");
  if (timeline && !reduceMotion && "IntersectionObserver" in window) {
    timeline.classList.add("will-draw");
    var lineIo = new IntersectionObserver(function (entries) {
      if (!entries[0].isIntersecting) return;
      lineIo.disconnect();
      timeline.classList.add("is-drawn");
    }, { rootMargin: "0px 0px -25% 0px" });
    lineIo.observe(timeline);
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
