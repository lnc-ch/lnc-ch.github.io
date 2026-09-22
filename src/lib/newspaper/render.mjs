import { getLocalizedCopy, localizeHref, localizePath, locales, localeLabels } from './i18n.mjs';
import { ui, escapeHtml as h, safeHref, safeImage, storyCopy, articleHref, formatIssueDate, excerpt, validateEdition } from './content.mjs';

const lines = text => h(text).replace(/\n/g, ' <br>');
const paragraphs = text => String(text || '').split(/\n\s*\n/).filter(Boolean).map(p => `<p>${lines(p)}</p>`).join('');

export function renderToolbar(site, locale, slug) {
  const labels = ui[locale];
  return `<a class="skip-link" href="#main">${labels.skip}</a>
    <header class="edition-toolbar">
      <a class="toolbar-brand" href="${h(localizePath('/', locale))}" aria-label="${h(site.name)}"><b>LNC</b><span>${h(site.name)}</span></a>
      <nav class="edition-navigation" aria-label="${locale === 'ja' ? '主なページ' : locale === 'fr' ? 'Navigation principale' : 'Main navigation'}">${(site.navigation || []).map(item => `<a href="${h(safeHref(localizeHref(item.href, locale)))}">${h(item.label[locale] || item.label.ja)}</a>`).join('')}</nav>
      <div class="edition-tools"><button hidden type="button" class="reading-toggle" data-reading-toggle data-label-text="${labels.text}" data-label-paper="${labels.paper}" aria-pressed="false">${labels.text}</button>
      <nav class="edition-languages" aria-label="${labels.language}">${locales.map(language => `<a href="${h(localizePath(slug, language))}" lang="${language}" hreflang="${language}" ${language === locale ? 'aria-current="page"' : ''}>${localeLabels[language]}</a>`).join('')}</nav></div>
    </header>`;
}

export function renderFooter(site, locale) {
  return `<footer class="edition-footer"><span>${h(site.name)}</span><span>LAUSANNE · CH</span><a href="${h(localizePath('/', locale))}">${ui[locale].back} ↑</a></footer>`;
}

function renderPublisher(edition, locale, site) {
  const copy = getLocalizedCopy(edition.copy, locale);
  const logo = safeImage(edition.logo);
  return `<div class="publisher">
    <span class="publisher-city">LAUSANNE · JAPON</span>
    ${logo ? `<img class="publisher-logo" src="${h(logo)}" alt="${h(site.name)}" width="140" height="90">` : '<span class="publisher-initials" aria-label="Lausanne Nihonjin Circle">LNC</span>'}
    <p class="publisher-name">${lines(copy.publisherName || site.name)}</p>
    <p class="publisher-tagline">${h(copy.publisherNote || '')}</p>
    <span class="publisher-issue">${ui[locale].issue} ${h(edition.issue)}${locale === 'ja' ? ' 号' : ''}</span>
  </div>`;
}

function renderNameplate(edition, locale, heading = true) {
  const copy = getLocalizedCopy(edition.copy, locale);
  const Tag = heading ? 'h1' : 'div';
  return `<div class="nameplate"><${Tag} id="paper-${h(edition.id)}-title" class="nameplate-title">${lines(copy.masthead)}</${Tag}><div class="nameplate-subline"><span>${h(copy.subtitle)}</span><span>${h(copy.season)}</span></div></div>`;
}

export function renderStory(story, edition, locale, slug) {
  const copy = storyCopy(story, locale);
  const id = `paper-${edition.id}-${story.id}`;
  const span = Math.max(1, Math.min(12, Number(story.span) || 4));
  const kinds = ['article', 'poster', 'lead', 'brief'];
  const kind = kinds.includes(story.kind) ? story.kind : 'article';
  const ink = story.tone === 'ink';
  const image = safeImage(story.image);
  const long = Array.from(copy.title || '').length > (locale === 'ja' ? 30 : 75);
  const href = articleHref(slug, edition.id, story.id, locale);
  const previewBody = story.placeholder ? Array(4).fill(copy.body).join('\n\n') : copy.body;
  const body = excerpt(previewBody, locale, story.area === 'rail' ? 9 : kind === 'lead' ? 2.5 : span >= 8 ? 2.1 : 0.92);
  return `<article id="${h(id)}" class="story story--${kind}${ink ? ' story--ink' : ''}${long ? ' story--long-title' : ''}" data-span="${span}" style="--span:${span}">
    <a class="story-link" href="${h(href)}" aria-labelledby="${h(id)}-title">
      <div class="story-topline"><span>${h(copy.label || '')}</span><span>${h(copy.meta || '')}</span></div>
      <div class="story-inner">
        <h2 id="${h(id)}-title" class="story-title">${lines(copy.title)}</h2>
        <div class="story-copy">${copy.deck ? `<p class="story-deck">${h(copy.deck)}</p>` : ''}${image ? `<figure class="story-figure"><img src="${h(image)}" alt="${h(copy.imageAlt || '')}" loading="lazy" width="600" height="420"></figure>` : ''}<div class="story-prose">${paragraphs(body)}</div></div>
      </div>
      <div class="story-tail"><span>${story.placeholder ? (locale === 'ja' ? '見本原稿' : 'SPECIMEN') : h(copy.byline || '')}</span><span>${ui[locale].read} ↗</span></div>
    </a>
  </article>`;
}

