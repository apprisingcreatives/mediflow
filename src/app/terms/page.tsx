"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Activity, ArrowLeft } from "lucide-react";

export default function TermsPage() {
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
            <Button variant="ghost" className="text-clinic-navy dark:text-white" asChild>
              <Link href="/">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Home
              </Link>
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-16">
        <div className="max-w-3xl mx-auto">
          <h1 className="font-display text-4xl font-bold text-clinic-navy dark:text-white mb-4">
            Terms of Service
          </h1>
          <p className="text-clinic-text/60 dark:text-white/60 mb-8">
            Last updated: December 2024
          </p>

          <div className="prose prose-lg dark:prose-invert max-w-none">
            <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-glass p-8 space-y-8">
              <section>
                <h2 className="font-display text-xl font-bold text-clinic-navy dark:text-white mb-4">
                  1. Acceptance of Terms
                </h2>
                <p className="text-clinic-text/70 dark:text-white/70">
                  By accessing or using MediFlow services, you agree to be bound by these Terms of
                  Service. If you do not agree to these terms, please do not use our services.
                </p>
              </section>

              <section>
                <h2 className="font-display text-xl font-bold text-clinic-navy dark:text-white mb-4">
                  2. Description of Service
                </h2>
                <p className="text-clinic-text/70 dark:text-white/70">
                  MediFlow provides healthcare management software including patient intake, scheduling,
                  messaging, and analytics tools. Our AI-powered features are designed to assist, not
                  replace, medical professionals.
                </p>
              </section>

              <section>
                <h2 className="font-display text-xl font-bold text-clinic-navy dark:text-white mb-4">
                  3. User Accounts
                </h2>
                <p className="text-clinic-text/70 dark:text-white/70">
                  You are responsible for maintaining the confidentiality of your account credentials
                  and for all activities that occur under your account. You must notify us immediately
                  of any unauthorized use.
                </p>
              </section>

              <section>
                <h2 className="font-display text-xl font-bold text-clinic-navy dark:text-white mb-4">
                  4. Acceptable Use
                </h2>
                <p className="text-clinic-text/70 dark:text-white/70">
                  You agree to use our services only for lawful purposes and in accordance with these
                  Terms. You may not use our services to violate any applicable laws, infringe on
                  intellectual property rights, or transmit harmful content.
                </p>
              </section>

              <section>
                <h2 className="font-display text-xl font-bold text-clinic-navy dark:text-white mb-4">
                  5. Payment Terms
                </h2>
                <p className="text-clinic-text/70 dark:text-white/70">
                  Subscription fees are billed monthly or annually as selected. All fees are non-refundable
                  unless otherwise stated. We reserve the right to change pricing with 30 days notice.
                </p>
              </section>

              <section>
                <h2 className="font-display text-xl font-bold text-clinic-navy dark:text-white mb-4">
                  6. Intellectual Property
                </h2>
                <p className="text-clinic-text/70 dark:text-white/70">
                  MediFlow and its content, features, and functionality are owned by us and are protected
                  by international copyright, trademark, and other intellectual property laws.
                </p>
              </section>

              <section>
                <h2 className="font-display text-xl font-bold text-clinic-navy dark:text-white mb-4">
                  7. Limitation of Liability
                </h2>
                <p className="text-clinic-text/70 dark:text-white/70">
                  MediFlow shall not be liable for any indirect, incidental, special, consequential,
                  or punitive damages resulting from your use of or inability to use the service.
                </p>
              </section>

              <section>
                <h2 className="font-display text-xl font-bold text-clinic-navy dark:text-white mb-4">
                  8. Contact Information
                </h2>
                <p className="text-clinic-text/70 dark:text-white/70">
                  For questions about these Terms, please contact us at{" "}
                  <a href="mailto:info@apprisingcreatives.com" className="text-clinic-teal hover:underline">
                    info@apprisingcreatives.com
                  </a>
                </p>
              </section>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
