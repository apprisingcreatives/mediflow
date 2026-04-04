import { ForgotPasswordForm } from '@/components/auth/forgot-password-form';

export default function SuperAdminForgotPasswordPage() {
  const redirectTo = `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/super-admin/reset-password`;

  return (
    <ForgotPasswordForm
      redirectTo={redirectTo}
      loginHref='/super-admin/login'
      title='Forgot Admin Password'
      subtitle='Enter your super admin email to receive a reset link'
    />
  );
}
