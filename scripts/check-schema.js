#!/usr/bin/env node

/**
 * Database Schema Check Script
 * This script checks if the clinic_id column exists in the patients table
 * and provides instructions for adding it if it doesn't exist.
 */

const { createClient } = require("@supabase/supabase-js");

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error(
    "Missing environment variables. Please ensure NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are set."
  );
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function checkSchema() {
  console.log("🔍 Checking database schema...");

  try {
    // Check if clinic_id column exists
    const { error } = await supabase
      .from("patients")
      .select("clinic_id")
      .limit(1);

    if (error && error.message?.includes("clinic_id")) {
      console.log("❌ clinic_id column does NOT exist in patients table");
      console.log("");
      console.log(
        "📋 To fix this, run the following SQL in your Supabase SQL editor:"
      );
      console.log("");
      console.log(
        "ALTER TABLE patients ADD COLUMN clinic_id UUID REFERENCES clinics(id) ON DELETE CASCADE;"
      );
      console.log(
        "CREATE INDEX IF NOT EXISTS idx_patients_clinic ON patients(clinic_id);"
      );
      console.log("");
      console.log("This will:");
      console.log("- Add clinic_id column to patients table");
      console.log("- Create a foreign key reference to clinics table");
      console.log("- Add an index for better query performance");
      return false;
    } else {
      console.log("✅ clinic_id column exists in patients table");
      return true;
    }
  } catch (err) {
    console.error("❌ Error checking schema:", err);
    return false;
  }
}

async function main() {
  console.log("🏥 MediFlow Database Schema Checker");
  console.log("=====================================");
  console.log("");

  const schemaOk = await checkSchema();

  if (schemaOk) {
    console.log("");
    console.log("🎉 Database schema is correct!");
    console.log("Patients can now be properly associated with clinics.");
  } else {
    console.log("");
    console.log(
      "⚠️  Please run the SQL commands above in your Supabase dashboard."
    );
    console.log("After running the SQL, restart your application.");
  }
}

main().catch(console.error);
