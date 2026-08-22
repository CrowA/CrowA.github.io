/* Shared behaviour: mobile nav, scroll reveals, hero interference canvas. */
(function () {
  "use strict";

  var reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* ---------- Mobile nav ---------- */
  var toggle = document.querySelector(".nav__toggle");
  var overlay = document.querySelector(".nav-overlay");
  if (toggle && overlay) {
    /* inert keeps keyboard/screen-reader users inside the open menu. */
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
      /* An open modal (lightbox) owns Escape; let it close first. */
      if (document.querySelector("dialog[open]")) return;
      if (document.body.classList.contains("menu-open")) {
        setMenu(false);
        toggle.focus();
      }
    });
    /* Leaving mobile widths (e.g. phone rotation) force-closes the menu,
       since the toggle that dismisses it stops being rendered. */
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

  /* ---------- Photo-strip parallax ----------
     Backgrounds move slower than the page, so content sections appear
     to slide over near-stationary photographs. */
  var strips = Array.prototype.slice.call(document.querySelectorAll(".strip"));
  if (strips.length && !reduceMotion) {
    var stripTicking = false;
    var updateStrips = function () {
      stripTicking = false;
      var vh = window.innerHeight;
      strips.forEach(function (strip) {
        var r = strip.getBoundingClientRect();
        if (r.bottom < 0 || r.top > vh) return;
        var bg = strip.querySelector(".strip__bg");
        if (!bg) return;
        /* t: 0 when the strip enters from below, 1 when it leaves above. */
        var t = (vh - r.top) / (vh + r.height);
        var shift = (0.5 - t) * 0.36 * vh;
        bg.style.transform = "translateY(" + shift.toFixed(1) + "px)";
      });
    };
    var requestStrips = function () {
      if (!stripTicking) {
        stripTicking = true;
        requestAnimationFrame(updateStrips);
      }
    };
    window.addEventListener("scroll", requestStrips, { passive: true });
    window.addEventListener("resize", requestStrips);
    updateStrips();
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

  /* ---------- Opening: photo shuffle (home only, V1-style) ----------
     White screen, one centred 3:4 card. Photos cut through it fast,
     the last two hold longer (the final one longest) while the frame
     widens to 16:9, still centred — then the photos scatter outward
     as the overlay fades into the blue hero. */
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
    var card = intro.querySelector(".intro__card");
    var img = intro.querySelector(".intro__img");
    var counter = intro.querySelector(".intro__counter");
    if (!entries.length || !card || !img || !counter) {
      intro.remove();
      done();
      return;
    }

    var finished = false;

    /* Beat sheet: rapid cuts, then the last two hold longer
       (the final one longest). */
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

    function showPhoto(i) {
      img.src = entries[i].src;
      img.style.objectPosition = entries[i].pos + " 50%";
    }

    /* The final frame widens to 16:9, capped to the viewport, centred. */
    function widen() {
      var r = card.getBoundingClientRect();
      var targetW = Math.min((r.height * 16) / 9, window.innerWidth * 0.92);
      var targetH = (targetW * 9) / 16;
      card.style.width = r.width + "px"; /* freeze auto size */
      card.style.height = r.height + "px";
      void card.offsetWidth; /* commit so the change below animates */
      card.style.transition =
        "width 1.2s cubic-bezier(0.22, 1, 0.36, 1), " +
        "height 1.2s cubic-bezier(0.22, 1, 0.36, 1)";
      card.style.width = targetW + "px";
      card.style.height = targetH + "px";
    }

    var patch = intro.querySelector(".intro__patch");

    /* Exit (intro-v2 style): the card turns pure blue, then becomes a
       window that expands until it IS the page, while the card blurs
       away and the white surroundings fade out. */
    function finish(instant) {
      if (finished) return;
      finished = true;
      counter.textContent = "[100]";
      card.classList.add("is-blue"); /* the final card is pure blue */

      setTimeout(function () {
        /* Drop the widen() inline transition so the exit blur/fade
           (class transitions) can play; size stays at its inline value. */
        card.style.transition = "";
        var r = card.getBoundingClientRect();
        if (patch) {
          patch.style.top = r.top + "px";
          patch.style.left = r.left + "px";
          patch.style.width = r.width + "px";
          patch.style.height = r.height + "px";
        }
        var scale =
          Math.max(
            window.innerWidth / Math.max(r.width, 1),
            window.innerHeight / Math.max(r.height, 1)
          ) * 1.2;
        intro.classList.add("is-patch-preview");
        requestAnimationFrame(function () {
          requestAnimationFrame(function () {
            intro.classList.add("is-patch-expanding");
            if (patch) {
              patch.style.transition =
                "transform 0.85s cubic-bezier(0.22, 1, 0.36, 1)";
              patch.style.transform = "translateZ(0) scale(" + scale + ")";
            }
            done(); /* the page reveals through the opening window */
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
      finish(true);
    });

    var t0;
    var current = -1;
    function tick(now) {
      if (finished) return;
      var elapsed = now - t0;
      var p = Math.min(1, elapsed / total);
      var n = Math.floor(p * 100);
      counter.textContent = "[" + (n < 10 ? "0" + n : n) + "]";
      var i = 0;
      while (i < starts.length - 1 && elapsed >= starts[i + 1]) i++;
      if (i !== current) {
        current = i;
        showPhoto(i);
        if (i === entries.length - 1) widen();
      }
      if (p >= 1) finish();
      else requestAnimationFrame(tick);
    }
    function begin() {
      /* Preload everything, then run the fixed timeline. */
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
    /* Opened in a background tab: hold the sequence until it is seen. */
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

  var intro = document.querySelector(".intro");
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

  /* ---------- Hero canvas: two-source interference field ----------
     A quiet nod to physics: dots whose size follows the superposition
     of two circular waves. One source drifts toward the pointer. */
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
    /* Re-read DPR: browser zoom and display moves change it after load. */
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
    var k = 0.045; /* spatial frequency */
    var w = 1.6; /* temporal frequency */

    for (var y = spacing / 2; y < height; y += spacing) {
      for (var x = spacing / 2; x < width; x += spacing) {
        var da = Math.hypot(x - ax, y - ay);
        var db = Math.hypot(x - bx, y - by);
        var amp =
          Math.sin(da * k - t * w) + Math.sin(db * k - t * w);
        /* amp in [-2, 2] -> radius */
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

  /* Animate only while the tab is visible AND the hero is on screen. */
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

  /* Catch window drags between displays of different pixel density,
     which do not always fire a resize event. */
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
