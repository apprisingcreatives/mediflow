import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  Activity,
  ArrowLeft,
  ArrowRight,
  Check,
  CalendarCheck,
  Sparkles,
} from "lucide-react";
import type { Metadata } from "next";
import type { LucideIcon } from "lucide-react";

export interface NichePageProps {
  specialty: string;
  headline: string;
  subheadline: string;
  painPoints: string[];
  features: { title: string; description: string }[];
  testimonial: {
    quote: string;
    author: string;
    role: string;
    clinic: string;
  };
  faq: { q: string; a: string }[];
}

export function NicheLandingPage({
  specialty,
  headline,
  subheadline,
  painPoints,
  features,
  testimonial,
  faq,
}: NichePageProps) {
  return (
    <div className="min-h-screen bg-clinic-bg dark:bg-slate-900">
      {/* Header */}
      <header className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-lg border-b border-clinic-navy/5 dark:border-white/5">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between h-16">
            <Link href="/" className="flex items-center gap-2">
              <div className="w-10 h-10 flex items-center justify-center rounded-xl bg-gradient-to-br from-clinic-navy to-clinic-teal">
                <Activity className="w-5 h-5 text-white" />
              </div>
              <span className="text-xl font-display font-bold text-clinic-navy dark:text-white">
                MediFlow
              </span>
            </Link>
            <div className="flex items-center gap-3">
              <Button
                variant="ghost"
                className="text-clinic-navy dark:text-white"
                asChild
              >
                <Link href="/">
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Home
                </Link>
              </Button>
              <Button
                className="bg-clinic-teal hover:bg-clinic-teal/90 text-white"
                asChild
              >
                <Link href="/register">Start Free Trial</Link>
              </Button>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-16">
        <div className="max-w-4xl mx-auto">
          {/* Hero */}
          <div className="text-center mb-16">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-clinic-teal/10 rounded-full text-clinic-teal text-sm font-medium mb-4">
              <Sparkles className="w-4 h-4" />
              {specialty} Software
            </div>
            <h1 className="font-display text-4xl sm:text-5xl font-bold text-clinic-navy dark:text-white mb-6 leading-tight">
              {headline}
            </h1>
            <p className="text-lg text-clinic-text/70 dark:text-white/70 max-w-2xl mx-auto mb-8">
              {subheadline}
            </p>
            <div className="flex flex-wrap items-center justify-center gap-4">
              <Button
                size="lg"
                className="bg-clinic-teal hover:bg-clinic-teal/90 text-white px-8 h-14 text-base shadow-glow group"
                asChild
              >
                <Link href="/register">
                  Start Free Trial
                  <ArrowRight className="ml-2 w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </Link>
              </Button>
              <Button
                size="lg"
                variant="outline"
                className="border-clinic-navy/20 text-clinic-navy dark:text-white px-8 h-14 text-base"
                asChild
              >
                <Link href="/demo">
                  <CalendarCheck className="mr-2 w-4 h-4" />
                  Book Live Demo
                </Link>
              </Button>
            </div>
          </div>

          {/* Pain Points */}
          <div className="mb-16">
            <h2 className="font-display text-2xl font-bold text-clinic-navy dark:text-white mb-6 text-center">
              Common Challenges for {specialty} Clinics
            </h2>
            <div className="grid sm:grid-cols-2 gap-4">
              {painPoints.map((point) => (
                <div
                  key={point}
                  className="flex items-start gap-3 p-4 bg-white dark:bg-slate-800 rounded-xl shadow-glass"
                >
                  <div className="w-6 h-6 rounded-full bg-rose-100 dark:bg-rose-900/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <span className="text-rose-500 text-xs font-bold">!</span>
                  </div>
                  <p className="text-sm text-clinic-text/80 dark:text-white/80">
                    {point}
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* Features */}
          <div className="mb-16">
            <h2 className="font-display text-2xl font-bold text-clinic-navy dark:text-white mb-8 text-center">
              How MediFlow Solves These for {specialty} Practices
            </h2>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {features.map((feature) => (
                <div
                  key={feature.title}
                  className="p-6 bg-white dark:bg-slate-800 rounded-2xl shadow-glass"
                >
                  <div className="w-10 h-10 rounded-lg bg-clinic-teal/10 flex items-center justify-center mb-4">
                    <Check className="w-5 h-5 text-clinic-teal" />
                  </div>
                  <h3 className="font-display font-semibold text-clinic-navy dark:text-white mb-2">
                    {feature.title}
                  </h3>
                  <p className="text-sm text-clinic-text/60 dark:text-white/60">
                    {feature.description}
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* Testimonial */}
          <div className="mb-16 p-8 bg-gradient-to-br from-clinic-navy to-clinic-navy/90 rounded-2xl text-white">
            <blockquote className="text-lg leading-relaxed italic mb-6">
              &quot;{testimonial.quote}&quot;
            </blockquote>
            <div>
              <p className="font-semibold">{testimonial.author}</p>
              <p className="text-sm text-white/70">
                {testimonial.role}, {testimonial.clinic}
              </p>
            </div>
          </div>

          {/* FAQ */}
          <div className="mb-16">
            <h2 className="font-display text-2xl font-bold text-clinic-navy dark:text-white mb-8 text-center">
              Frequently Asked Questions
            </h2>
            <div className="space-y-4">
              {faq.map((item) => (
                <details
                  key={item.q}
                  className="group bg-white dark:bg-slate-800 rounded-xl shadow-glass p-6"
                >
                  <summary className="font-display font-semibold text-clinic-navy dark:text-white cursor-pointer list-none flex items-center justify-between">
                    {item.q}
                    <span className="text-clinic-teal group-open:rotate-180 transition-transform">
                      ▾
                    </span>
                  </summary>
                  <p className="mt-4 text-sm text-clinic-text/70 dark:text-white/70 leading-relaxed">
                    {item.a}
                  </p>
                </details>
              ))}
            </div>
          </div>

          {/* CTA */}
          <div className="text-center p-8 bg-gradient-to-br from-clinic-teal to-clinic-ai rounded-2xl text-white">
            <h2 className="font-display text-2xl font-bold mb-4">
              Ready to Modernize Your {specialty} Clinic?
            </h2>
            <p className="text-white/80 mb-6 max-w-lg mx-auto">
              Join hundreds of clinics already using MediFlow to save time,
              reduce no-shows, and deliver better patient care.
            </p>
            <Button
              size="lg"
              className="bg-white text-clinic-navy hover:bg-white/90 px-8 h-14 text-base font-semibold group"
              asChild
            >
              <Link href="/register">
                Start Your Free Trial
                <ArrowRight className="ml-2 w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </Link>
            </Button>
          </div>
        </div>
      </main>
    </div>
  );
}
