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
      if (form.getAttribute("data-submitting") === "true") return;
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
      form.setAttribute("data-submitting", "true");
      btn.disabled = true;
      btn.setAttribute("aria-busy", "true");
      var label = btn.textContent;
      btn.textContent = "Submitting request…";
      status.hidden = true;

      var body = new FormData(form);
      if (form.getAttribute("data-form-type") === "rfq2") {
        var rfq = form.closest("[data-rfq]");
        var firstStep = rfq && $('[data-form-type="rfq1"]', rfq);
        if (firstStep) {
          new FormData(firstStep).forEach(function (value, key) {
            if (key !== "form_type" && key !== "lead_id" && !body.has(key)) body.append(key, value);
          });
        }
        body.set("form_type", "rfq1");
      }

      fetch(cfg.leadApiUrl || form.action, { method: "POST", body: body, headers: { Accept: "application/json" } })
        .then(function (response) {
          return response.text().then(function (text) {
            var contentType = response.headers.get("content-type") || "";
            if (!response.ok) throw new Error("Request failed (" + response.status + "): " + text.slice(0, 200));
            if (contentType.toLowerCase().indexOf("application/json") === -1) {
              throw new Error("Expected JSON but received " + (contentType || "an unknown response") + ": " + text.slice(0, 200));
            }
            try { return JSON.parse(text); }
            catch (parseError) { throw new Error("Invalid JSON response: " + parseError.message + ": " + text.slice(0, 200)); }
          });
        })
        .then(function (data) {
          if (!data || data.ok !== true) throw new Error(data && data.error ? data.error : "The server did not confirm the request.");
          var catSel = $('[name="category"]', form);
          track(form.getAttribute("data-event"), { category: (catSel && catSel.value) || form.getAttribute("data-category") || "" });
          if (window.AAQuote && /^(rfq1|rfq2|sample)$/.test(form.getAttribute("data-form-type"))) window.AAQuote.clear();

          if (form.getAttribute("data-form-type") === "rfq1") {
            var wrap = form.closest("[data-rfq]");
            var step2 = wrap && wrap.querySelectorAll("form")[1];
            if (step2) {
              $("[data-lead-id]", step2).value = data.lead_id || "";
              form.hidden = true;
              step2.hidden = false;
              var done = $("[data-step-done]", step2);
              done.focus();
              wrap.scrollIntoView({ behavior: "smooth", block: "start" });
              return;
            }
          }
          location.href = data.redirect || $('[name="redirect"]', form).value;
        })
        .catch(function (err) {
          console.error("Lead form submission failed:", err);
          form.setAttribute("data-submitting", "false");
          btn.disabled = false;
          btn.removeAttribute("aria-busy");
          btn.textContent = label;
          status.className = "form-status form-status--error";
          status.hidden = false;
          status.textContent = "Unable to submit your request right now. Please try again or contact our team directly.";
        });
    });
  });

  /* ---------- Quote list (per-visitor, stored in this browser) ---------- */
  var QKEY = "aa_quote";
  function qLoad() { try { return JSON.parse(localStorage.getItem(QKEY) || "[]") || []; } catch (e) { return []; } }
  function qSave(list) { try { localStorage.setItem(QKEY, JSON.stringify(list)); } catch (e) {} qSync(); }
  function qHas(ref) { return qLoad().some(function (x) { return x.ref === ref; }); }
  var toastEl = $("[data-toast]"), toastTimer;
  function toast(html) {
    if (!toastEl) return;
    toastEl.innerHTML = html; toastEl.hidden = false;
    clearTimeout(toastTimer); toastTimer = setTimeout(function () { toastEl.hidden = true; }, 3500);
  }
  function esc(t) { var d = document.createElement("div"); d.textContent = t; return d.innerHTML; }
  function imgBase() { var l = document.querySelector('link[rel="stylesheet"][href*="assets/css/site.css"]'); return l ? l.getAttribute("href").replace("css/site.css", "img/products/") : "/assets/img/products/"; }
  function qSync() {
    var list = qLoad();
    $all("[data-quote-count]").forEach(function (c) { c.textContent = String(list.length); if (list.length) c.removeAttribute("data-zero"); else c.setAttribute("data-zero", ""); });
    $all("[data-quote-summary]").forEach(function (c) {
      c.textContent = list.length === 1 ? "1 product in your request" : list.length + " products in your request";
    });
    $all("[data-add]").forEach(function (b) { var d = JSON.parse(b.getAttribute("data-add")); b.setAttribute("aria-pressed", String(qHas(d.ref))); });
    $all("[data-quote-items]").forEach(function (i) { i.value = list.map(function (x) { return x.ref + " " + x.name + " (" + x.cat + ")"; }).join("; "); });
    var box = $("[data-quote-list]");
    if (box) {
      $all(".qitem", box).forEach(function (n) { n.remove(); });
      var empty = $("[data-quote-empty]", box); if (empty) empty.hidden = list.length > 0;
      var base = imgBase();
      list.forEach(function (x) {
        var row = document.createElement("div"); row.className = "qitem";
        row.innerHTML = '<img src="' + base + esc(x.img) + '-s.webp" width="64" height="48" alt=""><span><strong>' + esc(x.name) + '</strong><span class="ref">REF ' + esc(x.ref) + " · " + esc(x.cat) + '</span></span><button type="button" aria-label="Remove ' + esc(x.name) + '">&times;</button>';
        $("button", row).addEventListener("click", function () { qSave(qLoad().filter(function (y) { return y.ref !== x.ref; })); });
        box.appendChild(row);
      });
      if (list.length) { var sel = $('#quote-category'); if (sel && !sel.value) { var slugs = list.map(function (x) { return x.slug; }).filter(function (v, i, a) { return a.indexOf(v) === i; }); sel.value = slugs.length === 1 ? slugs[0] : "several"; } }
      if (document.querySelector('[data-rfq-summary-products]')) {
        var text = list.length ? list.map(function (x) { return x.name; }).slice(0, 3).join(', ') + (list.length > 3 ? ' + ' + (list.length - 3) + ' more' : '') : 'No products selected';
        document.querySelector('[data-rfq-summary-products]').textContent = text;
      }
    }
  }
  window.AAQuote = { clear: function () { qSave([]); } };
  $all("[data-add]").forEach(function (b) {
    b.addEventListener("click", function () {
      var d = JSON.parse(b.getAttribute("data-add")); var list = qLoad();
      if (qHas(d.ref)) { qSave(list.filter(function (x) { return x.ref !== d.ref; })); return; }
      list.push(d); qSave(list);
      var link = $("[data-quote-link]");
      toast(esc(d.name) + ' added to your quote list. <a href="' + (link ? link.getAttribute("href") : "/request-quote/") + '">View list (' + list.length + ")</a>");
      track("add_to_quote", { category: d.slug });
    });
  });
  window.addEventListener("storage", function (e) { if (e.key === QKEY) qSync(); });
  qSync();

  /* ---------- RFQ step flow ---------- */
  function syncRfqSteps() {
    var forms = $all("[data-rfq-step]");
    if (!forms.length) return;
    var active = forms.filter(function (f) { return !f.hidden; })[0] || forms[0];
    var index = forms.indexOf(active);
    $all("[data-rfq-step-indicator]").forEach(function (step) {
      var val = Number(step.getAttribute("data-rfq-step-indicator"));
      step.classList.toggle("is-current", val === index + 1);
      step.classList.toggle("is-complete", val < index + 1);
    });
  }

  $all("[data-rfq-continue]").forEach(function (btn) {
    btn.addEventListener("click", function () {
      var form = btn.closest("form");
      if (!form) return;
      var inputs = $all("input, select, textarea", form).filter(function (i) {
        return !(i.type === "hidden" || i.type === "submit" || i.type === "button");
      });
      var valid = true;
      inputs.forEach(function (input) {
        if (input.required) {
          var checked = input.checkValidity();
          if (checked) { setError(input, null); }
          else { setError(input, messageFor(input)); valid = false; }
        }
      });
      if (!valid) {
        var summary = $("[data-error-summary]", form);
        if (summary) {
          summary.hidden = false;
          summary.scrollIntoView({ behavior: "smooth", block: "start" });
        }
        form.scrollIntoView({ behavior: "smooth", block: "start" });
        return;
      }
      var next = form.nextElementSibling;
      if (next && next.tagName === "FORM") {
        form.hidden = true;
        next.hidden = false;
        next.querySelector("input, select, textarea") && next.querySelector("input, select, textarea").focus();
        syncRfqSteps();
        var summaryReq = $("[data-rfq-summary-requirement]", next);
        var quantity = $("[name='quantity']", form); 
        var req = $("[name='message']", form);
        var category = $("[name='category']", form);
        if (summaryReq) summaryReq.textContent = (req && req.value.trim()) ? req.value.trim() : 'Not provided';
        if (document.querySelector('[data-rfq-summary-quantity]')) {
          document.querySelector('[data-rfq-summary-quantity]').textContent = (quantity && quantity.value.trim()) ? quantity.value.trim() : 'Not provided';
        }
        if (category && category.value && document.querySelector('[data-rfq-summary-products]')) {
          var catLabel = category.options[category.selectedIndex] ? category.options[category.selectedIndex].text : category.value;
          var productLabel = qLoad().length ? qLoad().slice(0, 3).map(function (x) { return x.name; }).join(', ') : catLabel;
          document.querySelector('[data-rfq-summary-products]').textContent = productLabel || 'No products selected';
        }
      }
    });
  });

  $all("[data-rfq-back]").forEach(function (btn) {
    btn.addEventListener("click", function () {
      var form = btn.closest("form");
      var prev = form.previousElementSibling;
      if (prev && prev.tagName === "FORM") {
        form.hidden = true;
        prev.hidden = false;
        prev.scrollIntoView({ behavior: "smooth", block: "start" });
        syncRfqSteps();
      }
    });
  });

  syncRfqSteps();

  /* ---------- Product search ---------- */
  var index = null;
  function loadIndex() {
    if (index) return Promise.resolve(index);
    var l = document.querySelector('link[rel="stylesheet"][href*="assets/css/site.css"]');
    var url = l ? l.getAttribute("href").replace("assets/css/site.css", "search.json") : "/search.json";
    return fetch(url).then(function (r) { return r.json(); }).then(function (j) { index = j; return j; }).catch(function () { index = []; return index; });
  }
  function norm(t) { return String(t).toLowerCase().replace(/[^a-z0-9µβ ]+/g, " "); }
  $all("[data-search]").forEach(function (box) {
    var input = $("[data-search-input]", box), out = $("[data-search-results]", box), active = -1;
    function close() { out.hidden = true; input.setAttribute("aria-expanded", "false"); active = -1; }
    function render(q) {
      loadIndex().then(function (ix) {
        var words = norm(q).split(/\s+/).filter(Boolean);
        if (!words.length) { close(); return; }
        var hits = ix.filter(function (it) { var k = norm(it.k + " " + it.t); return words.every(function (w) { return k.indexOf(w) > -1; }); }).slice(0, 8);
        var base = imgBase(), root = imgBase().replace("assets/img/products/", "");
        out.innerHTML = hits.length ? hits.map(function (h, i) {
          var u = h.u.replace(/^\//, root).replace(/\/(#|$)/, function (m, p1) { return root === "/" ? m : "/index.html" + p1; });
          return '<li role="option" id="' + input.id + "-o" + i + '"><a href="' + u + '"><img src="' + base + h.i + '-s.webp" alt="" width="52" height="39"><span><strong>' + esc(h.t) + '</strong><span class="ref">' + esc(h.r) + "</span></span></a></li>";
        }).join("") : '<li class="search-empty">No match. Try an analyte such as aflatoxin, or <a href="' + root + (root === "/" ? "request-quote/" : "request-quote/index.html") + '">ask us</a>.</li>';
        out.hidden = false; input.setAttribute("aria-expanded", "true"); active = -1;
      });
    }
    input.addEventListener("input", function () { render(input.value); });
    input.addEventListener("focus", function () { loadIndex(); if (input.value) render(input.value); });
    input.addEventListener("keydown", function (e) {
      var links = $all("a", out);
      if (e.key === "ArrowDown" || e.key === "ArrowUp") {
        if (!links.length) return; e.preventDefault();
        active = (active + (e.key === "ArrowDown" ? 1 : -1) + links.length) % links.length;
        links.forEach(function (a, i) { a.setAttribute("aria-selected", String(i === active)); });
        input.setAttribute("aria-activedescendant", input.id + "-o" + active);
      } else if (e.key === "Enter" && active > -1 && links[active]) { e.preventDefault(); location.href = links[active].href; }
      else if (e.key === "Escape") { close(); }
    });
    document.addEventListener("click", function (e) { if (!box.contains(e.target)) close(); });
  });
  var sToggle = $("[data-search-toggle]"), mSearch = $("#mobile-search");
  if (sToggle && mSearch) sToggle.addEventListener("click", function () {
    var open = mSearch.hidden; mSearch.hidden = !open; sToggle.setAttribute("aria-expanded", String(open));
    if (open) $("input", mSearch).focus();
  });
})();
