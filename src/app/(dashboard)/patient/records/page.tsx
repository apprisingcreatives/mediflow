'use client';

import { FileText } from 'lucide-react';
import { useAuth } from '@/hooks/use-auth';
import { HealthSummary } from '@/components/patient/dashboard';

export default function PatientRecordsPage() {
  const { patient } = useAuth();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-bold text-clinic-navy dark:text-white">
          Medical Records
        </h1>
        <p className="text-clinic-text/60 dark:text-white/60">
          View your health information and documents
        </p>
      </div>

      {/* Health Summary */}
      {patient && <HealthSummary patient={patient} />}

      {/* Documents placeholder */}
      <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-glass p-12 text-center">
        <FileText className="w-12 h-12 text-clinic-text/20 dark:text-white/20 mx-auto mb-4" />
        <h2 className="font-display text-lg font-semibold text-clinic-navy dark:text-white mb-2">
          Documents Coming Soon
        </h2>
        <p className="text-clinic-text/60 dark:text-white/60 max-w-md mx-auto">
          Access and manage your medical documents, prescriptions, and lab results.
        </p>
      </div>
    </div>
  );
}
