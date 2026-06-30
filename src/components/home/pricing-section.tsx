"use client";

import { useRef, useEffect, useState } from "react";
import Link from "next/link";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Check, Sparkles, Building2, Rocket, ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";
import type { ElementType } from "react";

if (typeof window !== "undefined") {
  gsap.registerPlugin(ScrollTrigger);
}

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface ApiPlan {
  id: string;
  name: string;
  slug: string;
  price: number;
  currency: string;
  billing_cycle: string;
  description: string;
  features: string[];
  max_practitioners: number | null;
  max_patients: number | null;
  is_active: boolean;
  sort_order: number;
}

interface DisplayPlan {
  name: string;
  description: string;
  price: string;
  period: string;
  icon: ElementType;
  features: string[];
  cta: string;
  href: string;
  highlighted: boolean;
  badge?: string;
  isEnterprise: boolean;
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const ICON_MAP: Record<string, ElementType> = {
  starter: Rocket,
  professional: Sparkles,
  enterprise: Building2,
};

const FALLBACK_PLANS: DisplayPlan[] = [
  {
    name: "Starter",
    description: "Perfect for small clinics getting started.",
    price: "₱5,000",
    period: "/month",
    icon: Rocket,
    features: [
      "Up to 3 practitioners",
      "Up to 500 patients",
      "1 location",
      "AI-powered intake forms",
      "Basic appointment scheduling",
      "Patient Records (EMR)",
      "Reporting Dashboard",
      "Email support",
    ],
    cta: "Start Free Trial",
    href: "/clinic/register",
    highlighted: false,
    isEnterprise: false,
  },
  {
    name: "Professional",
    description: "For growing clinics with advanced AI features.",
    price: "₱10,000",
    period: "/month",
    icon: Sparkles,
    features: [
      "Up to 5 practitioners per branch",
      "Up to 2,000 patients",
      "Up to 3 branches",
      "Advanced AI features",
      "Smart scheduling & reminders",
      "Analytics dashboard",
      "Secure messaging",
      "Priority support",
    ],
    cta: "Start Free Trial",
    href: "/clinic/register",
    highlighted: true,
    badge: "Recommended",
    isEnterprise: false,
  },
  {
    name: "Enterprise",
    description: "For large clinics and multi-location practices.",
    price: "₱25,000",
    period: "/month",
    icon: Building2,
    features: [
      "Unlimited practitioners",
      "Unlimited patients",
      "Unlimited branches",
      "Full AI suite",
      "Custom integrations & API",
      "Dedicated support",
      "Advanced analytics",
      "Multi-location management",
    ],
    cta: "Contact Sales",
    href: "tel:+639204786075",
    highlighted: false,
    isEnterprise: true,
  },
];

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function resolveIcon(slug: string): ElementType {
  return ICON_MAP[slug] ?? Rocket;
}

function formatPrice(price: number, slug: string): string {
  if (slug === "enterprise" && price === 0) return "Custom";
  return `₱${price.toLocaleString()}`;
}

function mapApiPlans(apiPlans: ApiPlan[], cycle: "monthly" | "yearly"): DisplayPlan[] {
  const filtered = apiPlans
    .filter((p) => p.is_active && p.billing_cycle === cycle)
    .sort((a, b) => a.sort_order - b.sort_order);

  if (filtered.length === 0) return [];

  // Determine which plan gets "highlighted". Prefer slug containing "professional",
  // otherwise fall back to the middle plan by sort_order.
  const professionalIdx = filtered.findIndex((p) => p.slug.includes("professional"));
  const highlightedIdx = professionalIdx !== -1 ? professionalIdx : Math.floor(filtered.length / 2);

  return filtered.map((plan, idx) => ({
    name: plan.name,
    description: plan.description,
    price: formatPrice(plan.price, plan.slug),
    period: plan.slug === "enterprise" && plan.price === 0 ? "" : `/${plan.billing_cycle}`,
    icon: resolveIcon(plan.slug),
    features: plan.features,
    cta: plan.slug === "enterprise" ? "Contact Sales" : "Start Free Trial",
    href: plan.slug === "enterprise" ? "tel:+639204786075" : "/clinic/register",
    highlighted: idx === highlightedIdx,
    badge: idx === highlightedIdx ? "Recommended" : undefined,
    isEnterprise: plan.slug === "enterprise",
  }));
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function PricingSection() {
  const sectionRef = useRef<HTMLElement>(null);
  const headerRef = useRef<HTMLDivElement>(null);
  const cardsRef = useRef<HTMLDivElement>(null);

  const [plans, setPlans] = useState<DisplayPlan[]>(FALLBACK_PLANS);
  const [cycle, setCycle] = useState<"monthly" | "yearly">("monthly");
  const [apiPlans, setApiPlans] = useState<ApiPlan[] | null>(null);
  const [hasYearly, setHasYearly] = useState(false);

  // Fetch once on mount; keep fallback until data arrives.
  useEffect(() => {
    let cancelled = false;

    fetch("/api/subscription-plans")
      .then((res) => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return res.json() as Promise<{ plans: ApiPlan[] }>;
      })
      .then(({ plans: raw }) => {
        if (cancelled || !raw || raw.length === 0) return;
        const yearly = raw.some((p) => p.is_active && p.billing_cycle === "yearly");
        const monthly = mapApiPlans(raw, "monthly");
        if (!cancelled) {
          setApiPlans(raw);
          setHasYearly(yearly);
          if (monthly.length > 0) setPlans(monthly);
        }
      })
      .catch(() => {
        // Silently keep fallback plans — no error state needed on the landing page.
      });

    return () => {
      cancelled = true;
    };
  }, []);

  // Re-derive display plans whenever the billing cycle toggle changes.
  useEffect(() => {
    if (!apiPlans) return;
    const derived = mapApiPlans(apiPlans, cycle);
    if (derived.length > 0) setPlans(derived);
  }, [cycle, apiPlans]);

  // GSAP animations — unchanged from original.
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

          {/* Monthly / Yearly toggle — only rendered when the API returns yearly plans */}
          {hasYearly && (
            <div className="inline-flex items-center gap-1 mt-8 p-1 bg-white dark:bg-slate-800 rounded-full shadow-sm border border-slate-200 dark:border-slate-700">
              <button
                onClick={() => setCycle("monthly")}
                className={cn(
                  "px-5 py-2 rounded-full text-sm font-medium transition-all duration-200",
                  cycle === "monthly"
                    ? "bg-clinic-navy text-white shadow-sm"
                    : "text-clinic-text/70 dark:text-white/60 hover:text-clinic-navy dark:hover:text-white"
                )}
              >
                Monthly
              </button>
              <button
                onClick={() => setCycle("yearly")}
                className={cn(
                  "px-5 py-2 rounded-full text-sm font-medium transition-all duration-200",
                  cycle === "yearly"
                    ? "bg-clinic-navy text-white shadow-sm"
                    : "text-clinic-text/70 dark:text-white/60 hover:text-clinic-navy dark:hover:text-white"
                )}
              >
                Yearly
                <span className="ml-1.5 text-xs text-clinic-teal font-semibold">
                  Save 20%
                </span>
              </button>
            </div>
          )}
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
                {plan.isEnterprise ? (
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
