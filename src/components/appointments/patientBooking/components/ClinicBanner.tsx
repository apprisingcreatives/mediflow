"use client";

import { Building2 } from "lucide-react";

interface ClinicBannerProps {
  clinicName: string;
  preSelectedServiceName?: string | null;
  preSelectedPractitionerName?: string | null;
}

export function ClinicBanner({
  clinicName,
  preSelectedServiceName,
  preSelectedPractitionerName,
}: ClinicBannerProps) {
  return (
    <div className="mb-6 p-4 bg-gradient-to-r from-clinic-navy/5 to-clinic-teal/5 dark:from-clinic-navy/20 dark:to-clinic-teal/20 rounded-xl border border-clinic-navy/10 dark:border-white/10">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-lg bg-clinic-navy/10 dark:bg-white/10 flex items-center justify-center">
          <Building2 className="w-5 h-5 text-clinic-navy dark:text-white" />
        </div>
        <div>
          <p className="text-xs text-clinic-text/60 dark:text-white/60">
            Booking appointment at
          </p>
          <p className="font-display font-bold text-clinic-navy dark:text-white">
            {clinicName}
          </p>
        </div>
        {preSelectedServiceName && (
          <div className="ml-auto text-right">
            <p className="text-xs text-clinic-text/60 dark:text-white/60">
              Service
            </p>
            <p className="font-medium text-clinic-teal">
              {preSelectedServiceName}
            </p>
          </div>
        )}
        {preSelectedPractitionerName && !preSelectedServiceName && (
          <div className="ml-auto text-right">
            <p className="text-xs text-clinic-text/60 dark:text-white/60">
              Practitioner
            </p>
            <p className="font-medium text-clinic-teal">
              {preSelectedPractitionerName}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
