'use client';

import { HelpGuideViewer } from '@/components/help/HelpGuideViewer';

export default function ClinicHelpPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-bold text-clinic-navy dark:text-white">
          Help & Guides
        </h1>
        <p className="text-clinic-text/60 dark:text-white/60">
          Learn how to manage your clinic, patients, and appointments
        </p>
      </div>
      <HelpGuideViewer category="clinic_admin" />
    </div>
  );
}
