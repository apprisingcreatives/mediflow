"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Activity, ArrowLeft, CheckCircle, AlertTriangle, XCircle, Clock } from "lucide-react";

const services = [
  { name: "Web Application", status: "operational", uptime: "99.99%" },
  { name: "API Services", status: "operational", uptime: "99.98%" },
  { name: "Database", status: "operational", uptime: "99.99%" },
  { name: "Authentication", status: "operational", uptime: "100%" },
  { name: "File Storage", status: "operational", uptime: "99.97%" },
  { name: "Email Services", status: "operational", uptime: "99.95%" },
];

const incidents = [
  {
    date: "Dec 10, 2024",
    title: "Scheduled Maintenance",
    description: "Brief maintenance window for database optimization. No downtime expected.",
    status: "resolved",
  },
  {
    date: "Nov 28, 2024",
    title: "API Latency Issues",
    description: "Some users experienced slower response times. Issue was resolved within 30 minutes.",
    status: "resolved",
  },
];

const getStatusIcon = (status: string) => {
  switch (status) {
    case "operational":
      return <CheckCircle className="w-5 h-5 text-green-500" />;
    case "degraded":
      return <AlertTriangle className="w-5 h-5 text-yellow-500" />;
    case "outage":
      return <XCircle className="w-5 h-5 text-red-500" />;
    default:
      return <Clock className="w-5 h-5 text-gray-500" />;
  }
};

export default function StatusPage() {
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
          <div className="text-center mb-12">
            <h1 className="font-display text-4xl sm:text-5xl font-bold text-clinic-navy dark:text-white mb-4">
              System Status
            </h1>
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-green-100 dark:bg-green-900/30 rounded-full">
              <CheckCircle className="w-5 h-5 text-green-500" />
              <span className="text-green-700 dark:text-green-400 font-medium">
                All Systems Operational
              </span>
            </div>
          </div>

          {/* Services Status */}
          <div className="mb-12">
            <h2 className="font-display text-xl font-bold text-clinic-navy dark:text-white mb-6">
              Services
            </h2>
            <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-glass overflow-hidden">
              {services.map((service, index) => (
                <div
                  key={service.name}
                  className={`p-4 flex items-center justify-between ${
                    index !== services.length - 1 ? "border-b border-clinic-navy/5 dark:border-white/5" : ""
                  }`}
                >
                  <div className="flex items-center gap-3">
                    {getStatusIcon(service.status)}
                    <span className="font-medium text-clinic-navy dark:text-white">
                      {service.name}
                    </span>
                  </div>
                  <div className="flex items-center gap-4">
                    <span className="text-sm text-clinic-text/50 dark:text-white/50">
                      {service.uptime} uptime
                    </span>
                    <span className="text-xs px-2 py-1 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 rounded-full capitalize">
                      {service.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Recent Incidents */}
          <div>
            <h2 className="font-display text-xl font-bold text-clinic-navy dark:text-white mb-6">
              Recent Incidents
            </h2>
            <div className="space-y-4">
              {incidents.map((incident) => (
                <div
                  key={incident.title}
                  className="p-6 bg-white dark:bg-slate-800 rounded-2xl shadow-glass"
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm text-clinic-text/50 dark:text-white/50">
                      {incident.date}
                    </span>
                    <span className="text-xs px-2 py-1 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 rounded-full capitalize">
                      {incident.status}
                    </span>
                  </div>
                  <h3 className="font-display font-semibold text-clinic-navy dark:text-white mb-2">
                    {incident.title}
                  </h3>
                  <p className="text-sm text-clinic-text/60 dark:text-white/60">
                    {incident.description}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
