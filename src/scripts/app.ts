import barba from "@barba/core";
import { gsap } from "gsap";
import LocomotiveScroll from "locomotive-scroll";

const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

let scroll: LocomotiveScroll | undefined;
let animationContext: gsap.Context | undefined;

function mount(container: HTMLElement) {
  animationContext?.revert();

  animationContext = gsap.context(() => {
    if (!reducedMotion) {
      gsap.from("[data-animate]", {
        opacity: 0,
        y: 16,
        duration: 0.5,
        stagger: 0.05,
        ease: "power2.out",
      });
    }
  }, container);

  scroll?.destroy();
  scroll = reducedMotion ? undefined : new LocomotiveScroll();
}

function unmount() {
  animationContext?.revert();
  animationContext = undefined;

  scroll?.destroy();
  scroll = undefined;
}

barba.init({
  preventRunning: true,

  transitions: [
    {
      name: "placeholder-fade",

      once({ next }) {
        mount(next.container);
      },

      leave({ current }) {
        if (reducedMotion) {
          unmount();
          return;
        }

        return gsap.to(current.container, {
          opacity: 0,
          duration: 0.2,
          onComplete: unmount,
        });
      },

      enter({ next }) {
        window.scrollTo(0, 0);

        if (reducedMotion) {
          mount(next.container);
          return;
        }

        gsap.set(next.container, { opacity: 0 });
        mount(next.container);

        return gsap.to(next.container, {
          opacity: 1,
          duration: 0.25,
        });
      },
    },
  ],
});
