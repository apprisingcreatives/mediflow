"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Activity, ArrowLeft, Download, ExternalLink, Mail } from "lucide-react";

const pressReleases = [
  {
    title: "MediFlow Raises $25M Series B to Expand AI Healthcare Platform",
    date: "December 2024",
    outlet: "TechCrunch",
  },
  {
    title: "MediFlow Named Top Healthcare Startup to Watch in 2024",
    date: "November 2024",
    outlet: "Forbes",
  },
  {
    title: "MediFlow Partners with Major Hospital Network for AI Integration",
    date: "October 2024",
    outlet: "Healthcare IT News",
  },
  {
    title: "MediFlow Launches Advanced Analytics Dashboard for Clinics",
    date: "September 2024",
    outlet: "Company Announcement",
  },
];

export default function PressPage() {
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
            <h1 className="font-display text-4xl sm:text-5xl font-bold text-clinic-navy dark:text-white mb-4">
              Press Kit
            </h1>
            <p className="text-lg text-clinic-text/70 dark:text-white/70 max-w-2xl mx-auto">
              Resources and information for media coverage of MediFlow.
            </p>
          </div>

          {/* Brand Assets */}
          <div className="mb-12 p-8 bg-white dark:bg-slate-800 rounded-2xl shadow-glass">
            <h2 className="font-display text-xl font-bold text-clinic-navy dark:text-white mb-6">
              Brand Assets
            </h2>
            <div className="grid sm:grid-cols-2 gap-4">
              <div className="p-4 border border-clinic-navy/10 dark:border-white/10 rounded-xl">
                <div className="aspect-video bg-clinic-navy rounded-lg flex items-center justify-center mb-4">
                  <div className="flex items-center gap-2">
                    <div className="w-10 h-10 flex items-center justify-center rounded-xl bg-gradient-to-br from-clinic-teal to-clinic-ai">
                      <Activity className="w-5 h-5 text-white" />
                    </div>
                    <span className="text-xl font-display font-bold text-white">
                      MediFlow
                    </span>
                  </div>
                </div>
                <Button variant="outline" className="w-full" size="sm">
                  <Download className="w-4 h-4 mr-2" />
                  Download Logo Pack
                </Button>
              </div>
              <div className="p-4 border border-clinic-navy/10 dark:border-white/10 rounded-xl">
                <div className="aspect-video bg-gradient-to-br from-clinic-navy via-clinic-teal to-clinic-ai rounded-lg mb-4" />
                <Button variant="outline" className="w-full" size="sm">
                  <Download className="w-4 h-4 mr-2" />
                  Download Brand Guidelines
                </Button>
              </div>
            </div>
          </div>

          {/* Press Releases */}
          <div className="mb-12">
            <h2 className="font-display text-xl font-bold text-clinic-navy dark:text-white mb-6">
              Recent Press
            </h2>
            <div className="space-y-4">
              {pressReleases.map((release) => (
                <div
                  key={release.title}
                  className="p-6 bg-white dark:bg-slate-800 rounded-2xl shadow-glass hover:shadow-glass-lg transition-all cursor-pointer group flex items-center justify-between"
                >
                  <div>
                    <p className="text-sm text-clinic-text/50 dark:text-white/50 mb-1">
                      {release.date} • {release.outlet}
                    </p>
                    <h3 className="font-display font-semibold text-clinic-navy dark:text-white group-hover:text-clinic-teal transition-colors">
                      {release.title}
                    </h3>
                  </div>
                  <ExternalLink className="w-5 h-5 text-clinic-text/40 group-hover:text-clinic-teal transition-colors flex-shrink-0" />
                </div>
              ))}
            </div>
          </div>

          {/* Contact */}
          <div className="text-center p-8 bg-gradient-to-br from-clinic-navy to-clinic-navy/90 rounded-2xl text-white">
            <h2 className="font-display text-2xl font-bold mb-4">
              Media Inquiries
            </h2>
            <p className="text-white/70 mb-6">
              For press inquiries, interviews, or additional information, please contact our PR team.
            </p>
            <Button className="bg-clinic-teal hover:bg-clinic-teal/90 text-white" asChild>
              <a href="mailto:info@apprisingcreatives.com">
                <Mail className="w-4 h-4 mr-2" />
                Contact PR Team
              </a>
            </Button>
          </div>
        </div>
      </main>
    </div>
  );
}
