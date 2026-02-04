"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
  ReactNode,
} from "react";
import { User, Session } from "@supabase/supabase-js";
import { supabase,  } from "@/lib/supabase";
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
    lastName: string,
    clinicId?: string
  ) => Promise<{ error: Error | null }>;
  signInWithGoogle: () => Promise<{ error: Error | null }>;
  signInWithApple: () => Promise<{ error: Error | null }>;
  signOut: () => Promise<void>;
  refreshPatient: () => Promise<void>;
  canAccessClinic: (clinicId: string) => boolean;
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

      // If auth succeeded, check if the patient account is activated
      if (authData.user) {
        const { data: patientData, error: patientError } = await supabase
          .from("patients")
          .select("is_active")
          .eq("auth_user_id", authData.user.id)
          .single();

        // If patient record not found or query failed, allow login (might be clinic-specific patient)
        if (!patientError && patientData && !patientData.is_active) {
          // Account exists but is not activated
          // Sign out the user since they shouldn't be logged in yet
          await supabase.auth.signOut();
          return {
            error: new Error(
              "This account is not yet activated, please check your email."
            ),
          };
        }
      }

      return { error: null };
    } catch (err) {
      return { error: new Error("An unexpected error occurred during login") };
    }
  };

  const signUp = async (
    email: string,
    password: string,
    firstName: string,
    lastName: string,
    clinicId?: string
  ) => {
    try {
      console.log("Starting signup process for:", email);

      // Use regular signup - ensure email confirmation is disabled in Supabase dashboard
      console.log("Attempting regular signup...");
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

      if (error) {
        console.error("Signup error:", error);
        console.error("Error details:", {
          message: error.message,
          status: error.status,
          name: error.name,
        });
        return { error };
      }

      if (!data.user) {
        console.error("No user returned from signup");
        return { error: new Error("Failed to create user account") };
      }

      console.log("User created successfully:", data.user.id);

      // Ensure clinic_id column exists in patients table
      console.log("Checking if clinic_id column exists...");
      try {
        // Try to run a query that would fail if clinic_id column doesn't exist
        const { error: columnCheckError } = await supabase
          .from("patients")
          .select("clinic_id")
          .limit(1);

        if (
          columnCheckError &&
          columnCheckError.message?.includes("column") &&
          columnCheckError.message?.includes("clinic_id")
        ) {
          console.log(
            "clinic_id column does not exist, attempting to add it..."
          );

          // Try to add the column using a direct SQL query (this might not work with RLS)
          // If this fails, we'll fall back to creating patient without clinic_id
          try {
            // This is a workaround - we'll try to insert without clinic_id first
            // and then update if the column gets added later
            console.warn(
              "clinic_id column missing - creating patient without clinic association for now"
            );
          } catch (alterError) {
            console.warn("Could not add clinic_id column:", alterError);
          }
        } else {
          console.log("clinic_id column exists");
        }
      } catch (checkError) {
        console.warn("Error checking clinic_id column:", checkError);
      }

      // Create patient record with clinic association (if column exists)
      const patientData: any = {
        auth_user_id: data.user.id,
        email: email,
        first_name: firstName,
        last_name: lastName,
        onboarding_completed: false,
        is_active: false, // New accounts start as inactive until email verified
      };

      // Try to insert with clinic_id first
      let insertData = { ...patientData };
      if (clinicId) {
        insertData.clinic_id = clinicId;
        console.log("Including clinic_id in patient data:", clinicId);
      }

      console.log("Creating patient record...");
      let { error: patientError } = await supabase
        .from("patients")
        .insert(insertData);

      // If clinic_id column doesn't exist, retry without it
      if (patientError && patientError.message?.includes("clinic_id")) {
        console.warn(
          "clinic_id column not found, creating patient without clinic association"
        );
        const { error: retryError } = await supabase
          .from("patients")
          .insert(patientData);

        if (retryError) {
          console.error("Error creating patient record:", retryError);
          return { error: new Error("Failed to create patient profile") };
        }
      } else if (patientError) {
        console.error("Error creating patient record:", patientError);
        console.error("Patient error details:", {
          message: patientError.message,
          details: patientError.details,
          hint: patientError.hint,
          code: patientError.code,
        });
        return {
          error: new Error(
            `Failed to create patient profile: ${patientError.message}`
          ),
        };
      }

      console.log("Signup process completed successfully");
      return { error: null };
    } catch (err) {
      console.error("Unexpected error during signup:", err);
      return { error: new Error("An unexpected error occurred during signup") };
    }
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

  const canAccessClinic = (clinicId: string): boolean => {
    return patient?.clinic_id === clinicId;
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
        canAccessClinic,
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
