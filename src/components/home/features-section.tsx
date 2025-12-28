"use client";

import { useRef, useEffect } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import {
  Sparkles,
  CalendarDays,
  BarChart3,
  MessageSquare,
  Shield,
  Zap,
  Brain,
  Users,
  FileText,
} from "lucide-react";
import { cn } from "@/lib/utils";

if (typeof window !== "undefined") {
  gsap.registerPlugin(ScrollTrigger);
}

const features = [
  {
    icon: Brain,
    title: "AI-Powered Intake",
    description:
      "Smart forms that adapt to patient responses, reducing intake time by 60% while improving data accuracy.",
    color: "from-clinic-ai to-clinic-teal",
    size: "large",
  },
  {
    icon: CalendarDays,
    title: "Intelligent Scheduling",
    description:
      "Real-time availability with AI-optimized appointment slots that maximize clinic efficiency.",
    color: "from-clinic-teal to-emerald-400",
    size: "medium",
  },
  {
    icon: BarChart3,
    title: "Analytics Dashboard",
    description:
      "Actionable insights on patient flow, revenue, and operational metrics in real-time.",
    color: "from-clinic-navy to-clinic-ai",
    size: "medium",
  },
  {
    icon: MessageSquare,
    title: "Secure Messaging",
    description:
      "HIPAA-compliant communication with patients, complete with read receipts and file sharing.",
    color: "from-rose-400 to-clinic-ai",
    size: "small",
  },
  {
    icon: Shield,
    title: "Compliance Controls",
    description: "Built-in HIPAA, GDPR, and SOC 2 compliance with audit trails.",
    color: "from-clinic-navy to-slate-600",
    size: "small",
  },
  {
    icon: Zap,
    title: "Automation Engine",
    description:
      "Automate reminders, follow-ups, and routine tasks to free up staff time.",
    color: "from-amber-400 to-orange-500",
    size: "small",
  },
];

export function FeaturesSection() {
  const sectionRef = useRef<HTMLElement>(null);
  const headerRef = useRef<HTMLDivElement>(null);
  const gridRef = useRef<HTMLDivElement>(null);

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

      // Feature cards stagger
      gsap.fromTo(
        gridRef.current?.children || [],
        { opacity: 0, y: 40 },
        {
          opacity: 1,
          y: 0,
          duration: 0.6,
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
      id="features"
      className="py-20 lg:py-32 bg-clinic-bg dark:bg-slate-900"
    >
      <div className="container mx-auto px-4">
        {/* Section Header */}
        <div ref={headerRef} className="text-center max-w-3xl mx-auto mb-16">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-clinic-ai/10 rounded-full text-clinic-ai text-sm font-medium mb-4">
            <Sparkles className="w-4 h-4" />
            Powerful Features
          </div>
          <h2 className="font-display text-3xl sm:text-4xl lg:text-5xl font-bold text-clinic-navy dark:text-white tracking-tight mb-4">
            Everything Your Clinic Needs
          </h2>
          <p className="text-lg text-clinic-text/70 dark:text-white/70">
            A comprehensive suite of tools designed to streamline operations,
            enhance patient care, and drive growth.
          </p>
        </div>

        {/* Bento Grid */}
        <div
          ref={gridRef}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
        >
          {features.map((feature, index) => (
            <div
              key={feature.title}
              className={cn(
                "group relative p-6 lg:p-8 rounded-2xl bg-white dark:bg-slate-800 border border-clinic-navy/5 dark:border-white/5 shadow-glass hover:shadow-glass-lg transition-all duration-300 hover:-translate-y-1 overflow-hidden",
                feature.size === "large" && "md:col-span-2 lg:col-span-1 lg:row-span-2",
                feature.size === "medium" && "lg:col-span-1"
              )}
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
                  "w-12 h-12 lg:w-14 lg:h-14 rounded-xl flex items-center justify-center mb-4 bg-gradient-to-br shadow-lg group-hover:shadow-glow transition-shadow",
                  feature.color
                )}
              >
                <feature.icon className="w-6 h-6 lg:w-7 lg:h-7 text-white" />
              </div>

              {/* Content */}
              <h3 className="font-display text-xl lg:text-2xl font-semibold text-clinic-navy dark:text-white mb-2">
                {feature.title}
              </h3>
              <p className="text-clinic-text/70 dark:text-white/70 leading-relaxed">
                {feature.description}
              </p>

              {/* Hover Arrow */}
              <div className="absolute bottom-6 right-6 w-8 h-8 rounded-full bg-clinic-navy/5 dark:bg-white/5 flex items-center justify-center opacity-0 group-hover:opacity-100 translate-x-2 group-hover:translate-x-0 transition-all duration-300">
                <svg
                  className="w-4 h-4 text-clinic-navy dark:text-white"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 5l7 7-7 7"
                  />
                </svg>
              </div>
            </div>
          ))}
        </div>

        {/* Additional Features List */}
        <div className="mt-16 p-8 rounded-2xl bg-gradient-to-r from-clinic-navy to-clinic-navy/90 text-white">
          <div className="grid md:grid-cols-3 gap-8">
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 rounded-lg bg-white/10 flex items-center justify-center flex-shrink-0">
                <Users className="w-5 h-5" />
              </div>
              <div>
                <h4 className="font-semibold mb-1">Multi-Clinic Support</h4>
                <p className="text-sm text-white/70">
                  Manage multiple locations from a single dashboard
                </p>
              </div>
            </div>
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 rounded-lg bg-white/10 flex items-center justify-center flex-shrink-0">
                <FileText className="w-5 h-5" />
              </div>
              <div>
                <h4 className="font-semibold mb-1">EHR Integration</h4>
                <p className="text-sm text-white/70">
                  Seamless connection with major EHR/EMR systems
                </p>
              </div>
            </div>
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 rounded-lg bg-white/10 flex items-center justify-center flex-shrink-0">
                <Zap className="w-5 h-5" />
              </div>
              <div>
                <h4 className="font-semibold mb-1">API Access</h4>
                <p className="text-sm text-white/70">
                  RESTful API for custom integrations
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
