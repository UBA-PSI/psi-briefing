/* ==========================================================================
   browserslides — runtime
   Zero dependencies. Drop this in at the end of <body>. It wires up the deck
   chrome (nav dots, keyboard, page numbers, detail layers, cross-reference
   previews, lightboxes, image stacks, the portrait hint) and exposes a small
   charting helper on window.Browserslides.

   MIT License — see LICENSE. Copyright (c) 2026 Dominik Herrmann.
   ========================================================================== */
(function () {
  "use strict";

  const NS = "http://www.w3.org/2000/svg";
  const reduceMotion = () => matchMedia("(prefers-reduced-motion: reduce)").matches;
  const smooth = () => (reduceMotion() ? "auto" : "smooth");

  /* Read a CSS custom property off :root, so charts inherit the active theme.
     Pass a fallback for safety. */
  function token(name, fallback) {
    const v = getComputedStyle(document.documentElement).getPropertyValue(name).trim();
    return v || fallback || "#000";
  }

  function svgEl(name, attrs, parent) {
    const e = document.createElementNS(NS, name);
    for (const k in attrs) e.setAttribute(k, attrs[k]);
    if (parent) parent.appendChild(e);
    return e;
  }

  /* Rounded top on a bar, square base. */
  function barPath(x, y, w, h, r) {
    r = Math.min(r, w / 2, h);
    return `M${x},${y + h} L${x},${y + r} Q${x},${y} ${x + r},${y} L${x + w - r},${y} Q${x + w},${y} ${x + w},${y + r} L${x + w},${y + h} Z`;
  }

  /* --- Tooltip plumbing shared by all charts --------------------------- */
  function attachTooltip(box, tt, hitEl, html) {
    hitEl.addEventListener("pointerenter", () => { tt.innerHTML = html; tt.style.opacity = 1; });
    hitEl.addEventListener("pointermove", (ev) => {
      const r = box.getBoundingClientRect();
      let x = ev.clientX - r.left + 12, y = ev.clientY - r.top - 10;
      if (x > r.width - tt.offsetWidth - 16) x = ev.clientX - r.left - tt.offsetWidth - 12;
      tt.style.left = x + "px"; tt.style.top = y + "px";
    });
    hitEl.addEventListener("pointerleave", () => { tt.style.opacity = 0; });
  }

  function ensureTooltip(box) {
    let tt = box.querySelector(".tooltip");
    if (!tt) { tt = document.createElement("div"); tt.className = "tooltip"; box.appendChild(tt); }
    return tt;
  }

  /* ======================================================================
     PUBLIC: barChart(target, config)
     A responsive SVG bar chart that themes itself from CSS tokens.

     target  — a .chartbox element or a selector for one.
     config:
       data      : [ {value, label?, color?, tooltip?}, ... ]  (or plain numbers)
       max       : y-axis maximum (default: 1.1 × largest value, rounded up)
       gridlines : array of y values to draw (default: 5 evenly-spaced)
       barColor  : default bar fill token/colour (default var(--accent))
       radius    : rounded-corner radius in SVG units (default 4)
       labelEvery: draw an x-axis label every N bars (default: all)
       yLabels   : show numeric y-axis labels (default true)
       valueLabels: draw each bar's value on top (default false)
       markers   : optional overlay [{index, label, color?, level?, anchor?}]
                   for milestones — dashed line + dot + text, staggered by level.
     Returns a controller { redraw() }.
     ====================================================================== */
  function barChart(target, config) {
    const box = typeof target === "string" ? document.querySelector(target) : target;
    if (!box) return null;
    const cfg = config || {};
    const raw = (cfg.data || []).map((d) => (typeof d === "number" ? { value: d } : d));
    const tt = ensureTooltip(box);

    const H = 480, padL = cfg.yLabels === false ? 8 : 46, padR = 8;
    const padT = cfg.markers ? 96 : 20, padB = 30;
    const values = raw.map((d) => d.value || 0);
    const dataMax = Math.max(1, ...values);
    const max = cfg.max || Math.ceil((dataMax * 1.1) / 5) * 5;
    const gridlines = cfg.gridlines || defaultGrid(max);
    const radius = cfg.radius != null ? cfg.radius : 4;
    const barColor = cfg.barColor ? resolveColor(cfg.barColor) : token("--accent", "#234e70");
    const gridColor = token("--muted-soft", "#ececeb");
    const axisColor = token("--muted", "#7c7c78");
    const markerColor = token("--danger", "#d64550");

    let svg = null;
    function redraw() {
      const bw = box.clientWidth, bh = box.clientHeight;
      if (!bw || !bh) return;
      const W = Math.round(H * bw / bh); // keep aspect so bars/text never distort
      if (svg) svg.remove();
      svg = svgEl("svg", { viewBox: `0 0 ${W} ${H}`, role: "img", "aria-label": cfg.ariaLabel || "Bar chart" }, box);
      const iw = (W - padL - padR) / raw.length;
      const y = (v) => padT + (H - padT - padB) * (1 - v / max);

      gridlines.forEach((g, gi) => {
        svgEl("line", { x1: padL, x2: W - padR, y1: y(g), y2: y(g), stroke: gridColor, "stroke-width": gi === 0 ? 2 : 1 }, svg);
        if (cfg.yLabels !== false)
          svgEl("text", { x: padL - 8, y: y(g) + 5, "text-anchor": "end", "font-size": 15, fill: axisColor }, svg).textContent = g;
      });

      raw.forEach((d, i) => {
        const v = d.value || 0;
        const x = padL + i * iw;
        const fill = d.color ? resolveColor(d.color) : barColor;
        const pad = Math.min(iw * 0.12, 6);
        if (v > 0) svgEl("path", { d: barPath(x + pad, y(v), iw - pad * 2, y(0) - y(v), radius), fill }, svg);
        if (cfg.valueLabels && v > 0)
          svgEl("text", { x: x + iw / 2, y: y(v) - 8, "text-anchor": "middle", "font-size": 15, fill: token("--ink-soft", "#4a4a48") }, svg).textContent = v;
        const hit = svgEl("rect", { x, y: padT - (cfg.markers ? 10 : 0), width: iw, height: H - padT - padB + (cfg.markers ? 10 : 0), fill: "transparent" }, svg);
        attachTooltip(box, tt, hit, d.tooltip || `<b>${d.label != null ? d.label : i}</b> &nbsp; ${v}`);
        const showLabel = cfg.labelEvery ? i % cfg.labelEvery === 0 : d.label != null;
        if (showLabel && d.label != null)
          svgEl("text", { x: x + iw / 2, y: H - 10, "text-anchor": "middle", "font-size": 15, fill: axisColor }, svg).textContent = d.label;
      });

      (cfg.markers || []).forEach((m) => {
        const x = padL + m.index * iw + iw / 2;
        const yTop = 20 + (m.level || 0) * 26;
        svgEl("line", { x1: x, x2: x, y1: yTop + 8, y2: y(0), stroke: m.color ? resolveColor(m.color) : markerColor, "stroke-width": 2, "stroke-dasharray": "5 4" }, svg);
        svgEl("circle", { cx: x, cy: yTop + 8, r: 5, fill: m.color ? resolveColor(m.color) : markerColor }, svg);
        const anchor = m.anchor || "start";
        const dx = anchor === "start" ? 10 : -10;
        svgEl("text", { x: x + dx, y: yTop + 13, "font-size": 16, fill: m.color ? resolveColor(m.color) : markerColor, "font-weight": "700", "text-anchor": anchor }, svg).textContent = m.label;
      });
    }

    redraw();
    if (window.ResizeObserver) new ResizeObserver(redraw).observe(box);
    else addEventListener("resize", redraw);
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(redraw);
    return { redraw };
  }

  function defaultGrid(max) {
    const step = max / 4;
    return [0, step, step * 2, step * 3, max].map((n) => Math.round(n));
  }

  /* Accept either a raw colour or a "--token" name. */
  function resolveColor(c) {
    return c && c.startsWith("--") ? token(c, "#000") : c;
  }

  /* ======================================================================
     DECK CHROME — auto-initialised on DOMContentLoaded
     ====================================================================== */
  function initDeck() {
    /* A missing lang used to be filled in with "en". That is a guess, and a
       wrong guess is worse than none: the browser picks its hyphenation
       dictionary from this attribute, so an undeclared German deck would get
       English break points, and a screen reader would read it in English.
       Left undeclared, hyphenation simply does not happen - the safe failure.
       So: say something, but do not invent an answer. */
    if (!document.documentElement.lang) {
      console.warn("browserslides: <html> has no lang attribute. Set it - " +
        "hyphenation and screen readers both depend on it.");
    }
    const frames = [...document.querySelectorAll(".frame")];
    if (!frames.length) return;

    /* Nav dots (created if a .dots container exists) */
    const nav = document.querySelector(".dots");
    let dots = [];
    if (nav) {
      dots = frames.map((f, i) => {
        const a = document.createElement("a");
        a.href = "#"; a.setAttribute("aria-label", `Slide ${i + 1}`);
        a.addEventListener("click", (ev) => { ev.preventDefault(); f.scrollIntoView({ behavior: smooth() }); });
        nav.appendChild(a); return a;
      });
      const io = new IntersectionObserver((entries) => {
        entries.forEach((en) => {
          if (en.isIntersecting) {
            const i = frames.indexOf(en.target);
            dots.forEach((d, j) => d.classList.toggle("active", j === i));
          }
        });
      }, { threshold: 0.6 });
      frames.forEach((f) => io.observe(f));
    }

    /* Page numbers: fill any .pagenum with "n / total" */
    frames.forEach((f, i) => {
      const el = f.querySelector(".pagenum");
      if (el) el.textContent = `${i + 1} / ${frames.length}`;
    });

    /* Keyboard navigation */
    const activeIndex = () => {
      if (dots.length) { const c = dots.findIndex((d) => d.classList.contains("active")); if (c >= 0) return c; }
      // fall back to whichever frame is nearest the viewport centre
      const mid = innerHeight / 2;
      let best = 0, bestD = Infinity;
      frames.forEach((f, i) => { const r = f.getBoundingClientRect(); const d = Math.abs((r.top + r.bottom) / 2 - mid); if (d < bestD) { bestD = d; best = i; } });
      return best;
    };
    document.addEventListener("keydown", (ev) => {
      if (ev.target.matches && ev.target.matches("input, textarea, [contenteditable]")) return;
      /* Something nearer the target already claimed this key. Without the
         check, Space on a focused .bottomline opened its detail layer AND
         advanced the deck: that handler calls preventDefault, but preventDefault
         does not stop the event bubbling here. */
      if (ev.defaultPrevented) return;
      /* An overlay is up: the keys belong to it, not to the deck. Without this,
         ArrowRight scrolled the deck to the next slide BEHIND an open detail
         layer, which stayed open on a slide you were no longer looking at. */
      if (overlayOpen()) return;
      const cur = activeIndex();
      if (["ArrowRight", "ArrowDown", "PageDown", " "].includes(ev.key) && cur < frames.length - 1) {
        ev.preventDefault(); frames[cur + 1].scrollIntoView({ behavior: smooth() });
      } else if (["ArrowLeft", "ArrowUp", "PageUp"].includes(ev.key) && cur > 0) {
        ev.preventDefault(); frames[cur - 1].scrollIntoView({ behavior: smooth() });
      } else if (ev.key === "Home") { ev.preventDefault(); frames[0].scrollIntoView({ behavior: smooth() }); }
      else if (ev.key === "End") { ev.preventDefault(); frames[frames.length - 1].scrollIntoView({ behavior: smooth() }); }
    });
  }

  /* True while anything is covering the slide. The deck's own keyboard handler
     stands down for as long as this holds. */
  function overlayOpen() {
    return !!document.querySelector(".detail-layer.open, .shot-layer.open, .zoom-ov");
  }

  /* ======================================================================
     DETAIL LAYERS — the "reveal" behind a .bottomline strip

     A .detail-layer is a full-slide panel (position:absolute; inset:0) that is
     NOT part of the scroll path: it has no frame, no page number and no nav
     dot, so it cannot be reached by paging through the deck. That is the point.
     Use it for the depth that would otherwise force a slide nobody needs to see
     in the linear run - a derivation, a caveat, the numbers behind a claim.

     One trigger opens one layer. The pairing is by DOM position: the layer is
     the trigger's next sibling. If it is not, the nth trigger in the slide takes
     the nth layer, and anything left ambiguous gets a console warning rather
     than a silently wrong panel - the old code fell back to the slide's FIRST
     layer, so on a slide with two reveals both buttons opened the same one.
     ====================================================================== */
  let layerUid = 0;

  function initDetailLayers() {
    document.querySelectorAll(".slide").forEach((slide) => {
      const triggers = [...slide.querySelectorAll(".bottomline")];
      const layers = [...slide.querySelectorAll(".detail-layer")];

      triggers.forEach((b, i) => {
        const sib = b.nextElementSibling;
        let layer = sib && sib.classList && sib.classList.contains("detail-layer") ? sib : layers[i];
        if (!layer) {
          console.warn("browserslides: .bottomline with no .detail-layer to open", b);
          return;
        }
        if (layer !== sib) {
          console.warn("browserslides: .detail-layer is not the next sibling of its " +
            ".bottomline; paired by position instead. Put them next to each other.", b);
        }
        if (!layer.id) layer.id = `bs-layer-${++layerUid}`;
        layer.setAttribute("role", "dialog");
        layer.setAttribute("aria-modal", "true");
        /* So the panel itself can take focus when it holds no close button. */
        if (!layer.hasAttribute("tabindex")) layer.tabIndex = -1;
        b.setAttribute("role", "button");
        b.setAttribute("aria-controls", layer.id);
        b.setAttribute("aria-expanded", "false");
        b.tabIndex = 0;

        const open = () => {
          layer.classList.add("open");
          b.setAttribute("aria-expanded", "true");
          layerOpener.set(layer, b);
          (layer.querySelector(".layer-close") || layer).focus();
        };
        b.addEventListener("click", open);
        b.addEventListener("keydown", (ev) => {
          if (ev.key === "Enter" || ev.key === " ") { ev.preventDefault(); open(); }
        });
      });
    });

    document.querySelectorAll(".layer-close").forEach((x) => {
      x.addEventListener("click", () => closeLayer(x.closest(".detail-layer")));
    });
    document.addEventListener("keydown", (ev) => {
      if (ev.key !== "Escape") return;
      /* Escape closes the TOPMOST overlay only. An image zoomed from inside a
         layer is above it, so that one goes first and the layer stays. */
      if (document.querySelector(".zoom-ov")) return;
      document.querySelectorAll(".detail-layer.open").forEach(closeLayer);
    });

    /* Keep Tab inside an open layer. Without it, tabbing walks out of the panel
       into the links of the slide underneath, which is invisible and confusing:
       the focus ring disappears behind an opaque overlay. */
    document.addEventListener("keydown", (ev) => {
      if (ev.key !== "Tab") return;
      const layer = document.querySelector(".detail-layer.open");
      if (!layer) return;
      const stops = [...layer.querySelectorAll(FOCUSABLE)].filter((el) => el.offsetParent !== null);
      if (!stops.length) { ev.preventDefault(); return; }
      const first = stops[0], last = stops[stops.length - 1];
      if (!layer.contains(document.activeElement)) { ev.preventDefault(); first.focus(); return; }
      if (ev.shiftKey && document.activeElement === first) { ev.preventDefault(); last.focus(); }
      else if (!ev.shiftKey && document.activeElement === last) { ev.preventDefault(); first.focus(); }
    });
  }

  const FOCUSABLE = 'a[href], button, [tabindex]:not([tabindex="-1"]), input, select, textarea';
  const layerOpener = new WeakMap();

  function closeLayer(layer) {
    if (!layer) return;
    layer.classList.remove("open");
    const opener = layerOpener.get(layer);
    if (opener) {
      opener.setAttribute("aria-expanded", "false");
      /* Focus goes back where it came from, or the reader is dumped at the top
         of the document with no idea which strip they just closed. */
      opener.focus();
    }
  }

  /* Cross-reference links: hover shows a mini preview, click jumps.
     Touch: first tap previews, second tap jumps. */
  function initGotoPreviews() {
    let prev = null, prevFor = null;
    const touchOnly = () => matchMedia("(hover: none)").matches;
    const clean = () => { if (prev) { prev.remove(); prev = null; prevFor = null; } };
    /* The href is author-written, so it can be a fragment that is not a valid
       CSS selector - "#3-rollen" throws in querySelector because an identifier
       may not start with a digit. getElementById takes the id as a string. */
    const byFragment = (a) => {
      const href = a.getAttribute("href") || "";
      return href.startsWith("#") ? document.getElementById(href.slice(1)) : null;
    };
    const show = (a) => {
      clean();
      const target = byFragment(a);
      const slide = target && target.querySelector(".slide");
      if (!slide) return;
      prev = document.createElement("div");
      prev.className = "slide-preview";
      const clone = slide.cloneNode(true);
      clone.querySelectorAll("[id]").forEach((el) => el.removeAttribute("id"));
      prev.appendChild(clone);
      document.body.appendChild(prev);
      const r = a.getBoundingClientRect(), pw = prev.offsetWidth, ph = prev.offsetHeight;
      const x = Math.min(Math.max(8, r.left), innerWidth - pw - 8);
      let y = r.top - ph - 12;
      if (y < 8) y = Math.min(r.bottom + 12, innerHeight - ph - 8);
      prev.style.left = x + "px"; prev.style.top = y + "px";
      prevFor = a;
    };
    document.addEventListener("mouseover", (e) => {
      if (touchOnly()) return;
      const a = e.target.closest && e.target.closest("a.goto");
      if (a) show(a);
    });
    document.addEventListener("mouseout", (e) => {
      if (touchOnly()) return;
      if (e.target.closest && e.target.closest("a.goto")) clean();
    });
    document.addEventListener("click", (e) => {
      const a = e.target.closest && e.target.closest("a.goto");
      if (!a) return;
      e.preventDefault();
      if (touchOnly() && prevFor !== a) { show(a); return; }
      clean();
      const t = byFragment(a);
      // smooth() and not a literal: every other jump in the deck honours
      // prefers-reduced-motion, and this one was the exception.
      if (t) t.scrollIntoView({ behavior: smooth() });
    });
    addEventListener("scroll", clean, { passive: true });
  }

  /* In-slide screenshot overlays (.shot-link → #shot-layer) */
  function initShotLayers() {
    document.querySelectorAll(".shot-link").forEach((b) => {
      b.addEventListener("click", (e) => {
        e.stopPropagation();
        const layer = document.getElementById(b.dataset.shot);
        if (layer) layer.classList.add("open");
      });
    });
    document.querySelectorAll(".shot-layer").forEach((l) => {
      l.addEventListener("click", () => l.classList.remove("open"));
    });
    document.addEventListener("keydown", (ev) => {
      if (ev.key === "Escape") document.querySelectorAll(".shot-layer.open").forEach((l) => l.classList.remove("open"));
    });
  }

  /* Universal image lightbox.
     Every image on a slide zooms — no class needed (img.zoomable still works for
     images outside a slide). Exceptions, so we don't fight other interactions:
     images already inside an overlay, and an unpinned .stack-card (there the
     first click pins the card; once pinned, a second click zooms it). */
  function initZoomable() {
    let ov = null;
    const close = () => { if (ov) { ov.remove(); ov = null; } };
    const zoomable = (img) => {
      if (img.closest(".zoom-ov, .shot-layer, .slide-preview")) return false;
      const card = img.closest(".stack-card");
      if (card && !card.classList.contains("pinned")) return false;
      return img.classList.contains("zoomable") || !!img.closest(".slide");
    };
    document.addEventListener("click", (e) => {
      if (e.bsPinnedNow) return;            // this click pinned a stack card
      const img = e.target.closest && e.target.closest("img");
      if (!img || !zoomable(img)) return;
      close();
      ov = document.createElement("div"); ov.className = "zoom-ov";
      const big = document.createElement("img");
      big.src = img.currentSrc || img.src; big.alt = img.alt || "";
      ov.appendChild(big);
      // Carry the caption into the overlay when the image has one.
      const cap = img.closest("figure") && img.closest("figure").querySelector("figcaption");
      const capText = (cap && cap.textContent.trim()) || img.alt;
      if (capText) {
        const c = document.createElement("p");
        c.className = "zoom-cap"; c.textContent = capText;
        ov.appendChild(c);
      }
      ov.addEventListener("click", close);
      document.body.appendChild(ov);
    });
    document.addEventListener("keydown", (ev) => { if (ev.key === "Escape") close(); });
  }

  /* Image stack: click a card to pin it to the front.
     This runs on the card (bubbling) before the document-level zoom handler, so
     mark the event when a click *changes* the pin — that click only pins, and
     the zoom handler skips it. A click on an already-pinned card zooms. */
  function initImageStacks() {
    document.querySelectorAll(".stack-stage").forEach((stage) => {
      const cards = stage.querySelectorAll(".stack-card");
      cards.forEach((card) => card.addEventListener("click", (ev) => {
        if (!card.classList.contains("pinned")) ev.bsPinnedNow = true;
        cards.forEach((c) => c.classList.toggle("pinned", c === card));
      }));
    });
  }

  /* Portrait hint dismiss */
  function initRotateHint() {
    const hint = document.getElementById("rotate-hint");
    if (hint) hint.addEventListener("click", () => hint.classList.add("rh-off"));
  }

  /* Optional light/dark toggle via a [data-theme-toggle] button */
  function initThemeToggle() {
    document.querySelectorAll("[data-theme-toggle]").forEach((btn) => {
      btn.addEventListener("click", () => {
        const root = document.documentElement;
        const now = root.getAttribute("data-theme") === "dark" ? "light" : "dark";
        root.setAttribute("data-theme", now);
      });
    });
  }

  /* Equalise side-by-side panels that are ALMOST the same height.
     Boxes ending within a few percent of each other read as sloppy; forcing
     them level reads as deliberate. Boxes of genuinely different length are
     left alone on purpose - stretching a short panel to match a long one just
     draws a border around empty space (see "Filling the frame" in the docs).
     Equalising is done with a class, not a pixel height, so it survives resize;
     the class is removed before measuring so the test sees natural heights. */
  const EQUALISE_TOLERANCE = 0.28;   // max relative height difference to level out

  function equaliseRows() {
    document.querySelectorAll(".cols").forEach((row) => {
      row.classList.remove("bs-equalised");
      // Only level panels that ARE their column. A column stacking prose over a
      // panel must keep its natural height, or the panel would be forced to the
      // full column height and overrun the text above it.
      const panels = [...row.children]
        .map((col) => (col.children.length === 1 ? col.querySelector(":scope > .panel") : null))
        .filter(Boolean);
      if (panels.length < 2 || panels.length !== row.children.length) return;
      const heights = panels.map((p) => p.getBoundingClientRect().height);
      const max = Math.max(...heights), min = Math.min(...heights);
      if (max > 0 && (max - min) / max <= EQUALISE_TOLERANCE) row.classList.add("bs-equalised");
    });
  }

  function initEqualise() {
    equaliseRows();
    let t;
    addEventListener("resize", () => { clearTimeout(t); t = setTimeout(equaliseRows, 120); });
    // Re-check once webfonts land, since they change text height.
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(equaliseRows);
  }

  function boot() {
    initDeck();
    initDetailLayers();
    initGotoPreviews();
    initShotLayers();
    initZoomable();
    initImageStacks();
    initRotateHint();
    initThemeToggle();
    initEqualise();
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", boot);
  else boot();

  window.Browserslides = { barChart, token, svgEl, barPath, attachTooltip };
})();
