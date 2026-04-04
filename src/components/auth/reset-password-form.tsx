'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Activity,
  Lock,
  Loader2,
  CheckCircle2,
  AlertCircle,
  Eye,
  EyeOff,
} from 'lucide-react';
import { toast } from 'sonner';

interface ResetPasswordFormProps {
  loginHref: string;
  forgotPasswordHref: string;
}

function validatePassword(pwd: string): string | null {
  if (pwd.length < 8) return 'Password must be at least 8 characters long';
  if (!/[A-Z]/.test(pwd)) return 'Password must contain at least one uppercase letter';
  if (!/[a-z]/.test(pwd)) return 'Password must contain at least one lowercase letter';
  if (!/[0-9]/.test(pwd)) return 'Password must contain at least one number';
  if (!/[^A-Za-z0-9]/.test(pwd)) return 'Password must contain at least one special character';
  return null;
}

function passwordStrength(pwd: string): { strength: number; label: string; color: string } {
  let strength = 0;
  if (pwd.length >= 8) strength++;
  if (pwd.length >= 12) strength++;
  if (/[A-Z]/.test(pwd)) strength++;
  if (/[a-z]/.test(pwd)) strength++;
  if (/[0-9]/.test(pwd)) strength++;
  if (/[^A-Za-z0-9]/.test(pwd)) strength++;

  if (strength <= 2) return { strength, label: 'Weak', color: 'bg-red-500' };
  if (strength <= 4) return { strength, label: 'Medium', color: 'bg-yellow-500' };
  return { strength, label: 'Strong', color: 'bg-green-500' };
}

