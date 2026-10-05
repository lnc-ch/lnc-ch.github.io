# Maintainer notes

## Boundaries

`content.mjs` owns locale paths, date handling, publication selection, palette values and their contrast. `src/content.config.ts` validates the CMS input. `routeEntries` detects duplicate routes across collections and locales.

`render/html.mjs` escapes all scalar interpolation; only composition of markup made by that helper bypasses escaping. CMS text cannot add script tags or arbitrary HTML. URL schemes are restricted. The block called `rich_text` is a historical name for a **plain-text** section, not an HTML trust boundary.

`render/page.mjs` emits one Barba container, the main landmark, navigation, footer and managed metadata. Every page uses the same bundled CSS and scripts; swapping a container does not require injecting another page-specific stylesheet or evaluating incoming scripts.

## Colour transition

1. A capture-phase click listener measures the selected link before scroll is stopped.
2. `rectToClip` clamps the visible rectangle to the viewport and returns an inset clip path.
3. GSAP animates a fixed colour layer from that rectangle to the full viewport.
4. The old container is removed; the next HTML container is inserted. Its background comes from the same `themeFor` token as the source card.
5. The layer fades, focus moves to the title, and the next page's reveals are mounted.
6. Browser Back/Forward uses a per-entry identity stored through Barba's history utility, not a map keyed only by pathname. Returning to a visible source card contracts the colour layer to it.

Reduced motion skips the spatial animation and Lenis. Native touch scrolling is not emulated. ScrollTrigger resources and image listeners belong to a page scope and are released before its DOM is removed. One persistent ticker drives Lenis. The browser's back/forward cache preserves the active router rather than remounting it.

## Publishing

No form submissions, payments, credentials or backend are introduced. Membership and event registration are plain links to confirmed destinations supplied through Pages CMS. Drafts are omitted from production routes and links. Explicit preview builds disclose sample content and set noindex.

Static event selection is evaluated at build time. A scheduled daily deployment prevents it remaining stale indefinitely, but there can be a delay of up to a build interval before an event moves to the archive. Build on demand for time-sensitive changes.

## Useful primary references

- GSAP contexts: https://gsap.com/docs/v3/GSAP/gsap.context/
- GSAP ticker: https://gsap.com/docs/v3/GSAP/gsap.ticker/
- Lenis: https://github.com/darkroomengineering/lenis
- Barba hooks: https://barba.js.org/docs/advanced/hooks/
- Barba history: https://barba.js.org/docs/advanced/strategies/
- Barba request failures and container lifecycle: https://barba.js.org/docs/advanced/recipes/
- Fonts: https://fontsource.org/fonts/eb-garamond · https://fontsource.org/fonts/zen-old-mincho · https://fontsource.org/fonts/hanken-grotesk

## Deliberate differences from the concept image

The masthead uses the association's actual Japanese designation, not a new logo. The preview has a small sample-content notice. Unsupported social/membership links are absent. Photos are labelled illustrative until replaced. On mobile the grid becomes two columns, while the lead event and lead photograph occupy full rows.
