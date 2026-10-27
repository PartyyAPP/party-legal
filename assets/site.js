/* Party — partyyapp.com */
(function () {
  "use strict";

  // Store links: fill in once the app is live in each store.
  var STORES = {
    ios: "",     // e.g. https://apps.apple.com/es/app/id6827253251
    android: ""  // e.g. https://play.google.com/store/apps/details?id=com.partyyapp.app
  };

  var root = document.documentElement;
  root.classList.add("js");

  function safe(fn, name) {
    try { fn(); } catch (e) { if (window.console) console.warn("[party] " + name, e); }
  }
  function isEn() { return root.classList.contains("is-en"); }

  /* ---------- Language ---------- */
  function setLang(lang, remember) {
    root.classList.toggle("is-en", lang === "en");
    root.lang = lang;
    document.querySelectorAll("img[data-src-en]").forEach(function (img) {
      if (!img.dataset.srcEs) img.dataset.srcEs = img.getAttribute("src");
      img.src = lang === "en" ? img.dataset.srcEn : img.dataset.srcEs;
    });
    if (remember) { try { localStorage.setItem("party-lang", lang); } catch (e) {} }
    safe(tickClock, "clock");
  }
  function initLang() {
    var saved = null;
    try { saved = localStorage.getItem("party-lang"); } catch (e) {}
    var lang = saved || ((navigator.language || "es").toLowerCase().indexOf("es") === 0 ? "es" : "en");
    if (location.hash === "#en") lang = "en";
    setLang(lang, false);
    var btn = document.querySelector("[data-lang-toggle]");
    if (btn) btn.addEventListener("click", function () { setLang(isEn() ? "es" : "en", true); });
  }

  /* ---------- Live clock (like the app's "Ahora mismo") ---------- */
  var clockEl;
  function tickClock() {
    clockEl = clockEl || document.querySelector("[data-clock]");
    if (!clockEl) return;
    var d = new Date();
    var day = d.toLocaleDateString(isEn() ? "en-GB" : "es-ES", { weekday: "long" });
    day = day.charAt(0).toUpperCase() + day.slice(1);
    var hm = d.toLocaleTimeString(isEn() ? "en-GB" : "es-ES", { hour: "2-digit", minute: "2-digit" });
    clockEl.textContent = (isEn() ? "Right now · " : "Ahora mismo · ") + day + " " + hm;
  }
  function initClock() { tickClock(); setInterval(tickClock, 15000); }

  /* ---------- Nav state ---------- */
  function initNav() {
    var nav = document.querySelector("[data-nav]");
    if (!nav) return;
    var on = function () { nav.classList.toggle("is-scrolled", window.scrollY > 40); };
    on();
    window.addEventListener("scroll", on, { passive: true });
  }

  /* ---------- Hero: pointer glow + phone tilt ---------- */
  function initHeroPointer() {
    if (matchMedia("(hover: none)").matches) return;
    var hero = document.querySelector("[data-hero]");
    var blob = document.querySelector("[data-pointer-blob]");
    var stage = document.querySelector("[data-tilt]");
    var phone = stage && stage.querySelector(".fan");
    if (!hero) return;
    var raf = 0, mx = 0, my = 0;
    hero.addEventListener("pointermove", function (e) {
      mx = e.clientX; my = e.clientY;
      if (raf) return;
      raf = requestAnimationFrame(function () {
        raf = 0;
        var r = hero.getBoundingClientRect();
        if (blob) blob.style.transform = "translate3d(" + (mx - r.left) + "px," + (my - r.top) + "px,0)";
        if (phone) {
          var nx = (mx - r.left) / r.width - 0.5, ny = (my - r.top) / r.height - 0.5;
          phone.style.transform = "rotateY(" + (nx * 14) + "deg) rotateX(" + (-ny * 10) + "deg)";
        }
      });
    });
    hero.addEventListener("pointerleave", function () { if (phone) phone.style.transform = ""; });
  }

  /* ---------- Marquee: duplicate the list once for a seamless loop ---------- */
  function initMarquee() {
    document.querySelectorAll("[data-marquee]").forEach(function (track) {
      if (track.children.length > 1) return;
      var clone = track.children[0].cloneNode(true);
      clone.setAttribute("aria-hidden", "true");
      track.appendChild(clone);
    });
  }

  /* ---------- Hero: club lasers on a canvas ---------- */
  function initLasers() {
    var canvas = document.querySelector("[data-lasers]");
    if (!canvas || !canvas.getContext) return;
    var ctx = canvas.getContext("2d");
    var reduced = matchMedia("(prefers-reduced-motion: reduce)").matches;
    var dpr = Math.min(window.devicePixelRatio || 1, 1.5);
    var w = 0, h = 0, running = true, visible = true;
    var COLORS = ["157,92,255", "255,62,165", "200,170,255", "255,120,200"];
    var beams = [];
    for (var i = 0; i < 9; i++) {
      beams.push({
        ox: [0.12, 0.5, 0.88][i % 3],
        base: (i % 3 === 0 ? 0.35 : i % 3 === 2 ? -0.35 : 0) + (Math.random() - 0.5) * 0.5,
        amp: 0.25 + Math.random() * 0.35,
        speed: (0.12 + Math.random() * 0.22) * (reduced ? 0.35 : 1),
        phase: Math.random() * Math.PI * 2,
        width: 0.012 + Math.random() * 0.02,
        color: COLORS[i % COLORS.length],
        alpha: 0.22 + Math.random() * 0.25
      });
    }
    function size() {
      var r = canvas.getBoundingClientRect();
      w = r.width; h = r.height;
      canvas.width = Math.round(w * dpr); canvas.height = Math.round(h * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    }
    function draw(t) {
      if (!running) return;
      requestAnimationFrame(draw);
      if (!visible || document.hidden) return;
      var s = t / 1000;
      ctx.clearRect(0, 0, w, h);
      ctx.globalCompositeOperation = "lighter";
      var len = Math.hypot(w, h) * 1.1;
      beams.forEach(function (b) {
        var ang = Math.PI / 2 + b.base + Math.sin(s * b.speed + b.phase) * b.amp;
        var ox = b.ox * w, oy = -10;
        var spread = b.width;
        var x1 = ox + Math.cos(ang - spread) * len, y1 = oy + Math.sin(ang - spread) * len;
        var x2 = ox + Math.cos(ang + spread) * len, y2 = oy + Math.sin(ang + spread) * len;
        var g = ctx.createLinearGradient(ox, oy, ox + Math.cos(ang) * len * 0.8, oy + Math.sin(ang) * len * 0.8);
        var flick = 0.85 + Math.sin(s * 3 + b.phase * 3) * 0.15;
        g.addColorStop(0, "rgba(" + b.color + "," + (b.alpha * flick) + ")");
        g.addColorStop(0.55, "rgba(" + b.color + "," + (b.alpha * 0.35 * flick) + ")");
        g.addColorStop(1, "rgba(" + b.color + ",0)");
        ctx.fillStyle = g;
        ctx.beginPath(); ctx.moveTo(ox, oy); ctx.lineTo(x1, y1); ctx.lineTo(x2, y2); ctx.closePath(); ctx.fill();
        // bright core line
        ctx.strokeStyle = "rgba(255,255,255," + (0.08 * flick) + ")";
        ctx.lineWidth = 1;
        ctx.beginPath(); ctx.moveTo(ox, oy); ctx.lineTo(ox + Math.cos(ang) * len * 0.6, oy + Math.sin(ang) * len * 0.6); ctx.stroke();
      });
      // light sources at the top
      [0.12, 0.5, 0.88].forEach(function (x, k) {
        var rg = ctx.createRadialGradient(x * w, 0, 0, x * w, 0, 90);
        rg.addColorStop(0, "rgba(255,255,255," + (0.35 + Math.sin(s * 2 + k) * 0.1) + ")");
        rg.addColorStop(1, "rgba(157,92,255,0)");
        ctx.fillStyle = rg; ctx.fillRect(x * w - 90, 0, 180, 90);
      });
      ctx.globalCompositeOperation = "source-over";
    }
    size();
    window.addEventListener("resize", size);
    if ("IntersectionObserver" in window) {
      new IntersectionObserver(function (e) { visible = e[0].isIntersecting; }, { threshold: 0 }).observe(canvas);
    }
    requestAnimationFrame(draw);
  }

  /* ---------- Soft spotlight that follows the pointer ---------- */
  function initSpot() {
    if (matchMedia("(hover: none)").matches) return;
    var spot = document.querySelector("[data-spot]");
    if (!spot) return;
    var x = 0, y = 0, tx = 0, ty = 0, started = false;
    window.addEventListener("pointermove", function (e) {
      tx = e.clientX; ty = e.clientY;
      if (!started) { started = true; x = tx; y = ty; spot.classList.add("is-on"); loop(); }
    }, { passive: true });
    function loop() {
      x += (tx - x) * 0.12; y += (ty - y) * 0.12;
      spot.style.transform = "translate3d(" + x + "px," + y + "px,0)";
      requestAnimationFrame(loop);
    }
  }

  /* ---------- Reveal on scroll ---------- */
  function initReveal() {
    var els = document.querySelectorAll(".reveal:not([data-split])");
    if (!("IntersectionObserver" in window)) { els.forEach(function (el) { el.classList.add("is-visible"); }); return; }
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (en.isIntersecting) { en.target.classList.add("is-visible"); io.unobserve(en.target); }
      });
    }, { threshold: 0.05, rootMargin: "0px 0px -6% 0px" });
    els.forEach(function (el) { io.observe(el); });
    setTimeout(function () { els.forEach(function (el) { el.classList.add("is-visible"); }); }, 6000);
  }

  /* ---------- Story: swap the sticky phone screen per step ---------- */
  function initStory() {
    var steps = document.querySelectorAll("[data-step]");
    var shots = document.querySelectorAll("[data-story-phone] img");
    if (!steps.length || !shots.length || !("IntersectionObserver" in window)) return;
    function show(i) {
      shots.forEach(function (s) { s.classList.toggle("is-on", s.dataset.shot === String(i)); });
      steps.forEach(function (s) { s.classList.toggle("is-active", s.dataset.step === String(i)); });
    }
    show(0);
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) { if (en.isIntersecting) show(en.target.dataset.step); });
    }, { rootMargin: "-45% 0px -45% 0px", threshold: 0 });
    steps.forEach(function (s) { io.observe(s); });
  }

  /* ---------- Count-up ---------- */
  function initCount() {
    var els = document.querySelectorAll("[data-count]");
    if (!els.length || !("IntersectionObserver" in window)) return;
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (!en.isIntersecting) return;
        io.unobserve(en.target);
        var el = en.target, end = +el.dataset.count, t0 = performance.now(), dur = 1400;
        (function step(t) {
          var p = Math.min(1, (t - t0) / dur), e = 1 - Math.pow(1 - p, 3);
          el.textContent = Math.round(end * e);
          if (p < 1) requestAnimationFrame(step);
        })(t0);
      });
    }, { threshold: 0.05 });
    els.forEach(function (el) { io.observe(el); });
  }

  /* ---------- Store buttons ---------- */
  var toastTimer;
  function toast(msg) {
    var t = document.querySelector("[data-toast]");
    if (!t) return;
    t.textContent = msg;
    t.classList.add("is-on");
    clearTimeout(toastTimer);
    toastTimer = setTimeout(function () { t.classList.remove("is-on"); }, 3200);
  }
  function initStores() {
    document.querySelectorAll("[data-store]").forEach(function (a) {
      var url = STORES[a.dataset.store];
      if (url) {
        a.href = url; a.target = "_blank"; a.rel = "noopener";
        a.querySelectorAll("small").forEach(function (s) {
          s.innerHTML = '<span data-l="es">Descárgala en</span><span data-l="en">Get it on</span>';
        });
        return;
      }
      a.addEventListener("click", function (e) {
        e.preventDefault();
        toast(isEn()
          ? "Party is finishing store review. Very soon on " + (a.dataset.store === "ios" ? "the App Store" : "Google Play") + "."
          : "Party está terminando la revisión. Muy pronto en " + (a.dataset.store === "ios" ? "App Store" : "Google Play") + ".");
      });
    });
  }

  /* ---------- Venue email with a ready-to-fill template ---------- */
  function initVenueMail() {
    var a = document.querySelector('[data-mail="venue"]');
    if (!a) return;
    a.addEventListener("click", function () {
      var es = !isEn();
      var subject = es ? "Mi local en Party" : "My venue on Party";
      var body = es
        ? "Hola,\n\nNombre del local:\nCiudad y dirección:\nTipo (discoteca o pub):\nMúsica:\nEdad del público:\nPrecio de entrada:\nHorario de cada día:\n\nAdjunto fotos oficiales del local.\n\nGracias."
        : "Hi,\n\nVenue name:\nCity and address:\nType (club or bar):\nMusic:\nCrowd age:\nEntry price:\nOpening hours per day:\n\nOfficial photos attached.\n\nThanks.";
      a.href = "mailto:contacto@partyyapp.com?subject=" + encodeURIComponent(subject) + "&body=" + encodeURIComponent(body);
    });
  }

  function boot() {
    safe(initLang, "lang");
    safe(initClock, "clock");
    safe(initNav, "nav");
    safe(initHeroPointer, "hero");
    safe(initMarquee, "marquee");
    safe(initLasers, "lasers");
    safe(initSpot, "spot");
    setTimeout(function () { root.classList.add("anim-done"); }, 2500);
    safe(initReveal, "reveal");
    safe(initStory, "story");
    safe(initCount, "count");
    safe(initStores, "stores");
    safe(initVenueMail, "mail");
  }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", boot);
  else boot();
})();
