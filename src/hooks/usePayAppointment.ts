'use client';

import { useState } from 'react';
import axios from 'axios';
import { supabase } from '@/lib/supabase';

export function usePayAppointment() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const pay = async (appointmentId: string) => {
    setLoading(true);
    setError(null);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) throw new Error('Not authenticated');

      const { data } = await axios.post(
        `/api/appointments/${appointmentId}/pay`,
        {},
        { headers: { Authorization: `Bearer ${session.access_token}` } },
      );

      if (data.checkout_url) {
        window.location.href = data.checkout_url;
      }

      return data;
    } catch (err: any) {
      const msg = err?.response?.data?.error || err.message || 'Payment failed';
      setError(msg);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  return { pay, loading, error };
}
