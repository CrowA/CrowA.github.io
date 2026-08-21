/* Intro V1 comparison page — same shared behaviour as main.js, but with
   the FIRST version of the opening animation: an even-paced shuffle with
   a [00]→[100] counter, ending in a scatter burst. Used only by
   intro-v1.html; the live site uses js/main.js. */
(function () {
  "use strict";

  var reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* ---------- Mobile nav ---------- */
  var toggle = document.querySelector(".nav__toggle");
  var overlay = document.querySelector(".nav-overlay");
  if (toggle && overlay) {
    var setMenu = function (open) {
      document.body.classList.toggle("menu-open", open);
      toggle.setAttribute("aria-expanded", open ? "true" : "false");
      toggle.textContent = open ? "Close" : "Menu";
      document.querySelectorAll("main, footer").forEach(function (el) {
        if (open) el.setAttribute("inert", "");
        else el.removeAttribute("inert");
      });
    };
    toggle.addEventListener("click", function () {
      setMenu(!document.body.classList.contains("menu-open"));
    });
    overlay.addEventListener("click", function (e) {
      if (e.target.closest("a")) setMenu(false);
    });
    document.addEventListener("keydown", function (e) {
      if (e.key !== "Escape") return;
      if (document.querySelector("dialog[open]")) return;
      if (document.body.classList.contains("menu-open")) {
        setMenu(false);
        toggle.focus();
      }
    });
    var mobileMq = window.matchMedia("(max-width: 720px)");
    mobileMq.addEventListener("change", function (e) {
      if (!e.matches && document.body.classList.contains("menu-open")) {
        setMenu(false);
      }
    });
  }

  /* ---------- Nav scrim on scroll ---------- */
  var nav = document.querySelector(".nav");
  if (nav) {
    var onScroll = function () {
      nav.classList.toggle("is-scrolled", window.scrollY > 24);
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
  }

  /* ---------- Scroll reveals (started after the intro, if any) ---------- */
  function startReveals() {
    var revealables = document.querySelectorAll(".reveal, .line-mask");
    if (reduceMotion || !("IntersectionObserver" in window)) {
      revealables.forEach(function (el) {
        el.classList.add("is-in");
      });
      return;
    }
    var io = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            entry.target.classList.add("is-in");
            io.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.15, rootMargin: "0px 0px -5% 0px" }
    );
    revealables.forEach(function (el) {
      io.observe(el);
    });
  }

  /* ---------- Intro V1: even shuffle + scatter ---------- */
  function runIntro(intro, done) {
    var srcs = (intro.dataset.images || "")
      .split(",")
      .map(function (s) { return s.trim(); })
      .filter(Boolean);
    var card = intro.querySelector(".introv1__card");
    var img = intro.querySelector(".introv1__img");
    var counter = intro.querySelector(".introv1__counter");
    if (!srcs.length || !card || !img || !counter) {
      intro.remove();
      done();
      return;
    }

    var finished = false;
    var SHUFFLE_MS = 1500;

    function finish() {
      if (finished) return;
      finished = true;

      /* Scatter: a handful of photos fling outward from the card. */
      var rect = card.getBoundingClientRect();
      var dirs = [
        [-1.1, -0.7, -14], [1.1, -0.6, 12], [-1.2, 0.5, 10],
        [1.2, 0.6, -12], [-0.7, 1.1, 16], [0.8, 1.0, -10],
      ];
      dirs.forEach(function (d, i) {
        var fly = document.createElement("img");
        fly.src = srcs[(i * 2 + 1) % srcs.length];
        fly.alt = "";
        fly.className = "introv1__fly";
        fly.style.left = rect.left + "px";
        fly.style.top = rect.top + "px";
        fly.style.width = rect.width + "px";
        fly.style.height = rect.height + "px";
        /* Start as a slightly fanned deck, then burst outward staggered. */
        fly.style.transform = "rotate(" + (i - 2.5) * 2.2 + "deg)";
        fly.style.transitionDelay = i * 40 + "ms";
        intro.appendChild(fly);
        requestAnimationFrame(function () {
          requestAnimationFrame(function () {
            fly.style.transform =
              "translate(" + d[0] * 70 + "vw," + d[1] * 70 + "vh) " +
              "rotate(" + d[2] + "deg) scale(0.92)";
            fly.style.opacity = "0.35";
          });
        });
      });

      card.style.opacity = "0";
      intro.classList.add("is-leaving");
      done();
      setTimeout(function () {
        intro.remove();
      }, 1100);
    }

    intro.addEventListener("click", finish);

    /* Wait (briefly) for the photos, then run the shuffle. */
    var preloads = srcs.map(function (s) {
      return new Promise(function (resolve) {
        var i = new Image();
        i.onload = i.onerror = function () { resolve(); };
        i.src = s;
      });
    });
    var ready = Promise.race([
      Promise.all(preloads),
      new Promise(function (r) { setTimeout(r, 1500); }),
    ]);

    ready.then(function () {
      if (finished) return;
      var t0 = performance.now();
      var lastIndex = -1;
      (function tick(now) {
        if (finished) return;
        var p = Math.min(1, (now - t0) / SHUFFLE_MS);
        var n = Math.floor(p * 100);
        counter.textContent = "[" + (n < 10 ? "0" + n : n) + "]";
        var index = Math.min(srcs.length - 1, Math.floor(p * srcs.length));
        if (index !== lastIndex) {
          lastIndex = index;
          img.src = srcs[index];
        }
        if (p < 1) requestAnimationFrame(tick);
        else finish();
      })(t0);
    });
  }

  var intro = document.querySelector(".introv1");
  if (intro && !reduceMotion) {
    runIntro(intro, startReveals);
  } else {
    if (intro) intro.remove();
    startReveals();
  }

  /* ---------- Footer year ---------- */
  document.querySelectorAll("[data-year]").forEach(function (el) {
    el.textContent = new Date().getFullYear();
  });

  /* ---------- Hero canvas: two-source interference field ---------- */
  var canvas = document.querySelector(".hero__canvas");
  if (!canvas) return;

  var ctx = canvas.getContext("2d");
  var dpr = Math.min(window.devicePixelRatio || 1, 2);
  var width = 0;
  var height = 0;
  var spacing = 30;
  var sourceA = { x: 0.32, y: 0.38 };
  var sourceB = { x: 0.72, y: 0.55 };
  var pointer = { x: 0.72, y: 0.55 };
  var running = false;
  var rafId = null;
  var start = performance.now();

  function resize() {
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    var rect = canvas.getBoundingClientRect();
    width = rect.width;
    height = rect.height;
    canvas.width = Math.round(width * dpr);
    canvas.height = Math.round(height * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    spacing = Math.max(24, Math.min(38, width / 46));
  }

  function draw(now) {
    var t = (now - start) / 1000;
    ctx.clearRect(0, 0, width, height);
    ctx.fillStyle = "rgba(255, 255, 255, 0.5)";

    sourceB.x += (pointer.x - sourceB.x) * 0.03;
    sourceB.y += (pointer.y - sourceB.y) * 0.03;

    var ax = sourceA.x * width;
    var ay = sourceA.y * height;
    var bx = sourceB.x * width;
    var by = sourceB.y * height;
    var k = 0.045;
    var w = 1.6;

    for (var y = spacing / 2; y < height; y += spacing) {
      for (var x = spacing / 2; x < width; x += spacing) {
        var da = Math.hypot(x - ax, y - ay);
        var db = Math.hypot(x - bx, y - by);
        var amp = Math.sin(da * k - t * w) + Math.sin(db * k - t * w);
        var r = Math.max(0, (amp + 2) / 4) * (spacing * 0.16) + 0.4;
        ctx.beginPath();
        ctx.arc(x, y, r, 0, Math.PI * 2);
        ctx.fill();
      }
    }
  }

  function loop(now) {
    draw(now);
    rafId = requestAnimationFrame(loop);
  }

  function play() {
    if (running || reduceMotion) return;
    running = true;
    rafId = requestAnimationFrame(loop);
  }

  function pause() {
    running = false;
    if (rafId) cancelAnimationFrame(rafId);
    rafId = null;
  }

  var tabVisible = !document.hidden;
  var onScreen = true;
  function sync() {
    if (tabVisible && onScreen) play();
    else pause();
  }

  resize();
  if (reduceMotion) {
    draw(start + 400);
  } else {
    sync();
  }

  window.addEventListener("resize", function () {
    resize();
    if (reduceMotion) draw(performance.now());
  });

  function watchDpr() {
    var mq = matchMedia("(resolution: " + window.devicePixelRatio + "dppx)");
    mq.addEventListener(
      "change",
      function () {
        resize();
        if (reduceMotion) draw(performance.now());
        watchDpr();
      },
      { once: true }
    );
  }
  watchDpr();

  canvas.closest(".hero").addEventListener("pointermove", function (e) {
    var rect = canvas.getBoundingClientRect();
    pointer.x = (e.clientX - rect.left) / rect.width;
    pointer.y = (e.clientY - rect.top) / rect.height;
  });

  document.addEventListener("visibilitychange", function () {
    tabVisible = !document.hidden;
    sync();
  });

  if ("IntersectionObserver" in window) {
    new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        onScreen = entry.isIntersecting;
      });
      sync();
    }).observe(canvas);
  }
})();
