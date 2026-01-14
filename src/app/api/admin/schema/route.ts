import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";

export async function POST(request: Request) {
  try {
    const { action } = await request.json();

    if (action === "check_schema") {
      // Check if clinic_id column exists in patients table
      try {
        const { error } = await supabaseAdmin
          .from("patients")
          .select("clinic_id")
          .limit(1);

        if (error && error.message?.includes("clinic_id")) {
          return NextResponse.json({
            clinic_id_exists: false,
            message: "clinic_id column does not exist in patients table",
          });
        }

        return NextResponse.json({
          clinic_id_exists: true,
          message: "clinic_id column exists in patients table",
        });
      } catch (err) {
        return NextResponse.json(
          {
            error: "Failed to check schema",
            details: err,
          },
          { status: 500 }
        );
      }
    }

    if (action === "add_clinic_id_column") {
      // Try to add clinic_id column to patients table
      try {
        // This would normally require direct database access
        // For now, we'll return instructions
        return NextResponse.json({
          message:
            "To add clinic_id column, run the migration: ALTER TABLE patients ADD COLUMN clinic_id UUID REFERENCES clinics(id) ON DELETE CASCADE;",
          sql: "ALTER TABLE patients ADD COLUMN clinic_id UUID REFERENCES clinics(id) ON DELETE CASCADE; CREATE INDEX IF NOT EXISTS idx_patients_clinic ON patients(clinic_id);",
        });
      } catch (err) {
        return NextResponse.json(
          {
            error: "Failed to add column",
            details: err,
          },
          { status: 500 }
        );
      }
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  } catch (err) {
    console.error("Database schema check error:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
