'use client';

import { useState } from 'react';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Lock,
  Loader2,
  CheckCircle2,
  AlertCircle,
  Eye,
  EyeOff,
  ArrowLeft,
} from 'lucide-react';
import { toast } from 'sonner';

interface ChangePasswordFormProps {
  backHref: string;
}

function validatePassword(pwd: string): string | null {
  if (pwd.length < 8) return 'Password must be at least 8 characters long';
  if (!/[A-Z]/.test(pwd)) return 'Password must contain at least one uppercase letter';
  if (!/[a-z]/.test(pwd)) return 'Password must contain at least one lowercase letter';
  if (!/[0-9]/.test(pwd)) return 'Password must contain at least one number';
  if (!/[^A-Za-z0-9]/.test(pwd)) return 'Password must contain at least one special character';
  return null;
}

export function ChangePasswordForm({ backHref }: ChangePasswordFormProps) {
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSuccess, setIsSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const validationError = validatePassword(newPassword);
    if (validationError) {
      setError(validationError);
      return;
    }

    if (newPassword !== confirmPassword) {
      setError('New passwords do not match');
      return;
    }

    if (currentPassword === newPassword) {
      setError('New password must be different from current password');
      return;
    }

    setIsLoading(true);

    try {
      // Verify current password
      const { data: { user } } = await supabase.auth.getUser();
      if (!user?.email) {
        setError('Unable to verify your identity. Please log in again.');
        return;
      }

      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: user.email,
        password: currentPassword,
      });

      if (signInError) {
        setError('Current password is incorrect');
        return;
      }

      // Update password
      const { error: updateError } = await supabase.auth.updateUser({
        password: newPassword,
      });

      if (updateError) {
        setError(updateError.message);
        return;
      }

      // Invalidate all other sessions
      await supabase.auth.signOut({ scope: 'others' });

      // Log activity
      const { data: { user: currentUser } } = await supabase.auth.getUser();
      if (currentUser) {
        const { data: patientRecord } = await supabase
          .from('patients')
          .select('id')
          .eq('auth_user_id', currentUser.id)
          .single();

        if (patientRecord) {
          await supabase.from('activity_logs').insert({
            patient_id: patientRecord.id,
            clinic_id: null,
            actor_id: currentUser.id,
            actor_role: 'patient',
            action_type: 'password_changed',
            entity_type: 'account',
            entity_id: null,
            metadata: {},
          }).then(({ error: logError }) => {
            if (logError) console.error('Failed to log activity:', logError);
          });
        }
      }

      setIsSuccess(true);
      toast.success('Password changed successfully!');
    } catch (err) {
      setError('An unexpected error occurred. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  if (isSuccess) {
    return (
      <div className='w-full max-w-md mx-auto'>
        <div className='bg-white dark:bg-slate-800 rounded-2xl shadow-glass p-8 text-center'>
          <div className='w-12 h-12 rounded-full bg-green-100 dark:bg-green-900/20 flex items-center justify-center mx-auto mb-4'>
            <CheckCircle2 className='w-6 h-6 text-green-600 dark:text-green-400' />
          </div>
          <h2 className='font-display font-semibold text-lg text-clinic-navy dark:text-white mb-2'>
            Password Changed
          </h2>
          <p className='text-sm text-clinic-text/60 dark:text-white/60 mb-6'>
            Your password has been updated and all other sessions have been signed out.
          </p>
          <Link href={backHref}>
            <Button variant='outline' className='w-full'>
              <ArrowLeft className='w-4 h-4 mr-2' />
              Go Back
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className='w-full max-w-md mx-auto'>
      <div className='mb-6'>
        <Link
          href={backHref}
          className='text-sm text-clinic-teal hover:underline inline-flex items-center gap-1'
        >
          <ArrowLeft className='w-4 h-4' />
          Back
        </Link>
      </div>

      <div className='bg-white dark:bg-slate-800 rounded-2xl shadow-glass p-8'>
        <div className='flex items-center gap-3 mb-6 pb-6 border-b border-clinic-navy/10 dark:border-white/10'>
          <div className='w-10 h-10 rounded-xl bg-clinic-teal/10 flex items-center justify-center'>
            <Lock className='w-5 h-5 text-clinic-teal' />
          </div>
          <div>
            <h2 className='font-display font-semibold text-lg text-clinic-navy dark:text-white'>
              Change Password
            </h2>
            <p className='text-sm text-clinic-text/60 dark:text-white/60'>
              Update your account password
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className='space-y-5'>
          {/* Current Password */}
          <div className='space-y-2'>
            <Label htmlFor='currentPassword' className='text-clinic-navy dark:text-white'>
              Current Password
            </Label>
            <div className='relative'>
              <Lock className='absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-clinic-text/40' />
              <Input
                id='currentPassword'
                type={showCurrentPassword ? 'text' : 'password'}
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                placeholder='Enter current password'
                className='pl-10 pr-10 h-11 border-clinic-navy/10 dark:border-white/10'
                required
                disabled={isLoading}
              />
              <button
                type='button'
                onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                className='absolute right-3 top-1/2 -translate-y-1/2 text-clinic-text/40 hover:text-clinic-text/60'
              >
                {showCurrentPassword ? <EyeOff className='w-4 h-4' /> : <Eye className='w-4 h-4' />}
              </button>
            </div>
          </div>

          {/* New Password */}
          <div className='space-y-2'>
            <Label htmlFor='newPassword' className='text-clinic-navy dark:text-white'>
              New Password
            </Label>
            <div className='relative'>
              <Lock className='absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-clinic-text/40' />
              <Input
                id='newPassword'
                type={showNewPassword ? 'text' : 'password'}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder='Enter new password'
                className='pl-10 pr-10 h-11 border-clinic-navy/10 dark:border-white/10'
                required
                minLength={8}
                disabled={isLoading}
              />
              <button
                type='button'
                onClick={() => setShowNewPassword(!showNewPassword)}
                className='absolute right-3 top-1/2 -translate-y-1/2 text-clinic-text/40 hover:text-clinic-text/60'
              >
                {showNewPassword ? <EyeOff className='w-4 h-4' /> : <Eye className='w-4 h-4' />}
              </button>
            </div>
          </div>

          {/* Confirm New Password */}
          <div className='space-y-2'>
            <Label htmlFor='confirmNewPassword' className='text-clinic-navy dark:text-white'>
              Confirm New Password
            </Label>
            <div className='relative'>
              <Lock className='absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-clinic-text/40' />
              <Input
                id='confirmNewPassword'
                type={showConfirmPassword ? 'text' : 'password'}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder='Confirm new password'
                className='pl-10 pr-10 h-11 border-clinic-navy/10 dark:border-white/10'
                required
                minLength={8}
                disabled={isLoading}
              />
              <button
                type='button'
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className='absolute right-3 top-1/2 -translate-y-1/2 text-clinic-text/40 hover:text-clinic-text/60'
              >
                {showConfirmPassword ? <EyeOff className='w-4 h-4' /> : <Eye className='w-4 h-4' />}
              </button>
            </div>
          </div>

          {/* Requirements */}
          <div className='p-3 bg-clinic-navy/5 dark:bg-white/5 rounded-lg'>
            <p className='text-xs font-medium text-clinic-navy dark:text-white mb-2'>
              New password must contain:
            </p>
            <ul className='space-y-1 text-xs text-clinic-text/60 dark:text-white/60'>
              <li className='flex items-center gap-2'>
                <div className={`w-1 h-1 rounded-full ${newPassword.length >= 8 ? 'bg-green-500' : 'bg-clinic-text/20'}`} />
                At least 8 characters
              </li>
              <li className='flex items-center gap-2'>
                <div className={`w-1 h-1 rounded-full ${/[A-Z]/.test(newPassword) ? 'bg-green-500' : 'bg-clinic-text/20'}`} />
                One uppercase letter
              </li>
              <li className='flex items-center gap-2'>
                <div className={`w-1 h-1 rounded-full ${/[a-z]/.test(newPassword) ? 'bg-green-500' : 'bg-clinic-text/20'}`} />
                One lowercase letter
              </li>
              <li className='flex items-center gap-2'>
                <div className={`w-1 h-1 rounded-full ${/[0-9]/.test(newPassword) ? 'bg-green-500' : 'bg-clinic-text/20'}`} />
                One number
              </li>
              <li className='flex items-center gap-2'>
                <div className={`w-1 h-1 rounded-full ${/[^A-Za-z0-9]/.test(newPassword) ? 'bg-green-500' : 'bg-clinic-text/20'}`} />
                One special character
              </li>
            </ul>
          </div>

          {/* Error */}
          {error && (
            <div className='flex items-start gap-2 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg'>
              <AlertCircle className='w-4 h-4 text-red-500 mt-0.5 flex-shrink-0' />
              <p className='text-sm text-red-600 dark:text-red-400'>{error}</p>
            </div>
          )}

          {/* Actions */}
          <div className='flex gap-3'>
            <Link href={backHref} className='flex-1'>
              <Button type='button' variant='outline' className='w-full h-11'>
                Cancel
              </Button>
            </Link>
            <Button
              type='submit'
              disabled={isLoading || !currentPassword || !newPassword || !confirmPassword}
              className='flex-1 h-11 bg-clinic-teal hover:bg-clinic-teal/90 text-white'
            >
              {isLoading ? (
                <>
                  <Loader2 className='w-4 h-4 mr-2 animate-spin' />
                  Updating...
                </>
              ) : (
                'Update Password'
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
