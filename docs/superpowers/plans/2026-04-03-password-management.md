# Password Management Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add forgot password and change password features for all 4 user roles (patient, clinic admin, practitioner, super admin).

**Architecture:** Three shared React components (`ForgotPasswordForm`, `ResetPasswordForm`, `ChangePasswordForm`) handle all logic via Supabase Auth client methods. Role-specific pages are thin wrappers passing configuration props. No new API routes needed.

**Tech Stack:** Next.js 14 App Router, TypeScript, Supabase Auth (`resetPasswordForEmail`, `updateUser`, `signInWithPassword`, `signOut`), Radix UI components, Zod validation, Sonner toasts

---

## File Structure

**New shared components (3):**
- `src/components/auth/forgot-password-form.tsx` — email input, sends reset email, 60s cooldown
- `src/components/auth/reset-password-form.tsx` — new password form, extracts token from URL hash, sets session
- `src/components/auth/change-password-form.tsx` — current + new password form, verifies current, invalidates other sessions

**New forgot password pages (4):**
- `src/app/(auth)/forgot-password/page.tsx`
- `src/app/(clinic)/clinic/forgot-password/page.tsx`
- `src/app/(practitioner)/practitioner/forgot-password/page.tsx`
- `src/app/(super-admin)/super-admin/forgot-password/page.tsx`

**New reset password pages (4):**
- `src/app/(auth)/reset-password/page.tsx`
- `src/app/(clinic)/clinic/reset-password/page.tsx`
- `src/app/(practitioner)/practitioner/reset-password/page.tsx`
- `src/app/(super-admin)/super-admin/reset-password/page.tsx`

**New change password pages (4):**
- `src/app/(dashboard)/patient/change-password/page.tsx`
- `src/app/(clinic)/clinic/[clinicId]/settings/change-password/page.tsx`
- `src/app/(practitioner)/practitioner/[practitionerId]/clinic/[clinicId]/profile/change-password/page.tsx`
- `src/app/(super-admin)/super-admin/change-password/page.tsx`

**Modified files (3):**
- `src/app/(clinic)/clinic/login/page.tsx` — add forgot password link
- `src/app/(super-admin)/super-admin/login/page.tsx` — add forgot password link
- `src/app/(clinic)/clinic/[clinicId]/settings/page.tsx` — wire change password button

---

### Task 1: ForgotPasswordForm component

**Files:**
- Create: `src/components/auth/forgot-password-form.tsx`

- [ ] **Step 1: Create the ForgotPasswordForm component**

