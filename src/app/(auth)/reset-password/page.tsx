import { ResetPasswordForm } from '@/components/auth/reset-password-form';

export default function PatientResetPasswordPage() {
  return (
    <ResetPasswordForm
      loginHref='/login'
      forgotPasswordHref='/forgot-password'
    />
  );
}
