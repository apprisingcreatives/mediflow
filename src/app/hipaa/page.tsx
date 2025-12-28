"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Activity, ArrowLeft, Shield, Lock, FileCheck, Users, Server, AlertTriangle } from "lucide-react";

const features = [
  {
    icon: Lock,
    title: "End-to-End Encryption",
    description: "All data is encrypted using 256-bit AES encryption both in transit and at rest.",
  },
  {
    icon: Shield,
    title: "Access Controls",
    description: "Role-based access controls ensure only authorized personnel can access PHI.",
  },
  {
    icon: FileCheck,
    title: "Audit Logging",
    description: "Comprehensive audit trails track all access to protected health information.",
  },
  {
    icon: Users,
    title: "Business Associate Agreements",
    description: "We sign BAAs with all covered entities to ensure HIPAA compliance.",
  },
  {
    icon: Server,
    title: "Secure Infrastructure",
    description: "Our infrastructure is hosted on HIPAA-compliant cloud providers with SOC 2 certification.",
  },
  {
    icon: AlertTriangle,
    title: "Breach Notification",
    description: "We have procedures in place for timely notification in case of any security incidents.",
  },
];

export default function HipaaPage() {
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
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-12">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-green-100 dark:bg-green-900/30 rounded-full text-green-700 dark:text-green-400 text-sm font-medium mb-4">
              <Shield className="w-4 h-4" />
              HIPAA Compliant
            </div>
            <h1 className="font-display text-4xl sm:text-5xl font-bold text-clinic-navy dark:text-white mb-4">
              HIPAA Compliance
            </h1>
            <p className="text-lg text-clinic-text/70 dark:text-white/70 max-w-2xl mx-auto">
              MediFlow is fully compliant with the Health Insurance Portability and Accountability Act (HIPAA).
              We take the security of your patients' data seriously.
            </p>
          </div>

          {/* Overview */}
          <div className="mb-12 p-8 bg-white dark:bg-slate-800 rounded-2xl shadow-glass">
            <h2 className="font-display text-xl font-bold text-clinic-navy dark:text-white mb-4">
              Our Commitment to HIPAA
            </h2>
            <p className="text-clinic-text/70 dark:text-white/70 mb-4">
              MediFlow maintains rigorous administrative, physical, and technical safeguards to protect
              the privacy and security of Protected Health Information (PHI). Our platform is designed
              from the ground up with healthcare compliance in mind.
            </p>
            <p className="text-clinic-text/70 dark:text-white/70">
              We undergo regular third-party security audits and maintain SOC 2 Type II certification
              to ensure our security practices meet the highest industry standards.
            </p>
          </div>

          {/* Security Features */}
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
            {features.map((feature) => (
              <div
                key={feature.title}
                className="p-6 bg-white dark:bg-slate-800 rounded-2xl shadow-glass"
              >
                <div className="w-12 h-12 rounded-xl bg-clinic-teal/10 flex items-center justify-center mb-4">
                  <feature.icon className="w-6 h-6 text-clinic-teal" />
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

          {/* CTA */}
          <div className="text-center p-8 bg-gradient-to-br from-clinic-navy to-clinic-navy/90 rounded-2xl text-white">
            <h2 className="font-display text-2xl font-bold mb-4">
              Have Questions About Compliance?
            </h2>
            <p className="text-white/70 mb-6">
              Our security team is happy to discuss our HIPAA compliance measures in detail.
            </p>
            <Button className="bg-clinic-teal hover:bg-clinic-teal/90 text-white" asChild>
              <Link href="/support">Contact Security Team</Link>
            </Button>
          </div>
        </div>
      </main>
    </div>
  );
}
