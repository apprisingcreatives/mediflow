'use client';

import { Building2, Loader2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { PatientClinicInfo } from './types';

interface PatientClinicsCardProps {
  clinics: PatientClinicInfo[];
  loading: boolean;
}

export function PatientClinicsCard({ clinics, loading }: PatientClinicsCardProps) {
  return (
    <Card className="border-0 shadow-glass">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="font-display text-lg font-semibold text-clinic-navy dark:text-white">
          My Clinics
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {loading ? (
          <div className="flex items-center justify-center py-4">
            <Loader2 className="w-5 h-5 animate-spin text-clinic-teal" />
          </div>
        ) : clinics.length === 0 ? (
          <div className="text-center py-4 text-clinic-text/60 dark:text-white/60 text-sm">
            No clinics associated yet
          </div>
        ) : (
          clinics.map((pc) => <ClinicItem key={pc.id} clinic={pc} />)
        )}
      </CardContent>
    </Card>
  );
}

interface ClinicItemProps {
  clinic: PatientClinicInfo;
}

function ClinicItem({ clinic }: ClinicItemProps) {
  return (
    <div className="p-3 rounded-xl bg-clinic-bg/50 dark:bg-slate-700/50">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-lg bg-clinic-teal/10 flex items-center justify-center">
          <Building2 className="w-5 h-5 text-clinic-teal" />
        </div>
        <div>
          <h4 className="font-medium text-clinic-navy dark:text-white text-sm">
            {clinic.clinic.name}
          </h4>
          {clinic.clinic.address && (
            <p className="text-xs text-clinic-text/50 dark:text-white/50">
              {clinic.clinic.address}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

export default PatientClinicsCard;
