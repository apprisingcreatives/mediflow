"use client";

import { useRef, useEffect } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { 
  UserPlus, 
  Brain, 
  CalendarCheck, 
  BarChart3,
  ArrowRight 
} from "lucide-react";

if (typeof window !== "undefined") {
  gsap.registerPlugin(ScrollTrigger);
}

const steps = [
  {
    number: "01",
    icon: UserPlus,
    title: "Patient Registration",
    description:
      "Patients complete AI-guided intake forms online. Smart questions adapt based on responses, ensuring comprehensive data collection.",
    highlight: "60% faster than paper forms",
  },
  {
    number: "02",
    icon: Brain,
    title: "AI Triage & Analysis",
    description:
      "Our AI analyzes intake data to prioritize patients, flag concerns, and suggest optimal appointment slots — all while maintaining compliance.",
    highlight: "Non-diagnostic, explainable AI",
  },
  {
    number: "03",
    icon: CalendarCheck,
    title: "Smart Scheduling",
    description:
      "Patients book appointments through real-time availability. The system optimizes scheduling to maximize clinic efficiency.",
    highlight: "Reduce no-shows by 40%",
  },
  {
    number: "04",
    icon: BarChart3,
    title: "Insights & Action",
    description:
      "Access real-time analytics on patient flow, revenue metrics, and operational efficiency. Make data-driven decisions with confidence.",
    highlight: "Actionable dashboard",
  },
];

export function HowItWorksSection() {
  const sectionRef = useRef<HTMLElement>(null);
  const headerRef = useRef<HTMLDivElement>(null);
  const stepsRef = useRef<HTMLDivElement>(null);
  const lineRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const prefersReducedMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)"
    ).matches;

    if (prefersReducedMotion) return;

    const ctx = gsap.context(() => {
      // Header animation
      gsap.fromTo(
        headerRef.current,
        { opacity: 0, y: 30 },
        {
          opacity: 1,
          y: 0,
          duration: 0.8,
          ease: "power3.out",
          scrollTrigger: {
            trigger: sectionRef.current,
            start: "top 80%",
          },
        }
      );

      // Progress line animation
      gsap.fromTo(
        lineRef.current,
        { scaleY: 0 },
        {
          scaleY: 1,
          duration: 1.5,
          ease: "power2.out",
          scrollTrigger: {
            trigger: stepsRef.current,
            start: "top 70%",
            end: "bottom 30%",
            scrub: 1,
          },
        }
      );

      // Steps stagger
      gsap.fromTo(
        stepsRef.current?.children || [],
        { opacity: 0, x: -30 },
        {
          opacity: 1,
          x: 0,
          duration: 0.6,
          stagger: 0.2,
          ease: "power3.out",
          scrollTrigger: {
            trigger: stepsRef.current,
            start: "top 75%",
          },
        }
      );
    }, sectionRef);

    return () => ctx.revert();
  }, []);

  return (
    <section
      ref={sectionRef}
      id="how-it-works"
      className="py-20 lg:py-32 bg-white dark:bg-slate-800"
    >
      <div className="container mx-auto px-4">
        {/* Section Header */}
        <div ref={headerRef} className="text-center max-w-3xl mx-auto mb-16 lg:mb-24">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-clinic-teal/10 rounded-full text-clinic-teal text-sm font-medium mb-4">
            <ArrowRight className="w-4 h-4" />
            Simple Process
          </div>
          <h2 className="font-display text-3xl sm:text-4xl lg:text-5xl font-bold text-clinic-navy dark:text-white tracking-tight mb-4">
            How MediFlow AI Works
          </h2>
          <p className="text-lg text-clinic-text/70 dark:text-white/70">
            From patient registration to actionable insights, our streamlined
            workflow transforms clinic operations in four simple steps.
          </p>
        </div>

        {/* Steps */}
        <div className="relative max-w-4xl mx-auto">
          {/* Progress Line */}
          <div
            ref={lineRef}
            className="absolute left-8 lg:left-12 top-0 bottom-0 w-0.5 bg-gradient-to-b from-clinic-teal via-clinic-ai to-clinic-navy origin-top hidden md:block"
          />

          <div ref={stepsRef} className="space-y-12 lg:space-y-16">
            {steps.map((step, index) => (
              <div key={step.number} className="relative flex gap-6 lg:gap-10">
                {/* Step Number & Icon */}
                <div className="flex-shrink-0 relative z-10">
                  <div className="w-16 h-16 lg:w-24 lg:h-24 rounded-2xl bg-gradient-to-br from-clinic-navy to-clinic-teal shadow-glass flex items-center justify-center">
                    <step.icon className="w-8 h-8 lg:w-10 lg:h-10 text-white" />
                  </div>
                  <span className="absolute -top-2 -right-2 w-8 h-8 bg-white dark:bg-slate-800 rounded-full flex items-center justify-center text-sm font-display font-bold text-clinic-navy dark:text-white shadow-md border border-clinic-navy/10 dark:border-white/10">
                    {step.number}
                  </span>
                </div>

                {/* Content */}
                <div className="flex-1 pt-2">
                  <h3 className="font-display text-xl lg:text-2xl font-semibold text-clinic-navy dark:text-white mb-2">
                    {step.title}
                  </h3>
                  <p className="text-clinic-text/70 dark:text-white/70 leading-relaxed mb-3">
                    {step.description}
                  </p>
                  <div className="inline-flex items-center gap-2 px-3 py-1 bg-clinic-teal/10 dark:bg-clinic-teal/20 rounded-full">
                    <span className="w-1.5 h-1.5 bg-clinic-teal rounded-full" />
                    <span className="text-sm font-medium text-clinic-teal">
                      {step.highlight}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
