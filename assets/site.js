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

  /* ---------- Music pills: tap to light up ---------- */
  function initVibes() {
    document.querySelectorAll("[data-vibes] button").forEach(function (b) {
      b.addEventListener("click", function () {
        b.setAttribute("aria-pressed", b.getAttribute("aria-pressed") === "true" ? "false" : "true");
      });
    });
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
    safe(initVibes, "vibes");
    safe(initReveal, "reveal");
    safe(initStory, "story");
    safe(initCount, "count");
    safe(initStores, "stores");
    safe(initVenueMail, "mail");
  }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", boot);
  else boot();
})();
