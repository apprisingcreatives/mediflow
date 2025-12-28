"use client";

import { useRef, useEffect } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { Star, Users } from "lucide-react";

if (typeof window !== "undefined") {
  gsap.registerPlugin(ScrollTrigger);
}

const practitioners = [
  {
    name: "Dr. Sarah Chen",
    specialty: "Family Medicine",
    clinic: "Bay Area Medical Group",
    image: "https://images.unsplash.com/photo-1559839734-2b71ea197ec2?w=400&q=80",
    quote: "MediFlow reduced our administrative burden by 50%. My staff can now focus on patient care.",
  },
  {
    name: "Dr. Michael Rodriguez",
    specialty: "Pediatrics",
    clinic: "Children's Wellness Center",
    image: "https://images.unsplash.com/photo-1612349317150-e413f6a5b16d?w=400&q=80",
    quote: "The AI intake system asks the right questions, saving valuable consultation time.",
  },
  {
    name: "Dr. Emily Watson",
    specialty: "Internal Medicine",
    clinic: "Eastside Health Partners",
    image: "https://images.unsplash.com/photo-1594824476967-48c8b964273f?w=400&q=80",
    quote: "Our no-show rate dropped 35% within the first month of using intelligent scheduling.",
  },
  {
    name: "Dr. James Park",
    specialty: "Orthopedics",
    clinic: "Summit Orthopedic Clinic",
    image: "https://images.unsplash.com/photo-1537368910025-700350fe46c7?w=400&q=80",
    quote: "The analytics dashboard gives me insights I never had before about my practice.",
  },
  {
    name: "Dr. Lisa Thompson",
    specialty: "Dermatology",
    clinic: "Clear Skin Dermatology",
    image: "https://images.unsplash.com/photo-1651008376811-b90baee60c1f?w=400&q=80",
    quote: "Seamless EHR integration made the transition effortless. Highly recommend.",
  },
  {
    name: "Dr. Robert Kim",
    specialty: "Cardiology",
    clinic: "Heart Health Associates",
    image: "https://images.unsplash.com/photo-1622253692010-333f2da6031d?w=400&q=80",
    quote: "The HIPAA compliance features give me peace of mind with patient data security.",
  },
];

export function PractitionersSection() {
  const sectionRef = useRef<HTMLElement>(null);
  const headerRef = useRef<HTMLDivElement>(null);
  const gridRef = useRef<HTMLDivElement>(null);

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
        gridRef.current?.children || [],
        { opacity: 0, y: 30 },
        {
          opacity: 1,
          y: 0,
          duration: 0.5,
          stagger: 0.1,
          ease: "power3.out",
          scrollTrigger: {
            trigger: gridRef.current,
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
      id="practitioners"
      className="py-20 lg:py-32 bg-clinic-bg dark:bg-slate-900"
    >
      <div className="container mx-auto px-4">
        {/* Section Header */}
        <div ref={headerRef} className="text-center max-w-3xl mx-auto mb-16">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-clinic-navy/10 dark:bg-white/10 rounded-full text-clinic-navy dark:text-white text-sm font-medium mb-4">
            <Users className="w-4 h-4" />
            Our Community
          </div>
          <h2 className="font-display text-3xl sm:text-4xl lg:text-5xl font-bold text-clinic-navy dark:text-white tracking-tight mb-4">
            Trusted by Leading Practitioners
          </h2>
          <p className="text-lg text-clinic-text/70 dark:text-white/70">
            Join hundreds of healthcare professionals who have transformed their
            practice with MediFlow.
          </p>
        </div>

        {/* Practitioners Grid - Masonry Style */}
        <div
          ref={gridRef}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
        >
          {practitioners.map((practitioner, index) => (
            <div
              key={practitioner.name}
              className="group relative bg-white dark:bg-slate-800 rounded-2xl overflow-hidden shadow-glass hover:shadow-glass-lg transition-all duration-300 hover:-translate-y-1"
            >
              {/* Image */}
              <div className="relative h-48 overflow-hidden">
                <img
                  src={practitioner.image}
                  alt={practitioner.name}
                  className="w-full h-full object-cover grayscale group-hover:grayscale-0 transition-all duration-500"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-clinic-navy/80 via-clinic-navy/20 to-transparent" />
                
                {/* Name Overlay */}
                <div className="absolute bottom-4 left-4 right-4">
                  <h3 className="font-display text-lg font-semibold text-white mb-0.5">
                    {practitioner.name}
                  </h3>
                  <p className="text-sm text-white/80">
                    {practitioner.specialty}
                  </p>
                </div>
              </div>

              {/* Content */}
              <div className="p-6">
                <p className="text-sm text-clinic-text/60 dark:text-white/60 mb-3">
                  {practitioner.clinic}
                </p>
                <blockquote className="text-clinic-text/80 dark:text-white/80 leading-relaxed italic">
                  "{practitioner.quote}"
                </blockquote>
                
                {/* Rating */}
                <div className="flex items-center gap-1 mt-4">
                  {[...Array(5)].map((_, i) => (
                    <Star
                      key={i}
                      className="w-4 h-4 fill-clinic-teal text-clinic-teal"
                    />
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
