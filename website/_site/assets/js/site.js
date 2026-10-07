/* Acurris Analytical: site behavior. No framework, no dependencies. */
(function () {
  "use strict";
  var CONSENT_KEY = "aa_consent";
  var cfg = window.SITE || {};

  function $(sel, root) { return (root || document).querySelector(sel); }
  function $all(sel, root) { return Array.prototype.slice.call((root || document).querySelectorAll(sel)); }
  function store(key, val) {
    try { if (val === undefined) return localStorage.getItem(key); localStorage.setItem(key, val); } catch (e) { return null; }
  }

  /* ---------- Analytics (GA4 loads only after consent) ---------- */
  var gaLoaded = false;
  function loadGA() {
    if (gaLoaded || !cfg.ga4) return;
    gaLoaded = true;
    window.dataLayer = window.dataLayer || [];
    window.gtag = function () { window.dataLayer.push(arguments); };
    window.gtag("consent", "default", { ad_storage: "denied", ad_user_data: "denied", ad_personalization: "denied", analytics_storage: "granted" });
    window.gtag("js", new Date());
    window.gtag("config", cfg.ga4, { anonymize_ip: true });
    var s = document.createElement("script");
    s.async = true;
    s.src = "https://www.googletagmanager.com/gtag/js?id=" + encodeURIComponent(cfg.ga4);
    document.head.appendChild(s);
  }
  function track(name, params) {
    params = params || {};
    params.page_type = document.body.getAttribute("data-page-type") || "page";
    if (!params.category) params.category = document.body.getAttribute("data-category") || "";
    if (window.gtag && gaLoaded) window.gtag("event", name, params);
  }

  var banner = $("[data-consent]");
  function showBanner() { if (banner && cfg.ga4) banner.hidden = false; }
  if (cfg.ga4) {
    var choice = store(CONSENT_KEY);
    if (choice === "accept") loadGA();
    else if (!choice) showBanner();
  }
  $all("[data-consent-choice]").forEach(function (btn) {
    btn.addEventListener("click", function () {
      var v = btn.getAttribute("data-consent-choice");
      store(CONSENT_KEY, v);
      if (banner) banner.hidden = true;
      if (v === "accept") loadGA();
    });
  });
  $all("[data-consent-open]").forEach(function (a) {
    a.addEventListener("click", function (e) {
      e.preventDefault();
      if (cfg.ga4) { banner.hidden = false; $("button", banner).focus(); }
    });
  });

  document.addEventListener("click", function (e) {
    var t = e.target.closest("[data-track]");
    if (t) track(t.getAttribute("data-track"), { category: t.getAttribute("data-category") || undefined });
  });

  /* ---------- Footer groups: open on desktop, collapsed on mobile ---------- */
  var footMq = window.matchMedia("(min-width: 768px)");
  function syncFooter() { $all("[data-footer-details]").forEach(function (d) { d.open = footMq.matches; }); }
  syncFooter();
  if (footMq.addEventListener) footMq.addEventListener("change", syncFooter);

  /* ---------- Desktop mega menus ---------- */
  var megaToggles = $all("[data-mega-toggle]");
  function closeMegas(except) {
    megaToggles.forEach(function (b) {
      if (b === except) return;
      b.setAttribute("aria-expanded", "false");
      var p = document.getElementById(b.getAttribute("aria-controls"));
      if (p) p.hidden = true;
    });
  }
  megaToggles.forEach(function (btn) {
    btn.addEventListener("click", function () {
      var panel = document.getElementById(btn.getAttribute("aria-controls"));
      var open = btn.getAttribute("aria-expanded") === "true";
      closeMegas(btn);
      btn.setAttribute("aria-expanded", String(!open));
      panel.hidden = open;
    });
  });
  document.addEventListener("click", function (e) {
    if (!e.target.closest(".site-header")) closeMegas();
  });
  document.addEventListener("keydown", function (e) {
    if (e.key !== "Escape") return;
    var openBtn = megaToggles.filter(function (b) { return b.getAttribute("aria-expanded") === "true"; })[0];
    closeMegas();
    if (openBtn) openBtn.focus();
    if (drawerBtn && drawerBtn.getAttribute("aria-expanded") === "true") { setDrawer(false); drawerBtn.focus(); }
  });

  /* ---------- Mobile drawer ---------- */
  var drawerBtn = $("[data-drawer-toggle]");
  var drawer = $("#drawer");
  function setDrawer(open) {
    if (!drawerBtn || !drawer) return;
    drawerBtn.setAttribute("aria-expanded", String(open));
    drawerBtn.setAttribute("aria-label", open ? "Close menu" : "Open menu");
    drawer.hidden = !open;
    $("[data-icon-open]", drawerBtn).hidden = open;
    $("[data-icon-close]", drawerBtn).hidden = !open;
    document.body.classList.toggle("drawer-open", open);
  }
  if (drawerBtn) drawerBtn.addEventListener("click", function () { setDrawer(drawerBtn.getAttribute("aria-expanded") !== "true"); });

  /* ---------- Scroll reveal (respects reduced motion via CSS) ---------- */
  if ("IntersectionObserver" in window) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) { if (en.isIntersecting) { en.target.classList.add("is-visible"); io.unobserve(en.target); } });
    }, { rootMargin: "0px 0px -8% 0px" });
    $all(".reveal").forEach(function (el) { io.observe(el); });
  } else {
    $all(".reveal").forEach(function (el) { el.classList.add("is-visible"); });
  }

  /* ---------- Share (category pages) ---------- */
  $all("[data-share]").forEach(function (a) {
    a.addEventListener("click", function (e) {
      if (navigator.share) {
        e.preventDefault();
        navigator.share({ title: document.title, url: location.href }).catch(function () {});
      }
      track("share_click");
    });
  });

  /* ---------- URL prefill ---------- */
  var params = new URLSearchParams(location.search);
  var preCat = params.get("category");
  if (preCat) $all('select[name="category"]').forEach(function (s) {
    if ($('option[value="' + CSS.escape(preCat) + '"]', s)) s.value = preCat;
  });
  var ev = params.get("event");
  $all("[data-event-field]").forEach(function (i) { if (ev) i.value = ev.replace(/[-_]+/g, " "); });

  /* ---------- Forms ---------- */
  var startedAt = Date.now();
  $all("[data-ts]").forEach(function (i) { i.value = String(startedAt); });

  function fieldWrap(input) { return input.closest(".field") || input.parentNode; }
  function messageFor(input) {
    var label = input.getAttribute("data-label") || input.name;
    var v = input.validity;
    if (input.type === "checkbox" && v.valueMissing) return "Tick the box to agree to the privacy notice";
    if (v.valueMissing) return "Enter your " + label.toLowerCase();
    if (v.typeMismatch && input.type === "email") return "Enter an email address like name@company.com";
    if (v.patternMismatch && input.name === "mobile") return "Enter a 10-digit mobile number";
    if (v.patternMismatch && input.name === "gst") return "A GST number has 15 letters and digits";
    return "Check your " + label.toLowerCase();
  }
  function setError(input, msg) {
    var wrap = fieldWrap(input);
    var id = input.id + "-error";
    var el = document.getElementById(id);
    if (msg) {
      if (!el) {
        el = document.createElement("span");
        el.className = "field-error";
        el.id = id;
        (input.type === "checkbox" ? wrap : input).insertAdjacentElement(input.type === "checkbox" ? "beforeend" : "afterend", el);
      }
      el.textContent = msg;
      wrap.classList.add("has-error");
      var lbl = input.closest(".consent"); if (lbl) lbl.classList.add("has-error");
      input.setAttribute("aria-invalid", "true");
      var db = (input.getAttribute("aria-describedby") || "").split(" ").filter(Boolean);
      if (db.indexOf(id) < 0) { db.push(id); input.setAttribute("aria-describedby", db.join(" ")); }
    } else {
      if (el) el.remove();
      wrap.classList.remove("has-error");
      var lbl2 = input.closest(".consent"); if (lbl2) lbl2.classList.remove("has-error");
      input.removeAttribute("aria-invalid");
    }
  }
  function validateInput(input) {
    if (input.name === "mobile" && input.value) input.value = input.value.trim();
    var ok = input.checkValidity();
    setError(input, ok ? null : messageFor(input));
    return ok;
  }

  $all(".js-lead-form").forEach(function (form) {
    form.noValidate = true;
    var inputs = $all("input:not([type=hidden]):not([name=company_website]), select, textarea", form);
    inputs.forEach(function (i) {
      i.addEventListener("blur", function () { if (i.value || i.getAttribute("aria-invalid")) validateInput(i); });
      i.addEventListener("change", function () { if (i.getAttribute("aria-invalid")) validateInput(i); });
    });

    form.addEventListener("submit", function (e) {
      e.preventDefault();
      var summary = $("[data-error-summary]", form);
      var bad = inputs.filter(function (i) { return !validateInput(i); });
      if (bad.length) {
        var ul = $("ul", summary);
        ul.innerHTML = "";
        bad.forEach(function (i) {
          var li = document.createElement("li");
          var a = document.createElement("a");
          a.href = "#" + i.id;
          a.textContent = messageFor(i);
          a.addEventListener("click", function (ev2) { ev2.preventDefault(); i.focus(); });
          li.appendChild(a);
          ul.appendChild(li);
        });
        summary.hidden = false;
        summary.focus();
        return;
      }
      summary.hidden = true;

      var btn = $("button[type=submit]", form);
      var status = $("[data-status]", form);
      btn.disabled = true;
      btn.setAttribute("aria-busy", "true");
      var label = btn.textContent;
      btn.textContent = "Sending...";
      status.hidden = true;

      fetch(form.action, { method: "POST", body: new FormData(form), headers: { Accept: "application/json" } })
        .then(function (r) { return r.json().then(function (j) { return { ok: r.ok, j: j }; }); })
        .then(function (res) {
          if (!res.ok || !res.j.ok) throw new Error(res.j && res.j.error ? res.j.error : "send_failed");
          var catSel = $('[name="category"]', form);
          track(form.getAttribute("data-event"), { category: (catSel && catSel.value) || form.getAttribute("data-category") || "" });

          if (form.getAttribute("data-form-type") === "rfq1") {
            var wrap = form.closest("[data-rfq]");
            var step2 = wrap && wrap.querySelectorAll("form")[1];
            if (step2) {
              $("[data-lead-id]", step2).value = res.j.lead_id || "";
              form.hidden = true;
              step2.hidden = false;
              var done = $("[data-step-done]", step2);
              done.focus();
              wrap.scrollIntoView({ behavior: "smooth", block: "start" });
              return;
            }
          }
          location.href = res.j.redirect || $('[name="redirect"]', form).value;
        })
        .catch(function (err) {
          btn.disabled = false;
          btn.removeAttribute("aria-busy");
          btn.textContent = label;
          status.className = "form-status form-status--error";
          status.hidden = false;
          status.textContent = err && err.message && err.message !== "send_failed" && err.message.length < 160
            ? err.message
            : "We couldn't send your request. Please try again, or email " + (document.querySelector('a[href^="mailto:"]') || { textContent: "us" }).textContent + ".";
        });
    });
  });
})();
