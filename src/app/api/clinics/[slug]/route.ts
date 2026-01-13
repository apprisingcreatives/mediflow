import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET(
  request: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;

    // Try to find by ID first, then by name slug
    let query = supabase
      .from("clinics")
      .select(`
        *,
        clinic_services (*),
        practitioners (*)
      `)
      .eq("is_active", true);

    // Check if slug is a UUID
    const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(slug);
    
    if (isUUID) {
      query = query.eq("id", slug);
    } else {
      // Convert slug back to name format and search
      const nameSearch = slug.replace(/-/g, " ");
      query = query.ilike("name", `%${nameSearch}%`);
    }

    const { data: clinic, error } = await query.single();

    if (error || !clinic) {
      return NextResponse.json({ error: "Clinic not found" }, { status: 404 });
    }

    return NextResponse.json({ clinic });
  } catch {
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
