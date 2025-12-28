"use client";

import { useRef, useEffect } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { Shield, Lock, CheckCircle, Award, Building2 } from "lucide-react";

if (typeof window !== "undefined") {
  gsap.registerPlugin(ScrollTrigger);
}

const certifications = [
  {
    icon: Shield,
    label: "HIPAA Compliant",
    description: "Full healthcare data protection",
  },
  {
    icon: Lock,
    label: "SOC 2 Type II",
    description: "Enterprise-grade security",
  },
  {
    icon: CheckCircle,
    label: "GDPR Ready",
    description: "Global privacy standards",
  },
  {
    icon: Award,
    label: "ISO 27001",
    description: "Information security certified",
  },
  {
    icon: Building2,
    label: "500+ Clinics",
    description: "Trusted worldwide",
  },
];

const logos = [
  "Cleveland Clinic",
  "Mayo Health",
  "Stanford Medical",
  "Johns Hopkins",
  "Mass General",
  "UCLA Health",
];

export function TrustBar() {
  const sectionRef = useRef<HTMLElement>(null);
  const badgesRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const prefersReducedMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)"
    ).matches;

    if (prefersReducedMotion) return;

    const ctx = gsap.context(() => {
      gsap.fromTo(
        badgesRef.current?.children || [],
        { opacity: 0, y: 20 },
        {
          opacity: 1,
          y: 0,
          duration: 0.5,
          stagger: 0.1,
          ease: "power2.out",
          scrollTrigger: {
            trigger: sectionRef.current,
            start: "top 85%",
            toggleActions: "play none none reverse",
          },
        }
      );
    }, sectionRef);

    return () => ctx.revert();
  }, []);

  return (
    <section
      ref={sectionRef}
      className="py-12 lg:py-16 bg-white dark:bg-slate-900 border-y border-clinic-navy/5 dark:border-white/5"
    >
      <div className="container mx-auto px-4">
        {/* Certifications */}
        <div
          ref={badgesRef}
          className="flex flex-wrap items-center justify-center gap-6 lg:gap-10 mb-12"
        >
          {certifications.map((cert) => (
            <div
              key={cert.label}
              className="flex items-center gap-3 px-4 py-2 rounded-full bg-clinic-navy/5 dark:bg-white/5 hover:bg-clinic-teal/10 transition-colors group cursor-default"
            >
              <div className="w-9 h-9 rounded-full bg-gradient-to-br from-clinic-navy to-clinic-teal flex items-center justify-center group-hover:shadow-glow transition-shadow">
                <cert.icon className="w-4 h-4 text-white" />
              </div>
              <div>
                <p className="text-sm font-semibold text-clinic-navy dark:text-white">
                  {cert.label}
                </p>
                <p className="text-xs text-clinic-text/60 dark:text-white/60">
                  {cert.description}
                </p>
              </div>
            </div>
          ))}
        </div>

        {/* Trusted By */}
        <div className="text-center">
          <p className="text-xs font-medium text-clinic-text/40 dark:text-white/40 uppercase tracking-wider mb-6">
            Trusted by leading healthcare providers
          </p>
          <div className="flex flex-wrap items-center justify-center gap-8 lg:gap-12">
            {logos.map((logo) => (
              <div
                key={logo}
                className="text-clinic-navy/30 dark:text-white/30 hover:text-clinic-navy/60 dark:hover:text-white/60 transition-colors"
              >
                <span className="font-display font-semibold text-lg">
                  {logo}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
