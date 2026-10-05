import { copyFor, copyLanguage, localizePath, safeHref, selectEvents, ui } from '../content.mjs';
import { html, arrow, paragraphs } from './html.mjs';
import { renderProgramme } from './event.mjs';
import { renderEventCard, renderPageCard, renderPhoto } from './cards.mjs';

export function renderFrontProgramme(section, model) {
  const selected = selectEvents(model.events,model.now,model.preview);
  const lead = selected.featured;
  const rest = [...selected.upcoming, ...selected.past].filter((item) => item.slug !== lead?.slug).slice(0, Math.min(3, Math.max(0,(section.limit ?? 4) - 1)));
  const fallbackPages = model.pages.filter((page) => ['about','join'].includes(page.key));
  const fillers = fallbackPages.slice(0,Math.max(0,3-rest.length));
  const wideDetail = rest.length + fillers.length < 3;
  const eventsPage = model.pages.find((page) => page.key === 'events') ?? { key:'events',slug:'/events/',theme:'paper',title:{ja:{text:'催事'},en:{text:'Events'},fr:{text:'Événements'}}};
  return html`<section class="front-grid ${!lead ? 'front-grid--empty' : ''} ${wideDetail ? 'front-grid--wide-detail' : ''}" aria-label="${ui[model.locale].events}" id="programme">
    ${lead ? renderEventCard(lead,model,{featured:true}) : renderPageCard(eventsPage,model,{featured:true,note:ui[model.locale].empty})}
    ${renderPhoto(model)}
    ${rest.map((event) => renderEventCard(event,model))}${fillers.map((page) => renderPageCard(page,model))}
    ${renderPhoto(model,{small:true})}
  </section>`;
}

export function renderSections(sections, model) {
  return (sections ?? []).map((section) => {
    const text = copyFor(section.copy,model.locale);
    const language = copyLanguage(section.copy,model.locale,'body');
    switch (section.type) {
      case 'event_index': return renderProgramme(model);
      case 'programme': return renderFrontProgramme(section,model);
      case 'rich_text': return html`<section class="text-section ${section.variant === 'statement' ? 'text-section--statement' : ''}" data-reveal>${text.heading ? html`<h2>${text.heading}</h2>` : ''}<div class="prose">${paragraphs(text.body,language)}</div></section>`;
      case 'split': return html`<section class="split-section ${section.imagePosition === 'left' ? 'split-section--reverse' : ''}" data-reveal><div>${text.heading ? html`<h2>${text.heading}</h2>` : ''}<div class="prose">${paragraphs(text.body,language)}</div></div>${safeHref(section.image) ? html`<img src="${safeHref(section.image)}" alt="${text.imageAlt || ''}" width="900" height="1000" loading="lazy" decoding="async">` : ''}</section>`;
      case 'gallery': return html`<section class="gallery-section" data-reveal>${text.heading ? html`<h2>${text.heading}</h2>` : ''}<div class="gallery-grid">${(section.items??[]).filter((item)=>safeHref(item.image)).map((item)=>{const caption=copyFor(item.copy,model.locale);return html`<figure><img src="${safeHref(item.image)}" alt="${caption.alt || ''}" width="1000" height="750" loading="lazy" decoding="async">${caption.caption ? html`<figcaption>${caption.caption}</figcaption>` : ''}</figure>`;})}</div></section>`;
      case 'cta': {const href=safeHref(section.href); return href ? html`<section class="cta-section" data-reveal>${text.heading ? html`<h2>${text.heading}</h2>` : ''}${text.body ? html`<p>${text.body}</p>` : ''}<a class="text-link" href="${localizePath(href,model.locale)}">${text.label}${arrow}</a></section>` : '';}
      case 'membership': {
        const href=safeHref(model.site.joinUrl);
        const email=safeHref(model.site.email ? `mailto:${model.site.email}` : '');
        return html`<section class="membership-section" data-reveal><h2>${ui[model.locale].membership}</h2><div class="prose">${href ? html`<a class="text-link" href="${href}" data-barba-prevent>${ui[model.locale].join}${arrow}</a>` : html`<p>${ui[model.locale].joinPending}</p>`}${email ? html`<a class="text-link" href="${email}" data-barba-prevent>${ui[model.locale].contact}${arrow}</a>` : ''}</div></section>`;
      }
      default: throw new Error(`Unknown section type: ${section.type}`);
    }
  });
}
