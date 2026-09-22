# LNC newspaper

The newspaper is a Pages CMS block, not a raster image or a separate application.
Japanese is the default edition; French and English use the same story structure
with horizontal typography. This change does not introduce React, Solid, another
CMS, or additional npm dependencies.

## Editing the front page

Open **Pages → home → Sections → Newspaper** in Pages CMS.

The edition fields control its stable ID, issue number, publication date,
masthead, subtitle, season, publisher text, and official logo. Upload the official
logo through the Logo field; it is displayed without recoloring. Until one is
provided, the publisher area contains plain LNC initials, not a replacement logo.

**Stories** is an ordered, editable list. Every story has Japanese, French and
English copy fields. The main fields are:

| Field | Effect |
| --- | --- |
| ID | Stable, unique lowercase URL identifier. Changing it changes article URLs. |
| Area | Main paper, publisher-side rail, or bottom notices. |
| Order | Drag stories to reorder them inside their chosen area. |
| Width | Number of columns in the 12-column desktop grid. Typical widths: 3, 4, 6, 9, 12. Rail stories always use the rail width. |
| Treatment | Article, poster, lead headline, or short notice. |
| Ink | Paper-on-ink headline instead of ink-on-paper. |
| Specimen | Explicit permission to supply language-specific lorem when that language's body is blank. |
| Title / deck / body | Headline, short introductory sentence, full article text. |
| Label / metadata / byline | Small editorial details, never generated event dates or membership prices. |
| Image / image description | Optional story image. Front-page photos are monochrome; full-article photos retain their colors. |
| Action link / label | Optional real destination on the full article, e.g. an existing registration page. |

Use plain text in newspaper bodies. Blank lines separate paragraphs; single
newlines are preserved. HTML is escaped rather than executed. The older
Rich Text blocks continue to use their original HTML editor.

The front page uses excerpts. Clicking a story opens its full body at a stable
route such as `/journal/front/autumn`, `/fr/journal/front/autumn`, or
`/en/journal/front/autumn`. A newspaper on another CMS page gets that page's prefix.
Language switching keeps the article, not just the homepage. Back/previous/next
article links are ordinary HTML links and work without JavaScript.

Keep edition IDs unique within a page and story IDs unique within an edition.
The build rejects duplicated generated routes and IDs. Edition dates must be real
calendar dates in `YYYY-MM-DD` format. The displayed date is the editorial issue
date, not a visitor-local clock pretending the issue was published today.

## Replacing the specimen

The supplied front page contains 16 clearly marked specimen stories. They are
examples, not actual event or membership announcements. For each real article:

1. Enter the real headline, introduction and body for each available language.
2. Turn **Specimen** off.
3. Supply genuine metadata, image or registration link only where applicable.

Blank real articles do not silently receive lorem. Untranslated real fields keep
the existing Japanese-source fallback behavior. Blank specimen bodies receive
Japanese, French, or English filler appropriate to the edition. Repeated filler
is used only to give *specimen front-page excerpts* the dense reference texture;
full articles do not repeat the body.

Specimen articles carry an explicit notice and `noindex, follow`. A CMS page with
any specimen story is also `noindex, follow`; remove all specimen flags after
replacing the sample copy before making the homepage indexable.

## Layout behavior

The desktop cover has a main field and narrow publisher rail, with a 12-column
story grid and a separate bottom row. Dense Japanese typography uses real
`writing-mode: vertical-rl`. Headline rules, gutters and ink panels are CSS, and
all text remains selectable HTML. Headline styles and column spans are editable;
there are no hand-positioned text overlays or screenshot slices.

At 900px and below the publisher becomes a compact line and the paper reflows
into a readable horizontal list. Bottom notices become two columns. A small
optional Reading view control switches the desktop cover to a horizontal list
of larger excerpts. Its preference is stored locally when the browser allows
storage; native links still work without scripts. The control is hidden on full
articles, which are already set for comfortable reading.

This design deliberately uses dense, small cover typography on large screens.
The full article pages and Reading view provide the more legible alternative.
Long replacement headlines can grow a tile or use the wrapping treatment.
Extremely narrow column choices should be checked in preview, especially with
long Latin words: 3–4 columns are a sensible default for short notices.

## Publishing

Content is dynamic **at build time**: changing CMS data changes the generated
layout and article routes on the next Astro/GitHub Pages build. This is not a
real-time database or an event booking backend. The existing deployment workflow
is unchanged. Use the repository's existing Pages CMS setup and publication
process after applying and reviewing these files.

The existing Hero, Rich Text, Split, Gallery and CTA block types remain
available, and the About YAML is not overwritten. The shell now uses normal
browser navigation instead of booting Barba/Locomotive; this avoids carrying an
old document language or head metadata across translated pages. The previous
animation script and dependency declarations have not been deleted, so you can
reintroduce appropriately scoped motion later.

## Typography and colors

No font binaries are included. The specimen uses local/system serif stacks:
Noto Serif CJK / Hiragino Mincho / Yu Mincho for Japanese, Didot / Bodoni /
Noto Serif Display for Latin display, and Noto Serif / Georgia for Latin body.
The screenshots used Linux-installed Noto faces. macOS will choose the available
faces from the stack, so exact letterforms and line breaks can differ.

After selecting fonts licensed for your use, define `@font-face` yourself and
override `--jp-serif`, `--latin-serif`, and `--body-serif` in
`src/styles/newspaper.css`. `--paper`, `--ink`, `--rule`, and `--desk` control the
paper/ink palette. There are no remotely loaded font services or bundled fonts.

## Files and checks

`src/lib/newspaper/render.mjs` is the escaped, shared HTML renderer.
`content.mjs` owns localizable interface copy, specimen fallback and route/date
helpers. `schema.ts` validates content. The Astro components are thin adapters,
and `src/pages/[...slug].astro` generates the CMS and article routes.

```sh
npm test
npm run build
npm run dev
```

The dependency-free unit tests cover rendering, localization, security, routing,
specimen behavior, and the optional reading-mode script. A production Astro
build should always be run locally before merging this visual change.
