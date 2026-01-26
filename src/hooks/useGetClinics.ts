import { ClinicWithDetails } from '@/types/database';
import axios from 'axios';
import { useState } from 'react';

const useGetClinics = () => {
  const [clinics, setClinics] = useState<ClinicWithDetails[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const sendRequest = async () => {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000);

    try {
      setLoading(true);
      const { data } = await axios.get('/api/clinics', {
        signal: controller.signal,
        headers: {
          'Cache-Control': 'no-store',
        },
      });
      clearTimeout(timeoutId);

      if (data.clinics && data.clinics.length > 0) {
        setClinics(data.clinics);
      }
    } catch (error) {
      if (axios.isCancel(error)) {
        console.log('Request cancelled:', error.message);
      } else {
        console.error('Failed to fetch clinics:', error);
        setError(
          error instanceof Error ? error.message : 'Failed to fetch clinics',
        );
      }
    } finally {
      setLoading(false);
    }
  };
  return { clinics, loading, error, sendRequest };
};

export default useGetClinics;
