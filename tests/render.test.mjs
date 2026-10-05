import test from 'node:test';
import assert from 'node:assert/strict';
import { html, paragraphs } from '../src/lib/render/html.mjs';
import { renderDocumentBody, renderHead, pageMeta } from '../src/lib/render/page.mjs';
import { renderEventCard } from '../src/lib/render/cards.mjs';
import { themeFor } from '../src/lib/content.mjs';
const site = {name:'Lausanne Nihonjin Circle',nameJa:'ローザンヌ日本人サークル',mastheadJa:'日本人サークル',url:'https://lnc-ch.github.io',location:'EPFL · Lausanne',logo:'',email:'',instagramUrl:'',joinUrl:'',photo:'',photoAlt:{ja:'',fr:'',en:''},photoIllustration:true};
const event={id:'autumn',slug:'autumn',start:'2026-10-12T16:30:00Z',end:'2026-10-12T19:00:00Z',draft:false,status:'scheduled',theme:'clay',location:'EPFL',registrationUrl:'',copy:{ja:{title:'秋の交流会',body:'これは本文です。'},en:{title:'Autumn gathering',body:'The event description.'},fr:{title:'Rencontre d’automne',body:'Le texte de l’événement.'}}};
const model=(extra={})=>({site,locale:'en',path:'/en/',kind:'home',page:{key:'home',kind:'home',slug:'/',theme:'paper',title:{ja:{text:'LNC'},en:{text:'LNC'}},description:{ja:{text:'LNC'}},sections:[{type:'programme',limit:4}]},pages:[],events:[event],preview:false,now:new Date('2026-10-05T12:00:00Z'),...extra});
test('tagged templates escape all untrusted interpolations but compose trusted markup',()=>{
 assert.equal(String(html`<p>${'<script>&"\''}</p>`),'<p>&lt;script&gt;&amp;&quot;&#39;</p>');
 assert.equal(String(html`<div>${[html`<b>${'One'}</b>`,html`<i>Two</i>`]}</div>`),'<div><b>One</b><i>Two</i></div>');
 assert.match(String(paragraphs('<img src=x onerror=alert(1)>')),/&lt;img/);
});
test('cards and event page have exactly the same background token and a real href',()=>{
 const card=String(renderEventCard(event,model(),{featured:true}));
 const detail=String(renderDocumentBody(model({kind:'event',event,path:'/en/events/autumn/'})));
 assert.match(card,new RegExp(`data-card-color="${themeFor('clay').background}"`));
 assert.match(detail,new RegExp(`data-page-color="${themeFor('clay').background}"`));
 assert.match(card,/href="\/en\/events\/autumn\/"/);
});
test('home renders the approved masthead and real event titles, not slogans',()=>{
 const output=String(renderDocumentBody(model()));
 assert.match(output,/LAUSANNE NIHONJIN/); assert.match(output,/CIRCLE/); assert.match(output,/秋の交流会/);
 assert.doesNotMatch(output,/つながる|ひろがる|newspaper|gazette|flag|torii/i);
 assert.equal((output.match(/<h1\b/g)||[]).length,1);
 assert.equal((output.match(/data-barba="container"/g)||[]).length,1);
});
test('draft event titles and links are absent from production home',()=>{
 const output=String(renderDocumentBody(model({events:[{...event,draft:true,copy:{ja:{title:'HIDDEN_DRAFT'}}}]})));
 assert.doesNotMatch(output,/HIDDEN_DRAFT|\/events\/autumn\//); assert.match(output,/No events announced/);
});
test('preview gets a noindex marker and explicit sample disclaimer',()=>{
 assert.match(String(renderHead(model({preview:true}))),/noindex, nofollow/);
 assert.match(String(renderDocumentBody(model({preview:true}))),/Design preview · sample events/);
});
test('localized metadata and alternate links survive direct loads',()=>{
 const input=model({kind:'event',locale:'fr',path:'/fr/events/autumn/',event});
 const meta=pageMeta(input); assert.equal(meta.lang,'fr'); assert.match(meta.title,/Rencontre d’automne/);
 const output=String(renderHead(input));
 assert.match(output,/hreflang="ja"[^>]+href="https:\/\/lnc-ch.github.io\/events\/autumn\/"/);
 assert.match(output,/rel="canonical"[^>]+\/fr\/events\/autumn\//);
});
test('cancelled and draft events never offer registration, even with a saved URL',()=>{
 for (const variant of [{...event,draft:true},{...event,status:'cancelled'}]) {
 const output=String(renderDocumentBody(model({kind:'event',event:{...variant,registrationUrl:'https://example.com/book'},preview:true})));
 assert.doesNotMatch(output,/href="https:\/\/example.com\/book"/);
 }
});
test('CMS text and event titles cannot break out of their elements',()=>{
 const output=String(renderDocumentBody(model({events:[{...event,copy:{ja:{title:'</h2><script>alert(1)</script>',body:'x'}}}]})));
 assert.doesNotMatch(output,/<script>alert\(1\)<\/script>/); assert.match(output,/&lt;script&gt;/);
});
test('missing official logo and contact URLs do not become broken images or fake links',()=>{
 const output=String(renderDocumentBody(model({events:[]})));
 assert.doesNotMatch(output,/src=""|href="#"|mailto:undefined|instagram.com\/undefined|official-logo/);
});
test('a short programme fills spare event slots with useful association pages',()=>{
 const pages=[{key:'about',slug:'/about/',theme:'moss',title:{ja:{text:'紹介'},en:{text:'About'}}},{key:'join',slug:'/join/',theme:'rose',title:{ja:{text:'入会'},en:{text:'Join'}}}];
 const output=String(renderDocumentBody(model({events:[event,{...event,slug:'second'}],pages})));
 assert.match(output,/class="page-card/);
 assert.match(output,/href="\/en\/join\/"[^>]+data-card-color/);
 assert.match(output,/href="\/en\/about\/"[^>]+data-card-color/);
});
test('the events index is a CMS section and respects surrounding section order',()=>{
 const page={kind:'programme',slug:'/events/',theme:'paper',title:{ja:{text:'催事'},en:{text:'Events'}},sections:[{type:'rich_text',copy:{ja:{body:'BEFORE_INDEX'}}},{type:'event_index'},{type:'rich_text',copy:{ja:{body:'AFTER_INDEX'}}}]};
 const output=String(renderDocumentBody(model({kind:'programme',path:'/en/events/',page})));
 assert.ok(output.indexOf('BEFORE_INDEX')<output.indexOf('class="programme-index"'));
 assert.ok(output.indexOf('AFTER_INDEX')>output.indexOf('class="programme-index"'));
 assert.equal((output.match(/<h1\b/g)||[]).length,1);
});
test('association-page cards share transition identity with their destination, too',()=>{
 const page={key:'about',slug:'/about/',kind:'content',theme:'moss',title:{ja:{text:'紹介'},en:{text:'About'}},sections:[]};
 const home=String(renderDocumentBody(model({events:[],pages:[page]})));
 const detail=String(renderDocumentBody(model({kind:'content',path:'/en/about/',page})));
 assert.match(home,/data-card-key="page:about"/);
 assert.match(detail,/data-transition-key="page:about"/);
 assert.match(detail,new RegExp(`data-page-color="${themeFor('moss').background}"`));
});
