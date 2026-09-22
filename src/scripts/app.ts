import barba from "@barba/core";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import LocomotiveScroll from "locomotive-scroll";

gsap.registerPlugin(ScrollTrigger);

const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");

let locomotive: LocomotiveScroll | undefined;
let pageContext: gsap.Context | undefined;

const curtain = document.querySelector<HTMLElement>(".transition-curtain");
const transitionLabel = document.querySelector<HTMLElement>("[data-transition-label]");
const cursor = document.querySelector<HTMLElement>(".cursor");

function setActiveNavigation() {
  const path = window.location.pathname.replace(/\/$/, "") || "/";

  document.querySelectorAll<HTMLAnchorElement>(".site-header nav a").forEach((link) => {
    const linkPath = new URL(link.href, window.location.origin).pathname.replace(/\/$/, "") || "/";
    if (linkPath === path) {
      link.setAttribute("aria-current", "page");
    } else {
      link.removeAttribute("aria-current");
    }
  });
}

function splitWords(root: ParentNode) {
  root.querySelectorAll<HTMLElement>("[data-split-words]").forEach((element) => {
    if (element.dataset.splitReady === "true") return;

    const label = element.textContent?.trim() ?? "";
    const words = label.split(/\s+/).filter(Boolean);

    element.setAttribute("aria-label", label);
    element.innerHTML = words
      .map(
        (word) =>
          `<span class="word" aria-hidden="true"><span class="word__inner">${word}</span></span>`,
      )
      .join(" ");
    element.dataset.splitReady = "true";
  });
}

function mountScroll() {
  locomotive?.destroy();
  locomotive = undefined;

  if (reducedMotion.matches) return;

  locomotive = new LocomotiveScroll();
}

function unmountPage() {
  pageContext?.revert();
  pageContext = undefined;

  locomotive?.destroy();
  locomotive = undefined;

  ScrollTrigger.getAll().forEach((trigger) => trigger.kill());
}

function mountPage(container: HTMLElement) {
  splitWords(container);

  pageContext = gsap.context(() => {
    gsap.utils.toArray<HTMLElement>("[data-reveal]").forEach((element) => {
      gsap.fromTo(
        element,
        {
          y: 56,
          opacity: 0,
        },
        {
          y: 0,
          opacity: 1,
          duration: 1.15,
          ease: "power4.out",
          scrollTrigger: {
            trigger: element,
            start: "top 88%",
            once: true,
          },
        },
      );
    });
  }, container);

  mountScroll();

  requestAnimationFrame(() => {
    ScrollTrigger.refresh();
  });
}

function intro(container: HTMLElement) {
  if (reducedMotion.matches) return gsap.set(container, { clearProps: "all" });

  const words = container.querySelectorAll<HTMLElement>(".hero .word__inner");
  const details = container.querySelectorAll<HTMLElement>("[data-hero-reveal]");
  const heroLine = container.querySelector<HTMLElement>(".hero__line");

  const timeline = gsap.timeline({
    defaults: { ease: "power4.out" },
  });

  timeline
    .fromTo(
      words,
      {
        yPercent: 115,
        rotate: 3,
      },
      {
        yPercent: 0,
        rotate: 0,
        duration: 1.35,
        stagger: 0.055,
      },
      0,
    )
    .fromTo(
      details,
      {
        y: 24,
        opacity: 0,
      },
      {
        y: 0,
        opacity: 1,
        duration: .9,
        stagger: .08,
      },
      .38,
    );

  if (heroLine) {
    timeline.fromTo(
      heroLine,
      { scaleX: 0 },
      { scaleX: 1, duration: 1.1 },
      .55,
    );
  }

  return timeline;
}

function syncDescription(html?: string) {
  if (!html) return;

  const nextDocument = new DOMParser().parseFromString(html, "text/html");
  const nextDescription = nextDocument.querySelector<HTMLMetaElement>('meta[name="description"]');
  const currentDescription = document.querySelector<HTMLMetaElement>('meta[name="description"]');

  if (nextDescription && currentDescription) {
    currentDescription.content = nextDescription.content;
  }
}

function initCursor() {
  if (!cursor || !window.matchMedia("(pointer: fine)").matches || reducedMotion.matches) return;

  const xTo = gsap.quickTo(cursor, "x", { duration: .34, ease: "power3" });
  const yTo = gsap.quickTo(cursor, "y", { duration: .34, ease: "power3" });

  window.addEventListener("pointermove", (event) => {
    cursor.style.opacity = "1";
    xTo(event.clientX);
    yTo(event.clientY);

    const target = event.target instanceof Element
      ? event.target.closest("a, button, [data-magnetic]")
      : null;

    cursor.classList.toggle("is-link", Boolean(target));
  });

  document.documentElement.addEventListener("mouseleave", () => {
    cursor.style.opacity = "0";
  });
}

function initMagneticLinks() {
  if (!window.matchMedia("(pointer: fine)").matches || reducedMotion.matches) return;

  document.addEventListener("pointermove", (event) => {
    if (!(event.target instanceof Element)) return;

    const element = event.target.closest<HTMLElement>("[data-magnetic]");
    if (!element) return;

    const rect = element.getBoundingClientRect();
    const x = event.clientX - (rect.left + rect.width / 2);
    const y = event.clientY - (rect.top + rect.height / 2);

    gsap.to(element, {
      x: x * .12,
      y: y * .12,
      duration: .55,
      ease: "power3.out",
      overwrite: "auto",
    });
  });

  document.addEventListener("pointerout", (event) => {
    if (!(event.target instanceof Element)) return;

    const element = event.target.closest<HTMLElement>("[data-magnetic]");
    if (!element) return;

    gsap.to(element, {
      x: 0,
      y: 0,
      duration: .8,
      ease: "elastic.out(1, .35)",
      overwrite: "auto",
    });
  });
}

if (curtain) {
  gsap.set(curtain, { yPercent: 100 });
}

initCursor();
initMagneticLinks();
setActiveNavigation();

barba.init({
  preventRunning: true,

  transitions: [
    {
      name: "lnc-curtain",

      once({ current }) {
        mountPage(current.container);
        return intro(current.container);
      },

      beforeLeave() {
        document.body.classList.add("is-transitioning");
        unmountPage();
      },

      leave() {
        if (reducedMotion.matches || !curtain) return;

        gsap.set(curtain, { yPercent: 100 });

        return gsap.to(curtain, {
          yPercent: 0,
          duration: .82,
          ease: "power4.inOut",
        });
      },

      beforeEnter({ next }) {
        window.scrollTo({ top: 0, left: 0, behavior: "auto" });
        syncDescription(next.html);

        if (transitionLabel) {
          transitionLabel.textContent = next.namespace || "Next";
        }
      },

      enter({ next }) {
        mountPage(next.container);
        setActiveNavigation();

        if (reducedMotion.matches || !curtain) {
          return intro(next.container);
        }

        const timeline = gsap.timeline();

        timeline
          .add(intro(next.container), .18)
          .to(
            curtain,
            {
              yPercent: -100,
              duration: .92,
              ease: "power4.inOut",
            },
            0,
          )
          .set(curtain, { yPercent: 100 });

        return timeline;
      },

      afterEnter() {
        document.body.classList.remove("is-transitioning");
        ScrollTrigger.refresh();
      },
    },
  ],
});
