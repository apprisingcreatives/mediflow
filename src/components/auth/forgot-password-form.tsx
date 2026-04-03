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
