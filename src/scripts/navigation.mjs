import barba from '@barba/core';
import { gsap } from 'gsap';
import { rectToClip, fullClip, isHistoryTrigger, resolveScroll, shouldRecoverRequest } from '../lib/motion/rules.mjs';
import { applyTheme, syncHead } from './head.mjs';
import { mountReveals } from './reveals.mjs';

/** Barba owns navigation; Astro supplies complete, independently usable HTML pages. */
export function mountNavigation({scroll,reducedMotion}) {
  const root = document.documentElement;
  const overlay = document.getElementById('transition-layer');
  const announcer = document.getElementById('page-announcer');
  const controller = new AbortController();
  const previousRestoration = history.scrollRestoration;
  history.scrollRestoration = 'manual';
  const entries = new Map();
  let entryId = null;
  let busy = false;
  let pageCleanup = () => {};
  let transition = null;
  let pointerCard = null;
  let targetHref = null;
  let safetyTimer = null;
  let destroyed = false;
  let finalRestoreY = null;

  const viewport = () => ({width:root.clientWidth,height:window.innerHeight});
  const snapshot = (key) => {
    if (entryId) entries.set(entryId,{y:window.scrollY,key:key ?? entries.get(entryId)?.key ?? ''});
  };
  const currentId = () => {
    const existing=barba.history.current?.data?.lncEntryId;
    if (existing) return existing;
    const id=crypto.randomUUID();
    barba.history.store({lncEntryId:id});
    return id;
  };
  function clearOverlay() {
    gsap.killTweensOf(overlay);
    gsap.set(overlay,{clearProps:'all'});
    root.classList.remove('is-transitioning');
  }
  function unlock() {
    clearTimeout(safetyTimer);
    busy=false;
    root.removeAttribute('aria-busy');
    document.querySelectorAll('[data-barba="container"]').forEach(container=>{container.inert=false;});
    scroll.start();
    clearOverlay();
  }
  function recover(url) {
    pageCleanup();
    unlock();
    // A failed click falls back to the browser. A failed hover/prefetch never navigates.
    if (url && !destroyed) window.location.assign(url);
  }
  function focusDestination(container, key, restore) {
    let target = restore && key ? [...container.querySelectorAll('[data-card-key]')].find(card=>card.dataset.cardKey===key) : null;
    target ||= container.querySelector('[data-page-focus]') || container.querySelector('main');
    target?.focus({preventScroll:true});
  }
  function hashTarget() {
    if (!window.location.hash) return null;
    try { return document.getElementById(decodeURIComponent(window.location.hash.slice(1))); }
    catch { return null; }
  }

  // A capture listener runs before Barba's click listener, while history still
  // refers to the outgoing entry. Rectangles are measured before scroll is stopped.
  document.addEventListener('click',event=>{
    if (event.defaultPrevented || event.button!==0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey || busy) return;
    const link=event.target instanceof Element ? event.target.closest('a[href]') : null;
    if (!link || link.target==='_blank' || link.hasAttribute('download')) return;
    const url=new URL(link.href,location.href);
    if (url.origin!==location.origin) return;
    snapshot(link.dataset.cardKey ?? '');
    if (url.pathname===location.pathname && url.search===location.search && url.hash) {
      let target;
      try { target=document.getElementById(decodeURIComponent(url.hash.slice(1))); } catch { return; }
      if (target) {
        event.preventDefault();
        // Section jumps replace the fragment, rather than creating extra Back
        // stops or a native history entry unknown to Barba.
        barba.history.add(url.href,link,'replace');
        barba.history.store({lncEntryId:entryId});
        if (!target.hasAttribute('tabindex')) target.setAttribute('tabindex','-1');
        scroll.anchor(target,()=>target.focus({preventScroll:true}));
        return;
      }
    }
    if (link.dataset.cardColor && !reducedMotion.matches) {
      const clip=rectToClip(link.getBoundingClientRect(),viewport());
      pointerCard=clip ? {clip,color:link.dataset.cardColor,href:url.href} : null;
    } else pointerCard=null;
  },{capture:true,signal:controller.signal});
  window.addEventListener('scroll',()=>{if (!busy) snapshot();},{passive:true,signal:controller.signal});
  window.addEventListener('popstate',()=>{if (!busy) snapshot();},{capture:true,signal:controller.signal});

  barba.init({
    timeout:10000,
    preventRunning:true,
    prefetchIgnore:navigator.connection?.saveData === true,
    // Shared styles/scripts cover every page. Binary/download, external and
    // explicitly native links must never be fetched as HTML.
    prevent:({el,href}) => {
      const url=new URL(href,location.href);
      return el.hasAttribute('download') || Boolean(el.closest('[data-barba-prevent]'))
        || !['http:','https:'].includes(url.protocol) || url.origin!==location.origin
        || /\.(pdf|zip|ics|png|jpe?g|webp|svg)$/i.test(url.pathname);
    },
    requestError:(_trigger,action,url) => {
      if (shouldRecoverRequest(action,url,busy ? targetHref : null)) recover(url);
      return false;
    },
    transitions:[{
      name:'editorial-card',
      once({next}) {
        entryId=currentId();
        applyTheme(next.container);
        pageCleanup=mountReveals(next.container,reducedMotion);
        scroll.resize();
        const target=hashTarget();
        if(target) scroll.to(target.getBoundingClientRect().top+window.scrollY);
        root.dataset.lncReady='true';
      },
      before(data) {
        busy=true;
        root.classList.add('is-transitioning');
        root.setAttribute('aria-busy','true');
        data.current.container.inert=true;
        scroll.stop();
        pageCleanup();
        const historyVisit=isHistoryTrigger(data.trigger);
        const clicked=(!historyVisit && pointerCard && data.next.url.href===pointerCard.href) ? pointerCard : null;
        targetHref=data.next.url.href;
        finalRestoreY=null;
        transition={clicked,historyVisit,fromKey:data.current.container.dataset.transitionKey || '',fromColor:data.current.container.dataset.pageColor};
        pointerCard=null;
        // Last-resort escape hatch if a library hook or request never settles.
        safetyTimer=setTimeout(()=>recover(targetHref),14000);
      },
      async leave({current}) {
        if(reducedMotion.matches) return;
        if(transition.clicked) {
          gsap.set(overlay,{display:'block',opacity:1,backgroundColor:transition.clicked.color,clipPath:transition.clicked.clip});
          await gsap.to(overlay,{clipPath:fullClip,duration:0.78,ease:'power4.inOut'});
        } else if(transition.historyVisit && transition.fromKey) {
          gsap.set(overlay,{display:'block',opacity:1,backgroundColor:transition.fromColor,clipPath:fullClip});
          await gsap.to(current.container,{opacity:0,duration:0.18,ease:'power2.out'});
        } else {
          await gsap.to(current.container,{opacity:0,duration:0.2,ease:'power2.out'});
        }
      },
      afterLeave({current}) {
        // Barba permits manual removal here; avoiding two stacked containers
        // prevents false scroll heights and one-frame layout jumps.
        current.container.remove();
      },
      beforeEnter({next}) {
        syncHead(next.html,next.container);
        applyTheme(next.container);
      },
      async enter({next}) {
        entryId=currentId();
        const saved=entries.get(entryId);
        const restore=transition.historyVisit;
        scroll.resize();
        const savedY=restore && Number.isFinite(saved?.y) ? saved.y : null;
        finalRestoreY=savedY;
        let y=resolveScroll(restore,saved,document.documentElement.scrollHeight-window.innerHeight).y;
        const target=hashTarget();
        if(!restore && target) y=target.getBoundingClientRect().top+window.scrollY;
        scroll.to(y);
        if(!reducedMotion.matches) {
          const returnCard=restore && transition.fromKey ? [...next.container.querySelectorAll('[data-card-key]')].find(card=>card.dataset.cardKey===transition.fromKey) : null;
          const clip=returnCard ? rectToClip(returnCard.getBoundingClientRect(),viewport()) : null;
          if(clip && !transition.clicked) {
            await gsap.to(overlay,{clipPath:clip,duration:0.7,ease:'power4.inOut'});
          } else if(transition.clicked) {
            // The expanding colour is now the actual page colour. Fade only
            // the veil, revealing native destination text without a white flash.
            await gsap.to(overlay,{opacity:0,duration:0.25,ease:'power2.out'});
          } else {
            gsap.set(overlay,{display:'none'});
            await gsap.fromTo(next.container,{opacity:0},{opacity:1,duration:0.32,ease:'power2.out',clearProps:'opacity'});
          }
        }
        if (!restore && target) {
          if (!target.hasAttribute('tabindex')) target.setAttribute('tabindex','-1');
          target.focus({preventScroll:true});
        } else focusDestination(next.container,saved?.key,restore);
        pageCleanup=mountReveals(next.container,reducedMotion);
        if(announcer) announcer.textContent=next.container.dataset.pageTitle || document.title;
      },
      after() {
        unlock();
        // History restoration is applied once more after Lenis is restarted and
        // the destination has finished laying out. The early restore is needed
        // to measure the return-card contraction; this final pass prevents a
        // stale Lenis limit / transient mobile layout from clamping that value.
        if (Number.isFinite(finalRestoreY)) {
          scroll.resize();
          const y=resolveScroll(true,{y:finalRestoreY},document.documentElement.scrollHeight-window.innerHeight).y;
          scroll.to(y);
        }
        snapshot();
        scroll.resize();
        transition=null;
        targetHref=null;
        finalRestoreY=null;
      },
    }],
  });
  const cancelSpatialMotion = () => {
    if (reducedMotion.matches && busy) {
      // Finish current tweens rather than abandoning unresolved transition promises.
      gsap.getTweensOf(overlay).forEach(tween=>tween.progress(1));
      document.querySelectorAll('[data-barba="container"]').forEach(container=>gsap.getTweensOf(container).forEach(tween=>tween.progress(1)));
    }
  };
  reducedMotion.addEventListener('change',cancelSpatialMotion);
  return () => {
    destroyed=true;
    controller.abort();
    reducedMotion.removeEventListener('change',cancelSpatialMotion);
    pageCleanup();
    unlock();
    barba.destroy();
    history.scrollRestoration=previousRestoration;
  };
}
