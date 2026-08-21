/* Intro V2 comparison page — same shared behaviour as main.js, but with
   the hard-cut five-photo version of the opening animation: long holds on
   the last two frames, the final frame stretching taller, then the card
   turns pure blue and expands into the page. Used only by intro-v2.html. */
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

  /* ---------- Intro V2: hard cuts, long holds, blue-card expansion ---------- */
  function runIntro(intro, done) {
    var entries = (intro.dataset.images || "")
      .split(",")
      .map(function (s) { return s.trim(); })
      .filter(Boolean)
      .map(function (item) {
        var parts = item.split("|");
        return {
          src: parts[0].trim(),
          pos: (parts[1] || "50%").trim(),
        };
      });
    var stack = intro.querySelector(".introv2__stack");
    var photo = intro.querySelector(".introv2__photo");
    var counter = intro.querySelector(".introv2__counter");
    var patch = intro.querySelector(".introv2__patch");
    if (!entries.length || !stack || !photo || !counter || !patch) {
      intro.remove();
      done();
      return;
    }

    var finished = false;

    var beats = entries.map(function (_, i) {
      if (i === entries.length - 1) return 1150;
      if (i === entries.length - 2) return 680;
      return 340;
    });
    var starts = [];
    var total = 0;
    beats.forEach(function (b) {
      starts.push(total);
      total += b;
    });

    function showPhoto(i) {
      photo.src = entries[i].src;
      photo.style.objectPosition = entries[i].pos + " 50%";
    }

    function startStretch() {
      var r = stack.getBoundingClientRect();
      stack.style.height = r.height + "px";
      void stack.offsetHeight;
      stack.style.transition = "height 1.05s cubic-bezier(0.22, 1, 0.36, 1)";
      stack.style.height = Math.round(r.height * 1.12) + "px";
    }

    function exit(instant) {
      if (finished) return;
      finished = true;
      counter.textContent = "[100]";
      stack.classList.add("is-blue");

      setTimeout(function () {
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
      }, instant ? 0 : 380);
    }

    intro.addEventListener("click", function () {
      exit(true);
    });

    var t0;
    var current = -1;
    function tick(now) {
      if (finished) return;
      var elapsed = now - t0;
      var p = Math.min(1, elapsed / total);
      counter.textContent = "[" + Math.floor(p * 100) + "]";
      var i = 0;
      while (i < starts.length - 1 && elapsed >= starts[i + 1]) i++;
      if (i !== current) {
        current = i;
        showPhoto(i);
        if (i === entries.length - 1) startStretch();
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
        showPhoto(0);
        current = 0;
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

  var intro = document.querySelector(".introv2");
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
