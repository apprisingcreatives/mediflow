import { ResetPasswordForm } from '@/components/auth/reset-password-form';

export default function PractitionerResetPasswordPage() {
  return (
    <ResetPasswordForm
      loginHref='/login'
      forgotPasswordHref='/practitioner/forgot-password'
    />
  );
}
