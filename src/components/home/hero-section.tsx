"use client";

import { useRef, useEffect } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowRight, Play, Sparkles, Shield, Clock } from "lucide-react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

if (typeof window !== "undefined") {
  gsap.registerPlugin(ScrollTrigger);
}

export function HeroSection() {
  const sectionRef = useRef<HTMLElement>(null);
  const headlineRef = useRef<HTMLHeadingElement>(null);
  const subheadlineRef = useRef<HTMLParagraphElement>(null);
  const ctaRef = useRef<HTMLDivElement>(null);
  const statsRef = useRef<HTMLDivElement>(null);
  const visualRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const prefersReducedMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)"
    ).matches;

    if (prefersReducedMotion) return;

    const ctx = gsap.context(() => {
      // Staggered headline animation
      gsap.fromTo(
        headlineRef.current,
        { opacity: 0, y: 30 },
        { opacity: 1, y: 0, duration: 0.8, ease: "power3.out", delay: 0.2 }
      );

      gsap.fromTo(
        subheadlineRef.current,
        { opacity: 0, y: 20 },
        { opacity: 1, y: 0, duration: 0.8, ease: "power3.out", delay: 0.4 }
      );

      gsap.fromTo(
        ctaRef.current,
        { opacity: 0, y: 20 },
        { opacity: 1, y: 0, duration: 0.8, ease: "power3.out", delay: 0.6 }
      );

      gsap.fromTo(
        statsRef.current?.children || [],
        { opacity: 0, y: 20 },
        {
          opacity: 1,
          y: 0,
          duration: 0.6,
          ease: "power3.out",
          stagger: 0.1,
          delay: 0.8,
        }
      );

      gsap.fromTo(
        visualRef.current,
        { opacity: 0, scale: 0.95, x: 30 },
        { opacity: 1, scale: 1, x: 0, duration: 1, ease: "power3.out", delay: 0.4 }
      );
    }, sectionRef);

    return () => ctx.revert();
  }, []);

  return (
    <section
      ref={sectionRef}
      className="relative min-h-screen flex items-center overflow-hidden bg-gradient-to-b from-clinic-bg to-white dark:from-slate-900 dark:to-slate-800"
    >
      {/* Animated Background Elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {/* Mesh Gradient */}
        <div className="absolute top-0 right-0 w-[800px] h-[800px] opacity-30">
          <div className="absolute inset-0 bg-gradient-to-br from-clinic-navy/20 via-clinic-teal/30 to-clinic-ai/20 rounded-full blur-3xl animate-pulse-glow" />
        </div>
        <div className="absolute bottom-0 left-0 w-[600px] h-[600px] opacity-20">
          <div className="absolute inset-0 bg-gradient-to-tr from-clinic-teal/30 via-clinic-ai/20 to-transparent rounded-full blur-3xl" />
        </div>
        {/* Floating Shapes */}
        <div className="absolute top-1/4 left-10 w-20 h-20 bg-clinic-teal/10 rounded-2xl rotate-12 animate-float" />
        <div className="absolute bottom-1/4 right-20 w-16 h-16 bg-clinic-ai/10 rounded-full animate-float" style={{ animationDelay: "2s" }} />
        <div className="absolute top-1/3 right-1/4 w-12 h-12 bg-clinic-navy/10 rounded-xl rotate-45 animate-float" style={{ animationDelay: "4s" }} />
      </div>

      <div className="container mx-auto px-4 pt-24 pb-16 lg:pt-32 lg:pb-24 relative z-10">
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-20 items-center">
          {/* Content Column */}
          <div className="max-w-2xl">
            {/* Badge */}
            <Badge
              variant="outline"
              className="mb-6 px-4 py-1.5 border-clinic-ai/30 bg-clinic-ai/5 text-clinic-ai font-medium"
            >
              <Sparkles className="w-3.5 h-3.5 mr-1.5" />
              AI-Powered Healthcare Platform
            </Badge>

            {/* Headline */}
            <h1
              ref={headlineRef}
              className="font-display text-4xl sm:text-5xl lg:text-6xl font-bold text-clinic-navy dark:text-white leading-[1.1] tracking-tight mb-6"
            >
              Transform Your Clinic with{" "}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-clinic-teal to-clinic-ai">
                Intelligent Care
              </span>
            </h1>

            {/* Subheadline */}
            <p
              ref={subheadlineRef}
              className="text-lg sm:text-xl text-clinic-text/70 dark:text-white/70 leading-relaxed mb-8 max-w-xl"
            >
              Streamline patient intake, automate scheduling, and unlock
              data-driven insights — all in one HIPAA-compliant platform designed
              for modern medical practices.
            </p>

            {/* CTAs */}
            <div ref={ctaRef} className="flex flex-wrap items-center gap-4 mb-12">
              <Button
                size="lg"
                className="bg-clinic-teal hover:bg-clinic-teal/90 text-white px-8 h-12 text-base shadow-glow hover:shadow-lg transition-all duration-300 group"
                asChild
              >
                <Link href="/demo">
                  Get Started Free
                  <ArrowRight className="ml-2 w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </Link>
              </Button>
              <Button
                size="lg"
                variant="outline"
                className="border-clinic-navy/20 text-clinic-navy dark:border-white/20 dark:text-white px-8 h-12 text-base hover:bg-clinic-navy/5 dark:hover:bg-white/5 transition-all duration-300"
                asChild
              >
                <Link href="/demo">
                  <Play className="mr-2 w-4 h-4" />
                  Watch Demo
                </Link>
              </Button>
            </div>

            {/* Trust Stats */}
            <div ref={statsRef} className="flex flex-wrap items-center gap-6 lg:gap-8">
              <div className="flex items-center gap-2">
                <div className="w-10 h-10 rounded-full bg-clinic-teal/10 flex items-center justify-center">
                  <Shield className="w-5 h-5 text-clinic-teal" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-clinic-navy dark:text-white">
                    HIPAA Compliant
                  </p>
                  <p className="text-xs text-clinic-text/60 dark:text-white/60">
                    Enterprise Security
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-10 h-10 rounded-full bg-clinic-ai/10 flex items-center justify-center">
                  <Sparkles className="w-5 h-5 text-clinic-ai" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-clinic-navy dark:text-white">
                    500+ Clinics
                  </p>
                  <p className="text-xs text-clinic-text/60 dark:text-white/60">
                    Trust MediFlow
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-10 h-10 rounded-full bg-clinic-navy/10 dark:bg-white/10 flex items-center justify-center">
                  <Clock className="w-5 h-5 text-clinic-navy dark:text-white" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-clinic-navy dark:text-white">
                    40% Time Saved
                  </p>
                  <p className="text-xs text-clinic-text/60 dark:text-white/60">
                    On Admin Tasks
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Visual Column */}
          <div ref={visualRef} className="relative lg:h-[600px]">
            <div className="relative h-full">
              {/* Main Dashboard Preview */}
              <div className="relative rounded-2xl overflow-hidden shadow-glass-lg border border-white/50 dark:border-slate-700/50 bg-white dark:bg-slate-800">
                <img
                  src="https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?w=800&q=80"
                  alt="Healthcare dashboard preview"
                  className="w-full h-auto"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-clinic-navy/80 via-transparent to-transparent" />
                
                {/* Floating UI Elements */}
                <div className="absolute bottom-4 left-4 right-4 p-4 rounded-xl glass-card">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs text-clinic-text/60 dark:text-white/60 mb-1">
                        Patient Intake Progress
                      </p>
                      <p className="text-sm font-semibold text-clinic-navy dark:text-white">
                        23 New Patients Today
                      </p>
                    </div>
                    <div className="flex items-center gap-1 px-3 py-1 bg-clinic-teal/10 rounded-full">
                      <span className="w-2 h-2 bg-clinic-teal rounded-full animate-pulse" />
                      <span className="text-xs font-medium text-clinic-teal">
                        Live
                      </span>
                    </div>
                  </div>
                  <div className="mt-3 h-2 bg-clinic-navy/10 dark:bg-white/10 rounded-full overflow-hidden">
                    <div className="h-full w-3/4 bg-gradient-to-r from-clinic-teal to-clinic-ai rounded-full" />
                  </div>
                </div>
              </div>

              {/* Floating Card - AI Assistant */}
              <div className="absolute -top-4 -right-4 lg:right-8 p-4 rounded-xl glass-card shadow-glass animate-float max-w-[200px]">
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-clinic-ai to-clinic-teal flex items-center justify-center">
                    <Sparkles className="w-4 h-4 text-white" />
                  </div>
                  <span className="text-xs font-semibold text-clinic-navy dark:text-white">
                    AI Assistant
                  </span>
                </div>
                <p className="text-xs text-clinic-text/70 dark:text-white/70">
                  "Patient symptoms suggest priority scheduling..."
                </p>
              </div>

              {/* Floating Card - Quick Stats */}
              <div
                className="absolute -bottom-4 -left-4 lg:left-8 p-4 rounded-xl glass-card shadow-glass animate-float max-w-[180px]"
                style={{ animationDelay: "1s" }}
              >
                <p className="text-xs text-clinic-text/60 dark:text-white/60 mb-1">
                  Today's Efficiency
                </p>
                <p className="text-2xl font-display font-bold text-clinic-navy dark:text-white">
                  94%
                </p>
                <div className="flex items-center gap-1 text-clinic-teal text-xs">
                  <ArrowRight className="w-3 h-3 rotate-[-45deg]" />
                  <span>+12% from last week</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Scroll Indicator */}
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 text-clinic-text/40 dark:text-white/40">
        <span className="text-xs font-medium">Scroll to explore</span>
        <div className="w-6 h-10 rounded-full border-2 border-current p-1">
          <div className="w-1.5 h-1.5 bg-current rounded-full animate-bounce mx-auto" />
        </div>
      </div>
    </section>
  );
}