```tsx
'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Activity, Mail, ArrowLeft, Loader2, CheckCircle2 } from 'lucide-react';
import { toast } from 'sonner';

interface ForgotPasswordFormProps {
  redirectTo: string;
  loginHref: string;
  title?: string;
  subtitle?: string;
}

export function ForgotPasswordForm({
  redirectTo,
  loginHref,
  title = 'Forgot Password',
  subtitle = 'Enter your email and we\'ll send you a reset link',
}: ForgotPasswordFormProps) {
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [cooldown, setCooldown] = useState(0);

  useEffect(() => {
    if (cooldown <= 0) return;
    const timer = setTimeout(() => setCooldown(cooldown - 1), 1000);
    return () => clearTimeout(timer);
  }, [cooldown]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (cooldown > 0) return;

    setIsLoading(true);

    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo,
      });

      if (error) {
        console.error('Reset password error:', error);
      }

      // Always show success to prevent email enumeration
      setIsSubmitted(true);
      setCooldown(60);
    } catch (err) {
      toast.error('An unexpected error occurred. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className='min-h-screen bg-clinic-bg dark:bg-slate-900 flex items-center justify-center px-4'>
      <div className='w-full max-w-md'>
        <div className='text-center mb-8'>
          <div className='inline-flex items-center justify-center w-12 h-12 rounded-xl bg-gradient-to-br from-clinic-navy to-clinic-teal mb-4'>
            <Activity className='w-6 h-6 text-white' />
          </div>
          <h1 className='font-display text-3xl font-bold text-clinic-navy dark:text-white mb-2'>
            {title}
          </h1>
          <p className='text-clinic-text/60 dark:text-white/60'>{subtitle}</p>
        </div>

        <div className='bg-white dark:bg-slate-800 rounded-2xl shadow-glass p-8'>
          {isSubmitted ? (
            <div className='text-center space-y-4'>
              <div className='w-12 h-12 rounded-full bg-green-100 dark:bg-green-900/20 flex items-center justify-center mx-auto'>
                <CheckCircle2 className='w-6 h-6 text-green-600 dark:text-green-400' />
              </div>
              <div>
                <h2 className='font-semibold text-clinic-navy dark:text-white mb-1'>
                  Check your email
                </h2>
                <p className='text-sm text-clinic-text/60 dark:text-white/60'>
                  If an account exists for <strong>{email}</strong>, you will
                  receive a password reset link shortly.
                </p>
              </div>
              <Button
                variant='outline'
                onClick={() => {
                  setIsSubmitted(false);
                  setEmail('');
                }}
                disabled={cooldown > 0}
                className='w-full'
              >
                {cooldown > 0
                  ? `Resend available in ${cooldown}s`
                  : 'Send another link'}
              </Button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className='space-y-5'>
              <div className='space-y-2'>
                <Label
                  htmlFor='email'
                  className='text-clinic-navy dark:text-white'
                >
                  Email Address
                </Label>
                <div className='relative'>
                  <Mail className='absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-clinic-text/40' />
                  <Input
                    id='email'
                    type='email'
                    placeholder='you@example.com'
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className='pl-12 h-12 border-clinic-navy/20 dark:border-white/20'
                    disabled={isLoading}
                  />
                </div>
              </div>

              <Button
                type='submit'
                disabled={isLoading || !email}
                className='w-full h-12 bg-clinic-teal hover:bg-clinic-teal/90 text-white'
              >
                {isLoading ? (
                  <>
                    <Loader2 className='w-4 h-4 mr-2 animate-spin' />
                    Sending...
                  </>
                ) : (
                  'Send Reset Link'
                )}
              </Button>
            </form>
          )}
        </div>

        <p className='text-center mt-6 text-sm text-clinic-text/60 dark:text-white/60'>
          <Link
            href={loginHref}
            className='text-clinic-teal hover:underline inline-flex items-center gap-1'
          >
            <ArrowLeft className='w-4 h-4' />
            Back to login
          </Link>
        </p>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Verify it compiles**

Run: `npx tsc --noEmit src/components/auth/forgot-password-form.tsx 2>&1 | head -20`
Expected: No errors (or only unrelated errors from other files)

- [ ] **Step 3: Commit**

```bash
git add src/components/auth/forgot-password-form.tsx
git commit -m "feat: add ForgotPasswordForm shared component"
```

---

### Task 2: ResetPasswordForm component

**Files:**
- Create: `src/components/auth/reset-password-form.tsx`

- [ ] **Step 1: Create the ResetPasswordForm component**

```tsx
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
```

- [ ] **Step 2: Verify it compiles**

Run: `npx tsc --noEmit src/components/auth/reset-password-form.tsx 2>&1 | head -20`
Expected: No errors

- [ ] **Step 3: Commit**

```bash
git add src/components/auth/reset-password-form.tsx
git commit -m "feat: add ResetPasswordForm shared component"
```

---

### Task 3: ChangePasswordForm component

**Files:**
- Create: `src/components/auth/change-password-form.tsx`

- [ ] **Step 1: Create the ChangePasswordForm component**

```tsx
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
```

- [ ] **Step 2: Verify it compiles**

Run: `npx tsc --noEmit src/components/auth/change-password-form.tsx 2>&1 | head -20`
Expected: No errors

- [ ] **Step 3: Commit**

```bash
git add src/components/auth/change-password-form.tsx
git commit -m "feat: add ChangePasswordForm shared component"
```

---

### Task 4: Patient forgot password page

**Files:**
- Create: `src/app/(auth)/forgot-password/page.tsx`

- [ ] **Step 1: Create the page**

```tsx
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
```

- [ ] **Step 2: Commit**

```bash
git add src/app/\(auth\)/forgot-password/page.tsx
git commit -m "feat: add patient forgot password page"
```

---

### Task 5: Clinic admin forgot password page

**Files:**
- Create: `src/app/(clinic)/clinic/forgot-password/page.tsx`

- [ ] **Step 1: Create the page**

```tsx
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
```

- [ ] **Step 2: Commit**

```bash
git add src/app/\(clinic\)/clinic/forgot-password/page.tsx
git commit -m "feat: add clinic admin forgot password page"
```

---

### Task 6: Practitioner forgot password page

**Files:**
- Create: `src/app/(practitioner)/practitioner/forgot-password/page.tsx`

- [ ] **Step 1: Create the page**

```tsx
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
```

- [ ] **Step 2: Commit**

```bash
git add src/app/\(practitioner\)/practitioner/forgot-password/page.tsx
git commit -m "feat: add practitioner forgot password page"
```

---

### Task 7: Super admin forgot password page

**Files:**
- Create: `src/app/(super-admin)/super-admin/forgot-password/page.tsx`

- [ ] **Step 1: Create the page**

```tsx
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
```

- [ ] **Step 2: Commit**

```bash
git add src/app/\(super-admin\)/super-admin/forgot-password/page.tsx
git commit -m "feat: add super admin forgot password page"
```

---

### Task 8: Patient reset password page

**Files:**
- Create: `src/app/(auth)/reset-password/page.tsx`

- [ ] **Step 1: Create the page**

```tsx
import { ResetPasswordForm } from '@/components/auth/reset-password-form';

