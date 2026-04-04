import { ForgotPasswordForm } from '@/components/auth/forgot-password-form';

export default function PractitionerForgotPasswordPage() {
  const redirectTo = `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/practitioner/reset-password`;

  return (
    <ForgotPasswordForm
      redirectTo={redirectTo}
      loginHref='/login'
      title='Forgot Password'
      subtitle='Enter your practitioner email to receive a reset link'
    />
  );
}
