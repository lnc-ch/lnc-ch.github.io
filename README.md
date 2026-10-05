# Lausanne Nihonjin Circle

Astro + Pages CMS. Japanese at `/`, French at `/fr/`, English at `/en/`.

An editorial event board: oversized Garamond/Mincho typography, terracotta, moss, rose and ink. No slogans, flag imagery, paper texture or newspaper renderer.

## Run

Use Node 24 (Node 22.12+ also satisfies the declared engine).

```sh
npm install
npm run dev:design  # previews drafts with a visible disclaimer; never indexed
```

`npm run dev` and `npm run build` exclude drafts. `npm run preview` serves the last build. The source handoff does not fabricate a lockfile: `npm install` generates it, and the apply/PR helper commits it before opening a PR. Subsequent installs and CI use `npm ci`.

## Edit in Pages CMS

`.pages.yml` exposes **Site settings**, **Pages**, and **Events**. All copy has Japanese/French/English fields; missing translations fall back to Japanese per field.

Pages contain ordered sections: event board, full events index, text, text/image split, gallery, link, membership. Text is deliberately plain text, not executable HTML; blank lines become paragraphs. The required home, events, about and join routes should remain published. Further pages can be added without writing Astro routes.

Events have their own stable slug, start/end (ISO strings with an explicit timezone offset), location, status, palette, image, registration URL, and localized copy. Palette choices determine **both** the card and its destination page. Cancellation and end time control registration availability. A daily GitHub Pages build refreshes the upcoming/archive classification; this is static publishing, not a continuously updating database.

### Content still needed

The four included events are **draft design samples**, not real announcements. Replace their information with confirmed details before publishing, or delete them. The two WebP images are illustrative crops from the approved concept, not LNC documentary photographs. Replace them with genuine images, update their descriptions, and then switch off the illustration label.

Site settings deliberately leave the official logo, contact email, Instagram and membership URL empty. No fake signup form or guessed contact details are shipped. The supplied logo will be displayed unchanged.

## Typography

- Latin display: **EB Garamond 400**.
- Japanese display: **Zen Old Mincho 400**.
- UI: **ABC Diatype-ready**, with **Hanken Grotesk Variable** as the open-licensed fallback.

Fonts are installed through Fontsource. No commercial/trial font assets are included. After obtaining the appropriate Diatype licence, add its `@font-face` declaration to `src/styles/fonts.css`; the UI stack already uses `ABC Diatype` first. Do not deploy Dinamo trial files.

## Motion and architecture

Astro generates complete HTML pages. `src/lib/render/` contains the escaped render functions used by the Astro layout and unit tests. The schema is in `src/content.config.ts`; routes are generated from the content collections, not duplicated for each language.

**Barba** is the only client router. **GSAP** expands a selected card's measured viewport rectangle into a full-screen colour layer. The real destination has that exact palette underneath. Back navigation contracts the layer into the previous card when it is present. **Lenis** uses the GSAP ticker, with native touch scrolling, and is omitted under reduced motion. There is no competing Astro ClientRouter or Locomotive instance.

The router updates title, language, canonical/alternate metadata and focus, preserves per-history-entry scroll positions, and cleans up page-bound ScrollTriggers. Links remain ordinary links without JavaScript. Failed clicks fall back to native navigation; failed speculative prefetches do not navigate. Section anchors replace the URL fragment without creating extra Back stops.

## Checks

```sh
npm run validate              # unit tests, Astro check, production build
node scripts/audit-build.mjs   # required routes and draft isolation
npm run build:test            # deterministic, noindex test fixtures
npx --no-install playwright install chromium
npm run test:e2e              # desktop/mobile real browser integration
npm run build                # restore production output after testing
```

Browser tests use fixed fixtures and a fixed clock independently of live CMS edits. Real content is still schema-validated during their build. Preview/test builds are explicitly barred from the deployment workflow.

### Verification of this handoff

Dependency-free tests and offline Chromium rendering were run in the authoring environment. Its npm registry access failed with `EAI_AGAIN`, and browser URL navigation was policy-blocked. Consequently, **Astro compilation and the real GSAP/Lenis/Barba integration suite have not been run here**. The included CI workflow and apply/PR helper run them before submission. Offline screenshots use locally available Garamond/Mincho/sans fonts rather than fetched Fontsource files.
