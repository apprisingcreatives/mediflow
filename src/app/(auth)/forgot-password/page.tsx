import { ForgotPasswordForm } from '@/components/auth/forgot-password-form';

export default function PatientForgotPasswordPage() {
  const redirectTo = `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/reset-password`;

  return (
    <ForgotPasswordForm
      redirectTo={redirectTo}
      loginHref='/login'
    />
  );
}
