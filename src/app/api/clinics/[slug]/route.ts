import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;

    // Check if slug is a UUID (full UUID)
    const isUUID =
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
        slug
      );

    let query = supabaseAdmin
      .from("clinics")
      .select(
        `
        *,
        clinic_services (*),
        practitioners (*)
      `
      )
      .eq("is_active", true);

    if (isUUID) {
      // Direct UUID match
      query = query.eq("id", slug);
    } else {
      // Check if slug ends with what looks like a UUID fragment (8 characters)
      const parts = slug.split("-");
      const lastPart = parts[parts.length - 1];

      if (
        lastPart &&
        lastPart.length === 8 &&
        /^[0-9a-f]{8}$/i.test(lastPart)
      ) {
        // Get all clinics and find the one with matching ID prefix
        const { data: allClinics, error: fetchError } = await supabaseAdmin
          .from("clinics")
          .select(
            `
            *,
            clinic_services (*),
            practitioners (*)
          `
          )
          .eq("is_active", true);

        if (!fetchError && allClinics) {
          // Find clinic where ID starts with the fragment
          const clinic = allClinics.find((c) => c.id.startsWith(lastPart));
          if (clinic) {
            return NextResponse.json({ clinic });
          }
        }
      }

      // Fallback: search by name (remove ID part and search)
      const nameParts = parts.slice(0, -1); // Remove last part (ID fragment)
      const nameSearch = nameParts.join(" ");
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
