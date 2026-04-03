import { ResetPasswordForm } from '@/components/auth/reset-password-form';

export default function ClinicResetPasswordPage() {
  return (
    <ResetPasswordForm
      loginHref='/clinic/login'
      forgotPasswordHref='/clinic/forgot-password'
    />
  );
}
