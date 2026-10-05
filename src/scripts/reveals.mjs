import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);
/** All page-bound animation resources are torn down before its DOM is replaced. */
export function mountReveals(container, reducedMotion) {
  let context = null;
  let disposed = false;
  const controller = new AbortController();
  const build = () => {
    context?.revert();
    context = null;
    if (reducedMotion.matches || disposed) return;
    context = gsap.context(() => {
      const elements = gsap.utils.toArray('[data-reveal]',container);
      // First-screen typography is never hidden; only real content below it reveals.
      elements.forEach((element) => {
        if (element.getBoundingClientRect().top < window.innerHeight * 0.94) return;
        gsap.from(element,{ y:28, opacity:0, duration:0.7, ease:'power3.out',
          scrollTrigger:{trigger:element,start:'top 94%',once:true}, clearProps:'transform,opacity' });
      });
    },container);
    ScrollTrigger.refresh();
  };
  build();
  reducedMotion.addEventListener('change',build);
  container.querySelectorAll('img').forEach(image => {
    if (!image.complete) image.addEventListener('load',()=>ScrollTrigger.refresh(),{once:true,signal:controller.signal});
  });
  document.fonts?.ready.then(()=>{if (!disposed) ScrollTrigger.refresh();});
  return () => { disposed=true; controller.abort(); reducedMotion.removeEventListener('change',build); context?.revert(); };
}
