// /**
//  * Updated useAuth hook for per-clinic database architecture
//  * Handles authentication against both central and clinic-specific databases
//  */

// "use client";

// import {
//   createContext,
//   useContext,
//   useEffect,
//   useState,
//   ReactNode,
// } from "react";
// import { User, Session } from "@supabase/supabase-js";
// import {
//   supabase,
//   supabaseAdmin,
//   // getClinicSupabaseClient,
// } from "@/lib/supabase";
// import { getClinicSupabaseAdminClient } from "@/lib/clinic-supabase";
// import { Patient } from "@/types/database";

// interface AuthContextType {
//   user: User | null;
//   session: Session | null;
//   patient: Patient | null;
//   clinicId: string | null;
//   isLoading: boolean;
//   signIn: (email: string, password: string) => Promise<{ error: Error | null }>;
//   signUp: (
//     email: string,
//     password: string,
//     firstName: string,
//     lastName: string,
//     clinicId?: string
//   ) => Promise<{ error: Error | null }>;
//   signInWithGoogle: () => Promise<{ error: Error | null }>;
//   signInWithApple: () => Promise<{ error: Error | null }>;
//   signOut: () => Promise<void>;
//   refreshPatient: () => Promise<void>;
//   canAccessClinic: (clinicId: string) => boolean;
// }

// const AuthContext = createContext<AuthContextType | undefined>(undefined);

// export function AuthProvider({ children }: { children: ReactNode }) {
//   const [user, setUser] = useState<User | null>(null);
//   const [session, setSession] = useState<Session | null>(null);
//   const [patient, setPatient] = useState<Patient | null>(null);
//   const [clinicId, setClinicId] = useState<string | null>(null);
//   const [isLoading, setIsLoading] = useState(true);

//   /**
//    * Fetch patient from clinic's database
//    * Assumes clinicId is already determined from context/URL
//    */
//   const fetchPatient = async (userId: string, clinicContextId?: string) => {
//     try {
//       // Determine clinic ID from context or patient record
//       let targetClinicId = clinicContextId;

//       // If no clinic context, try to get from URL or patient record in central DB
//       if (!targetClinicId) {
//         // Check if patient exists in central database with clinic_id
//         const { data: centralPatient } = await supabase
//           .from("patients")
//           .select("clinic_id")
//           .eq("auth_user_id", userId)
//           .single();

//         targetClinicId = centralPatient?.clinic_id;
//       }

//       if (!targetClinicId) {
//         console.warn("No clinic context found for patient");
//         setPatient(null);
//         return;
//       }

//       // Fetch patient from clinic's database
//       const clinicClient = await getClinicSupabaseClient(targetClinicId);
//       const { data, error } = await clinicClient
//         .from("patients")
//         .select("*")
//         .eq("auth_user_id", userId)
//         .single();

//       if (error && error.code !== "PGRST116") {
//         console.error("Error fetching patient from clinic database:", error);
//       }

//       setPatient(data);
//       setClinicId(targetClinicId);
//     } catch (err) {
//       console.error("Failed to fetch patient:", err);
//     }
//   };

//   const refreshPatient = async () => {
//     if (user) {
//       await fetchPatient(user.id);
//     }
//   };

//   useEffect(() => {
//     const getSession = async () => {
//       // Get session from central auth
//       const {
//         data: { session },
//       } = await supabase.auth.getSession();
//       setSession(session);
//       setUser(session?.user ?? null);

//       if (session?.user) {
//         await fetchPatient(session.user.id);
//       }

//       setIsLoading(false);
//     };

//     getSession();

//     // Listen for auth changes
//     const {
//       data: { subscription },
//     } = supabase.auth.onAuthStateChange(async (event, session) => {
//       setSession(session);
//       setUser(session?.user ?? null);

//       if (session?.user) {
//         await fetchPatient(session.user.id);
//       } else {
//         setPatient(null);
//         setClinicId(null);
//       }

//       setIsLoading(false);
//     });

//     return () => subscription.unsubscribe();
//   }, []);

//   /**
//    * Sign in - authenticates against central auth
//    * Patient data is then fetched from their clinic's database
//    * Also checks if account is activated
//    */
//   const signIn = async (email: string, password: string) => {
//     try {
//       // First, authenticate with Supabase Auth
//       const { data: authData, error: authError } =
//         await supabase.auth.signInWithPassword({
//           email,
//           password,
//         });

