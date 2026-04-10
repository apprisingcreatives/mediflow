import { ResetPasswordForm } from '@/components/auth/reset-password-form';

export default function ResetPasswordPage() {
  return (
    <ResetPasswordForm
      loginHref='/login'
      forgotPasswordHref='/forgot-password'
      roleBasedRedirect
    />
  );
}
