"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Activity, ArrowLeft, MapPin, Clock, Briefcase, ArrowRight } from "lucide-react";

const positions = [
  {
    title: "Senior Full-Stack Engineer",
    department: "Engineering",
    location: "Remote",
    type: "Full-time",
  },
  {
    title: "Product Designer",
    department: "Design",
    location: "Remote",
    type: "Full-time",
  },
  {
    title: "Healthcare Solutions Consultant",
    department: "Sales",
    location: "Manila, PH",
    type: "Full-time",
  },
  {
    title: "Customer Success Manager",
    department: "Customer Success",
    location: "Remote",
    type: "Full-time",
  },
  {
    title: "DevOps Engineer",
    department: "Engineering",
    location: "Remote",
    type: "Full-time",
  },
  {
    title: "Marketing Manager",
    department: "Marketing",
    location: "Manila, PH",
    type: "Full-time",
  },
];

const benefits = [
  "Competitive salary and equity",
  "Remote-first culture",
  "Health and dental insurance",
  "Unlimited PTO",
  "Learning and development budget",
  "Home office stipend",
  "Team retreats",
  "Wellness programs",
];

export default function CareersPage() {
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
              Join Our Team
            </h1>
            <p className="text-lg text-clinic-text/70 dark:text-white/70 max-w-2xl mx-auto">
              Help us build the future of healthcare technology. We're looking for passionate
              people who want to make a difference.
            </p>
          </div>

          {/* Benefits */}
          <div className="mb-16 p-8 bg-white dark:bg-slate-800 rounded-2xl shadow-glass">
            <h2 className="font-display text-xl font-bold text-clinic-navy dark:text-white mb-6">
              Why Work at MediFlow?
            </h2>
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {benefits.map((benefit) => (
                <div
                  key={benefit}
                  className="flex items-center gap-2 text-sm text-clinic-text/70 dark:text-white/70"
                >
                  <div className="w-2 h-2 rounded-full bg-clinic-teal flex-shrink-0" />
                  {benefit}
                </div>
              ))}
            </div>
          </div>

          {/* Open Positions */}
          <div>
            <h2 className="font-display text-2xl font-bold text-clinic-navy dark:text-white mb-6">
              Open Positions
            </h2>
            <div className="space-y-4">
              {positions.map((position) => (
                <div
                  key={position.title}
                  className="p-6 bg-white dark:bg-slate-800 rounded-2xl shadow-glass hover:shadow-glass-lg transition-all group cursor-pointer"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                      <h3 className="font-display font-semibold text-clinic-navy dark:text-white mb-2 group-hover:text-clinic-teal transition-colors">
                        {position.title}
                      </h3>
                      <div className="flex flex-wrap gap-4 text-sm text-clinic-text/60 dark:text-white/60">
                        <span className="flex items-center gap-1">
                          <Briefcase className="w-4 h-4" />
                          {position.department}
                        </span>
                        <span className="flex items-center gap-1">
                          <MapPin className="w-4 h-4" />
                          {position.location}
                        </span>
                        <span className="flex items-center gap-1">
                          <Clock className="w-4 h-4" />
                          {position.type}
                        </span>
                      </div>
                    </div>
                    <ArrowRight className="w-5 h-5 text-clinic-text/40 group-hover:text-clinic-teal group-hover:translate-x-1 transition-all" />
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="mt-12 text-center">
            <p className="text-clinic-text/60 dark:text-white/60 mb-4">
              Don't see a role that fits? We're always looking for talented people.
            </p>
            <Button className="bg-clinic-teal hover:bg-clinic-teal/90 text-white" asChild>
              <Link href="/demo">Get in Touch</Link>
            </Button>
          </div>
        </div>
      </main>
    </div>
  );
}
