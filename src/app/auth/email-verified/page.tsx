'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { Activity, CheckCircle, Loader2, AlertCircle } from 'lucide-react';

export default function EmailVerifiedPage() {
  const router = useRouter();
  const [status, setStatus] = useState<'verifying' | 'success' | 'error'>(
    'verifying',
  );
  const [message, setMessage] = useState('Verifying your email...');

  useEffect(() => {
    let mounted = true;

    async function activate() {
      try {
        // Extract tokens from URL hash (Supabase sends them as hash params)
        if (typeof window !== 'undefined') {
          const urlHash = window.location.hash.replace(/^#/, '');

          const hashParams = new URLSearchParams(urlHash);

          const access_token = hashParams.get('access_token');
          const refresh_token = hashParams.get('refresh_token');
          if (access_token) {
            const { error: setError } = await supabase.auth.setSession({
              access_token,
              refresh_token: refresh_token ?? '',
            });

            if (setError) {
              console.error('setSession error:', setError);
              if (!mounted) return;
              setStatus('error');
              setMessage(
                'Failed to verify session. Please try signing in.',
              );
              return;
            }

            // Clear hash to avoid re-processing
            try {
              history.replaceState(
                null,
                '',
                window.location.pathname + window.location.search,
              );
            } catch (_) {}
          }

          const { data: sessionData } = await supabase.auth.getSession();
          if (!mounted) return;

          if (!sessionData.session) {
            setStatus('error');
            setMessage('No active session. Please sign in to continue.');
            return;
          }

          setMessage('Activating your account...');

          // Call the activate API to create patient record
          const response = await fetch('/api/auth/activate', {
            method: 'POST',
            headers: {
              Authorization: `Bearer ${sessionData.session.access_token}`,
              'Content-Type': 'application/json',
            },
          });

          if (!response.ok) {
            const data = await response.json();
            throw new Error(data.error || 'Activation failed');
          }

          if (!mounted) return;

          setStatus('success');
          setMessage('Your email has been verified and your account is active!');

          setTimeout(() => {
            router.push('/patient/profile/setup');
          }, 2000);
        }
      } catch (err) {
        console.error('Activation error:', err);
        if (!mounted) return;
        setStatus('error');
        setMessage(
          err instanceof Error
            ? err.message
            : 'An unexpected error occurred.',
        );
      }
    }

    activate();

    return () => {
      mounted = false;
    };
  }, [router]);

  return (
    <div className='min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800 p-4'>
      <div className='w-full max-w-md bg-white dark:bg-slate-800 rounded-2xl shadow-xl p-8 text-center'>
        <div className='flex justify-center mb-6'>
          <div className='w-14 h-14 flex items-center justify-center rounded-2xl bg-gradient-to-br from-clinic-navy to-clinic-teal'>
            <Activity className='w-7 h-7 text-white' />
          </div>
        </div>

        {status === 'verifying' && (
          <>
            <Loader2 className='w-10 h-10 animate-spin text-clinic-teal mx-auto mb-4' />
            <h1 className='font-display text-2xl font-bold text-clinic-navy dark:text-white mb-2'>
              Verifying Email
            </h1>
            <p className='text-clinic-text/60 dark:text-white/60'>{message}</p>
          </>
        )}

        {status === 'success' && (
          <>
            <div className='w-16 h-16 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center mx-auto mb-4'>
              <CheckCircle className='w-8 h-8 text-green-600 dark:text-green-400' />
            </div>
            <h1 className='font-display text-2xl font-bold text-clinic-navy dark:text-white mb-2'>
              Email Verified!
            </h1>
            <p className='text-clinic-text/60 dark:text-white/60 mb-4'>
              {message}
            </p>
            <p className='text-sm text-clinic-text/40 dark:text-white/40'>
              Redirecting to complete your profile...
            </p>
          </>
        )}

        {status === 'error' && (
          <>
            <div className='w-16 h-16 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center mx-auto mb-4'>
              <AlertCircle className='w-8 h-8 text-red-600 dark:text-red-400' />
            </div>
            <h1 className='font-display text-2xl font-bold text-clinic-navy dark:text-white mb-2'>
              Verification Failed
            </h1>
            <p className='text-red-600 dark:text-red-400 mb-4'>{message}</p>
            <button
              onClick={() => router.push('/login')}
              className='text-clinic-teal hover:underline font-medium'
            >
              Go to Sign In
            </button>
          </>
        )}
      </div>
    </div>
  );
}
