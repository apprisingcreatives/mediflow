import { ChangePasswordForm } from '@/components/auth/change-password-form';

export default function SuperAdminChangePasswordPage() {
  return (
    <div className='min-h-screen bg-clinic-bg dark:bg-slate-900 py-12 px-4'>
      <ChangePasswordForm backHref='/super-admin/dashboard' />
    </div>
  );
}
