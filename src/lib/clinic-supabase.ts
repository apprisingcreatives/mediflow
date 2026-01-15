import { createClient, SupabaseClient } from "@supabase/supabase-js";

// Central database client (always used for clinic management)
export const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY || ""
);

export const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

// Cache for clinic database clients to avoid recreating them
const clinicClientCache = new Map<string, SupabaseClient>();

/**
 * Get Supabase client for a specific clinic
 * @param clinicId - The clinic ID to get the client for
 * @returns Supabase client configured for that clinic's database
 */
export async function getClinicSupabaseClient(
  clinicId: string
): Promise<SupabaseClient> {
  // Check cache first
  if (clinicClientCache.has(clinicId)) {
    return clinicClientCache.get(clinicId)!;
  }

  try {
    // Fetch clinic database credentials from central database
    const { data, error } = await supabaseAdmin
      .from("clinic_database_references")
      .select("supabase_url, anon_key")
      .eq("clinic_id", clinicId)
      .single();

    if (error || !data) {
      throw new Error(
        `Could not fetch clinic database credentials: ${error?.message}`
      );
    }

    // Create client for this clinic's database
    const clinicClient = createClient(data.supabase_url, data.anon_key);

    // Cache it
    clinicClientCache.set(clinicId, clinicClient);

    return clinicClient;
  } catch (error) {
    console.error(
      `Error getting clinic Supabase client for clinic ${clinicId}:`,
      error
    );
    throw error;
  }
}

/**
 * Get Supabase admin client for a specific clinic
 * @param clinicId - The clinic ID to get the admin client for
 * @returns Supabase admin client configured for that clinic's database
 */
export async function getClinicSupabaseAdminClient(
  clinicId: string
): Promise<SupabaseClient> {
  try {
    // Fetch clinic database credentials from central database
    const { data, error } = await supabaseAdmin
      .from("clinic_database_references")
      .select("supabase_url, service_role_key")
      .eq("clinic_id", clinicId)
      .single();

    if (error || !data) {
      throw new Error(
        `Could not fetch clinic database credentials: ${error?.message}`
      );
    }

    // Create admin client for this clinic's database
    const clinicAdminClient = createClient(
      data.supabase_url,
      data.service_role_key
    );

    return clinicAdminClient;
  } catch (error) {
    console.error(
      `Error getting clinic Supabase admin client for clinic ${clinicId}:`,
      error
    );
    throw error;
  }
}

/**
 * Clear the clinic client cache (useful after database updates)
 */
export function clearClinicClientCache(clinicId?: string) {
  if (clinicId) {
    clinicClientCache.delete(clinicId);
  } else {
    clinicClientCache.clear();
  }
}

/**
 * Store clinic database credentials in the central database
 * Called after creating a new clinic Supabase project
 */
export async function storeClinicDatabaseCredentials(
  clinicId: string,
  supabaseUrl: string,
  anonKey: string,
  serviceRoleKey: string,
  projectId: string
) {
  const { error } = await supabaseAdmin
    .from("clinic_database_references")
    .insert({
      clinic_id: clinicId,
      supabase_project_id: projectId,
      supabase_url: supabaseUrl,
      anon_key: anonKey,
      service_role_key: serviceRoleKey,
    });

  if (error) {
    throw new Error(
      `Failed to store clinic database credentials: ${error.message}`
    );
  }

  // Also update the clinics table for backward compatibility
  await supabaseAdmin
    .from("clinics")
    .update({
      supabase_url: supabaseUrl,
      supabase_anon_key: anonKey,
      supabase_service_key: serviceRoleKey,
      database_created_at: new Date().toISOString(),
      database_status: "active",
    })
    .eq("id", clinicId);

  // Clear cache to force refresh
  clearClinicClientCache(clinicId);
}

/**
 * Get clinic database info from the central database
 */
export async function getClinicDatabaseInfo(clinicId: string) {
  const { data, error } = await supabaseAdmin
    .from("clinic_database_references")
    .select("*")
    .eq("clinic_id", clinicId)
    .single();

  if (error) {
    throw new Error(`Failed to fetch clinic database info: ${error.message}`);
  }

  return data;
}

/**
 * Log clinic database operations for audit purposes
 */
export async function logClinicDatabaseOperation(
  clinicId: string,
  operation: "create" | "migrate" | "backup" | "restore" | "error",
  status: "pending" | "success" | "failed",
  details?: Record<string, any>,
  errorMessage?: string
) {
  const { error } = await supabaseAdmin
    .from("clinic_database_audit_log")
    .insert({
      clinic_id: clinicId,
      operation,
      status,
      operation_details: details || {},
      error_message: errorMessage,
    });

  if (error) {
    console.error("Failed to log clinic database operation:", error);
  }
}
