"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Activity, ArrowLeft } from "lucide-react";

export default function PrivacyPage() {
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
            Privacy Policy
          </h1>
          <p className="text-clinic-text/60 dark:text-white/60 mb-8">
            Last updated: December 2024
          </p>

          <div className="prose prose-lg dark:prose-invert max-w-none">
            <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-glass p-8 space-y-8">
              <section>
                <h2 className="font-display text-xl font-bold text-clinic-navy dark:text-white mb-4">
                  1. Information We Collect
                </h2>
                <p className="text-clinic-text/70 dark:text-white/70">
                  We collect information you provide directly to us, including name, email address,
                  phone number, and any other information you choose to provide. For healthcare
                  providers, we also collect clinic information and practice details.
                </p>
              </section>

              <section>
                <h2 className="font-display text-xl font-bold text-clinic-navy dark:text-white mb-4">
                  2. How We Use Your Information
                </h2>
                <p className="text-clinic-text/70 dark:text-white/70">
                  We use the information we collect to provide, maintain, and improve our services,
                  process transactions, send communications, and comply with legal obligations.
                </p>
              </section>

              <section>
                <h2 className="font-display text-xl font-bold text-clinic-navy dark:text-white mb-4">
                  3. Data Security
                </h2>
                <p className="text-clinic-text/70 dark:text-white/70">
                  We implement industry-standard security measures including end-to-end encryption,
                  secure data storage, and regular security audits. All data is encrypted in transit
                  and at rest using 256-bit SSL encryption.
                </p>
              </section>

              <section>
                <h2 className="font-display text-xl font-bold text-clinic-navy dark:text-white mb-4">
                  4. HIPAA Compliance
                </h2>
                <p className="text-clinic-text/70 dark:text-white/70">
                  MediFlow is fully HIPAA compliant. We maintain appropriate administrative, physical,
                  and technical safeguards to protect the privacy and security of protected health
                  information (PHI).
                </p>
              </section>

              <section>
                <h2 className="font-display text-xl font-bold text-clinic-navy dark:text-white mb-4">
                  5. Data Retention
                </h2>
                <p className="text-clinic-text/70 dark:text-white/70">
                  We retain your information for as long as your account is active or as needed to
                  provide services. We will also retain and use information as necessary to comply
                  with legal obligations and resolve disputes.
                </p>
              </section>

              <section>
                <h2 className="font-display text-xl font-bold text-clinic-navy dark:text-white mb-4">
                  6. Your Rights
                </h2>
                <p className="text-clinic-text/70 dark:text-white/70">
                  You have the right to access, correct, or delete your personal information. You may
                  also request a copy of your data or restrict certain processing activities. Contact
                  us at info@apprisingcreatives.com to exercise these rights.
                </p>
              </section>

              <section>
                <h2 className="font-display text-xl font-bold text-clinic-navy dark:text-white mb-4">
                  7. Contact Us
                </h2>
                <p className="text-clinic-text/70 dark:text-white/70">
                  If you have any questions about this Privacy Policy, please contact us at{" "}
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
