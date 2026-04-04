import { ResetPasswordForm } from '@/components/auth/reset-password-form';

export default function SuperAdminResetPasswordPage() {
  return (
    <ResetPasswordForm
      loginHref='/super-admin/login'
      forgotPasswordHref='/super-admin/forgot-password'
    />
  );
}
