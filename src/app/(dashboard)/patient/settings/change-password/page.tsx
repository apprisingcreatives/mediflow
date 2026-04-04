'use client';

import { ChangePasswordForm } from '@/components/auth/change-password-form';

export default function PatientChangePasswordPage() {
  return <ChangePasswordForm backHref='/patient/settings' />;
}
