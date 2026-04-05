'use client';

import { usePractitionerDashboard } from '@/hooks';
import { usePractitionerContext } from '../layout';
import { PractitionerProfile } from '@/components/clinic/practitioners';

export default function PractitionerProfilePage() {
  const { profile, isLoading, refreshProfile } = usePractitionerContext();
  const { updateProfile } = usePractitionerDashboard();

  const handleSave = async (data: Parameters<typeof updateProfile>[0]) => {
    const result = await updateProfile(data);
    if (result) {
      await refreshProfile();
    }
    return result;
  };

  return (
    <PractitionerProfile
      profile={profile}
      isLoading={isLoading}
      onSave={handleSave}
    />
  );
}
