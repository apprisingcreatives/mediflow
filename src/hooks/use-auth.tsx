'use client';

import {
  createContext,
  useContext,
  useEffect,
  useState,
  ReactNode,
} from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabase';
import { Patient } from '@/types/database';
import { isClinicStaff } from '@/lib/permissions';

interface Practitioner {
  id: string;
  clinic_id: string;
  auth_user_id: string | null;
  name: string;
  email: string | null;
  specialization: string | null;
  is_active: boolean;
  role: string | null;
}

interface SignInResult {
  error: Error | null;
  redirectTo?: string;
}

interface AuthContextType {
  user: User | null;
  session: Session | null;
  patient: Patient | null;
  practitioner: Practitioner | null;
  isLoading: boolean;
  signIn: (email: string, password: string) => Promise<SignInResult>;
  signUp: (
    email: string,
    password: string,
    firstName: string,
    lastName: string,
    clinicId?: string,
  ) => Promise<{ error: Error | null }>;
  signInWithGoogle: () => Promise<{ error: Error | null }>;
  signInWithApple: () => Promise<{ error: Error | null }>;
  signOut: () => Promise<void>;
  refreshPatient: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [patient, setPatient] = useState<Patient | null>(null);
  const [practitioner, setPractitioner] = useState<Practitioner | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const fetchPatient = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('patients')
        .select('*')
        .eq('auth_user_id', userId)
        .single();

      if (error && error.code !== 'PGRST116') {
        console.error('Error fetching patient:', error);
      }
      setPatient(data);
    } catch (err) {
      console.error('Failed to fetch patient:', err);
    }
  };

  const fetchPractitioner = async (
    userId: string,
  ): Promise<Practitioner | null> => {
    try {
      // Practitioners can belong to multiple clinics, get the first active one
      const { data, error } = await supabase
        .from('practitioners')
        .select(
          'id, clinic_id, auth_user_id, name, email, specialization, is_active, role',
        )
        .eq('auth_user_id', userId)
        .eq('is_active', true)
        .limit(1)
        .single();

      if (error && error.code !== 'PGRST116') {
        console.error('Error fetching practitioner:', error);
      }
      setPractitioner(data);
      return data;
    } catch (err) {
      console.error('Failed to fetch practitioner:', err);
      return null;
    }
  };

  const refreshPatient = async () => {
    const role = user?.user_metadata?.role;
    if (user && (!role || role === 'patient')) {
      await fetchPatient(user.id);
    }
  };

  useEffect(() => {
    let isMounted = true;
    let currentUserId: string | null = null;

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (!isMounted) return;

      if (event === 'TOKEN_REFRESHED') {
        setSession(session);
        return;
      }

      setSession(session);
      setUser(session?.user ?? null);

      if (session?.user) {
        const role = session.user.user_metadata?.role;
        if (session.user.id !== currentUserId && (!role || role === 'patient')) {
          currentUserId = session.user.id;
          await fetchPatient(session.user.id);
        }
      } else {
        currentUserId = null;
        setPatient(null);
      }

      setIsLoading(false);
    });

    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, []);

  const signIn = async (
    email: string,
    password: string,
  ): Promise<SignInResult> => {
    try {
      // First, authenticate with Supabase Auth
      const { data: authData, error: authError } =
        await supabase.auth.signInWithPassword({
          email,
          password,
        });

      // If auth failed, return the error
      if (authError) {
        return { error: authError };
      }

      // If auth succeeded, check role and verify account is activated
      if (authData.user) {
        const role = authData.user.user_metadata.role;

        if (role === 'patient') {
          // Fetch patient data
          const { data: patientData, error: patientError } = await supabase
            .from('patients')
            .select('*')
            .eq('auth_user_id', authData.user.id)
            .single();

          // Set patient state
          if (patientData) {
            setPatient(patientData);
          }

          return { error: null, redirectTo: '/patient' };
        } else if (role === 'clinic_practitioner' || isClinicStaff({ role })) {
          // Fetch practitioner data - get first active practitioner record
          const { data: practitionerData, error: practitionerError } =
            await supabase
              .from('practitioners')
              .select(
                'id, clinic_id, auth_user_id, name, email, specialization, is_active, role',
              )
              .eq('auth_user_id', authData.user.id)
              .eq('is_active', true)
              .limit(1)
              .single();

          // Check if practitioner exists and is active
          if (practitionerError) {
            if (practitionerError.code === 'PGRST116') {
              // No practitioner record found
              await supabase.auth.signOut();
              return {
                error: new Error(
                  'No active practitioner account found. Please contact your clinic administrator.',
                ),
              };
            }
            console.error('Error fetching practitioner:', practitionerError);
          }

          if (!practitionerData) {
            await supabase.auth.signOut();
            return {
              error: new Error(
                'No active practitioner account found. Please contact your clinic administrator.',
              ),
            };
          }

          if (!practitionerData.is_active) {
            // Account exists but is not activated
            await supabase.auth.signOut();
            return {
              error: new Error(
                'This account is not yet activated, please check your email.',
              ),
            };
          }

          // Set practitioner state
          setPractitioner(practitionerData);

          // Redirect to practitioner dashboard
          return {
            error: null,
            redirectTo: `/practitioner/${practitionerData.id}/clinic/${practitionerData.clinic_id}/dashboard`,
          };
        } else if (role === 'clinic_admin') {
          // Clinic admins go to their clinic dashboard
          return { error: null, redirectTo: '/clinic' };
        }
      }

      return { error: null };
    } catch (err) {
      return { error: new Error('An unexpected error occurred during login') };
    }
  };

  const signUp = async (
    email: string,
    password: string,
    firstName: string,
    lastName: string,
    clinicId?: string,
  ) => {
    try {
      const redirectTo =
        typeof window !== 'undefined'
          ? `${window.location.origin}/auth/email-verified${clinicId ? `?clinic=${clinicId}` : ''}`
          : undefined;

      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: redirectTo,
          data: {
            first_name: firstName,
            last_name: lastName,
            role: 'patient',
          },
        },
      });

      if (error) {
        return { error };
      }

      if (!data.user) {
        return { error: new Error('Failed to create user account') };
      }

      // Patient record is created after email verification on the email-verified page.
      return { error: null };
    } catch (err) {
      return { error: new Error('An unexpected error occurred during signup') };
    }
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setSession(null);
    setPatient(null);
    setPractitioner(null);
  };

  const signInWithGoogle = async () => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/patient`,
      },
    });
    return { error };
  };

  const signInWithApple = async () => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'apple',
      options: {
        redirectTo: `${window.location.origin}/patient`,
      },
    });
    return { error };
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        session,
        patient,
        practitioner,
        isLoading,
        signIn,
        signUp,
        signInWithGoogle,
        signInWithApple,
        signOut,
        refreshPatient,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
