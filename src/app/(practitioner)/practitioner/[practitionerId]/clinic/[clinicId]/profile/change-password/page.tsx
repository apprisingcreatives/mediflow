'use client';

import { useParams } from 'next/navigation';
import { ChangePasswordForm } from '@/components/auth/change-password-form';

export default function PractitionerChangePasswordPage() {
  const params = useParams();
  const practitionerId = params.practitionerId as string;
  const clinicId = params.clinicId as string;

  return (
    <div className='py-8 px-4'>
      <ChangePasswordForm
        backHref={`/practitioner/${practitionerId}/clinic/${clinicId}/profile`}
      />
    </div>
  );
}
