/* Party — marks venues open tonight on destination pages, in the destination's own time zone.
   Same rules as the app (_lib/hours.ts): a night runs from 08:00 to 08:00 of the next day,
   and a line like "Viernes: 23:00-6:00" belongs to Friday night. */
(function () {
  var box = document.querySelector(".tonight");
  if (!box) return;
  var en = box.dataset.lang === "en";
  var DAYS = ["domingo", "lunes", "martes", "miércoles", "jueves", "viernes", "sábado"];
  var START = 8 * 60;

  function nowIn(tz) {
    try { return new Date(new Date().toLocaleString("en-US", { timeZone: tz })); } catch (e) { return new Date(); }
  }
  function mins(s) { var m = /^(\d{1,2}):(\d{2})$/.exec((s || "").trim()); return m ? +m[1] * 60 + +m[2] : null; }
  function ranges(h) {
    if (h === "Abierto") return [{ s: START, e: START + 24 * 60 }];
    var f = /^Desde (\d{1,2}:\d{2})$/.exec(h);
    if (f) { var s0 = mins(f[1]); if (s0 < START) s0 += 1440; return [{ s: s0, e: 32 * 60 }]; }
    var out = [];
    h.split(" y ").forEach(function (p) {
      var ab = p.split("-"); if (ab.length !== 2) return;
      var s = mins(ab[0]), e = mins(ab[1]); if (s == null || e == null) return;
      if (s < START) s += 1440;
      while (e <= s) e += 1440;
      out.push({ s: s, e: e });
    });
    return out;
  }
  function lineFor(sched, day) {
    var lines = (sched || "").split("\n");
    for (var i = 0; i < lines.length; i++) {
      var k = lines[i].indexOf(":"); if (k < 0) continue;
      if (lines[i].slice(0, k).trim().toLowerCase() === DAYS[day]) return lines[i].slice(k + 1).trim();
    }
    return null;
  }

  var now = nowIn(box.dataset.tz);
  var m = now.getHours() * 60 + now.getMinutes();
  var night = new Date(now); if (m < START) night.setDate(night.getDate() - 1);
  var since = m < START ? m + 1440 : m;
  var cards = [].slice.call(document.querySelectorAll(".card"));
  var withHours = 0, openTonight = 0;
  cards.forEach(function (c) {
    var sched = c.dataset.schedule; if (!sched) return;
    withHours++;
    var h = lineFor(sched, night.getDay());
    if (!h || /cerrado/i.test(h)) return;
    var r = ranges(h); if (!r.length) return;
    openTonight++;
    var nowOpen = r.some(function (x) { return since >= x.s && since < x.e; });
    var b = c.querySelector(".card__tonight");
    b.hidden = false;
    b.textContent = nowOpen ? (en ? "Open now" : "Abierto ahora") : (en ? "Open tonight " : "Abre esta noche ") + (h === "Abierto" ? "" : h);
    if (nowOpen) b.classList.add("is-now");
    c.dataset.tonight = "1";
  });
  var count = box.querySelector(".tonight__count");
  count.innerHTML = withHours
    ? (en ? "Tonight <b>" + openTonight + "</b> of the " + withHours + " venues with opening hours are open."
          : "Esta noche abren <b>" + openTonight + "</b> de los " + withHours + " locales con horario.")
    : "";

  var btns = [].slice.call(box.querySelectorAll("[data-filter]"));
  btns.forEach(function (btn) {
    btn.addEventListener("click", function () {
      btns.forEach(function (b) { b.classList.toggle("on", b === btn); });
      var f = btn.dataset.filter;
      cards.forEach(function (c) {
        c.hidden = f === "tonight" ? c.dataset.tonight !== "1" : f === "all" ? false : c.dataset.type !== f;
      });
    });
  });
})();
