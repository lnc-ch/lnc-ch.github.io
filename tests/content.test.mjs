import test from 'node:test';
import assert from 'node:assert/strict';
import { localizePath, copyFor, safeHref, eventState, selectEvents, dateParts, themeFor, routeEntries, validateEvent, themeNames, normalizeTimestamp } from '../src/lib/content.mjs';

test('Japanese paths stay canonical; other locales have exactly one prefix', () => {
  assert.equal(localizePath('/', 'ja'), '/');
  assert.equal(localizePath('/', 'en'), '/en/');
  assert.equal(localizePath('/events/welcome/', 'fr'), '/fr/events/welcome/');
  assert.equal(localizePath('/en/events/', 'fr'), '/fr/events/');
  assert.equal(localizePath('/en/events/?q=x#details', 'ja'), '/events/?q=x#details');
});
test('external/mail/hash links are not localized', () => {
  for (const p of ['https://example.com/x', 'mailto:hello@example.com', '#details']) assert.equal(localizePath(p, 'fr'), p);
});
test('locale fallback is per field and ignores empty translations', () => {
  assert.deepEqual(copyFor({ ja: {title:'催事', body:'本文'}, fr:{title:'Événements', body:''} }, 'fr'), {title:'Événements',body:'本文'});
  assert.deepEqual(copyFor({ja:{title:'催事'}}, 'en'), {title:'催事'});
});
test('URLs permit expected destinations without accepting script or protocol-relative URLs', () => {
  for (const href of ['https://example.org/a', '/events/', '#details', 'mailto:lnc@example.org']) assert.equal(safeHref(href),href);
  for (const href of ['javascript:alert(1)', 'data:text/html,x', '//evil.test', '/\\evil.test', '\njava\tscript:alert(1)', 'vbscript:x']) assert.equal(safeHref(href),'');
});
const event = (id, start, extras={}) => ({id,slug:id,start,end:start,status:'scheduled',draft:false,theme:'clay',location:'EPFL',copy:{ja:{title:id,body:'説明'}},...extras});
const now = new Date('2026-10-05T12:00:00Z');
test('drafts never appear unless preview is explicitly enabled; source array is not mutated', () => {
  const entries = [event('draft','2026-10-12T16:30:00Z',{draft:true}),event('published','2026-10-20T16:30:00Z')];
  assert.deepEqual(selectEvents(entries,now).all.map(x=>x.id),['published']);
  assert.equal(selectEvents(entries,now,true).all.length,2);
  assert.equal(entries[0].id,'draft');
});
test('upcoming are chronological, archives reverse chronological, cancelled not featured', () => {
  const entries = [event('late','2026-10-20T16:00:00Z'),event('old','2026-09-01T16:00:00Z'),event('cancelled','2026-10-06T16:00:00Z',{status:'cancelled'}),event('early','2026-10-10T16:00:00Z'),event('recent','2026-10-01T16:00:00Z')];
  const selected = selectEvents(entries,now);
  assert.deepEqual(selected.upcoming.map(x=>x.id),['cancelled','early','late']);
  assert.deepEqual(selected.past.map(x=>x.id),['recent','old']);
  assert.equal(selected.featured.id,'early');
});
test('an ongoing event remains current until its end; cancellation takes precedence', () => {
  const item=event('now','2026-10-05T11:00:00Z',{end:'2026-10-05T15:00:00Z'});
  assert.equal(eventState(item,now),'ongoing');
  assert.equal(eventState(item,new Date('2026-10-05T15:00:00Z')),'past');
  assert.equal(eventState({...item,status:'cancelled'},now),'cancelled');
});
test('display dates use Zurich time across winter/summer boundaries', () => {
  assert.equal(dateParts('2026-10-12T16:30:00Z','en').time,'18:30');
  assert.equal(dateParts('2026-11-15T17:30:00Z','fr').time,'18:30');
  assert.equal(dateParts('2026-10-05T23:30:00Z','ja').day,'06');
});
test('Pages CMS YAML timestamps normalize without changing the Swiss event time', () => {
  const cmsValue = new Date('2026-11-15T14:00:00+01:00');
  assert.equal(normalizeTimestamp(cmsValue),'2026-11-15T13:00:00.000Z');
  assert.equal(normalizeTimestamp('2026-11-15T14:00:00+01:00'),'2026-11-15T14:00:00+01:00');
  assert.equal(dateParts(normalizeTimestamp(cmsValue),'en').time,'14:00');
});
test('palette is shared and unknown themes fall back rather than inject CSS', () => {
  assert.equal(themeFor('clay').background,'#c87860');
  assert.equal(themeFor('bad; background:url(x)').background,themeFor('paper').background);
  assert.equal(themeNames.length,5);
});
test('invalid or timezone-ambiguous event dates are rejected', () => {
  assert.throws(()=>validateEvent(event('bad','2026-10-05T18:30:00')),/offset|timezone/i);
  assert.throws(()=>validateEvent(event('bad','not-a-date')),/date/i);
  assert.throws(()=>validateEvent(event('bad','2026-02-30T18:30:00+01:00')),/date/i);
  assert.throws(()=>validateEvent(event('bad','2026-10-05T16:30:00Z',{end:'2026-10-04T16:30:00Z'})),/end/i);
});
test('event slugs and route collisions fail before generating pages', () => {
  assert.throws(()=>validateEvent(event('../escape','2026-10-12T16:30:00Z')),/slug/i);
  const pages=[{key:'home',slug:'/'},{key:'events',slug:'/events/'}];
  assert.equal(routeEntries(pages,[event('welcome','2026-10-12T16:30:00Z')],false).length,9);
  assert.equal(routeEntries(pages,[event('draft','2026-10-12T16:30:00Z',{draft:true})],false).length,6);
  assert.throws(()=>routeEntries([...pages,{key:'duplicate',slug:'/events/'}],[],false),/duplicate/i);
});

test('every card/page palette has at least 4.5:1 normal-text contrast',()=>{
 const luminance=hex=>hex.slice(1).match(/../g).map(value=>parseInt(value,16)/255).map(value=>value<=.04045?value/12.92:((value+.055)/1.055)**2.4).reduce((sum,value,i)=>sum+value*[.2126,.7152,.0722][i],0);
 for(const name of ['paper','clay','moss','rose','ink']) {
  const {background,foreground}=themeFor(name);
  const ls=[luminance(background),luminance(foreground)].sort((a,b)=>b-a);
  assert.ok((ls[0]+.05)/(ls[1]+.05)>=4.5,`${name} contrast`);
 }
});
