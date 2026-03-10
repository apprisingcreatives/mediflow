import { useState } from 'react';
import axios from 'axios';
import { supabase } from '@/lib/supabase';

interface InviteUserParams {
  email: string;
  name: string;
}

interface InviteUserResponse {
  message: string;
  super_admin: {
    id: string;
    email: string;
    name: string;
  };
}

export const useInviteUser = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const inviteUser = async ({ email, name }: InviteUserParams) => {
    setLoading(true);
    setError(null);
    setSuccess(false);

    try {
      // Get current session
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        throw new Error('Not authenticated');
      }

      // Call API with auth token
      const { data } = await axios.post<InviteUserResponse>(
        '/api/super-admin/invite-user',
        { email, name },
        {
          headers: {
            'Authorization': `Bearer ${session.access_token}`,
          },
        }
      );

      setSuccess(true);
      return data;
    } catch (err) {
      const errorMessage = axios.isAxiosError(err)
        ? err.response?.data?.error || err.message
        : err instanceof Error
        ? err.message
        : 'An error occurred';
      
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const resetState = () => {
    setError(null);
    setSuccess(false);
  };

  return {
    inviteUser,
    loading,
    error,
    success,
    resetState,
  };
};
