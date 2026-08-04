'use client';

import { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { supabase } from '@/lib/supabase';

interface NotificationPreferences {
  phone_e164: string | null;
  sms_enabled: boolean;
  sms_opted_out: boolean;
}

const useNotificationPreferences = () => {
  const [preferences, setPreferences] = useState<NotificationPreferences | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const getAuthHeader = async () => {
    const {
      data: { session },
    } = await supabase.auth.getSession();
    return session?.access_token
      ? { Authorization: `Bearer ${session.access_token}` }
      : null;
  };

  const fetchPreferences = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const headers = await getAuthHeader();
      if (!headers) return;

      const { data } = await axios.get('/api/patient/notification-preferences', {
        headers,
      });
      setPreferences(data.preferences);
    } catch (err) {
      console.error('Failed to fetch notification preferences:', err);
      setError('Failed to load preferences');
    } finally {
      setLoading(false);
    }
  }, []);

  const updatePreferences = useCallback(
    async (updates: { phone?: string; sms_enabled?: boolean }) => {
      try {
        setLoading(true);
        setError(null);
        const headers = await getAuthHeader();
        if (!headers) return null;

        const { data } = await axios.put(
          '/api/patient/notification-preferences',
          updates,
          { headers },
        );
        setPreferences(data.preferences);
        return data.preferences;
      } catch (err: any) {
        const msg =
          err.response?.data?.error || 'Failed to update preferences';
        setError(msg);
        return null;
      } finally {
        setLoading(false);
      }
    },
    [],
  );

  useEffect(() => {
    fetchPreferences();
  }, [fetchPreferences]);

  return { preferences, loading, error, updatePreferences, refreshPreferences: fetchPreferences };
};

export default useNotificationPreferences;