export default function PatientResetPasswordPage() {
  return (
    <ResetPasswordForm
      loginHref='/login'
      forgotPasswordHref='/forgot-password'
    />
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add src/app/\(auth\)/reset-password/page.tsx
git commit -m "feat: add patient reset password page"
```

---

### Task 9: Clinic admin reset password page

**Files:**
- Create: `src/app/(clinic)/clinic/reset-password/page.tsx`

- [ ] **Step 1: Create the page**

```tsx
import { ResetPasswordForm } from '@/components/auth/reset-password-form';

export default function ClinicResetPasswordPage() {
  return (
    <ResetPasswordForm
      loginHref='/clinic/login'
      forgotPasswordHref='/clinic/forgot-password'
    />
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add src/app/\(clinic\)/clinic/reset-password/page.tsx
git commit -m "feat: add clinic admin reset password page"
```

---

### Task 10: Practitioner reset password page

**Files:**
- Create: `src/app/(practitioner)/practitioner/reset-password/page.tsx`

- [ ] **Step 1: Create the page**

```tsx
import { ResetPasswordForm } from '@/components/auth/reset-password-form';

export default function PractitionerResetPasswordPage() {
  return (
    <ResetPasswordForm
      loginHref='/login'
      forgotPasswordHref='/practitioner/forgot-password'
    />
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add src/app/\(practitioner\)/practitioner/reset-password/page.tsx
git commit -m "feat: add practitioner reset password page"
```

---

### Task 11: Super admin reset password page

**Files:**
- Create: `src/app/(super-admin)/super-admin/reset-password/page.tsx`

- [ ] **Step 1: Create the page**

```tsx
import { ResetPasswordForm } from '@/components/auth/reset-password-form';

export default function SuperAdminResetPasswordPage() {
  return (
    <ResetPasswordForm
      loginHref='/super-admin/login'
      forgotPasswordHref='/super-admin/forgot-password'
    />
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add src/app/\(super-admin\)/super-admin/reset-password/page.tsx
git commit -m "feat: add super admin reset password page"
```

---

### Task 12: Patient change password page

**Files:**
- Create: `src/app/(dashboard)/patient/change-password/page.tsx`

- [ ] **Step 1: Create the page**

```tsx
import { ChangePasswordForm } from '@/components/auth/change-password-form';

export default function PatientChangePasswordPage() {
  return (
    <div className='min-h-screen bg-clinic-bg dark:bg-slate-900 py-12 px-4'>
      <ChangePasswordForm backHref='/patient' />
    </div>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add src/app/\(dashboard\)/patient/change-password/page.tsx
git commit -m "feat: add patient change password page"
```

---

### Task 13: Clinic admin change password page

**Files:**
- Create: `src/app/(clinic)/clinic/[clinicId]/settings/change-password/page.tsx`

- [ ] **Step 1: Create the page**

```tsx
'use client';

import { useParams } from 'next/navigation';
import { ChangePasswordForm } from '@/components/auth/change-password-form';

export default function ClinicChangePasswordPage() {
  const params = useParams();
  const clinicId = params.clinicId as string;

  return (
    <div className='py-8 px-4'>
      <ChangePasswordForm backHref={`/clinic/${clinicId}/settings`} />
    </div>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add src/app/\(clinic\)/clinic/\[clinicId\]/settings/change-password/page.tsx
git commit -m "feat: add clinic admin change password page"
```

---

### Task 14: Practitioner change password page

**Files:**
- Create: `src/app/(practitioner)/practitioner/[practitionerId]/clinic/[clinicId]/profile/change-password/page.tsx`

- [ ] **Step 1: Create the page**

```tsx
'use client';

import { useParams } from 'next/navigation';
import { ChangePasswordForm } from '@/components/auth/change-password-form';

export default function PractitionerChangePasswordPage() {
  const params = useParams();
  const practitionerId = params.practitionerId as string;
  const clinicId = params.clinicId as string;

  return (
    <div className='py-8 px-4'>
      <ChangePasswordForm
        backHref={`/practitioner/${practitionerId}/clinic/${clinicId}/profile`}
      />
    </div>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add "src/app/(practitioner)/practitioner/[practitionerId]/clinic/[clinicId]/profile/change-password/page.tsx"
git commit -m "feat: add practitioner change password page"
```

---

### Task 15: Super admin change password page

**Files:**
- Create: `src/app/(super-admin)/super-admin/change-password/page.tsx`

- [ ] **Step 1: Create the page**

```tsx
import { ChangePasswordForm } from '@/components/auth/change-password-form';

export default function SuperAdminChangePasswordPage() {
  return (
    <div className='min-h-screen bg-clinic-bg dark:bg-slate-900 py-12 px-4'>
      <ChangePasswordForm backHref='/super-admin/dashboard' />
    </div>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add src/app/\(super-admin\)/super-admin/change-password/page.tsx
git commit -m "feat: add super admin change password page"
```

---

### Task 16: Wire up clinic admin login — add forgot password link

**Files:**
- Modify: `src/app/(clinic)/clinic/login/page.tsx:133-138`

- [ ] **Step 1: Add forgot password link to the password field**

In `src/app/(clinic)/clinic/login/page.tsx`, find the password label section (around line 133-138):

```tsx
            <div className='space-y-2'>
              <Label
                htmlFor='password'
                className='text-clinic-navy dark:text-white'
              >
                Password
              </Label>
```

Replace with:

```tsx
            <div className='space-y-2'>
              <div className='flex items-center justify-between'>
                <Label
                  htmlFor='password'
                  className='text-clinic-navy dark:text-white'
                >
                  Password
                </Label>
                <Link
                  href='/clinic/forgot-password'
                  className='text-sm text-clinic-teal hover:underline'
                >
                  Forgot password?
                </Link>
              </div>
```

- [ ] **Step 2: Verify the page compiles**

Run: `npx tsc --noEmit src/app/\(clinic\)/clinic/login/page.tsx 2>&1 | head -20`
Expected: No errors

- [ ] **Step 3: Commit**

```bash
git add src/app/\(clinic\)/clinic/login/page.tsx
git commit -m "feat: add forgot password link to clinic admin login"
```

---

### Task 17: Wire up super admin login — add forgot password link

**Files:**
- Modify: `src/app/(super-admin)/super-admin/login/page.tsx:155-161`

- [ ] **Step 1: Add forgot password link to the password field**

In `src/app/(super-admin)/super-admin/login/page.tsx`, find the password label section (around line 155-161):

```tsx
            <div className='space-y-2'>
              <Label
                htmlFor='password'
                className='text-clinic-navy dark:text-white'
              >
                Password
              </Label>
```

Replace with:

```tsx
            <div className='space-y-2'>
              <div className='flex items-center justify-between'>
                <Label
                  htmlFor='password'
                  className='text-clinic-navy dark:text-white'
                >
                  Password
                </Label>
                <Link
                  href='/super-admin/forgot-password'
                  className='text-sm text-clinic-teal hover:underline'
                >
                  Forgot password?
                </Link>
              </div>
```

- [ ] **Step 2: Verify the page compiles**

Run: `npx tsc --noEmit src/app/\(super-admin\)/super-admin/login/page.tsx 2>&1 | head -20`
Expected: No errors

- [ ] **Step 3: Commit**

```bash
git add src/app/\(super-admin\)/super-admin/login/page.tsx
git commit -m "feat: add forgot password link to super admin login"
```

---

### Task 18: Wire up clinic settings — change password button

**Files:**
- Modify: `src/app/(clinic)/clinic/[clinicId]/settings/page.tsx:1,201`

- [ ] **Step 1: Add Link import if not already present**

Check the imports at the top of `src/app/(clinic)/clinic/[clinicId]/settings/page.tsx`. If `Link` from `next/link` is not imported, add it. Also ensure `useParams` is imported from `next/navigation`.

- [ ] **Step 2: Replace the Change Password button**

Find line 201:

```tsx
          <Button variant='outline'>Change Password</Button>
```

Replace with:

```tsx
          <Link href={`/clinic/${clinicId}/settings/change-password`}>
            <Button variant='outline'>Change Password</Button>
          </Link>
```

Note: `clinicId` should come from `useParams()`. Check if the page already extracts it — if so, use the existing variable. If not, add:

```tsx
const params = useParams();
const clinicId = params.clinicId as string;
```

- [ ] **Step 3: Verify the page compiles**

Run: `npx tsc --noEmit src/app/\(clinic\)/clinic/\[clinicId\]/settings/page.tsx 2>&1 | head -20`
Expected: No errors

- [ ] **Step 4: Commit**

```bash
git add src/app/\(clinic\)/clinic/\[clinicId\]/settings/page.tsx
git commit -m "feat: wire change password button to dedicated page"
```

---

### Task 19: Build verification

**Files:** None (verification only)

- [ ] **Step 1: Run full TypeScript check**

Run: `npx tsc --noEmit 2>&1 | head -40`
Expected: No new errors introduced by the password management feature

- [ ] **Step 2: Run Next.js build check**

Run: `npx next build 2>&1 | tail -30`
Expected: Build succeeds. All 15 new pages should appear in the build output.

- [ ] **Step 3: Verify all new routes are accessible**

Start dev server and manually verify these URLs load without errors:
- `/forgot-password`
- `/reset-password` (will show token error — expected)
- `/clinic/forgot-password`
- `/clinic/reset-password` (will show token error — expected)
- `/practitioner/forgot-password`
- `/practitioner/reset-password` (will show token error — expected)
- `/super-admin/forgot-password`
- `/super-admin/reset-password` (will show token error — expected)

- [ ] **Step 4: Verify login page links**

- `/login` — "Forgot password?" link points to `/forgot-password`
- `/clinic/login` — "Forgot password?" link points to `/clinic/forgot-password`
- `/super-admin/login` — "Forgot password?" link points to `/super-admin/forgot-password`
