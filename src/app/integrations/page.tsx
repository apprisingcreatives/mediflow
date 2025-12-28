"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Activity, ArrowLeft, Plug, Stethoscope, Calendar, FileText, CreditCard, MessageSquare, BarChart3, Shield } from "lucide-react";

const integrations = [
  {
    name: "Epic Systems",
    description: "Seamlessly sync patient records with Epic EHR for unified healthcare data.",
    icon: Stethoscope,
    category: "EHR",
  },
  {
    name: "Cerner",
    description: "Two-way integration with Cerner for real-time patient data synchronization.",
    icon: Stethoscope,
    category: "EHR",
  },
  {
    name: "Google Calendar",
    description: "Sync appointments with Google Calendar for easy scheduling management.",
    icon: Calendar,
    category: "Scheduling",
  },
  {
    name: "Microsoft 365",
    description: "Connect with Outlook and Microsoft Teams for seamless communication.",
    icon: Calendar,
    category: "Scheduling",
  },
  {
    name: "Stripe",
    description: "Process payments securely with Stripe's payment infrastructure.",
    icon: CreditCard,
    category: "Payments",
  },
  {
    name: "Twilio",
    description: "Send SMS reminders and notifications to patients automatically.",
    icon: MessageSquare,
    category: "Communication",
  },
  {
    name: "QuickBooks",
    description: "Sync financial data with QuickBooks for streamlined accounting.",
    icon: BarChart3,
    category: "Finance",
  },
  {
    name: "DocuSign",
    description: "Enable digital signatures for consent forms and documents.",
    icon: FileText,
    category: "Documents",
  },
];

export default function IntegrationsPage() {
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
              <Plug className="w-4 h-4" />
              Integrations
            </div>
            <h1 className="font-display text-4xl sm:text-5xl font-bold text-clinic-navy dark:text-white mb-4">
              Connect Your Tools
            </h1>
            <p className="text-lg text-clinic-text/70 dark:text-white/70 max-w-2xl mx-auto">
              MediFlow integrates with your existing healthcare systems and tools for a seamless workflow.
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            {integrations.map((integration) => (
              <div
                key={integration.name}
                className="p-6 bg-white dark:bg-slate-800 rounded-2xl shadow-glass hover:shadow-glass-lg transition-all"
              >
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-xl bg-clinic-teal/10 flex items-center justify-center flex-shrink-0">
                    <integration.icon className="w-6 h-6 text-clinic-teal" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-display font-semibold text-clinic-navy dark:text-white">
                        {integration.name}
                      </h3>
                      <span className="text-xs px-2 py-0.5 bg-clinic-navy/5 dark:bg-white/10 rounded-full text-clinic-text/60 dark:text-white/60">
                        {integration.category}
                      </span>
                    </div>
                    <p className="text-sm text-clinic-text/60 dark:text-white/60">
                      {integration.description}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-12 text-center p-8 bg-gradient-to-br from-clinic-navy to-clinic-navy/90 rounded-2xl text-white">
            <h2 className="font-display text-2xl font-bold mb-4">
              Need a Custom Integration?
            </h2>
            <p className="text-white/70 mb-6">
              Our team can build custom integrations for your specific needs.
            </p>
            <Button className="bg-clinic-teal hover:bg-clinic-teal/90 text-white" asChild>
              <Link href="/demo">Contact Us</Link>
            </Button>
          </div>
        </div>
      </main>
    </div>
  );
}
