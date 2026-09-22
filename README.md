# Lausanne Nihonjin Circle website

Static Astro website with Git-backed editing through Pages CMS.

## Local development

```sh
npm install
npm run dev
```

## Architecture

- `src/data/pages/*.yaml` — CMS-owned page content.
- `src/components/sections/` — bespoke visual section components.
- `src/components/PageRenderer.astro` — maps CMS section types to components.
- `src/pages/[...slug].astro` — generates every CMS page route.
- `src/data/site.json` — association name and navigation.
- `.pages.yml` — Pages CMS admin schema.
- `.github/workflows/deploy.yml` — static GitHub Pages deployment.

Pages CMS edits data files; Astro validates them and renders a static site. No CMS or Astro runtime is required in the visitor's browser.
