import { copyFor, localizePath, locales, safeHref, themeFor, ui } from '../content.mjs';
import { html, arrow } from './html.mjs';
import { renderHeader, renderFooter } from './chrome.mjs';
import { renderSections } from './sections.mjs';
import { renderEvent } from './event.mjs';

export function pageMeta(model) {
  const {kind,locale,site,event,page}=model;
  const title=kind==='home' ? site.name : kind==='event' ? `${copyFor(event.copy,locale).title} — LNC` : kind==='404' ? `${ui[locale].notFound} — LNC` : `${copyFor(page?.title,locale).text || ui[locale].events} — LNC`;
  const description=kind==='event' ? copyFor(event.copy,locale).body?.split('\n')[0] : copyFor(page?.description,locale).text || site.name;
  const theme=themeFor(kind==='event' ? event.theme : page?.theme ?? 'paper');
  const canonical=new URL(model.path,site.url).href;
  return {title,description:description || site.name,canonical,lang:locale,...theme};
}

export function renderHead(model) {
  const meta=pageMeta(model);
  return html`<title data-page-head>${meta.title}</title>
    <meta data-page-head name="description" content="${meta.description}">
    <meta data-page-head name="theme-color" content="${meta.background}">
    <meta data-page-head name="robots" content="${model.preview || model.kind==='404' ? 'noindex, nofollow' : 'index, follow, max-image-preview:large'}">
    <link data-page-head rel="canonical" href="${meta.canonical}">
    ${locales.map((language)=>html`<link data-page-head rel="alternate" hreflang="${language}" href="${new URL(localizePath(model.path,language),model.site.url).href}">`)}
    <link data-page-head rel="alternate" hreflang="x-default" href="${new URL(localizePath(model.path,'ja'),model.site.url).href}">
    <meta data-page-head property="og:type" content="website">
    <meta data-page-head property="og:title" content="${meta.title}">
    <meta data-page-head property="og:description" content="${meta.description}">
    <meta data-page-head property="og:url" content="${meta.canonical}">
    ${safeHref(model.site.socialImage) ? html`<meta data-page-head property="og:image" content="${new URL(model.site.socialImage,model.site.url).href}">` : ''}`;
}

export function renderDocumentBody(model) {
  const meta=pageMeta(model);
  const {locale,kind,page}=model;
  const content=kind==='event' ? renderEvent(model) : kind==='programme' ? html`${renderSections(page?.sections,model)}` : kind==='404' ? html`<div class="not-found"><p>404</p><h1 tabindex="-1" data-page-focus>${ui[locale].notFound}</h1><a class="text-link" href="${localizePath('/',locale)}">${ui[locale].returnHome}${arrow}</a></div>` : html`${kind==='content' ? html`<div class="page-heading"><h1 tabindex="-1" data-page-focus>${copyFor(page.title,locale).text}</h1>${locale!=='ja' ? html`<span lang="ja">${copyFor(page.title,'ja').text}</span>` : ''}</div>` : ''}${renderSections(page?.sections,model)}`;
  return html`<div class="page-shell" data-barba="container" data-barba-namespace="${kind}" data-page-color="${meta.background}" data-page-ink="${meta.foreground}" data-page-lang="${locale}" data-page-title="${meta.title}" data-page-path="${model.path}" data-event-key="${model.event?.slug ?? ''}" data-transition-key="${model.event?.slug ?? (kind!=='home' && page?.key ? `page:${page.key}` : '')}" style="--page-bg:${meta.background};--page-ink:${meta.foreground}">
    <a class="skip-link" href="#main-content" data-barba-prevent>${ui[locale].skip}</a>
    ${model.preview ? html`<aside class="preview-banner">${ui[locale].preview}</aside>` : ''}
    ${renderHeader(model)}
    <main id="main-content" tabindex="-1" class="page-main page-main--${kind}">${content}</main>
    ${renderFooter(model)}
  </div>`;
}
