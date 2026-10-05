import Lenis from 'lenis';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

/** One clock for GSAP and Lenis. Native touch scrolling is intentionally kept. */
export function createScrollController(reducedMotion) {
  let lenis = null;
  let ticker = null;
  let stopped = false;
  function release() {
    if (ticker) gsap.ticker.remove(ticker);
    ticker = null;
    lenis?.destroy();
    lenis = null;
  }
  function configure() {
    release();
    if (reducedMotion.matches) return;
    lenis = new Lenis({ autoRaf:false, smoothWheel:true, syncTouch:false, lerp:0.12 });
    lenis.on('scroll', ScrollTrigger.update);
    ticker = time => lenis?.raf(time * 1000);
    gsap.ticker.add(ticker);
    if (stopped) lenis.stop();
  }
  gsap.ticker.lagSmoothing(0);
  configure();
  reducedMotion.addEventListener('change', configure);
  return {
    stop() { stopped=true; lenis?.stop(); },
    start() { stopped=false; lenis?.start(); },
    resize() { lenis?.resize(); ScrollTrigger.refresh(); },
    to(y) { lenis ? lenis.scrollTo(y,{immediate:true,force:true}) : window.scrollTo({top:y,left:0,behavior:'instant'}); },
    anchor(element,onComplete) {
      if (lenis) lenis.scrollTo(element,{duration:0.75,onComplete});
      else { element.scrollIntoView({behavior:'instant',block:'start'}); onComplete?.(); }
    },
    get enabled() { return Boolean(lenis); },
    destroy() { reducedMotion.removeEventListener('change',configure); release(); },
  };
}
