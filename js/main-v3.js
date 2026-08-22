/* Intro V3 comparison page — same shared behaviour as main.js, but the
   opening is the grow-from-centre pile (k95 boot-loader style): each photo
   grows onto a centred stack, paced with the site's current beat sheet,
   ending with the blue-card window expansion. Used only by intro-v3.html. */
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

  /* ---------- Intro V3: grow-from-centre pile ---------- */
  function runIntro(intro, done) {
    var entries = (intro.dataset.images || "")
      .split(",")
      .map(function (s) { return s.trim(); })
      .filter(Boolean)
      .map(function (item) {
        var parts = item.split("|");
        return { src: parts[0].trim(), pos: (parts[1] || "50%").trim() };
      });
    var stack = intro.querySelector(".introv3__stack");
    var counter = intro.querySelector(".introv3__counter");
    var patch = intro.querySelector(".introv3__patch");
    if (!entries.length || !stack || !counter || !patch) {
      intro.remove();
      done();
      return;
    }

    var finished = false;
    var POP_MS = 340; /* each layer's centre-out growth */

    /* The site's beat sheet: steady, then long holds on the last two. */
    var beats = entries.map(function (_, i) {
      if (i === entries.length - 1) return 1750;
      if (i === entries.length - 2) return 950;
      return 200;
    });
    var starts = [];
    var total = 0;
    beats.forEach(function (b) {
      starts.push(total);
      total += b;
    });

    function addLayer(src, pos, isFinal, instant) {
      var layer = document.createElement("div");
      layer.className = "introv3__layer" + (isFinal ? " introv3__layer--final" : "");
      if (src) {
        var im = document.createElement("img");
        im.src = src;
        im.alt = "";
        im.style.objectPosition = pos + " 50%";
        layer.appendChild(im);
      }
      stack.appendChild(layer);
      if (instant) {
        layer.style.width = "100%";
        layer.style.height = "100%";
      } else {
        layer.style.transition =
          "width " + POP_MS + "ms cubic-bezier(0.22, 1, 0.36, 1), " +
          "height " + POP_MS + "ms cubic-bezier(0.22, 1, 0.36, 1)";
        requestAnimationFrame(function () {
          requestAnimationFrame(function () {
            layer.style.width = "100%";
            layer.style.height = "100%";
          });
        });
      }
    }

    /* The final frame widens the whole pile to 16:9 (viewport-capped,
       still centred) — same gesture as the live intro. */
    function widen() {
      var r = stack.getBoundingClientRect();
      var targetW = Math.min((r.height * 16) / 9, window.innerWidth * 0.92);
      var targetH = (targetW * 9) / 16;
      stack.style.width = r.width + "px"; /* freeze auto size */
      stack.style.height = r.height + "px";
      void stack.offsetWidth; /* commit so the change below animates */
      stack.style.transition =
        "width 1.2s cubic-bezier(0.22, 1, 0.36, 1), " +
        "height 1.2s cubic-bezier(0.22, 1, 0.36, 1)";
      stack.style.width = targetW + "px";
      stack.style.height = targetH + "px";
    }

    function exit(instant) {
      if (finished) return;
      finished = true;
      counter.textContent = "[100]";
      addLayer(null, "50%", true, instant); /* the final card is pure blue */

      setTimeout(function () {
        /* Drop the widen() inline transition so the exit blur/fade
           (class transitions) can play; size stays at its inline value. */
        stack.style.transition = "";
        var r = stack.getBoundingClientRect();
        patch.style.top = r.top + "px";
        patch.style.left = r.left + "px";
        patch.style.width = r.width + "px";
        patch.style.height = r.height + "px";
        var scale =
          Math.max(
            window.innerWidth / Math.max(r.width, 1),
            window.innerHeight / Math.max(r.height, 1)
          ) * 1.2;
        intro.classList.add("is-patch-preview");
        requestAnimationFrame(function () {
          requestAnimationFrame(function () {
            intro.classList.add("is-patch-expanding");
            patch.style.transition =
              "transform 0.85s cubic-bezier(0.22, 1, 0.36, 1)";
            patch.style.transform = "translateZ(0) scale(" + scale + ")";
            done();
            setTimeout(function () {
              intro.classList.add("is-fading");
            }, 350);
            setTimeout(function () {
              intro.remove();
            }, 1500);
          });
        });
      }, instant ? 0 : POP_MS + 80);
    }

    intro.addEventListener("click", function () {
      exit(true);
    });

    var t0;
    var popped = 0;
    function tick(now) {
      if (finished) return;
      var elapsed = now - t0;
      var p = Math.min(1, elapsed / total);
      counter.textContent = "[" + Math.floor(p * 100) + "]";
      while (popped < entries.length && elapsed >= starts[popped]) {
        addLayer(entries[popped].src, entries[popped].pos, false, false);
        popped++;
        if (popped === entries.length) widen();
      }
      if (p >= 1) exit(false);
      else requestAnimationFrame(tick);
    }
    function begin() {
      var preloads = entries.map(function (e) {
        return new Promise(function (resolve) {
          var im = new Image();
          im.onload = im.onerror = function () { resolve(); };
          im.src = e.src;
        });
      });
      Promise.race([
        Promise.all(preloads),
        new Promise(function (r) { setTimeout(r, 2500); }),
      ]).then(function () {
        if (finished) return;
        t0 = performance.now();
        requestAnimationFrame(tick);
      });
    }
    if (document.hidden) {
      document.addEventListener("visibilitychange", function onVis() {
        if (!document.hidden && !finished) {
          document.removeEventListener("visibilitychange", onVis);
          begin();
        }
      });
    } else {
      begin();
    }
  }

  var intro = document.querySelector(".introv3");
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
