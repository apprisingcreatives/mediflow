'use client';

import { usePatientContext } from '../layout';
import ReportForm from '@/components/reports/ReportForm';

export default function PatientReportPage() {
  const { patient } = usePatientContext();

  if (!patient) return null;

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
        Submit a Report
      </h1>
      <ReportForm userEmail={patient.email} userRole="patient" />
    </div>
  );
}
