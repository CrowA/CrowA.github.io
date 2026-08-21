# Crowtao — Photography & Physics

A hand-built personal website for a photographer-physicist. No frameworks, no
build step — plain HTML, CSS and a little vanilla JavaScript. Open
`index.html` in a browser or serve the folder with any static server.

Design language (inspired by studio sites like k95.it): one electric blue,
huge grotesque display type (Space Grotesk), monospace micro-labels
(IBM Plex Mono), a dark "darkroom" theme for photographs and a warm "paper"
theme for the physics pages. The home hero draws a live two-source wave
interference pattern — a small physics signature.

## Run it locally

```bash
python3 -m http.server 8000
```

Then open http://localhost:8000.

## Structure

```
index.html         Home: opening shuffle, then ONE screen — the blue
                   interference-dot canvas with a centred three-line
                   self-intro (name in EB Garamond, two guide links)
photography.html   Photography index
physics.html       Academic CV (research, education, projects, talks)
about.html         Bio, portrait, facts, contact
css/style.css      All styling (design tokens at the top)
js/main.js         Mobile nav, scroll reveals, hero wave canvas
js/gallery.js      Series filters + lightbox
assets/fonts/      Self-hosted woff2 (Space Grotesk, IBM Plex Mono — both OFL licensed)
assets/img/        PLACEHOLDER artwork — replace with your photographs
```

## Make it yours (checklist)

Everything to replace is marked with `PLACEHOLDER` comments in the HTML.

1. **Name / wordmark** — the name appears in two casings: all-caps
   "CROWTAO" in the nav wordmark of every page, and title-case "Crowtao"
   in the footer copyright, the home hero subtitle, each nav link's
   aria-label, and the `<title>`/meta tags. Search case-insensitively (or
   search both forms) and keep each spot's casing when replacing.
2. **Photos** — drop JPEGs into `assets/img/` and update the items in
   `photography.html` (src, width/height, alt text, `data-title`,
   `data-meta`, `data-series`). Export at ~2000 px on the long edge,
   sRGB, quality ≈ 80. Keep the width/height attributes accurate — they
   prevent layout shift. Also update the two count labels ("14
   photographs / 03 series" in `photography.html`, "03 series / 14
   photographs" on `index.html`) to match your final gallery.
3. **Series** — the three sample series (Spectra / Terrain / Matter) are
   defined by the filter buttons in `photography.html` and the cards on
   `index.html`. Rename or add series by editing `data-filter` /
   `data-series` values, and update the matching `#hash` in each
   series-card `href` on `index.html` (e.g. `photography.html#spectra`) —
   the gallery uses that hash to preselect the filter when arriving from
   the home page.
4. **Physics** — replace the sample publications and talks in
   `physics.html` with your real ones; point links at arXiv/DOI pages and
   the CV button at a real `assets/cv.pdf`.
5. **About** — rewrite the bio, replace `assets/img/portrait.svg`, and
   edit the fact list.
6. **Contact** — the email is set to crowtao2020@gmail.com in three places
   (home, physics, about). Note: a plain-text email on a public site
   attracts some spam; consider a dedicated address.
7. **Social links** — the footer "Elsewhere" links are `#` placeholders.
8. **Colors** — the palette lives as CSS custom properties at the top of
   `css/style.css` (`--blue` plus `--blue-bright`, its lighter partner
   used for hover text on dark backgrounds). Two copies of the blue are
   hardcoded and must be updated by hand: the `theme-color` meta in
   `index.html` and the background fill in `assets/favicon.svg` (a
   favicon cannot read CSS variables). Regenerate the PNG icons after
   editing the SVG.
9. **Share previews** — each page head has a commented-out `og:url` /
   `og:image` block; fill in your real domain after deploying so links
   shared in chat apps show the `assets/img/og.jpg` card.

## Experiments

`intro-v1.html` / `intro-v2.html` (older opening animations) and
`index-experiment*.html` (alternative homepage concepts: pinned curtain
backgrounds, intro-straight-to-CV, partitioned CV screens) are kept as
`noindex` comparison pages with their own isolated styles/scripts. Delete
them freely once no longer wanted. The `.strip` parallax CSS/JS remains in
`css/style.css` and `js/main.js` but no live page uses it.

## Deploy (free options)

- **GitHub Pages**: create a repo, push this folder, enable Pages in repo
  settings (deploy from branch). Custom domain supported.
- **Netlify / Cloudflare Pages**: drag-and-drop the folder or connect the
  repo. Instant HTTPS, custom domain support.

Buy a domain (e.g. your-name.com) from any registrar and point it at your
host — every option above documents this in a couple of steps.

## Opening animation

The home page opens with a fast shuffle (V1 style): a white screen, one
centred 3:4 card, photos cutting through it rapidly with a `[00]→[100]`
counter at the card's top-right. The last two entries hold longer — the final
one longest, while the frame widens to 16:9 (viewport-capped, still centred) —
then the photos scatter outward as the blue hero fades in. The photo list
lives in the `data-images` attribute of the `.intro` div in `index.html`
(order = shuffle order; the last two entries get the long holds; an optional
`|40%` after a path shifts the crop focus horizontally). Click anywhere to
skip; users with `prefers-reduced-motion` skip it automatically.

Two comparison pages are kept alongside (not linked from the site,
`noindex`): `intro-v1.html` — the original even-paced shuffle with no long
holds — and `intro-v2.html` — the hard-cut five-photo version whose final
frame stretches taller and whose blue card expands into the page. Each uses
its own script (`js/main-v1.js` / `js/main-v2.js`); delete the pair when no
longer needed.

## Notes

- Fonts are subset to latin and self-hosted (~42 KB total); both are under
  the SIL Open Font License.
- Animations respect `prefers-reduced-motion`.
- The gallery lightbox uses the native `<dialog>` element (all modern
  browsers).
