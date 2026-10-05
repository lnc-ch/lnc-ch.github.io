import { copyFor, copyLanguage, dateParts, eventState, localizePath, safeHref, selectEvents, ui } from '../content.mjs';
import { html, arrow, backArrow, paragraphs } from './html.mjs';
import { renderEventCard, renderPhoto } from './cards.mjs';

export function renderProgramme(model) {
  const words=ui[model.locale];
  const selection=selectEvents(model.events,model.now,model.preview);
  return html`<div class="page-heading"><h1 tabindex="-1" data-page-focus>${words.events}</h1>${model.locale !== 'ja' ? html`<span lang="ja" aria-hidden="true">催事</span>` : ''}</div>
    <nav class="programme-index" aria-label="${words.events}"><a href="#upcoming" data-barba-prevent>${words.upcoming}<span>${String(selection.upcoming.length).padStart(2,'0')}</span></a><a href="#archive" data-barba-prevent>${words.past}<span>${String(selection.past.length).padStart(2,'0')}</span></a></nav>
    <section id="upcoming" class="programme-section" aria-labelledby="upcoming-title"><h2 id="upcoming-title">${words.upcoming}</h2>${selection.upcoming.length ? html`<div class="event-grid">${selection.upcoming.map((item)=>renderEventCard(item,model))}</div>` : html`<p class="empty-state">${words.empty}</p>`}</section>
    <section id="archive" class="programme-section" aria-labelledby="archive-title"><h2 id="archive-title">${words.past}</h2>${selection.past.length ? html`<div class="event-grid">${selection.past.map((item)=>renderEventCard(item,model))}</div>` : html`<p class="empty-state">${words.emptyPast}</p>`}</section>`;
}

export function renderEvent(model) {
  const {event,locale,now}=model;
  const text=copyFor(event.copy,locale);
  const words=ui[locale];
  const date=dateParts(event.start,locale);
  const end=dateParts(event.end,locale);
  const state=eventState(event,now);
  const register=safeHref(event.registrationUrl);
  const canRegister=register && !event.draft && state !== 'cancelled' && state !== 'past';
  const next=selectEvents(model.events,now,model.preview).upcoming.find((item)=>item.slug!==event.slug && item.status!=='cancelled');
  const secondary=locale==='ja' ? event.copy.en?.title : text.title;
  return html`<article class="event-detail">
    <a class="back-link" href="${localizePath('/events/',locale)}">${backArrow}<span>${words.allEvents}</span></a>
    <header class="event-hero">
      <div class="event-hero__name"><div class="event-status">${event.draft ? words.sample : state==='cancelled' ? words.cancelled : state==='past' ? words.archived : ''}</div>
      <h1 tabindex="-1" data-page-focus data-event-title lang="ja">${event.copy.ja.title}</h1>${secondary && secondary!==event.copy.ja.title ? html`<p class="event-hero__translation" lang="${locale==='ja'?'en':locale}">${secondary}</p>` : ''}</div>
      <div class="event-hero__date"><time datetime="${event.start}">${date.day}<span>${date.month} / ${date.year}</span></time><span>${date.weekday}</span></div>
    </header>
    <section class="event-information" id="details" aria-label="${words.details}">
      <dl class="event-facts"><div><dt>${words.date}</dt><dd>${date.long}${date.numeric!==end.numeric ? html`<span> — ${end.long}</span>` : ''}</dd></div><div><dt>${words.time}</dt><dd>${date.time}–${end.time}<small>${words.localTime}</small></dd></div><div><dt>${words.location}</dt><dd>${event.location}</dd></div>${canRegister ? html`<div><dt>${words.registration}</dt><dd><a class="text-link" href="${register}" data-barba-prevent>${words.register}${arrow}</a></dd></div>` : ''}</dl>
      <div class="event-description prose">${paragraphs(text.body,copyLanguage(event.copy,locale,'body'))}</div>
    </section>
    ${event.image ? html`<div class="event-detail__photo">${renderPhoto(model,{event})}</div>` : ''}
    ${next ? html`<section class="next-event"><h2>${words.next}</h2>${renderEventCard(next,model)}</section>` : ''}
  </article>`;
}
