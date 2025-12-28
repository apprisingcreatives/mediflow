"use client";

import { useRef, useEffect } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { Quote } from "lucide-react";

if (typeof window !== "undefined") {
  gsap.registerPlugin(ScrollTrigger);
}

const testimonials = [
  {
    quote:
      "MediFlow has completely transformed how we operate. What used to take hours now takes minutes. Our patients notice the difference, and so does our bottom line.",
    author: "Dr. Amanda Foster",
    role: "Medical Director",
    organization: "Pacific Northwest Health Network",
    image: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=400&q=80",
    metric: "40%",
    metricLabel: "Revenue increase",
  },
  {
    quote:
      "The AI-powered intake is a game-changer. Patients arrive with all their information already processed, and our staff can focus on what matters — patient care.",
    author: "Jennifer Martinez, RN",
    role: "Practice Manager",
    organization: "Sunrise Family Medicine",
    image: "https://images.unsplash.com/photo-1580489944761-15a19d654956?w=400&q=80",
    metric: "60%",
    metricLabel: "Time saved on intake",
  },
  {
    quote:
      "As a multi-location practice, we needed a solution that could scale. MediFlow gives us unified visibility across all our clinics with enterprise-grade security.",
    author: "Dr. Richard Chang",
    role: "CEO & Founder",
    organization: "Integrated Care Partners",
    image: "https://images.unsplash.com/photo-1560250097-0b93528c311a?w=400&q=80",
    metric: "5",
    metricLabel: "Clinics unified",
  },
];

export function TestimonialsSection() {
  const sectionRef = useRef<HTMLElement>(null);
  const headerRef = useRef<HTMLDivElement>(null);
  const cardsRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const prefersReducedMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)"
    ).matches;

    if (prefersReducedMotion) return;

    const ctx = gsap.context(() => {
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

      gsap.fromTo(
        cardsRef.current?.children || [],
        { opacity: 0, y: 40 },
        {
          opacity: 1,
          y: 0,
          duration: 0.6,
          stagger: 0.15,
          ease: "power3.out",
          scrollTrigger: {
            trigger: cardsRef.current,
            start: "top 85%",
          },
        }
      );
    }, sectionRef);

    return () => ctx.revert();
  }, []);

  return (
    <section
      ref={sectionRef}
      id="testimonials"
      className="py-20 lg:py-32 bg-white dark:bg-slate-800"
    >
      <div className="container mx-auto px-4">
        {/* Section Header */}
        <div ref={headerRef} className="text-center max-w-3xl mx-auto mb-16">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-clinic-teal/10 rounded-full text-clinic-teal text-sm font-medium mb-4">
            <Quote className="w-4 h-4" />
            Success Stories
          </div>
          <h2 className="font-display text-3xl sm:text-4xl lg:text-5xl font-bold text-clinic-navy dark:text-white tracking-tight mb-4">
            Hear From Clinic Leaders
          </h2>
          <p className="text-lg text-clinic-text/70 dark:text-white/70">
            Real results from healthcare professionals who made the switch to
            intelligent practice management.
          </p>
        </div>

        {/* Testimonial Cards */}
        <div ref={cardsRef} className="grid lg:grid-cols-3 gap-8">
          {testimonials.map((testimonial, index) => (
            <div
              key={testimonial.author}
              className="relative bg-clinic-bg dark:bg-slate-900 rounded-2xl p-8 shadow-glass"
            >
              {/* Quote Icon */}
              <div className="absolute -top-4 left-8 w-8 h-8 bg-gradient-to-br from-clinic-teal to-clinic-ai rounded-full flex items-center justify-center">
                <Quote className="w-4 h-4 text-white" />
              </div>

              {/* Quote */}
              <blockquote className="text-lg text-clinic-text dark:text-white leading-relaxed font-serif italic mb-6">
                "{testimonial.quote}"
              </blockquote>

              {/* Metric */}
              <div className="mb-6 p-4 bg-gradient-to-r from-clinic-navy/5 to-clinic-teal/5 dark:from-white/5 dark:to-clinic-teal/10 rounded-xl">
                <div className="text-3xl font-display font-bold text-clinic-teal mb-1">
                  {testimonial.metric}
                </div>
                <div className="text-sm text-clinic-text/60 dark:text-white/60">
                  {testimonial.metricLabel}
                </div>
              </div>

              {/* Author */}
              <div className="flex items-center gap-4">
                <img
                  src={testimonial.image}
                  alt={testimonial.author}
                  className="w-14 h-14 rounded-full object-cover border-2 border-white dark:border-slate-700 shadow-md"
                />
                <div>
                  <h4 className="font-semibold text-clinic-navy dark:text-white">
                    {testimonial.author}
                  </h4>
                  <p className="text-sm text-clinic-text/60 dark:text-white/60">
                    {testimonial.role}
                  </p>
                  <p className="text-xs text-clinic-teal">
                    {testimonial.organization}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
