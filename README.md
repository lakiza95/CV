# Ilya Lakiza — CV site

A single-page CV / portfolio site, deployed as static HTML/CSS/JS (no build step, no framework).

- `index.html` — Russian (default)
- `en.html` — English
- `assets/site.css`, `assets/site.js` — shared styles and scroll/nav behaviour
- `assets/portrait.jpg` — hero photo

## Local preview

```
python3 -m http.server 8000
```

then open `http://localhost:8000/index.html`.

## Deploying with GitHub Pages

1. Push this repo to GitHub (already set up if you're reading this from the repo).
2. In the repo's **Settings → Pages**, set **Source** to "Deploy from a branch", branch `main`, folder `/ (root)`.
3. The site will be published at `https://<username>.github.io/<repo>/`.

## About `design-handoff/`

`design-handoff/` holds the original Claude Design export (prototype HTML, design-system tokens,
and the chat transcript that shaped the design) that this site was built from. It's kept for
reference and isn't part of the published site.
