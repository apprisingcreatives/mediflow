"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Activity, Play, ArrowRight, Shield, Clock, Users } from "lucide-react";

export default function DemoPage() {
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
                MediFlow<span className="text-clinic-teal">AI</span>
              </span>
            </Link>

            <Button
              className="bg-clinic-teal hover:bg-clinic-teal/90 text-white"
              asChild
            >
              <Link href="/register">Start Free Trial</Link>
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-16">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="text-center mb-12">
            <h1 className="font-display text-4xl sm:text-5xl font-bold text-clinic-navy dark:text-white mb-4">
              See MediFlow AI in Action
            </h1>
            <p className="text-lg text-clinic-text/70 dark:text-white/70 max-w-2xl mx-auto">
              Watch how our AI-powered platform transforms clinic operations,
              from patient intake to analytics.
            </p>
          </div>

          {/* Video Player */}
          <div className="relative aspect-video rounded-2xl overflow-hidden bg-clinic-navy shadow-glass-lg mb-12">
            <img
              src="https://images.unsplash.com/photo-1576091160550-2173dba999ef?w=1200&q=80"
              alt="MediFlow AI Demo"
              className="w-full h-full object-cover opacity-50"
            />
            <div className="absolute inset-0 flex items-center justify-center">
              <button className="w-20 h-20 rounded-full bg-white/90 hover:bg-white flex items-center justify-center shadow-glass-lg transition-all hover:scale-105 group">
                <Play className="w-8 h-8 text-clinic-navy ml-1 group-hover:scale-110 transition-transform" />
              </button>
            </div>
            <div className="absolute bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-black/60 to-transparent">
              <p className="text-white font-medium">
                Product Demo • 5 min watch
              </p>
            </div>
          </div>

          {/* Feature Highlights */}
          <div className="grid md:grid-cols-3 gap-6 mb-12">
            <div className="p-6 bg-white dark:bg-slate-800 rounded-2xl shadow-glass">
              <div className="w-12 h-12 rounded-xl bg-clinic-teal/10 flex items-center justify-center mb-4">
                <Clock className="w-6 h-6 text-clinic-teal" />
              </div>
              <h3 className="font-display font-semibold text-clinic-navy dark:text-white mb-2">
                60% Faster Intake
              </h3>
              <p className="text-sm text-clinic-text/60 dark:text-white/60">
                AI-powered forms that adapt to patient responses in real-time.
              </p>
            </div>
            <div className="p-6 bg-white dark:bg-slate-800 rounded-2xl shadow-glass">
              <div className="w-12 h-12 rounded-xl bg-clinic-ai/10 flex items-center justify-center mb-4">
                <Users className="w-6 h-6 text-clinic-ai" />
              </div>
              <h3 className="font-display font-semibold text-clinic-navy dark:text-white mb-2">
                Smart Scheduling
              </h3>
              <p className="text-sm text-clinic-text/60 dark:text-white/60">
                Reduce no-shows by 40% with intelligent appointment management.
              </p>
            </div>
            <div className="p-6 bg-white dark:bg-slate-800 rounded-2xl shadow-glass">
              <div className="w-12 h-12 rounded-xl bg-clinic-navy/10 flex items-center justify-center mb-4">
                <Shield className="w-6 h-6 text-clinic-navy dark:text-white" />
              </div>
              <h3 className="font-display font-semibold text-clinic-navy dark:text-white mb-2">
                HIPAA Compliant
              </h3>
              <p className="text-sm text-clinic-text/60 dark:text-white/60">
                Enterprise-grade security with end-to-end encryption.
              </p>
            </div>
          </div>

          {/* CTA */}
          <div className="text-center p-8 bg-gradient-to-br from-clinic-navy to-clinic-navy/90 rounded-2xl text-white">
            <h2 className="font-display text-2xl font-bold mb-4">
              Ready to Transform Your Clinic?
            </h2>
            <p className="text-white/70 mb-6">
              Start your 14-day free trial today. No credit card required.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Button
                size="lg"
                className="bg-clinic-teal hover:bg-clinic-teal/90 text-white group"
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
                className="border-white/20 text-white hover:bg-white/10"
                asChild
              >
                <Link href="/book">Book a Demo Call</Link>
              </Button>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
