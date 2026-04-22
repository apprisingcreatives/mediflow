'use client';

import { useState, useEffect, useCallback } from 'react';
import { usePathname } from 'next/navigation';
import axios from 'axios';
import { supabase } from '@/lib/supabase';

interface PendingIntake {
  id: string;
  appointment_date: string;
  appointment_time: string;
  clinic_name: string;
}

const usePendingIntakes = (patientId: string | undefined) => {
  const pathname = usePathname();
  const [pendingIntakes, setPendingIntakes] = useState<PendingIntake[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchPendingIntakes = useCallback(async () => {
    if (!patientId) return;

    try {
      setLoading(true);
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) return;

      const { data } = await axios.get(
        `/api/patients/${patientId}/pending-intakes`,
        { headers: { Authorization: `Bearer ${session.access_token}` } },
      );

      setPendingIntakes(data.intakes || []);
    } catch (err) {
      console.error('Failed to fetch pending intakes:', err);
      setPendingIntakes([]);
    } finally {
      setLoading(false);
    }
  }, [patientId]);

  useEffect(() => {
    fetchPendingIntakes();
  }, [fetchPendingIntakes, pathname]);

  return { pendingIntakes, loading, refetch: fetchPendingIntakes };
};

export default usePendingIntakes;
