"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Activity, ArrowLeft, Shield, Lock, Key, Server, Eye, RefreshCcw, CheckCircle } from "lucide-react";

const securityFeatures = [
  {
    icon: Lock,
    title: "256-bit SSL Encryption",
    description: "All data transmitted between your browser and our servers is encrypted using industry-standard TLS 1.3.",
  },
  {
    icon: Key,
    title: "Two-Factor Authentication",
    description: "Add an extra layer of security to your account with SMS or authenticator app verification.",
  },
  {
    icon: Server,
    title: "Secure Data Centers",
    description: "Our infrastructure is hosted in SOC 2 Type II certified data centers with 24/7 monitoring.",
  },
  {
    icon: Eye,
    title: "Privacy by Design",
    description: "We follow privacy-by-design principles, minimizing data collection and maximizing user control.",
  },
  {
    icon: RefreshCcw,
    title: "Regular Security Audits",
    description: "We conduct quarterly penetration testing and annual third-party security assessments.",
  },
  {
    icon: Shield,
    title: "Incident Response",
    description: "Our security team has established procedures for rapid response to any security incidents.",
  },
];

const certifications = [
  { name: "HIPAA Compliant", description: "Healthcare data protection" },
  { name: "SOC 2 Type II", description: "Security & availability controls" },
  { name: "GDPR Ready", description: "EU data protection standards" },
  { name: "ISO 27001", description: "Information security management" },
];

export default function SecurityPage() {
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
            <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-clinic-navy/10 dark:bg-white/10 rounded-full text-clinic-navy dark:text-white text-sm font-medium mb-4">
              <Lock className="w-4 h-4" />
              Enterprise Security
            </div>
            <h1 className="font-display text-4xl sm:text-5xl font-bold text-clinic-navy dark:text-white mb-4">
              Security at MediFlow
            </h1>
            <p className="text-lg text-clinic-text/70 dark:text-white/70 max-w-2xl mx-auto">
              We implement industry-leading security practices to protect your data and your patients' information.
            </p>
          </div>

          {/* Certifications */}
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-12">
            {certifications.map((cert) => (
              <div
                key={cert.name}
                className="p-4 bg-white dark:bg-slate-800 rounded-xl shadow-glass text-center"
              >
                <CheckCircle className="w-8 h-8 text-clinic-teal mx-auto mb-2" />
                <h3 className="font-display font-semibold text-clinic-navy dark:text-white text-sm">
                  {cert.name}
                </h3>
                <p className="text-xs text-clinic-text/60 dark:text-white/60">
                  {cert.description}
                </p>
              </div>
            ))}
          </div>

          {/* Security Features */}
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
            {securityFeatures.map((feature) => (
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

          {/* Security Practices */}
          <div className="mb-12 p-8 bg-white dark:bg-slate-800 rounded-2xl shadow-glass">
            <h2 className="font-display text-xl font-bold text-clinic-navy dark:text-white mb-4">
              Our Security Practices
            </h2>
            <ul className="space-y-3 text-clinic-text/70 dark:text-white/70">
              <li className="flex items-start gap-2">
                <CheckCircle className="w-5 h-5 text-clinic-teal mt-0.5 flex-shrink-0" />
                <span>All employees undergo security training and background checks</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle className="w-5 h-5 text-clinic-teal mt-0.5 flex-shrink-0" />
                <span>Access to production systems is limited and logged</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle className="w-5 h-5 text-clinic-teal mt-0.5 flex-shrink-0" />
                <span>We maintain a bug bounty program for security researchers</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle className="w-5 h-5 text-clinic-teal mt-0.5 flex-shrink-0" />
                <span>Data is backed up daily with geo-redundant storage</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle className="w-5 h-5 text-clinic-teal mt-0.5 flex-shrink-0" />
                <span>We conduct regular disaster recovery testing</span>
              </li>
            </ul>
          </div>

          {/* CTA */}
          <div className="text-center p-8 bg-gradient-to-br from-clinic-navy to-clinic-navy/90 rounded-2xl text-white">
            <h2 className="font-display text-2xl font-bold mb-4">
              Questions About Security?
            </h2>
            <p className="text-white/70 mb-6">
              Our security team is available to answer your questions and provide detailed documentation.
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
