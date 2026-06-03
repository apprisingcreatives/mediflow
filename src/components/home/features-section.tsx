"use client";

import { useRef, useEffect } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import {
  Sparkles,
  CalendarDays,
  BarChart3,
  Brain,
  Users,
  FileText,
  ClipboardCheck,
  BellRing,
  TrendingUp,
  Stethoscope,
  ShieldCheck,
  Smartphone,
} from "lucide-react";
import { cn } from "@/lib/utils";

if (typeof window !== "undefined") {
  gsap.registerPlugin(ScrollTrigger);
}

const categories = [
  {
    title: "Clinic Operations",
    description: "Streamline daily workflows and eliminate manual coordination.",
    features: [
      {
        icon: CalendarDays,
        title: "Smart Scheduling",
        description:
          "AI-optimized appointment slots with real-time doctor availability. Eliminate double-bookings and empty gaps.",
        color: "from-clinic-teal to-emerald-400",
      },
      {
        icon: Users,
        title: "Staff Management",
        description:
          "Role-based access, shift scheduling, and performance tracking for your entire team.",
        color: "from-clinic-navy to-clinic-ai",
      },
      {
        icon: BellRing,
        title: "Automated Reminders",
        description:
          "Multi-step SMS and email reminders that reduce no-shows by up to 70%.",
        color: "from-amber-400 to-orange-500",
      },
    ],
  },
  {
    title: "Patient Management",
    description:
      "Digitize your patient records and deliver exceptional care.",
    features: [
      {
        icon: ClipboardCheck,
        title: "Digital Intake Forms",
        description:
          "Patients complete intake before arrival. No more clipboards, paper, or manual data entry.",
        color: "from-clinic-ai to-clinic-teal",
      },
      {
        icon: FileText,
        title: "Electronic Medical Records",
        description:
          "Secure, searchable patient records accessible from any device. Replace paper charts forever.",
        color: "from-rose-400 to-clinic-ai",
      },
      {
        icon: Stethoscope,
        title: "Patient Follow-Ups",
        description:
          "Automated follow-up reminders and care plans that improve patient retention and outcomes.",
        color: "from-clinic-navy to-slate-600",
      },
    ],
  },
  {
    title: "AI Productivity",
    description:
      "Let AI handle documentation so doctors can focus on patients.",
    features: [
      {
        icon: Brain,
        title: "AI Consultation Summaries",
        description:
          "Auto-generate comprehensive consultation notes from visit data. Save 15+ minutes per patient.",
        color: "from-clinic-ai to-purple-500",
      },
      {
        icon: Sparkles,
        title: "AI Medical Notes",
        description:
          "Smart clinical note formatting with ICD coding suggestions and treatment plan templates.",
        color: "from-clinic-teal to-clinic-ai",
      },
      {
        icon: ShieldCheck,
        title: "AI Analytics & Insights",
        description:
          "Predictive no-show alerts, peak-hour analysis, and operational recommendations.",
        color: "from-emerald-400 to-clinic-teal",
      },
    ],
  },
  {
    title: "Business Intelligence",
    description:
      "Make data-driven decisions to grow your practice profitably.",
    features: [
      {
        icon: BarChart3,
        title: "Revenue Tracking",
        description:
          "Real-time revenue dashboards with per-doctor, per-service, and daily breakdowns.",
        color: "from-clinic-navy to-clinic-teal",
      },
      {
        icon: TrendingUp,
        title: "Clinic Performance Reports",
        description:
          "Monthly trend reports on patient volume, utilization rates, and cancellation patterns.",
        color: "from-amber-500 to-rose-500",
      },
      {
        icon: Smartphone,
        title: "Mobile Dashboard",
        description:
          "Access key metrics, approve appointments, and monitor your clinic from anywhere.",
        color: "from-clinic-ai to-clinic-navy",
      },
    ],
  },
];

export function FeaturesSection() {
  const sectionRef = useRef<HTMLElement>(null);
  const headerRef = useRef<HTMLDivElement>(null);

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

      // Animate each category block
      document.querySelectorAll(".feature-category").forEach((el) => {
        gsap.fromTo(
          el,
          { opacity: 0, y: 40 },
          {
            opacity: 1,
            y: 0,
            duration: 0.7,
            ease: "power3.out",
            scrollTrigger: {
              trigger: el,
              start: "top 88%",
            },
          }
        );
      });
    }, sectionRef);

    return () => ctx.revert();
  }, []);

  return (
    <section
      ref={sectionRef}
      id="features"
      className="py-20 lg:py-32 bg-clinic-bg dark:bg-slate-900"
    >
      <div className="container mx-auto px-4">
        {/* Section Header */}
        <div ref={headerRef} className="text-center max-w-3xl mx-auto mb-16">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-clinic-ai/10 rounded-full text-clinic-ai text-sm font-medium mb-4">
            <Sparkles className="w-4 h-4" />
            Complete Clinic Platform
          </div>
          <h2 className="font-display text-3xl sm:text-4xl lg:text-5xl font-bold text-clinic-navy dark:text-white tracking-tight mb-4">
            Everything Your Clinic Needs to Thrive
          </h2>
          <p className="text-lg text-clinic-text/70 dark:text-white/70">
            From scheduling to AI-powered clinical notes — one platform that
            replaces spreadsheets, paper charts, and manual coordination.
          </p>
        </div>

        {/* Feature Categories */}
        <div className="space-y-16">
          {categories.map((category, catIdx) => (
            <div key={category.title} className="feature-category">
              {/* Category Header */}
              <div className="mb-8">
                <h3 className="font-display text-2xl font-bold text-clinic-navy dark:text-white mb-2">
                  {category.title}
                </h3>
                <p className="text-clinic-text/60 dark:text-white/60">
                  {category.description}
                </p>
              </div>

              {/* Feature Cards Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {category.features.map((feature) => (
                  <div
                    key={feature.title}
                    className="group relative p-6 lg:p-8 rounded-2xl bg-white dark:bg-slate-800 border border-clinic-navy/5 dark:border-white/5 shadow-glass hover:shadow-glass-lg transition-all duration-300 hover:-translate-y-1 flex flex-col"
                  >
                    {/* Background Gradient */}
                    <div
                      className={cn(
                        "absolute top-0 right-0 w-32 h-32 rounded-full blur-3xl opacity-10 group-hover:opacity-20 transition-opacity",
                        `bg-gradient-to-br ${feature.color}`
                      )}
                    />

                    {/* Icon */}
                    <div
                      className={cn(
                        "w-12 h-12 lg:w-14 lg:h-14 rounded-xl flex items-center justify-center mb-4 bg-gradient-to-br shadow-lg group-hover:shadow-glow transition-all duration-300 group-hover:scale-110",
                        feature.color
                      )}
                    >
                      <feature.icon className="w-6 h-6 lg:w-7 lg:h-7 text-white transition-transform duration-300 group-hover:rotate-6" />
                    </div>

                    {/* Content */}
                    <h4 className="font-display text-xl font-semibold text-clinic-navy dark:text-white mb-2">
                      {feature.title}
                    </h4>
                    <p className="text-clinic-text/70 dark:text-white/70 leading-relaxed flex-1 text-sm">
                      {feature.description}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
