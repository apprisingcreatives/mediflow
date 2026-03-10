'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';

export default function EmailVerifiedPage() {
  const [status, setStatus] = useState('Verifying...');

  useEffect(() => {
    let mounted = true;

    async function activate() {
      try {
        // Try to extract tokens from URL (hash or query) and set session manually.
        if (typeof window !== 'undefined') {
          const urlSearch = window.location.search;
          const urlHash = window.location.hash.replace(/^#/, '');

          const params = new URLSearchParams(urlHash || urlSearch);
          const access_token = params.get('access_token');
          const refresh_token = params.get('refresh_token');

          if (access_token) {
            // setSession expects an object with access_token and refresh_token
            const { data: setData, error: setError } =
              await supabase.auth.setSession({
                access_token,
                refresh_token: refresh_token ?? '',
              });

            if (setError) {
              console.warn('setSession error', setError);
            } else {
              // Clear hash to avoid re-processing
              try {
                history.replaceState(
                  null,
                  '',
                  window.location.pathname + window.location.search,
                );
              } catch (e) {}
            }
          }
        }

        const { data: sessionData } = await supabase.auth.getSession();

        if (!mounted) return;

        if (!sessionData.session) {
          setStatus(
            'No active session after redirect. Please sign in to continue.',
          );
          return;
        }

        setStatus('Activating account...');

        const { error } = await supabase.rpc(
          'activate_patient_for_current_user',
        );

        if (error) {
          console.error('RPC activation error:', error);
          setStatus('Activation failed. Contact support.');
          return;
        }

        setStatus('Your account is verified and active. You may continue.');
      } catch (err) {
        console.error(err);
        setStatus('An unexpected error occurred.');
      }
    }

    activate();

    return () => {
      mounted = false;
    };
  }, []);

  return (
    <div className='min-h-screen flex items-center justify-center'>
      <div className='prose text-center'>
        <h1>Email verified</h1>
        <p>{status}</p>
      </div>
    </div>
  );
}