export function renderEdition(edition, locale, { slug = '/', site } = {}) {
  validateEdition(edition);
  const copy = getLocalizedCopy(edition.copy, locale);
  const stories = edition.stories || [];
  const main = stories.filter(story => !story.area || story.area === 'main');
  const rail = stories.filter(story => story.area === 'rail');
  const bottom = stories.filter(story => story.area === 'bottom');
  return `<section class="newspaper" aria-labelledby="paper-${h(edition.id)}-title">
    <div class="pressline"><span>LAUSANNE, SUISSE</span><time datetime="${h(edition.date)}">${h(formatIssueDate(edition.date, locale))}</time><span>${h(copy.edition || ui[locale].edition)}</span><span>${ui[locale].issue} ${h(edition.issue)}</span></div>
    <div class="newspaper-grid">
      <div class="newspaper-main">${renderNameplate(edition, locale)}<div class="story-grid">${main.map(story => renderStory(story, edition, locale, slug)).join('')}</div></div>
      <aside class="newspaper-rail" aria-label="${h(copy.railLabel || ui[locale].publisher)}">${renderPublisher(edition, locale, site)}${rail.map(story => renderStory(story, edition, locale, slug)).join('')}</aside>
    </div>
    ${bottom.length ? `<section class="classifieds" aria-label="${h(copy.bottomLabel || 'Notices')}">${bottom.map(story => renderStory(story, edition, locale, slug)).join('')}</section>` : ''}
    <div class="colophon"><span>${h(copy.colophon || '')}</span><span>${stories.some(story => story.placeholder) ? ui[locale].specimen : h(copy.subtitle || '')}</span></div>
  </section>`;
}

export function renderArticle(edition, story, locale, { slug = '/', site } = {}) {
  const copy = storyCopy(story, locale);
  const issue = getLocalizedCopy(edition.copy, locale);
  const image = safeImage(story.image);
  const action = safeHref(story.href, '');
  const index = edition.stories.findIndex(item => item.id === story.id);
  const adjacent = [edition.stories[index - 1], edition.stories[index + 1]];
  return `<article class="reading-sheet">
    <header class="reading-header"><a class="reading-wordmark" href="${h(localizePath(slug, locale))}">${h(issue.masthead).replace(/\n/g, ' ')}</a><span>${h(formatIssueDate(edition.date, locale))} · ${ui[locale].issue} ${h(edition.issue)}</span></header>
    <a class="reading-back" href="${h(localizePath(slug, locale))}#paper-${h(edition.id)}-${h(story.id)}">← ${ui[locale].back}</a>
    <p class="reading-label">${h(copy.label || '')}</p>
    <h1 class="reading-title">${lines(copy.title)}</h1>
    ${copy.deck ? `<p class="reading-deck">${h(copy.deck)}</p>` : ''}
    ${story.placeholder ? `<p class="specimen-notice">${ui[locale].sample}</p>` : ''}
    <div class="reading-byline"><span>${h(copy.byline || site.name)}</span><span>${h(copy.meta || '')}</span></div>
    ${image ? `<figure class="reading-image"><img src="${h(image)}" alt="${h(copy.imageAlt || '')}" width="1100" height="770"></figure>` : ''}
    <div class="reading-body">${paragraphs(copy.body || ui[locale].noBody)}</div>
    ${action ? `<a class="reading-action" href="${h(safeHref(localizeHref(action, locale)))}">${h(copy.action || ui[locale].read)} ↗</a>` : ''}
    <nav class="reading-adjacent" aria-label="${locale === 'ja' ? '記事の移動' : locale === 'fr' ? 'Parcourir les articles' : 'Browse articles'}">${adjacent.map((item, n) => item ? `<a href="${h(articleHref(slug, edition.id, item.id, locale))}"><small>${n ? ui[locale].next : ui[locale].previous}</small><span>${h(storyCopy(item, locale).title).replace(/\n/g, ' ')} ${n ? '→' : '←'}</span></a>` : '<span></span>').join('')}</nav>
  </article>`;
}
