"use client";

import { useEffect, useRef, useState } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

// Register GSAP plugins
if (typeof window !== "undefined") {
  gsap.registerPlugin(ScrollTrigger);
}

export function useGSAP() {
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);

  useEffect(() => {
    const mediaQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
    setPrefersReducedMotion(mediaQuery.matches);

    const handleChange = (e: MediaQueryListEvent) => {
      setPrefersReducedMotion(e.matches);
    };

    mediaQuery.addEventListener("change", handleChange);
    return () => mediaQuery.removeEventListener("change", handleChange);
  }, []);

  return { gsap, ScrollTrigger, prefersReducedMotion };
}

export function useFadeIn(
  ref: React.RefObject<HTMLElement>,
  options?: {
    delay?: number;
    duration?: number;
    y?: number;
    trigger?: string;
    start?: string;
  }
) {
  const { prefersReducedMotion } = useGSAP();

  useEffect(() => {
    if (!ref.current) return;

    const element = ref.current;
    const {
      delay = 0,
      duration = 0.6,
      y = 20,
      trigger,
      start = "top 85%",
    } = options || {};

    if (prefersReducedMotion) {
      gsap.set(element, { opacity: 1, y: 0 });
      return;
    }

    gsap.fromTo(
      element,
      { opacity: 0, y },
      {
        opacity: 1,
        y: 0,
        duration,
        delay,
        ease: "power2.out",
        scrollTrigger: {
          trigger: trigger || element,
          start,
          toggleActions: "play none none reverse",
        },
      }
    );

    return () => {
      ScrollTrigger.getAll().forEach((t) => t.kill());
    };
  }, [ref, options, prefersReducedMotion]);
}

export function useStaggerFadeIn(
  containerRef: React.RefObject<HTMLElement>,
  childSelector: string,
  options?: {
    stagger?: number;
    duration?: number;
    y?: number;
    start?: string;
  }
) {
  const { prefersReducedMotion } = useGSAP();

  useEffect(() => {
    if (!containerRef.current) return;

    const container = containerRef.current;
    const children = container.querySelectorAll(childSelector);
    const {
      stagger = 0.1,
      duration = 0.6,
      y = 20,
      start = "top 85%",
    } = options || {};

    if (prefersReducedMotion) {
      gsap.set(children, { opacity: 1, y: 0 });
      return;
    }

    gsap.fromTo(
      children,
      { opacity: 0, y },
      {
        opacity: 1,
        y: 0,
        duration,
        stagger,
        ease: "power2.out",
        scrollTrigger: {
          trigger: container,
          start,
          toggleActions: "play none none reverse",
        },
      }
    );

    return () => {
      ScrollTrigger.getAll().forEach((t) => t.kill());
    };
  }, [containerRef, childSelector, options, prefersReducedMotion]);
}

export function useParallax(
  ref: React.RefObject<HTMLElement>,
  speed: number = 0.5
) {
  const { prefersReducedMotion } = useGSAP();

  useEffect(() => {
    if (!ref.current || prefersReducedMotion) return;

    const element = ref.current;

    gsap.to(element, {
      yPercent: -50 * speed,
      ease: "none",
      scrollTrigger: {
        trigger: element,
        start: "top bottom",
        end: "bottom top",
        scrub: true,
      },
    });

    return () => {
      ScrollTrigger.getAll().forEach((t) => t.kill());
    };
  }, [ref, speed, prefersReducedMotion]);
}
