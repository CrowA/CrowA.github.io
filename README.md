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
blog/              Blog ("Field Notes") — a real Jekyll blog, see below
_posts/            Blog posts, one Markdown file each
_layouts/          Jekyll layouts for the blog (blog.html, post.html)
_config.yml        Jekyll config (blog title, permalinks, RSS feed)
photography-*.html Eight numbered galleries (i … viii)
css/style.css      Site styling (design tokens at the top)
css/blog.css       Blog styling
js/main.js         Nav, reveals, opening animation, hero dot canvas
assets/fonts/      Self-hosted fonts (Space Grotesk, IBM Plex Mono,
                   EB Garamond, Latin Modern — all freely licensed)
assets/img/        Images, organised by USE — see the map below
```

## Image folders — where to put what

Every display slot on the site has its own folder. To change what a slot
shows, change the files in its folder (and the matching `src`/`data-images`
list if you add or remove files):

```
assets/img/
  intro/               Opening-animation photos. The play order lives in
                       the data-images attribute in index.html (the same
                       list is used by the experiment pages).
  photography/
    covers/i.jpg …     The photo each Roman numeral shows on hover on
    covers/viii.jpg    photography.html. One file per numeral, named
                       after it — to change a cover, replace the file.
    i/ … viii/         The photos INSIDE each numbered gallery page
                       (photography-i.html … photography-viii.html).
  profile/             Personal photos ("him dreaming", "me in the past")
                       linked from the physics page and the blog sidebar.
  site/                Site graphics: og.jpg (share preview) and the
                       generated interference-dot backgrounds used by the
                       experiment pages.
  placeholders/        The original starter SVG artwork. Only
                       home-sections-backup.html still references it.
  originals/           Your TIFF scans (49 MB each). Git-ignored — they
                       never upload; keep them here as the local archive.
```

A photo used in two places (e.g. in the intro AND in gallery i) exists as
a copy in both folders on purpose: each slot is managed only by its own
folder.

## Blog ("Field Notes")

The blog is a proper Jekyll blog (the engine GitHub Pages runs natively —
the same idea as a WordPress blog like wall.org/~aron, but static). To
publish a post, create a Markdown file in `_posts/` named
`YYYY-MM-DD-slug.md`:

```markdown
---
layout: post
title: My post title
---

Write the post here in Markdown.
```

Push it, and GitHub Pages builds everything automatically: the post page at
`/blog/slug/`, the listing at `/blog/` (newest first, with the About /
Recent posts / Archives sidebar), and the RSS feed at `/feed.xml`. Nothing
else to maintain by hand.

To preview locally WITH the blog rendered, run:

```bash
./preview.sh
```

and open http://localhost:8001 — it builds and serves the whole site
(Jekyll is installed via Homebrew Ruby; the script sets up PATH and locale,
and rebuilds automatically when files change). `python3 -m http.server`
still works for everything except `/blog/`. Either way the blog builds on
GitHub's side on push: check the repo's Actions tab for the green
"pages build and deployment" run.

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
