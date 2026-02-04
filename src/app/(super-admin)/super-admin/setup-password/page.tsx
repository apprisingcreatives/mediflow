'use client';

import { useEffect, useState } from 'react';
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

export default function SetupPasswordPage() {
  const router = useRouter();
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [userName, setUserName] = useState('');

  useEffect(() => {
    const init = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) return;

      setUserName(user.user_metadata?.name ?? '');

      const { data: admin } = await supabase
        .from('super_admins')
        .select('status')
        .eq('auth_user_id', user.id)
        .single();

      // If already active, redirect to dashboard
      if (admin?.status === 'active') {
        router.replace('/super-admin/dashboard');
      }
    };

    init();
  }, []);

  // ❌ REMOVED: Redundant activation logic - now handled by /api/super-admin/activate
  // This prevented proper RLS checks and audit logging

  const validatePassword = (pwd: string): string | null => {
    if (pwd.length < 8) {
      return 'Password must be at least 8 characters long';
    }
    if (!/[A-Z]/.test(pwd)) {
      return 'Password must contain at least one uppercase letter';
    }
    if (!/[a-z]/.test(pwd)) {
      return 'Password must contain at least one lowercase letter';
    }
    if (!/[0-9]/.test(pwd)) {
      return 'Password must contain at least one number';
    }
    return null;
  };

  const handlePasswordSetup = async (e: React.FormEvent) => {
    e.preventDefault();

    const validationError = validatePassword(password);
    if (validationError) return setError(validationError);

    if (password !== confirmPassword) return setError('Passwords do not match');

    setLoading(true);

    try {
      const { error } = await supabase.auth.updateUser({
        password,
      });

      if (error) throw error;

      // server activation
      const res = await fetch('/api/super-admin/activate', {
        method: 'POST',
      });

      if (!res.ok) throw new Error('Activation failed');

      router.replace('/super-admin/dashboard');
    } catch (err) {
      setError('Failed to complete setup');
    } finally {
      setLoading(false);
    }
  };

  const passwordStrength = (
    pwd: string,
  ): { strength: number; label: string; color: string } => {
    let strength = 0;
    if (pwd.length >= 8) strength++;
    if (pwd.length >= 12) strength++;
    if (/[A-Z]/.test(pwd)) strength++;
    if (/[a-z]/.test(pwd)) strength++;
    if (/[0-9]/.test(pwd)) strength++;
    if (/[^A-Za-z0-9]/.test(pwd)) strength++;

    if (strength <= 2) return { strength, label: 'Weak', color: 'bg-red-500' };
    if (strength <= 4)
      return { strength, label: 'Medium', color: 'bg-yellow-500' };
    return { strength, label: 'Strong', color: 'bg-green-500' };
  };

  const pwdStrength = passwordStrength(password);

  return (
    <div className='min-h-screen bg-gradient-to-br from-clinic-bg via-white to-clinic-teal/5 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900 flex items-center justify-center p-4'>
      <div className='w-full max-w-md'>
        {/* Logo & Header */}
        <div className='text-center mb-8'>
          <div className='inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-clinic-navy to-clinic-teal mb-4 shadow-lg'>
            <Activity className='w-8 h-8 text-white' />
          </div>
          <h1 className='text-3xl font-display font-bold text-clinic-navy dark:text-white mb-2'>
            Welcome to MediFlow
          </h1>
          {userName && (
            <p className='text-clinic-text/60 dark:text-white/60'>
              Hi {userName}! Set up your password to get started
            </p>
          )}
        </div>

        {/* Card */}
        <div className='bg-white dark:bg-slate-800 rounded-2xl shadow-glass p-8 border border-clinic-navy/5 dark:border-white/5'>
          <div className='flex items-center gap-3 mb-6 pb-6 border-b border-clinic-navy/10 dark:border-white/10'>
            <div className='w-10 h-10 rounded-xl bg-clinic-teal/10 flex items-center justify-center'>
              <Lock className='w-5 h-5 text-clinic-teal' />
            </div>
            <div>
              <h2 className='font-display font-semibold text-lg text-clinic-navy dark:text-white'>
                Set Your Password
              </h2>
              <p className='text-sm text-clinic-text/60 dark:text-white/60'>
                Create a secure password for your account
              </p>
            </div>
          </div>

          <form onSubmit={handlePasswordSetup} className='space-y-5'>
            {/* Password Field */}
            <div className='space-y-2'>
              <Label
                htmlFor='password'
                className='text-sm font-medium text-clinic-navy dark:text-white'
              >
                Password
              </Label>
              <div className='relative'>
                <Lock className='absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-clinic-text/40' />
                <Input
                  id='password'
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder='Enter your password'
                  className='pl-10 pr-10 h-11 border-clinic-navy/10 dark:border-white/10 focus:border-clinic-teal'
                  required
                  minLength={8}
                  disabled={loading}
                />
                <button
                  type='button'
                  onClick={() => setShowPassword(!showPassword)}
                  className='absolute right-3 top-1/2 -translate-y-1/2 text-clinic-text/40 hover:text-clinic-text/60'
                >
                  {showPassword ? (
                    <EyeOff className='w-4 h-4' />
                  ) : (
                    <Eye className='w-4 h-4' />
                  )}
                </button>
              </div>

              {/* Password Strength Indicator */}
              {password && (
                <div className='space-y-1'>
                  <div className='flex items-center justify-between text-xs'>
                    <span className='text-clinic-text/60 dark:text-white/60'>
                      Password strength
                    </span>
                    <span
                      className={`font-medium ${
                        pwdStrength.label === 'Weak'
                          ? 'text-red-500'
                          : pwdStrength.label === 'Medium'
                            ? 'text-yellow-500'
                            : 'text-green-500'
                      }`}
                    >
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

            {/* Confirm Password Field */}
            <div className='space-y-2'>
              <Label
                htmlFor='confirmPassword'
                className='text-sm font-medium text-clinic-navy dark:text-white'
              >
                Confirm Password
              </Label>
              <div className='relative'>
                <Lock className='absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-clinic-text/40' />
                <Input
                  id='confirmPassword'
                  type={showConfirmPassword ? 'text' : 'password'}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder='Confirm your password'
                  className='pl-10 pr-10 h-11 border-clinic-navy/10 dark:border-white/10 focus:border-clinic-teal'
                  required
                  minLength={8}
                  disabled={loading}
                />
                <button
                  type='button'
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className='absolute right-3 top-1/2 -translate-y-1/2 text-clinic-text/40 hover:text-clinic-text/60'
                >
                  {showConfirmPassword ? (
                    <EyeOff className='w-4 h-4' />
                  ) : (
                    <Eye className='w-4 h-4' />
                  )}
                </button>
              </div>
            </div>

            {/* Password Requirements */}
            <div className='p-3 bg-clinic-navy/5 dark:bg-white/5 rounded-lg'>
              <p className='text-xs font-medium text-clinic-navy dark:text-white mb-2'>
                Password must contain:
              </p>
              <ul className='space-y-1 text-xs text-clinic-text/60 dark:text-white/60'>
                <li className='flex items-center gap-2'>
                  <div
                    className={`w-1 h-1 rounded-full ${password.length >= 8 ? 'bg-green-500' : 'bg-clinic-text/20'}`}
                  />
                  At least 8 characters
                </li>
                <li className='flex items-center gap-2'>
                  <div
                    className={`w-1 h-1 rounded-full ${/[A-Z]/.test(password) ? 'bg-green-500' : 'bg-clinic-text/20'}`}
                  />
                  One uppercase letter
                </li>
                <li className='flex items-center gap-2'>
                  <div
                    className={`w-1 h-1 rounded-full ${/[a-z]/.test(password) ? 'bg-green-500' : 'bg-clinic-text/20'}`}
                  />
                  One lowercase letter
                </li>
                <li className='flex items-center gap-2'>
                  <div
                    className={`w-1 h-1 rounded-full ${/[0-9]/.test(password) ? 'bg-green-500' : 'bg-clinic-text/20'}`}
                  />
                  One number
                </li>
              </ul>
            </div>

            {/* Error Message */}
            {error && (
              <div className='flex items-start gap-2 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg'>
                <AlertCircle className='w-4 h-4 text-red-500 mt-0.5 flex-shrink-0' />
                <p className='text-sm text-red-600 dark:text-red-400'>
                  {error}
                </p>
              </div>
            )}

            {/* Submit Button */}
            <Button
              type='submit'
              disabled={loading || !password || !confirmPassword}
              className='w-full h-11 bg-clinic-teal hover:bg-clinic-teal/90 text-white font-medium'
            >
              {loading ? (
                <>
                  <Loader2 className='w-4 h-4 mr-2 animate-spin' />
                  Setting up your account...
                </>
              ) : (
                <>
                  <CheckCircle2 className='w-4 h-4 mr-2' />
                  Complete Setup
                </>
              )}
            </Button>
          </form>
        </div>

        {/* Footer */}
        <p className='text-center text-xs text-clinic-text/50 dark:text-white/50 mt-6'>
          By setting up your account, you agree to our Terms of Service and
          Privacy Policy
        </p>
      </div>
    </div>
  );
}
