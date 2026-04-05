'use client';

import { MessageSquare } from 'lucide-react';

export default function PatientMessagesPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-bold text-clinic-navy dark:text-white">
          Messages
        </h1>
        <p className="text-clinic-text/60 dark:text-white/60">
          Communicate with your healthcare providers
        </p>
      </div>

      <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-glass p-12 text-center">
        <MessageSquare className="w-12 h-12 text-clinic-text/20 dark:text-white/20 mx-auto mb-4" />
        <h2 className="font-display text-lg font-semibold text-clinic-navy dark:text-white mb-2">
          Coming Soon
        </h2>
        <p className="text-clinic-text/60 dark:text-white/60 max-w-md mx-auto">
          Secure messaging with your healthcare providers will be available soon.
        </p>
      </div>
    </div>
  );
}
