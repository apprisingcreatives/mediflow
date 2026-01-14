"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
  ReactNode,
} from "react";
import { User, Session } from "@supabase/supabase-js";
import { supabase } from "@/lib/supabase";
import { Patient } from "@/types/database";

interface AuthContextType {
  user: User | null;
  session: Session | null;
  patient: Patient | null;
  isLoading: boolean;
  signIn: (email: string, password: string) => Promise<{ error: Error | null }>;
  signUp: (
    email: string,
    password: string,
    firstName: string,
    lastName: string
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
  const [isLoading, setIsLoading] = useState(true);

  const fetchPatient = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from("patients")
        .select("*")
        .eq("auth_user_id", userId)
        .single();

      if (error && error.code !== "PGRST116") {
        console.error("Error fetching patient:", error);
      }
      setPatient(data);
    } catch (err) {
      console.error("Failed to fetch patient:", err);
    }
  };

  const refreshPatient = async () => {
    if (user) {
      await fetchPatient(user.id);
    }
  };

  useEffect(() => {
    const getSession = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      setSession(session);
      setUser(session?.user ?? null);

      if (session?.user) {
        await fetchPatient(session.user.id);
      }

      setIsLoading(false);
    };

    getSession();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      setSession(session);
      setUser(session?.user ?? null);

      if (session?.user) {
        await fetchPatient(session.user.id);
      } else {
        setPatient(null);
      }

      setIsLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    return { error };
  };

  const signUp = async (
    email: string,
    password: string,
    firstName: string,
    lastName: string
  ) => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          first_name: firstName,
          last_name: lastName,
        },
      },
    });

    if (!error && data.user) {
      // Create patient record
      const { error: patientError } = await supabase.from("patients").insert({
        auth_user_id: data.user.id,
        email: email,
        first_name: firstName,
        last_name: lastName,
        onboarding_completed: false,
      });

      if (patientError) {
        console.error("Error creating patient record:", patientError);
        return { error: new Error("Failed to create patient profile") };
      }

      // Queue welcome email
      await supabase.from("email_notifications").insert({
        recipient_email: email,
        recipient_name: `${firstName} ${lastName}`,
        recipient_type: "patient",
        subject: "Welcome to MediFlow",
        body: `Dear ${firstName}, Welcome to MediFlow! Your account has been created successfully. Complete your health profile to get started.`,
        html_body: `<h1>Welcome to MediFlow!</h1><p>Dear ${firstName},</p><p>Welcome to MediFlow! Your account has been created successfully.</p><p>Complete your health profile to get personalized care recommendations.</p>`,
        notification_type: "welcome_patient",
        status: "pending",
      });
    }

    return { error };
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setSession(null);
    setPatient(null);
  };

  const signInWithGoogle = async () => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${window.location.origin}/patient`,
      },
    });
    return { error };
  };

  const signInWithApple = async () => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "apple",
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
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
