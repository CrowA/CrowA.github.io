/* Gallery: series filters + lightbox (native <dialog>). */
(function () {
  "use strict";

  var items = Array.prototype.slice.call(document.querySelectorAll(".ph"));
  if (!items.length) return;

  /* ---------- Filters ---------- */
  var filterButtons = Array.prototype.slice.call(
    document.querySelectorAll(".filters button")
  );

  function applyFilter(btn) {
    filterButtons.forEach(function (b) {
      b.setAttribute("aria-pressed", b === btn ? "true" : "false");
    });
    var series = btn.dataset.filter;
    items.forEach(function (item) {
      var show = series === "all" || item.dataset.series === series;
      item.classList.toggle("is-hidden", !show);
    });
  }

  filterButtons.forEach(function (btn) {
    btn.addEventListener("click", function () {
      applyFilter(btn);
    });
  });

  /* Deep links: photography.html#spectra preselects that series.
     Guarded: a malformed hash (e.g. a truncated %-escape) must not throw. */
  var hash;
  try {
    hash = decodeURIComponent(location.hash.slice(1));
  } catch (err) {
    hash = "";
  }
  if (hash) {
    var target = filterButtons.filter(function (b) {
      return b.dataset.filter === hash;
    })[0];
    if (target) applyFilter(target);
  }

  /* ---------- Lightbox ---------- */
  var dialog = document.querySelector(".lightbox");
  if (!dialog || typeof dialog.showModal !== "function") return;

  var imgEl = dialog.querySelector(".lightbox__img");
  var titleEl = dialog.querySelector(".lightbox__title");
  var metaEl = dialog.querySelector(".lightbox__meta");
  var current = -1;

  function visibleItems() {
    return items.filter(function (item) {
      return !item.classList.contains("is-hidden");
    });
  }

  function show(index) {
    var list = visibleItems();
    if (!list.length) return;
    current = ((index % list.length) + list.length) % list.length;
    var item = list[current];
    var img = item.querySelector("img");
    imgEl.src = item.getAttribute("href");
    imgEl.alt = img ? img.alt : "";
    titleEl.textContent = item.dataset.title || "";
    /* Position suffix doubles as the aria-live change announcement. */
    metaEl.textContent =
      (item.dataset.meta || "") + " — " + (current + 1) + " of " + list.length;
  }

  items.forEach(function (item) {
    item.addEventListener("click", function (e) {
      /* Let the browser handle new-tab / new-window gestures. */
      if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
      e.preventDefault();
      var list = visibleItems();
      show(list.indexOf(item));
      if (!dialog.open) dialog.showModal();
    });
  });

  dialog.querySelector(".lightbox__close").addEventListener("click", function () {
    dialog.close();
  });
  dialog.querySelector(".lightbox__prev").addEventListener("click", function () {
    show(current - 1);
  });
  dialog.querySelector(".lightbox__next").addEventListener("click", function () {
    show(current + 1);
  });

  dialog.addEventListener("keydown", function (e) {
    if (e.key === "ArrowLeft") show(current - 1);
    if (e.key === "ArrowRight") show(current + 1);
  });

  /* Click on the dark backdrop (outside the figure) closes. */
  dialog.addEventListener("click", function (e) {
    if (e.target === dialog || e.target.classList.contains("lightbox__inner")) {
      dialog.close();
    }
  });
})();
