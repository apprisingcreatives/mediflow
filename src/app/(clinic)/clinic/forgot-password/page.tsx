import { ForgotPasswordForm } from '@/components/auth/forgot-password-form';

export default function ClinicForgotPasswordPage() {
  const redirectTo = `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/clinic/reset-password`;

  return (
    <ForgotPasswordForm
      redirectTo={redirectTo}
      loginHref='/clinic/login'
      title='Forgot Clinic Password'
      subtitle='Enter your clinic admin email to receive a reset link'
    />
  );
}
