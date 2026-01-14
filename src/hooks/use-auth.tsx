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
    lastName: string,
    clinicId?: string
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
    lastName: string,
    clinicId?: string
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
      // Create patient record with clinic association (if column exists)
      const patientData: any = {
        auth_user_id: data.user.id,
        email: email,
        first_name: firstName,
        last_name: lastName,
        onboarding_completed: false,
      };

      // Try to insert with clinic_id first
      let insertData = { ...patientData };
      if (clinicId) {
        insertData.clinic_id = clinicId;
      }

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
        return { error: new Error("Failed to create patient profile") };
      }

      // Get clinic information for customized email
      let clinicInfo = null;
      if (clinicId) {
        const { data: clinicData } = await supabase
          .from("clinics")
          .select("name, email, phone, address, city")
          .eq("id", clinicId)
          .single();
        clinicInfo = clinicData;
      }

      // Queue customized welcome email
      const clinicName = clinicInfo?.name || "MediFlow";
      const clinicContact = clinicInfo?.email || "support@mediflow.ai";
      const clinicPhone = clinicInfo?.phone || "+63 920 478 6075";

      await supabase.from("email_notifications").insert({
        recipient_email: email,
        recipient_name: `${firstName} ${lastName}`,
        recipient_type: "patient",
        subject: `Welcome to ${clinicName} - Your Health Journey Begins`,
        body: `Dear ${firstName},

Welcome to ${clinicName}! Your patient account has been created successfully.

Your Clinic Details:
- Clinic: ${clinicName}
${clinicInfo?.address ? `- Address: ${clinicInfo.address}${clinicInfo.city ? `, ${clinicInfo.city}` : ""}` : ""}
${clinicInfo?.phone ? `- Phone: ${clinicInfo.phone}` : ""}
- Contact: ${clinicContact}

Next Steps:
1. Complete your health profile with medical history and preferences
2. Book your first appointment through our easy online system
3. Receive personalized care recommendations powered by AI

We're excited to be part of your healthcare journey!

Best regards,
The ${clinicName} Team`,
        html_body: `<h1>Welcome to ${clinicName}!</h1>
<p>Dear ${firstName},</p>

<p>Welcome to ${clinicName}! Your patient account has been created successfully.</p>

<h2>Your Clinic Details:</h2>
<ul>
  <li><strong>Clinic:</strong> ${clinicName}</li>
  ${clinicInfo?.address ? `<li><strong>Address:</strong> ${clinicInfo.address}${clinicInfo.city ? `, ${clinicInfo.city}` : ""}</li>` : ""}
  ${clinicInfo?.phone ? `<li><strong>Phone:</strong> ${clinicInfo.phone}</li>` : ""}
  <li><strong>Contact:</strong> <a href="mailto:${clinicContact}">${clinicContact}</a></li>
</ul>

<h2>Next Steps:</h2>
<ol>
  <li>Complete your health profile with medical history and preferences</li>
  <li>Book your first appointment through our easy online system</li>
  <li>Receive personalized care recommendations powered by AI</li>
</ol>

<p>We're excited to be part of your healthcare journey!</p>

<p>Best regards,<br>The ${clinicName} Team</p>`,
        notification_type: "welcome_patient",
        related_entity_type: clinicId ? "clinic" : null,
        related_entity_id: clinicId || null,
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