export function ResetPasswordForm({
  loginHref,
  forgotPasswordHref,
}: ResetPasswordFormProps) {
  const router = useRouter();
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isSettingSession, setIsSettingSession] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [tokenError, setTokenError] = useState(false);

  useEffect(() => {
    async function setSessionFromUrl() {
      if (typeof window === 'undefined') return;

      const urlHash = window.location.hash.replace(/^#/, '');
      const params = new URLSearchParams(urlHash);
      const access_token = params.get('access_token');
      const refresh_token = params.get('refresh_token');

      if (!access_token) {
        setTokenError(true);
        setIsSettingSession(false);
        return;
      }

      const { error } = await supabase.auth.setSession({
        access_token,
        refresh_token: refresh_token ?? '',
      });

      if (error) {
        setTokenError(true);
        setIsSettingSession(false);
        return;
      }

      // Clear hash to avoid re-processing and exposure in browser history
      try {
        history.replaceState(null, '', window.location.pathname);
      } catch (e) {}

      setIsSettingSession(false);
    }

    setSessionFromUrl();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const validationError = validatePassword(password);
    if (validationError) {
      setError(validationError);
      return;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    setIsLoading(true);

    try {
      const { error } = await supabase.auth.updateUser({ password });

      if (error) {
        setError(error.message);
        return;
      }

      toast.success('Password reset successfully! Redirecting to login...');
      await supabase.auth.signOut();
      setTimeout(() => router.push(loginHref), 2000);
    } catch (err) {
      setError('An unexpected error occurred. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const pwdStrength = passwordStrength(password);

  if (isSettingSession) {
    return (
      <div className='min-h-screen bg-clinic-bg dark:bg-slate-900 flex items-center justify-center'>
        <div className='flex items-center gap-2 text-clinic-navy dark:text-white'>
          <Loader2 className='w-5 h-5 animate-spin' />
          Verifying reset link...
        </div>
      </div>
    );
  }

  if (tokenError) {
    return (
      <div className='min-h-screen bg-clinic-bg dark:bg-slate-900 flex items-center justify-center px-4'>
        <div className='w-full max-w-md text-center'>
          <div className='bg-white dark:bg-slate-800 rounded-2xl shadow-glass p-8'>
            <div className='w-12 h-12 rounded-full bg-red-100 dark:bg-red-900/20 flex items-center justify-center mx-auto mb-4'>
              <AlertCircle className='w-6 h-6 text-red-600 dark:text-red-400' />
            </div>
            <h2 className='font-display font-semibold text-lg text-clinic-navy dark:text-white mb-2'>
              Invalid or Expired Link
            </h2>
            <p className='text-sm text-clinic-text/60 dark:text-white/60 mb-6'>
              This password reset link is invalid or has expired. Please request
              a new one.
            </p>
            <Link href={forgotPasswordHref}>
              <Button className='w-full bg-clinic-teal hover:bg-clinic-teal/90 text-white'>
                Request New Reset Link
              </Button>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className='min-h-screen bg-clinic-bg dark:bg-slate-900 flex items-center justify-center px-4'>
      <div className='w-full max-w-md'>
        <div className='text-center mb-8'>
          <div className='inline-flex items-center justify-center w-12 h-12 rounded-xl bg-gradient-to-br from-clinic-navy to-clinic-teal mb-4'>
            <Activity className='w-6 h-6 text-white' />
          </div>
          <h1 className='font-display text-3xl font-bold text-clinic-navy dark:text-white mb-2'>
            Reset Password
          </h1>
          <p className='text-clinic-text/60 dark:text-white/60'>
            Enter your new password
          </p>
        </div>

        <div className='bg-white dark:bg-slate-800 rounded-2xl shadow-glass p-8'>
          <form onSubmit={handleSubmit} className='space-y-5'>
            {/* New Password */}
            <div className='space-y-2'>
              <Label htmlFor='password' className='text-clinic-navy dark:text-white'>
                New Password
              </Label>
              <div className='relative'>
                <Lock className='absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-clinic-text/40' />
                <Input
                  id='password'
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder='Enter new password'
                  className='pl-10 pr-10 h-11 border-clinic-navy/10 dark:border-white/10 focus:border-clinic-teal'
                  required
                  minLength={8}
                  disabled={isLoading}
                />
                <button
                  type='button'
                  onClick={() => setShowPassword(!showPassword)}
                  className='absolute right-3 top-1/2 -translate-y-1/2 text-clinic-text/40 hover:text-clinic-text/60'
                >
                  {showPassword ? <EyeOff className='w-4 h-4' /> : <Eye className='w-4 h-4' />}
                </button>
              </div>

              {/* Password Strength */}
              {password && (
                <div className='space-y-1'>
                  <div className='flex items-center justify-between text-xs'>
                    <span className='text-clinic-text/60 dark:text-white/60'>Password strength</span>
                    <span className={`font-medium ${pwdStrength.label === 'Weak' ? 'text-red-500' : pwdStrength.label === 'Medium' ? 'text-yellow-500' : 'text-green-500'}`}>
                      {pwdStrength.label}
                    </span>
                  </div>
                  <div className='h-1.5 bg-clinic-navy/5 dark:bg-white/5 rounded-full overflow-hidden'>
                    <div
                      className={`h-full transition-all duration-300 ${pwdStrength.color}`}
                      style={{ width: `${(pwdStrength.strength / 6) * 100}%` }}
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Confirm Password */}
            <div className='space-y-2'>
              <Label htmlFor='confirmPassword' className='text-clinic-navy dark:text-white'>
                Confirm Password
              </Label>
              <div className='relative'>
                <Lock className='absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-clinic-text/40' />
                <Input
                  id='confirmPassword'
                  type={showConfirmPassword ? 'text' : 'password'}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder='Confirm new password'
                  className='pl-10 pr-10 h-11 border-clinic-navy/10 dark:border-white/10 focus:border-clinic-teal'
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
                Password must contain:
              </p>
              <ul className='space-y-1 text-xs text-clinic-text/60 dark:text-white/60'>
                <li className='flex items-center gap-2'>
                  <div className={`w-1 h-1 rounded-full ${password.length >= 8 ? 'bg-green-500' : 'bg-clinic-text/20'}`} />
                  At least 8 characters
                </li>
                <li className='flex items-center gap-2'>
                  <div className={`w-1 h-1 rounded-full ${/[A-Z]/.test(password) ? 'bg-green-500' : 'bg-clinic-text/20'}`} />
                  One uppercase letter
                </li>
                <li className='flex items-center gap-2'>
                  <div className={`w-1 h-1 rounded-full ${/[a-z]/.test(password) ? 'bg-green-500' : 'bg-clinic-text/20'}`} />
                  One lowercase letter
                </li>
                <li className='flex items-center gap-2'>
                  <div className={`w-1 h-1 rounded-full ${/[0-9]/.test(password) ? 'bg-green-500' : 'bg-clinic-text/20'}`} />
                  One number
                </li>
                <li className='flex items-center gap-2'>
                  <div className={`w-1 h-1 rounded-full ${/[^A-Za-z0-9]/.test(password) ? 'bg-green-500' : 'bg-clinic-text/20'}`} />
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

            {/* Submit */}
            <Button
              type='submit'
              disabled={isLoading || !password || !confirmPassword}
              className='w-full h-11 bg-clinic-teal hover:bg-clinic-teal/90 text-white'
            >
              {isLoading ? (
                <>
                  <Loader2 className='w-4 h-4 mr-2 animate-spin' />
                  Resetting password...
                </>
              ) : (
                <>
                  <CheckCircle2 className='w-4 h-4 mr-2' />
                  Reset Password
                </>
              )}
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
}
