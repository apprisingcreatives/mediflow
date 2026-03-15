'use client';

import { usePractitionerDashboard } from '@/hooks';
import { usePractitionerContext } from '../layout';
import { PractitionerProfile } from '@/components/clinic/practitioners';

export default function PractitionerProfilePage() {
  const { profile, isLoading } = usePractitionerContext();
  const { updateProfile } = usePractitionerDashboard();

  return (
    <PractitionerProfile
      profile={profile}
      isLoading={isLoading}
      onSave={updateProfile}
    />
  );
}
