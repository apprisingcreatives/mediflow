"use client";

import React from 'react';
import { Check, X, ShieldAlert, AlertCircle } from 'lucide-react';

const comparisonData = [
  {
    feature: 'Online 24/7 Booking',
    mediflow: { status: 'yes', text: 'Self-service patient portal' },
    paper: { status: 'no', text: 'Impossible' },
    excel: { status: 'no', text: 'Impossible' },
    social: { status: 'partial', text: 'Manual staff replies' },
  },
  {
    feature: 'Automated Reminders (SMS/Email)',
    mediflow: { status: 'yes', text: 'Multi-step automated alerts' },
    paper: { status: 'no', text: 'None' },
    excel: { status: 'no', text: 'None' },
    social: { status: 'partial', text: 'Manual typing required' },
  },
  {
    feature: 'AI Consultation Summaries',
    mediflow: { status: 'yes', text: 'Auto-generates charts & logs' },
    paper: { status: 'no', text: 'Manual handwriting' },
    excel: { status: 'no', text: 'Manual data entry' },
    social: { status: 'no', text: 'None' },
  },
  {
    feature: 'HIPAA Data Compliance',
    mediflow: { status: 'yes', text: 'Full encryption & access logs' },
    paper: { status: 'no', text: 'Physical risk of loss/theft' },
    excel: { status: 'no', text: 'Unsecured local files' },
    social: { status: 'no', text: 'Violates patient privacy' },
  },
  {
    feature: 'Revenue & Analytics Reports',
    mediflow: { status: 'yes', text: 'Real-time operational dashboards' },
    paper: { status: 'no', text: 'Requires manual accounting' },
    excel: { status: 'partial', text: 'Requires advanced formulas' },
    social: { status: 'no', text: 'None' },
  },
  {
    feature: 'Smart Intake Forms',
    mediflow: { status: 'yes', text: 'Pre-fills records before arrival' },
    paper: { status: 'no', text: 'Paper clipboards in waiting room' },
    excel: { status: 'no', text: 'None' },
    social: { status: 'no', text: 'Manual copy-paste' },
  },
];

export function ComparisonSection() {
  return (
    <section id="comparison" className="py-20 lg:py-32 bg-clinic-bg dark:bg-slate-900 border-b border-clinic-navy/5 dark:border-white/5">
      <div className="container mx-auto px-4">
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-16">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-clinic-navy/10 dark:bg-white/10 rounded-full text-clinic-navy dark:text-white text-sm font-medium mb-4">
            <AlertCircle className="w-4 h-4" />
            Niche Analysis
          </div>
          <h2 className="font-display text-3xl sm:text-4xl lg:text-5xl font-bold text-clinic-navy dark:text-white tracking-tight mb-4">
            How MediFlow Compares
          </h2>
          <p className="text-lg text-clinic-text/70 dark:text-white/70">
            Stop losing hours of administrative time to Messenger, Viber, and spreadsheets. Here is why modern clinics choose MediFlow.
          </p>
        </div>

        {/* Comparison Matrix */}
        <div className="max-w-5xl mx-auto overflow-x-auto">
          <table className="w-full border-collapse text-left bg-white dark:bg-slate-800 rounded-2xl shadow-glass overflow-hidden min-w-[700px]">
            <thead>
              <tr className="bg-clinic-navy/5 dark:bg-slate-700/50 border-b border-clinic-navy/10 dark:border-white/10">
                <th className="p-6 text-sm font-bold text-clinic-navy dark:text-white uppercase tracking-wider">Features</th>
                <th className="p-6 text-sm font-bold text-white bg-gradient-to-r from-clinic-navy to-clinic-teal uppercase tracking-wider text-center">MediFlow</th>
                <th className="p-6 text-sm font-bold text-clinic-text/60 dark:text-white/60 uppercase tracking-wider text-center">Paper Files</th>
                <th className="p-6 text-sm font-bold text-clinic-text/60 dark:text-white/60 uppercase tracking-wider text-center">Spreadsheets</th>
                <th className="p-6 text-sm font-bold text-clinic-text/60 dark:text-white/60 uppercase tracking-wider text-center">Viber/Messenger</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-clinic-navy/5 dark:divide-white/5">
              {comparisonData.map((row) => (
                <tr key={row.feature} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors">
                  <td className="p-6 font-semibold text-clinic-navy dark:text-white text-sm lg:text-base">
                    {row.feature}
                  </td>
                  
                  {/* MediFlow */}
                  <td className="p-6 bg-clinic-teal/5 dark:bg-clinic-teal/5 text-center border-x border-clinic-teal/20">
                    <div className="flex flex-col items-center justify-center gap-1">
                      <div className="w-6 h-6 rounded-full bg-clinic-teal flex items-center justify-center">
                        <Check className="w-4 h-4 text-white" />
                      </div>
                      <span className="text-xs font-bold text-clinic-teal">{row.mediflow.text}</span>
                    </div>
                  </td>

                  {/* Paper */}
                  <td className="p-6 text-center">
                    <div className="flex flex-col items-center justify-center gap-1">
                      <X className="w-5 h-5 text-rose-500 mx-auto" />
                      <span className="text-xs text-clinic-text/50 dark:text-white/50">{row.paper.text}</span>
                    </div>
                  </td>

                  {/* Excel */}
                  <td className="p-6 text-center">
                    <div className="flex flex-col items-center justify-center gap-1">
                      {row.excel.status === 'partial' ? (
                        <AlertCircle className="w-5 h-5 text-amber-500 mx-auto" />
                      ) : (
                        <X className="w-5 h-5 text-rose-500 mx-auto" />
                      )}
                      <span className="text-xs text-clinic-text/50 dark:text-white/50">{row.excel.text}</span>
                    </div>
                  </td>

                  {/* Social (Viber / Messenger) */}
                  <td className="p-6 text-center">
                    <div className="flex flex-col items-center justify-center gap-1">
                      {row.social.status === 'partial' ? (
                        <AlertCircle className="w-5 h-5 text-amber-500 mx-auto" />
                      ) : (
                        <X className="w-5 h-5 text-rose-500 mx-auto" />
                      )}
                      <span className="text-xs text-clinic-text/50 dark:text-white/50">{row.social.text}</span>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  );
}
