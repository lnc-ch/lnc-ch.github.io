import test from 'node:test';
import assert from 'node:assert/strict';
import { localizePath, localizeHref } from '../src/lib/newspaper/i18n.mjs';

test('Japanese is canonical; all locale roots and article paths work', () => {
  assert.equal(localizePath('/', 'ja'), '/');
  assert.equal(localizePath('/', 'fr'), '/fr/');
  assert.equal(localizePath('/journal/welcome', 'en'), '/en/journal/welcome');
});
test('already localized bare roots must not be prefixed twice', () => {
  assert.equal(localizeHref('/fr', 'en'), '/fr');
  assert.equal(localizeHref('/en?edition=1#top', 'fr'), '/en?edition=1#top');
});
test('root fragments retain the slash before the fragment', () => {
  assert.equal(localizeHref('/#culture', 'fr'), '/fr/#culture');
  assert.equal(localizeHref('/?edition=1#top', 'en'), '/en/?edition=1#top');
});
test('external, email, and same-page links are not localized', () => {
  for (const link of ['https://epfl.ch', 'mailto:circle@example.org', '//example.org', '#main']) {
    assert.equal(localizeHref(link, 'fr'), link);
  }
});

import { ui, lorem, escapeHtml, safeHref, safeImage, storyCopy, articlePath, articleHref, formatIssueDate, excerpt, validateEdition } from '../src/lib/newspaper/content.mjs';
import { renderEdition, renderArticle, renderToolbar } from '../src/lib/newspaper/render.mjs';
const site = { name: 'Lausanne Nihonjin Circle', navigation: [] };
const sample = { id: 'first', area: 'main', span: 4, kind: 'article', tone: 'paper', placeholder: true, copy: { ja: { title: '見本記事' }, fr: { title: 'Un article' }, en: { title: 'An article' } } };
const edition = { id: 'front', issue: '001', date: '2026-09-22', copy: { ja: { masthead: 'ローザンヌ新聞' }, fr: { masthead: 'La gazette' }, en: { masthead: 'The Gazette' } }, stories: [sample] };

