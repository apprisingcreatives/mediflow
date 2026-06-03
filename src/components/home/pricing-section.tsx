"use client";

import { useRef, useEffect } from "react";
import Link from "next/link";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Check, Sparkles, Building2, Rocket, ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";

if (typeof window !== "undefined") {
  gsap.registerPlugin(ScrollTrigger);
}

const plans = [
  {
    name: "Basic",
    description: "Everything you need to run your clinic digitally.",
    price: "₱5,000",
    period: "/month",
    icon: Rocket,
    features: [
      "Appointment Management",
      "Patient Records (EMR)",
      "Staff Management",
      "Smart Scheduling & Calendar",
      "Reporting Dashboard",
      "Mobile Access",
      "Automated SMS Reminders",
      "HIPAA-Compliant Security",
    ],
    cta: "Start Free Trial",
    href: "/register",
    highlighted: false,
  },
  {
    name: "AI Professional",
    description: "AI-powered productivity for growing practices.",
    price: "₱10,000",
    period: "/month",
    icon: Sparkles,
    features: [
      "Everything in Basic, plus:",
      "AI Consultation Summaries",
      "AI Medical Notes",
      "AI Patient Follow-Up Recommendations",
      "AI Clinic Analytics & Insights",
      "AI Productivity Assistant",
      "AI Reporting Insights",
      "Priority Support",
    ],
    cta: "Start Free Trial",
    href: "/register",
    highlighted: true,
    badge: "Recommended",
  },
  {
    name: "Enterprise",
    description: "For larger clinics and medical groups.",
    price: "Custom",
    period: "",
    icon: Building2,
    features: [
      "Everything in AI Professional, plus:",
      "Multi-branch Management",
      "Unlimited Practitioners",
      "Dedicated Success Manager",
      "Custom Integrations & API",
      "SLA Guarantee (99.9%)",
      "White-Label Option",
      "24/7 Phone & Chat Support",
    ],
    cta: "Contact Sales",
    href: "tel:+639204786075",
    highlighted: false,
  },
];

export function PricingSection() {
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
      id="pricing"
      className="py-20 lg:py-32 bg-clinic-bg dark:bg-slate-900"
    >
      <div className="container mx-auto px-4">
        {/* Section Header */}
        <div ref={headerRef} className="text-center max-w-3xl mx-auto mb-16">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-clinic-navy/10 dark:bg-white/10 rounded-full text-clinic-navy dark:text-white text-sm font-medium mb-4">
            <Sparkles className="w-4 h-4" />
            Transparent Pricing
          </div>
          <h2 className="font-display text-3xl sm:text-4xl lg:text-5xl font-bold text-clinic-navy dark:text-white tracking-tight mb-4">
            Choose the Plan That Fits Your Clinic
          </h2>
          <p className="text-lg text-clinic-text/70 dark:text-white/70">
            No hidden fees. No long-term contracts. Start with a 14-day free
            trial and upgrade as your practice grows.
          </p>
        </div>

        {/* Pricing Cards */}
        <div
          ref={cardsRef}
          className="grid lg:grid-cols-3 gap-8 max-w-6xl mx-auto"
        >
          {plans.map((plan) => (
            <div
              key={plan.name}
              className={cn(
                "relative rounded-2xl p-8 transition-all duration-300 hover:-translate-y-1",
                plan.highlighted
                  ? "bg-gradient-to-br from-clinic-navy to-clinic-navy/90 text-white shadow-glass-lg ring-2 ring-clinic-teal"
                  : "bg-white dark:bg-slate-800 shadow-glass"
              )}
            >
              {/* Badge */}
              {plan.badge && (
                <Badge className="absolute -top-3 left-1/2 -translate-x-1/2 bg-clinic-teal text-white px-4 py-1">
                  {plan.badge}
                </Badge>
              )}

              {/* Icon */}
              <div
                className={cn(
                  "w-12 h-12 rounded-xl flex items-center justify-center mb-4",
                  plan.highlighted
                    ? "bg-white/10"
                    : "bg-gradient-to-br from-clinic-navy to-clinic-teal"
                )}
              >
                <plan.icon
                  className={cn(
                    "w-6 h-6",
                    plan.highlighted ? "text-clinic-teal" : "text-white"
                  )}
                />
              </div>

              {/* Plan Name */}
              <h3
                className={cn(
                  "font-display text-2xl font-bold mb-2",
                  plan.highlighted
                    ? "text-white"
                    : "text-clinic-navy dark:text-white"
                )}
              >
                {plan.name}
              </h3>
              <p
                className={cn(
                  "text-sm mb-6",
                  plan.highlighted
                    ? "text-white/70"
                    : "text-clinic-text/60 dark:text-white/60"
                )}
              >
                {plan.description}
              </p>

              {/* Price */}
              <div className="mb-6">
                <span
                  className={cn(
                    "text-4xl font-display font-bold",
                    plan.highlighted
                      ? "text-white"
                      : "text-clinic-navy dark:text-white"
                  )}
                >
                  {plan.price}
                </span>
                <span
                  className={cn(
                    "text-sm",
                    plan.highlighted
                      ? "text-white/70"
                      : "text-clinic-text/60 dark:text-white/60"
                  )}
                >
                  {plan.period}
                </span>
              </div>

              {/* Features */}
              <ul className="space-y-3 mb-8">
                {plan.features.map((feature) => (
                  <li key={feature} className="flex items-start gap-3">
                    <Check
                      className={cn(
                        "w-5 h-5 flex-shrink-0 mt-0.5",
                        "text-clinic-teal"
                      )}
                    />
                    <span
                      className={cn(
                        "text-sm",
                        plan.highlighted
                          ? "text-white/90"
                          : "text-clinic-text/80 dark:text-white/80"
                      )}
                    >
                      {feature}
                    </span>
                  </li>
                ))}
              </ul>

              {/* CTA */}
              <Button
                className={cn(
                  "w-full h-12 group",
                  plan.highlighted
                    ? "bg-clinic-teal hover:bg-clinic-teal/90 text-white"
                    : "bg-clinic-navy hover:bg-clinic-navy/90 text-white"
                )}
                asChild
              >
                {plan.name === "Enterprise" ? (
                  <a href={plan.href}>{plan.cta}</a>
                ) : (
                  <Link href={plan.href}>
                    {plan.cta}
                    <ArrowRight className="ml-2 w-4 h-4 group-hover:translate-x-1 transition-transform" />
                  </Link>
                )}
              </Button>
            </div>
          ))}
        </div>

        {/* Bottom Note */}
        <p className="text-center text-sm text-clinic-text/50 dark:text-white/50 mt-12">
          All plans include a 14-day free trial. No credit card required to
          start.
        </p>
      </div>
    </section>
  );
}
