"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Download,
  CheckCircle2,
  Loader2,
  FileText,
  ArrowRight,
} from "lucide-react";

export function LeadMagnet() {
  const [email, setEmail] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;
    setIsSubmitting(true);
    // Simulate API call — replace with actual lead capture endpoint
    await new Promise((resolve) => setTimeout(resolve, 1500));
    setIsSubmitting(false);
    setIsSubmitted(true);
  };

  return (
    <section
      id="lead-magnet"
      className="py-20 lg:py-28 bg-gradient-to-br from-clinic-navy via-clinic-navy/95 to-clinic-navy/90 relative overflow-hidden"
    >
      {/* Decorative elements */}
      <div className="absolute top-0 right-0 w-[500px] h-[500px] opacity-10">
        <div className="absolute inset-0 bg-gradient-to-br from-clinic-teal/40 to-clinic-ai/30 rounded-full blur-3xl" />
      </div>
      <div className="absolute bottom-0 left-0 w-[400px] h-[400px] opacity-10">
        <div className="absolute inset-0 bg-gradient-to-tr from-clinic-ai/30 to-transparent rounded-full blur-3xl" />
      </div>

      <div className="container mx-auto px-4 relative z-10">
        <div className="max-w-4xl mx-auto">
          <div className="grid md:grid-cols-2 gap-10 lg:gap-16 items-center">
            {/* Content */}
            <div>
              <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-white/10 rounded-full text-clinic-teal text-sm font-medium mb-6">
                <Download className="w-4 h-4" />
                Free Resource
              </div>
              <h2 className="font-display text-3xl sm:text-4xl font-bold text-white tracking-tight mb-4">
                Free Clinic Operations Checklist
              </h2>
              <p className="text-white/70 leading-relaxed mb-6">
                Download our comprehensive 25-point checklist that top-performing
                clinics use to streamline operations, reduce no-shows, and
                improve patient satisfaction scores.
              </p>
              <ul className="space-y-3 mb-8">
                {[
                  "Patient intake workflow optimization",
                  "Appointment scheduling best practices",
                  "Staff efficiency benchmarks",
                  "Revenue leakage audit checklist",
                ].map((item) => (
                  <li
                    key={item}
                    className="flex items-center gap-3 text-sm text-white/80"
                  >
                    <CheckCircle2 className="w-4 h-4 text-clinic-teal flex-shrink-0" />
                    {item}
                  </li>
                ))}
              </ul>
            </div>

            {/* Form Card */}
            <div className="bg-white/10 backdrop-blur-sm border border-white/10 rounded-2xl p-8">
              {isSubmitted ? (
                <div className="text-center py-6">
                  <div className="w-16 h-16 rounded-full bg-clinic-teal/20 flex items-center justify-center mx-auto mb-4">
                    <CheckCircle2 className="w-8 h-8 text-clinic-teal" />
                  </div>
                  <h3 className="font-display text-xl font-bold text-white mb-2">
                    Check Your Email!
                  </h3>
                  <p className="text-white/60 text-sm">
                    We&apos;ve sent the checklist to{" "}
                    <strong className="text-white">{email}</strong>. Check your
                    inbox (and spam folder, just in case).
                  </p>
                </div>
              ) : (
                <>
                  <div className="flex items-center gap-3 mb-6">
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-clinic-teal to-clinic-ai flex items-center justify-center">
                      <FileText className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <p className="font-semibold text-white text-sm">
                        Free Download
                      </p>
                      <p className="text-white/50 text-xs">
                        No credit card required
                      </p>
                    </div>
                  </div>

                  <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                      <Input
                        type="email"
                        placeholder="your@clinic-email.com"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                        disabled={isSubmitting}
                        className="h-12 bg-white/10 border-white/20 text-white placeholder:text-white/40 focus:border-clinic-teal"
                      />
                    </div>
                    <Button
                      type="submit"
                      disabled={isSubmitting || !email.trim()}
                      className="w-full h-12 bg-clinic-teal hover:bg-clinic-teal/90 text-white text-base font-semibold group"
                    >
                      {isSubmitting ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          Sending...
                        </>
                      ) : (
                        <>
                          Download Free Checklist
                          <ArrowRight className="ml-2 w-4 h-4 group-hover:translate-x-1 transition-transform" />
                        </>
                      )}
                    </Button>
                    <p className="text-[11px] text-white/40 text-center">
                      By downloading, you agree to receive occasional product
                      updates. Unsubscribe anytime.
                    </p>
                  </form>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
