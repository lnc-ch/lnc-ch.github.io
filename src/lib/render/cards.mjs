import { copyFor, dateParts, eventState, localizePath, safeHref, themeFor, ui } from '../content.mjs';
import { html, arrow } from './html.mjs';

export function renderEventCard(event, model, { featured = false } = {}) {
  const { locale, now } = model;
  const text = copyFor(event.copy, locale);
  const japanese = event.copy.ja.title;
  const secondary = locale === 'ja' ? event.copy.en?.title ?? '' : text.title;
  const date = dateParts(event.start, locale);
  const state = eventState(event, now);
  const theme = themeFor(event.theme);
  const words = ui[locale];
  const status = event.draft ? words.sample : state === 'cancelled' ? words.cancelled : state === 'past' ? words.archived : state === 'ongoing' ? words.ongoing : '';
  const eyebrow = featured ? (state === 'past' ? words.recentEvent : words.nextEvent) : status;
  return html`<a class="event-card ${featured ? 'event-card--featured' : 'event-card--compact'}" href="${localizePath(`/events/${event.slug}/`, locale)}"
    data-card-key="${event.slug}" data-card-color="${theme.background}" data-card-ink="${theme.foreground}"
    data-event-start="${event.start}" data-event-end="${event.end}" data-event-status="${event.status}" data-reveal
    style="--card-bg:${theme.background};--card-ink:${theme.foreground}"
    aria-label="${text.title} · ${date.long} · ${date.time}${status ? ` · ${status}` : ''}">
    <span class="event-card__eyebrow">${eyebrow}${featured && status ? html`<span class="event-card__status">${status}</span>` : ''}</span>
    <time class="event-card__date" datetime="${event.start}">${date.numeric}${featured ? html`<span>${date.time}</span>` : ''}</time>
    <h2 class="event-card__title" data-card-title><span lang="ja">${japanese}</span>${secondary && secondary !== japanese ? html`<span class="event-card__translation" lang="${locale === 'ja' ? 'en' : locale}">${secondary}</span>` : ''}</h2>
    <span class="event-card__footer"><span>${event.location}</span>${arrow}</span>
  </a>`;
}

export function renderPageCard(page, model, { featured = false, note = '' } = {}) {
  const theme = themeFor(page.theme);
  const ja = copyFor(page.title, 'ja').text;
  const current = copyFor(page.title, model.locale).text;
  const secondary = model.locale === 'ja' ? copyFor(page.title, 'en').text : current;
  return html`<a class="page-card ${featured ? 'page-card--featured' : ''}" href="${localizePath(page.slug, model.locale)}" data-card-key="page:${page.key}" data-card-color="${theme.background}" data-card-ink="${theme.foreground}" data-reveal style="--card-bg:${theme.background};--card-ink:${theme.foreground}">
    <span class="page-card__index">LNC</span><h2 lang="ja">${ja}${secondary !== ja ? html`<span class="page-card__translation" lang="${model.locale === 'ja' ? 'en' : model.locale}">${secondary}</span>` : ''}</h2>
    <span class="page-card__footer">${note ? html`<span>${note}</span>` : ''}${arrow}</span>
  </a>`;
}

export function renderPhoto(model, { small = false, event = null } = {}) {
  const image = safeHref(event?.image || (small ? model.site.detailPhoto : model.site.photo));
  if (!image) return '';
  const altCopy = event?.copy ? copyFor(event.copy, model.locale).imageAlt : (small ? model.site.detailPhotoAlt : model.site.photoAlt)?.[model.locale] ?? (small ? model.site.detailPhotoAlt : model.site.photoAlt)?.ja;
  const illustration = event ? event.imageIllustration : model.site.photoIllustration;
  return html`<figure class="editorial-photo ${small ? 'editorial-photo--small' : 'editorial-photo--lead'}" data-reveal>
    <img src="${image}" alt="${altCopy || ''}" width="${small ? 600 : 1440}" height="${small ? 560 : 720}" loading="${small ? 'lazy' : 'eager'}" decoding="async" ${!small ? html`fetchpriority="high"` : ''}>
    ${illustration ? html`<figcaption>${ui[model.locale].illustration}</figcaption>` : ''}
  </figure>`;
}