//       // If auth failed, return the error
//       if (authError) {
//         return { error: authError };
//       }

//       // If auth succeeded, check if the patient account is activated
//       if (authData.user) {
//         const { data: patientData, error: patientError } = await supabase
//           .from("patients")
//           .select("is_active")
//           .eq("auth_user_id", authData.user.id)
//           .single();

//         // If patient record not found or query failed, allow login (might be clinic-specific patient)
//         if (!patientError && patientData && !patientData.is_active) {
//           // Account exists but is not activated
//           // Sign out the user since they shouldn't be logged in yet
//           await supabase.auth.signOut();
//           return {
//             error: new Error(
//               "This account is not yet activated, please check your email."
//             ),
//           };
//         }
//       }

//       return { error: null };
//     } catch (err) {
//       return { error: new Error("An unexpected error occurred during login") };
//     }
//   };

//   /**
//    * Sign up - creates user in central auth and clinic's database
//    */
//   const signUp = async (
//     email: string,
//     password: string,
//     firstName: string,
//     lastName: string,
//     clinicId?: string
//   ) => {
//     try {
//       if (!clinicId) {
//         return { error: new Error("Clinic ID is required for registration") };
//       }

//       // Create user in central Auth
//       const { data, error } = await supabase.auth.signUp({
//         email,
//         password,
//         options: {
//           data: {
//             first_name: firstName,
//             last_name: lastName,
//           },
//         },
//       });

//       if (error || !data.user) {
//         return { error: error || new Error("Failed to create user") };
//       }

//       // Create patient in clinic's database
//       const clinicAdminClient = await getClinicSupabaseAdminClient(clinicId);
//       const { error: patientError } = await clinicAdminClient
//         .from("patients")
//         .insert({
//           auth_user_id: data.user.id,
//           email,
//           first_name: firstName,
//           last_name: lastName,
//           onboarding_completed: false,
//           is_active: false, // New accounts start as inactive until email verified
//         });

//       if (patientError) {
//         // Clean up: delete the auth user since we couldn't create the patient record
//         await supabaseAdmin.auth.admin.deleteUser(data.user.id);
//         return { error: patientError };
//       }

//       // Create reference in central database for federation/audit
//       await supabaseAdmin.from("clinic_patient_references").insert({
//         clinic_id: clinicId,
//         central_auth_user_id: data.user.id,
//         email,
//         clinic_patient_id: null, // Will be updated after fetching
//       });

//       return { error: null };
//     } catch (err) {
//       return { error: new Error("An unexpected error occurred during signup") };
//     }
//   };

//   const signOut = async () => {
//     await supabase.auth.signOut();
//     setUser(null);
//     setSession(null);
//     setPatient(null);
//     setClinicId(null);
//   };

//   const signInWithGoogle = async () => {
//     const { error } = await supabase.auth.signInWithOAuth({
//       provider: "google",
//       options: {
//         redirectTo: `${typeof window !== "undefined" ? window.location.origin : ""}/patient`,
//       },
//     });
//     return { error };
//   };

//   const signInWithApple = async () => {
//     const { error } = await supabase.auth.signInWithOAuth({
//       provider: "apple",
//       options: {
//         redirectTo: `${typeof window !== "undefined" ? window.location.origin : ""}/patient`,
//       },
//     });
//     return { error };
//   };

//   /**
//    * Check if patient can access a specific clinic
//    */
//   const canAccessClinic = (targetClinicId: string): boolean => {
//     return clinicId === targetClinicId;
//   };

//   return (
//     <AuthContext.Provider
//       value={{
//         user,
//         session,
//         patient,
//         clinicId,
//         isLoading,
//         signIn,
//         signUp,
//         signInWithGoogle,
//         signInWithApple,
//         signOut,
//         refreshPatient,
//         canAccessClinic,
//       }}
//     >
//       {children}
//     </AuthContext.Provider>
//   );
// }

// export function useAuth() {
//   const context = useContext(AuthContext);
//   if (context === undefined) {
//     throw new Error("useAuth must be used within an AuthProvider");
//   }
//   return context;
// }
