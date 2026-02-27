'use client';

import { useEffect, useCallback } from 'react';
import { useParams } from 'next/navigation';
import { usePractitionerDashboard } from '@/hooks';
import { PractitionerAvailability } from '@/components/clinic/practitioners';
import { PractitionerWorkingHours } from '@/hooks/useGetPractitioners';

export default function PractitionerAvailabilityPage() {
  const params = useParams();
  const practitionerId = params.practitionerId as string;

  const {
    workingHours,
    workingHoursLoading,
    fetchWorkingHours,
    updateWorkingHours,
  } = usePractitionerDashboard();

  // Fetch working hours on mount
  useEffect(() => {
    if (practitionerId) {
      fetchWorkingHours(practitionerId);
    }
  }, [practitionerId, fetchWorkingHours]);

  const handleSave = useCallback(
    async (hours: Omit<PractitionerWorkingHours, 'id' | 'practitioner_id'>[]) => {
      return await updateWorkingHours({
        practitionerId,
        workingHours: hours,
      });
    },
    [practitionerId, updateWorkingHours]
  );

  return (
    <PractitionerAvailability
      workingHours={workingHours}
      isLoading={workingHoursLoading}
      onSave={handleSave}
    />
  );
}
