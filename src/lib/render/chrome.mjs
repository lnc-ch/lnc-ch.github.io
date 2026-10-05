import { copyFor, localizePath, safeHref, locales, localeLabels, ui } from '../content.mjs';
import { html, arrow } from './html.mjs';

export function renderNavigation(model) {
  const { locale, path, site } = model;
  const words = ui[locale];
  const canonical = localizePath(path, 'ja');
  const nav = [{ href: '/events/', label: words.events }, { href: '/about/', label: words.about }, { href: '/join/', label: words.join }];
  return html`<nav class="site-nav" aria-label="${words.nav}">
    ${nav.map((item) => html`<a class="site-nav__link" href="${localizePath(item.href, locale)}"${canonical.startsWith(item.href) ? html` aria-current="page"` : ''}><span>${item.label}</span>${arrow}</a>`)}
    <div class="language-switch" role="group" aria-label="${words.language}">${locales.map((language) => html`<a href="${localizePath(path, language)}" lang="${language}" hreflang="${language}" aria-label="${language === 'ja' ? '日本語' : language === 'fr' ? 'Français' : 'English'}"${language === locale ? html` aria-current="page"` : ''}>${localeLabels[language]}</a>`)}</div>
    ${safeHref(site.logo) ? html`<a class="official-logo" href="${localizePath('/',locale)}" aria-label="${words.home}"><img src="${safeHref(site.logo)}" alt="${site.name}" width="52" height="52"></a>` : ''}
  </nav>`;
}

export function renderHeader(model) {
  const { site, locale, kind } = model;
  if (kind === 'home') return html`<header class="site-header site-header--home">
    <h1 class="masthead" tabindex="-1" data-page-focus aria-label="${site.name}">
      <span class="masthead__line masthead__line--first" lang="en">LAUSANNE NIHONJIN</span>
      <span class="masthead__line masthead__line--second"><span class="masthead__circle" lang="en">CIRCLE</span><span class="masthead__japanese" lang="ja">${site.mastheadJa}</span><span class="masthead__location" aria-hidden="true">EPFL<br>LAUSANNE</span></span>
    </h1>${renderNavigation(model)}
  </header>`;
  return html`<header class="site-header site-header--compact">
    <div class="compact-brand"><a href="${localizePath('/',locale)}" aria-label="${ui[locale].home}">LNC</a><span lang="en">Lausanne<br>Nihonjin Circle</span></div>
    ${renderNavigation(model)}
  </header>`;
}

export function renderFooter(model) {
  const { site, locale } = model;
  const email = safeHref(site.email ? `mailto:${site.email}` : '');
  const social = safeHref(site.instagramUrl);
  return html`<footer class="site-footer"><a class="footer-wordmark" href="${localizePath('/',locale)}" aria-label="${ui[locale].home}">LNC</a><span class="site-footer__place">EPFL · LAUSANNE</span><div class="site-footer__links">
    ${social ? html`<a href="${social}" data-barba-prevent target="_blank" rel="noopener noreferrer">Instagram ${arrow}</a>` : ''}
    ${email ? html`<a href="${email}" data-barba-prevent>${ui[locale].contact} ${arrow}</a>` : ''}
  </div></footer>`;
}