test('placeholder filler is in the requested language', () => {
  assert.equal(storyCopy(sample, 'ja').body, lorem.ja);
  assert.equal(storyCopy(sample, 'fr').body, lorem.fr);
  assert.equal(storyCopy(sample, 'en').body, lorem.en);
});
test('real articles never receive lorem ipsum when copy is missing', () => {
  assert.equal(storyCopy({ ...sample, placeholder: false }, 'en').body, '');
});
test('authored body replaces placeholder fallback without mutating the input', () => {
  const story = structuredClone(sample);
  story.copy.en.body = 'Actual supplied copy.';
  assert.equal(storyCopy(story, 'en').body, 'Actual supplied copy.');
  assert.equal(sample.copy.en.body, undefined);
});
test('Japanese remains the source fallback for actual untranslated content', () => {
  const story = { ...sample, placeholder: false, copy: { ja: { title: '原文', body: '本文です。' } } };
  assert.equal(storyCopy(story, 'fr').body, '本文です。');
});
test('escapes markup in text and attribute contexts', () => {
  assert.equal(escapeHtml('<b title="a&b">\'x\'</b>'), '&lt;b title=&quot;a&amp;b&quot;&gt;&#39;x&#39;&lt;/b&gt;');
});
test('unsafe, obfuscated, protocol-relative and data URLs cannot execute', () => {
  for (const href of ['javascript:alert(1)', 'data:text/html,x', '//evil.test', '/\\evil.test', 'java\nscript:alert(1)', 'https://a.test/\u0000']) assert.equal(safeHref(href, ''), '');
  for (const href of ['/about', '#main', 'https://epfl.ch', 'mailto:test@example.org']) assert.equal(safeHref(href), href);
});
test('image sources accept only same-site or HTTP(S) paths', () => {
  assert.equal(safeImage('/images/logo.svg'), '/images/logo.svg');
  assert.equal(safeImage('mailto:test@example.org'), '');
  assert.equal(safeImage('data:image/svg+xml,<svg>'), '');
});
test('article URLs are deterministic and locale switches preserve the article', () => {
  assert.equal(articlePath('/', 'front', 'first'), '/journal/front/first');
  assert.equal(articlePath('/about', 'autumn', 'first'), '/about/journal/autumn/first');
  assert.equal(articleHref('/', 'front', 'first', 'en'), '/en/journal/front/first');
  assert.equal(articlePath('/', 'front', 'unsafe/id'), '/journal/front/unsafe%2Fid');
});
test('publication dates reject invalid and rolled-over dates', () => {
  assert.match(formatIssueDate('2026-09-22', 'en'), /22.*September.*2026/);
  for (const date of ['2026-02-30', 'not-a-date', '2026-9-2']) assert.equal(formatIssueDate(date, 'en'), '');
});
test('excerpt truncation respects Unicode characters and whole Latin words', () => {
  assert.equal(excerpt('😀'.repeat(251), 'ja'), '😀'.repeat(250) + '…');
  assert.equal(excerpt('word '.repeat(106), 'en'), Array(105).fill('word').join(' ') + '…');
  assert.equal(excerpt('', 'ja'), '');
});
test('duplicate story IDs and unsafe edition IDs fail early', () => {
  assert.throws(() => validateEdition({ ...edition, stories: [sample, sample] }), /Duplicate story ID/);
  assert.throws(() => validateEdition({ ...edition, id: '"<bad>' }), /edition IDs/);
});
test('CMS story reordering changes presentation order without template edits', () => {
  const second = { ...sample, id: 'second' };
  const markup = renderEdition({ ...edition, stories: [second, sample] }, 'en', { slug: '/', site });
  assert.ok(markup.indexOf('id="paper-front-second"') < markup.indexOf('id="paper-front-first"'));
  assert.equal((markup.match(/class="story story--/g) || []).length, 2);
});
test('CMS placement and width choices control the grid', () => {
  const story = { ...sample, area: 'bottom', span: 6 };
  const markup = renderEdition({ ...edition, stories: [story] }, 'en', { slug: '/', site });
  assert.ok(markup.indexOf('class="classifieds"') < markup.indexOf('id="paper-front-first"'));
  assert.match(markup, /data-span="6" style="--span:6"/);
});
test('CMS text is escaped everywhere, not interpreted as HTML', () => {
  const story = { ...sample, placeholder: false, copy: { ja: { title: '<script>bad()</script>', body: '<img src=x onerror=bad()>' } } };
  const markup = renderArticle(edition, story, 'ja', { slug: '/', site });
  assert.ok(!markup.includes('<script>'));
  assert.ok(!markup.includes('<img src=x'));
  assert.ok(markup.includes('&lt;script&gt;'));
});
test('empty editions still render the masthead and publisher without broken links', () => {
  const markup = renderEdition({ ...edition, stories: [] }, 'en', { slug: '/', site });
  assert.ok(markup.includes('The Gazette'));
  assert.ok(!markup.includes('undefined'));
  assert.ok(!markup.includes('class="classifieds"'));
});
test('full article body is not the clamped/repeated front-page excerpt', () => {
  const markup = renderArticle(edition, sample, 'en', { slug: '/', site });
  assert.ok(markup.includes(escapeHtml(lorem.en.split('\n\n')[2])));
  assert.equal((markup.match(/Every headline and paragraph/g) || []).length, 1);
  assert.ok(markup.includes(ui.en.sample));
});
test('long headings switch to a wrapping treatment instead of being cropped', () => {
  const story = { ...sample, copy: { ja: { title: 'これはとても長い記事の見出しです。'.repeat(5) } } };
  assert.match(renderEdition({ ...edition, stories: [story] }, 'ja', { slug: '/', site }), /story--long-title/);
});
test('the official publisher image is displayed unchanged, with an initialism fallback', () => {
  const markup = renderEdition({ ...edition, logo: '/images/official.svg' }, 'en', { slug: '/', site });
  assert.match(markup, /class="publisher-logo" src="\/images\/official.svg"/);
  assert.ok(!markup.includes('publisher-initials'));
  assert.match(renderEdition(edition, 'en', { slug: '/', site }), /publisher-initials/);
});
test('toolbar provides exact article translation paths and an accessible current locale', () => {
  const markup = renderToolbar(site, 'fr', '/journal/front/first');
  assert.match(markup, /href="\/en\/journal\/front\/first"/);
  assert.match(markup, /lang="fr" hreflang="fr" aria-current="page"/);
  assert.match(markup, /button hidden type="button"/);
});

import { readFileSync } from 'node:fs';
import { runInNewContext } from 'node:vm';
const clientScript = readFileSync(new URL('../public/newspaper.js', import.meta.url), 'utf8');
function clientHarness({ stored = null, denied = false, newspaper = true } = {}) {
  let click;
  const attributes = {};
  const button = { hidden: true, dataset: { labelPaper: 'Paper', labelText: 'Reading' }, textContent: '',
    setAttribute(name, value) { attributes[name] = value; }, addEventListener(name, fn) { if (name === 'click') click = fn; } };
  const document = { documentElement: { dataset: {} }, querySelectorAll: () => [button], querySelector: () => newspaper ? {} : null };
  const storage = { getItem() { if (denied) throw new Error('Storage denied'); return stored; }, setItem(key, value) { if (denied) throw new Error('Storage denied'); stored = value; } };
  runInNewContext(clientScript, { document, localStorage: storage });
  return { button, attributes, document, click: () => click(), stored: () => stored };
}
test('reading-mode preference initializes state, label and ARIA correctly', () => {
  const client = clientHarness({ stored: 'text' });
  assert.equal(client.document.documentElement.dataset.readingMode, 'text');
  assert.equal(client.button.hidden, false);
  assert.equal(client.button.textContent, 'Paper');
  assert.equal(client.attributes['aria-pressed'], 'true');
  client.click();
  assert.equal(client.stored(), 'paper');
  assert.equal(client.attributes['aria-pressed'], 'false');
});
test('reading-mode toggle works when browser storage is denied', () => {
  const client = clientHarness({ denied: true });
  assert.doesNotThrow(() => client.click());
  assert.equal(client.document.documentElement.dataset.readingMode, 'text');
});
test('the cover-only display toggle stays hidden on full articles', () => {
  const client = clientHarness({ newspaper: false });
  assert.equal(client.button.hidden, true);
});
