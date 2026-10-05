import { createScrollController } from './scroll.mjs';
import { mountNavigation } from './navigation.mjs';

// Barba never re-executes this application entry on in-site navigation.
const reducedMotion=window.matchMedia('(prefers-reduced-motion: reduce)');
let cleanup=null;
let activeScroll=null;
function mount() {
  if(cleanup) return;
  const scroll=createScrollController(reducedMotion);
  activeScroll=scroll;
  try {
    const navigation=mountNavigation({scroll,reducedMotion});
    cleanup=()=>{navigation();scroll.destroy();activeScroll=null;cleanup=null;};
  } catch(error) {
    scroll.destroy();
    activeScroll=null;
    document.documentElement.classList.remove('is-transitioning');
    document.documentElement.removeAttribute('aria-busy');
    document.querySelectorAll('[data-barba="container"]').forEach(container=>{container.inert=false;container.style.opacity='';});
    document.getElementById('transition-layer')?.removeAttribute('style');
    console.error('LNC navigation enhancement failed; native links remain available.',error);
  }
}
mount();
// Preserve the live router/history map when the browser freezes a page into
// its back/forward cache. Re-initialising would discard those entry positions.
const onHide=event=>{if(!event.persisted) cleanup?.();};
const onShow=event=>{if(event.persisted) { if(cleanup) activeScroll?.resize(); else mount(); }};
window.addEventListener('pagehide',onHide);
window.addEventListener('pageshow',onShow);
if(import.meta.hot) import.meta.hot.dispose(()=>{
  window.removeEventListener('pagehide',onHide);
  window.removeEventListener('pageshow',onShow);
  cleanup?.();
});
