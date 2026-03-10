'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Activity,
  Lock,
  Eye,
  EyeOff,
  CheckCircle2,
  XCircle,
  Loader2,
  Building2,
} from 'lucide-react';

export default function SetupClinicAccountPage() {
  return (
    <Suspense fallback={
      <div className='min-h-screen bg-gradient-to-br from-clinic-bg via-white to-clinic-teal/5 flex items-center justify-center'>
        <Loader2 className='w-8 h-8 animate-spin text-clinic-teal' />
      </div>
    }>
      <SetupClinicAccount />
    </Suspense>
  );
}

function SetupClinicAccount() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [clinicName, setClinicName] = useState('');
  const [adminName, setAdminName] = useState('');

  // Password strength indicators
  const hasMinLength = password.length >= 8;
  const hasUpperCase = /[A-Z]/.test(password);
  const hasLowerCase = /[a-z]/.test(password);
  const hasNumber = /[0-9]/.test(password);
  const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(password);
  const passwordsMatch = password === confirmPassword && password.length > 0;

  const passwordStrength =
    [hasMinLength, hasUpperCase, hasLowerCase, hasNumber, hasSpecialChar].filter(
      Boolean,
    ).length;

  const isPasswordValid =
    hasMinLength &&
    hasUpperCase &&
    hasLowerCase &&
    hasNumber &&
    hasSpecialChar &&
    passwordsMatch;

  useEffect(() => {
    // Get user metadata from the invitation
    const fetchUserData = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (user?.user_metadata) {
        setClinicName(user.user_metadata.clinic_name || '');
        setAdminName(user.user_metadata.name || '');
      }
    };

    fetchUserData();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isPasswordValid) {
      setError('Please meet all password requirements');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      // Update user password
      const { error: passwordError } = await supabase.auth.updateUser({
        password: password,
      });

      if (passwordError) throw passwordError;

      // Get the current user
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) throw new Error('No user found');

      // Update clinic_admin record to mark as active
      const { error: updateError } = await supabase
        .from('clinic_admins')
        .update({ is_active: true })
        .eq('auth_user_id', user.id);

      if (updateError) throw updateError;

      // Redirect to clinic dashboard
      router.push('/clinic/dashboard');
    } catch (err) {
      console.error('Setup error:', err);
      setError(
        err instanceof Error ? err.message : 'Failed to set up account',
      );
      setIsLoading(false);
    }
  };

  return (
    <div className='min-h-screen bg-gradient-to-br from-clinic-bg via-white to-clinic-teal/5 flex items-center justify-center p-4'>
      <div className='w-full max-w-md'>
        {/* Logo */}
        <Link href='/' className='flex items-center justify-center gap-2 mb-8'>
          <div className='w-12 h-12 flex items-center justify-center rounded-xl bg-gradient-to-br from-clinic-navy to-clinic-teal shadow-lg'>
            <Activity className='w-6 h-6 text-white' />
          </div>
          <span className='text-2xl font-display font-bold text-clinic-navy'>
            MediFlow
          </span>
        </Link>

        {/* Setup Card */}
        <div className='bg-white rounded-2xl shadow-glass p-8 border border-clinic-navy/5'>
          <div className='text-center mb-8'>
            <div className='w-16 h-16 mx-auto mb-4 rounded-2xl bg-clinic-teal/10 flex items-center justify-center'>
              <Building2 className='w-8 h-8 text-clinic-teal' />
            </div>
            <h1 className='text-2xl font-display font-bold text-clinic-navy mb-2'>
              Welcome to {clinicName || 'Your Clinic'}!
            </h1>
            <p className='text-clinic-text/60'>
              Hi {adminName}, set up your admin account password to get started.
            </p>
          </div>

          <form onSubmit={handleSubmit} className='space-y-6'>
            {error && (
              <div className='p-3 bg-red-50 border border-red-200 rounded-lg'>
                <p className='text-sm text-red-600'>{error}</p>
              </div>
            )}

            {/* Password */}
            <div className='space-y-2'>
              <Label htmlFor='password' className='text-clinic-navy'>
                Password
              </Label>
              <div className='relative'>
                <Lock className='absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-clinic-text/40' />
                <Input
                  id='password'
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder='Enter your password'
                  className='pl-10 pr-10 h-12 border-clinic-navy/10'
                  required
                />
                <button
                  type='button'
                  onClick={() => setShowPassword(!showPassword)}
                  className='absolute right-3 top-1/2 -translate-y-1/2 text-clinic-text/40 hover:text-clinic-navy'
                >
                  {showPassword ? (
                    <EyeOff className='w-5 h-5' />
                  ) : (
                    <Eye className='w-5 h-5' />
                  )}
                </button>
              </div>
            </div>

            {/* Confirm Password */}
            <div className='space-y-2'>
              <Label htmlFor='confirmPassword' className='text-clinic-navy'>
                Confirm Password
              </Label>
              <div className='relative'>
                <Lock className='absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-clinic-text/40' />
                <Input
                  id='confirmPassword'
                  type={showConfirmPassword ? 'text' : 'password'}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder='Confirm your password'
                  className='pl-10 pr-10 h-12 border-clinic-navy/10'
                  required
                />
                <button
                  type='button'
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className='absolute right-3 top-1/2 -translate-y-1/2 text-clinic-text/40 hover:text-clinic-navy'
                >
                  {showConfirmPassword ? (
                    <EyeOff className='w-5 h-5' />
                  ) : (
                    <Eye className='w-5 h-5' />
                  )}
                </button>
              </div>
            </div>

            {/* Password Requirements */}
            {password && (
              <div className='space-y-2 p-4 bg-clinic-bg rounded-lg border border-clinic-navy/10'>
                <p className='text-sm font-medium text-clinic-navy mb-2'>
                  Password Requirements:
                </p>
                <div className='space-y-1.5'>
                  <RequirementItem
                    met={hasMinLength}
                    text='At least 8 characters'
                  />
                  <RequirementItem
                    met={hasUpperCase}
                    text='One uppercase letter'
                  />
                  <RequirementItem
                    met={hasLowerCase}
                    text='One lowercase letter'
                  />
                  <RequirementItem met={hasNumber} text='One number' />
                  <RequirementItem
                    met={hasSpecialChar}
                    text='One special character'
                  />
                  <RequirementItem
                    met={passwordsMatch}
                    text='Passwords match'
                  />
                </div>

                {/* Strength Indicator */}
                <div className='mt-3 pt-3 border-t border-clinic-navy/10'>
                  <div className='flex items-center justify-between mb-2'>
                    <span className='text-xs font-medium text-clinic-navy'>
                      Password Strength:
                    </span>
                    <span
                      className={`text-xs font-medium ${
                        passwordStrength <= 2
                          ? 'text-red-500'
                          : passwordStrength === 3 || passwordStrength === 4
                            ? 'text-yellow-500'
                            : 'text-green-500'
                      }`}
                    >
                      {passwordStrength <= 2
                        ? 'Weak'
                        : passwordStrength === 3 || passwordStrength === 4
                          ? 'Medium'
                          : 'Strong'}
                    </span>
                  </div>
                  <div className='h-2 bg-clinic-navy/10 rounded-full overflow-hidden'>
                    <div
                      className={`h-full transition-all duration-300 ${
                        passwordStrength <= 2
                          ? 'bg-red-500'
                          : passwordStrength === 3 || passwordStrength === 4
                            ? 'bg-yellow-500'
                            : 'bg-green-500'
                      }`}
                      style={{ width: `${(passwordStrength / 6) * 100}%` }}
                    />
                  </div>
                </div>
              </div>
            )}

            <Button
              type='submit'
              disabled={!isPasswordValid || isLoading}
              className='w-full h-12 bg-clinic-teal hover:bg-clinic-teal/90 text-white font-medium'
            >
              {isLoading ? (
                <>
                  <Loader2 className='w-4 h-4 mr-2 animate-spin' />
                  Setting up...
                </>
              ) : (
                'Complete Setup'
              )}
            </Button>
          </form>

          <p className='text-center text-sm text-clinic-text/60 mt-6'>
            Need help?{' '}
            <Link
              href='/support'
              className='text-clinic-teal hover:underline font-medium'
            >
              Contact Support
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}

function RequirementItem({ met, text }: { met: boolean; text: string }) {
  return (
    <div className='flex items-center gap-2'>
      {met ? (
        <CheckCircle2 className='w-4 h-4 text-green-500' />
      ) : (
        <XCircle className='w-4 h-4 text-clinic-text/30' />
      )}
      <span
        className={`text-xs ${met ? 'text-green-600 font-medium' : 'text-clinic-text/60'}`}
      >
        {text}
      </span>
    </div>
  );
}
