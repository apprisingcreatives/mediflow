"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Activity, ArrowLeft, Book, Code, FileJson, Terminal, Webhook, Key, Database, Lock } from "lucide-react";

const docSections = [
  {
    title: "Getting Started",
    icon: Book,
    items: ["Quick Start Guide", "Authentication", "API Overview", "Rate Limits"],
  },
  {
    title: "REST API",
    icon: Code,
    items: ["Patients API", "Appointments API", "Messages API", "Analytics API"],
  },
  {
    title: "Webhooks",
    icon: Webhook,
    items: ["Event Types", "Webhook Setup", "Payload Format", "Retry Policy"],
  },
  {
    title: "SDKs",
    icon: Terminal,
    items: ["JavaScript SDK", "Python SDK", "PHP SDK", "Ruby SDK"],
  },
];

export default function DocsPage() {
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
              <FileJson className="w-4 h-4" />
              API Documentation
            </div>
            <h1 className="font-display text-4xl sm:text-5xl font-bold text-clinic-navy dark:text-white mb-4">
              Developer Docs
            </h1>
            <p className="text-lg text-clinic-text/70 dark:text-white/70 max-w-2xl mx-auto">
              Everything you need to integrate MediFlow into your applications.
            </p>
          </div>

          {/* Quick Links */}
          <div className="grid sm:grid-cols-3 gap-4 mb-12">
            <div className="p-4 bg-white dark:bg-slate-800 rounded-xl shadow-glass flex items-center gap-3">
              <Key className="w-5 h-5 text-clinic-teal" />
              <span className="text-sm font-medium text-clinic-navy dark:text-white">API Keys</span>
            </div>
            <div className="p-4 bg-white dark:bg-slate-800 rounded-xl shadow-glass flex items-center gap-3">
              <Database className="w-5 h-5 text-clinic-teal" />
              <span className="text-sm font-medium text-clinic-navy dark:text-white">Data Models</span>
            </div>
            <div className="p-4 bg-white dark:bg-slate-800 rounded-xl shadow-glass flex items-center gap-3">
              <Lock className="w-5 h-5 text-clinic-teal" />
              <span className="text-sm font-medium text-clinic-navy dark:text-white">Security</span>
            </div>
          </div>

          {/* Documentation Sections */}
          <div className="grid md:grid-cols-2 gap-6">
            {docSections.map((section) => (
              <div
                key={section.title}
                className="p-6 bg-white dark:bg-slate-800 rounded-2xl shadow-glass"
              >
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 rounded-lg bg-clinic-teal/10 flex items-center justify-center">
                    <section.icon className="w-5 h-5 text-clinic-teal" />
                  </div>
                  <h3 className="font-display font-semibold text-clinic-navy dark:text-white">
                    {section.title}
                  </h3>
                </div>
                <ul className="space-y-2">
                  {section.items.map((item) => (
                    <li key={item}>
                      <span className="text-sm text-clinic-text/60 dark:text-white/60 hover:text-clinic-teal cursor-pointer transition-colors">
                        {item}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>

          <div className="mt-12 text-center">
            <p className="text-clinic-text/60 dark:text-white/60 mb-4">
              Need help with integration?
            </p>
            <Button className="bg-clinic-teal hover:bg-clinic-teal/90 text-white" asChild>
              <Link href="/support">Contact Developer Support</Link>
            </Button>
          </div>
        </div>
      </main>
    </div>
  );
}
