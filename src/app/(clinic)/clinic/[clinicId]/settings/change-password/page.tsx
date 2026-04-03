'use client';

import { useParams } from 'next/navigation';
import { ChangePasswordForm } from '@/components/auth/change-password-form';

export default function ClinicChangePasswordPage() {
  const params = useParams();
  const clinicId = params.clinicId as string;

  return (
    <div className='py-8 px-4'>
      <ChangePasswordForm backHref={`/clinic/${clinicId}/settings`} />
    </div>
  );
}
