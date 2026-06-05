'use client';

import { useClinicContext } from '../clinic-context';
import ReportForm from '@/components/reports/ReportForm';

export default function ClinicReportPage() {
  const { admin } = useClinicContext();

  if (!admin) return null;

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
        Submit a Report
      </h1>
      <ReportForm userEmail={admin.email} userRole="clinic_admin" />
    </div>
  );
}
