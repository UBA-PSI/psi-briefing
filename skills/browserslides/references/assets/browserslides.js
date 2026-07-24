/* ==========================================================================
   browserslides — runtime
   Zero dependencies. Drop this in at the end of <body>. It wires up the deck
   chrome (nav dots, keyboard, page numbers, detail layers, cross-reference
   previews, lightboxes, image stacks, the portrait hint) and exposes a small
   charting helper on window.Browserslides.

   Licensed CC BY 4.0 — https://creativecommons.org/licenses/by/4.0/
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
    if (!document.documentElement.lang) document.documentElement.lang = "en";
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
      const cur = activeIndex();
      if (["ArrowRight", "ArrowDown", "PageDown", " "].includes(ev.key) && cur < frames.length - 1) {
        ev.preventDefault(); frames[cur + 1].scrollIntoView({ behavior: smooth() });
      } else if (["ArrowLeft", "ArrowUp", "PageUp"].includes(ev.key) && cur > 0) {
        ev.preventDefault(); frames[cur - 1].scrollIntoView({ behavior: smooth() });
      } else if (ev.key === "Home") { ev.preventDefault(); frames[0].scrollIntoView({ behavior: smooth() }); }
      else if (ev.key === "End") { ev.preventDefault(); frames[frames.length - 1].scrollIntoView({ behavior: smooth() }); }
    });
  }

  /* Detail layers behind .bottomline strips */
  function initDetailLayers() {
    document.querySelectorAll(".bottomline").forEach((b) => {
      b.setAttribute("role", "button");
      b.tabIndex = 0;
      b.addEventListener("click", () => {
        const sib = b.nextElementSibling;
        const layer = sib && sib.classList && sib.classList.contains("detail-layer") ? sib : b.closest(".slide").querySelector(".detail-layer");
        if (layer) { layer.classList.add("open"); layer.querySelector(".layer-close")?.focus(); }
      });
      b.addEventListener("keydown", (ev) => { if (ev.key === "Enter" || ev.key === " ") { ev.preventDefault(); b.click(); } });
    });
    document.querySelectorAll(".layer-close").forEach((x) => {
      x.addEventListener("click", () => x.closest(".detail-layer").classList.remove("open"));
    });
    document.addEventListener("keydown", (ev) => {
      if (ev.key === "Escape") document.querySelectorAll(".detail-layer.open").forEach((l) => l.classList.remove("open"));
    });
  }

  /* Cross-reference links: hover shows a mini preview, click jumps.
     Touch: first tap previews, second tap jumps. */
  function initGotoPreviews() {
    let prev = null, prevFor = null;
    const touchOnly = () => matchMedia("(hover: none)").matches;
    const clean = () => { if (prev) { prev.remove(); prev = null; prevFor = null; } };
    const show = (a) => {
      clean();
      const target = document.querySelector(a.getAttribute("href"));
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
      const t = document.querySelector(a.getAttribute("href"));
      if (t) t.scrollIntoView({ behavior: "smooth" });
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

  /* Universal image lightbox (img.zoomable) */
  function initZoomable() {
    let ov = null;
    const close = () => { if (ov) { ov.remove(); ov = null; } };
    document.addEventListener("click", (e) => {
      const img = e.target.closest && e.target.closest("img.zoomable");
      if (!img) return;
      close();
      ov = document.createElement("div"); ov.className = "zoom-ov";
      const big = document.createElement("img");
      big.src = img.currentSrc || img.src; big.alt = img.alt || "";
      ov.appendChild(big); ov.addEventListener("click", close);
      document.body.appendChild(ov);
    });
    document.addEventListener("keydown", (ev) => { if (ev.key === "Escape") close(); });
  }

  /* Image stack: click a card to pin it to the front */
  function initImageStacks() {
    document.querySelectorAll(".stack-stage").forEach((stage) => {
      const cards = stage.querySelectorAll(".stack-card");
      cards.forEach((card) => card.addEventListener("click", () => {
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

  function boot() {
    initDeck();
    initDetailLayers();
    initGotoPreviews();
    initShotLayers();
    initZoomable();
    initImageStacks();
    initRotateHint();
    initThemeToggle();
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", boot);
  else boot();

  window.Browserslides = { barChart, token, svgEl, barPath, attachTooltip };
})();
