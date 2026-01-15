/**
 * Clinic Data Migration Script
 * Migrates patient data from central database to per-clinic databases
 *
 * Usage: npx ts-node scripts/migrate-clinic-data.ts --clinic-id <clinic-uuid>
 */

import { createClient } from "@supabase/supabase-js";
import * as fs from "fs";
import * as path from "path";

interface MigrationOptions {
  clinicId: string;
  dryRun: boolean;
  verbose: boolean;
}

interface ClinicDatabase {
  supabaseUrl: string;
  anonKey: string;
  serviceRoleKey: string;
}

class ClinicDataMigrator {
  private centralClient: ReturnType<typeof createClient>;
  private clinicClient: ReturnType<typeof createClient>;
  private options: MigrationOptions;
  private stats = {
    patientsProcessed: 0,
    appointmentsMigrated: 0,
    documentsMigrated: 0,
    errors: 0,
  };

  constructor(options: MigrationOptions) {
    this.options = options;

    // Initialize central database client
    this.centralClient = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );
  }

  async initialize() {
    try {
      // Fetch clinic database credentials
      const { data: clinicDb, error } = await this.centralClient
        .from("clinic_database_references")
        .select("supabase_url, service_role_key")
        .eq("clinic_id", this.options.clinicId)
        .single();

      if (error || !clinicDb) {
        throw new Error(
          `Failed to fetch clinic database credentials: ${error?.message}`
        );
      }

      // Initialize clinic database client
      this.clinicClient = createClient(
        clinicDb.supabase_url,
        clinicDb.service_role_key
      );

      this.log(`✓ Connected to clinic database`);
    } catch (error) {
      console.error("✗ Failed to initialize:", error);
      process.exit(1);
    }
  }

  async migratePatients() {
    try {
      this.log("Starting patient migration...");

      // Fetch patients for this clinic from central database
      const { data: patients, error } = await this.centralClient
        .from("patients")
        .select("*")
        .eq("clinic_id", this.options.clinicId)
        .eq("migrated_to_clinic_db", false);

      if (error) {
        throw new Error(`Failed to fetch patients: ${error.message}`);
      }

      if (!patients || patients.length === 0) {
        this.log("No patients to migrate");
        return;
      }

      this.log(`Found ${patients.length} patients to migrate`);

      for (const patient of patients) {
        try {
          // Prepare patient data for clinic database
          const patientData = {
            auth_user_id: patient.auth_user_id,
            email: patient.email,
            first_name: patient.first_name,
            last_name: patient.last_name,
            phone: patient.phone,
            date_of_birth: patient.date_of_birth,
            gender: patient.gender,
            address: patient.address,
            city: patient.city,
            emergency_contact_name: patient.emergency_contact_name,
            emergency_contact_phone: patient.emergency_contact_phone,
            blood_type: patient.blood_type,
            allergies: patient.allergies,
            chronic_conditions: patient.chronic_conditions,
            current_medications: patient.current_medications,
            medical_notes: patient.medical_notes,
            insurance_provider: patient.insurance_provider,
            insurance_policy_number: patient.insurance_policy_number,
            onboarding_completed: patient.onboarding_completed,
          };

          if (!this.options.dryRun) {
            // Insert into clinic database
            const { data: clinicPatient, error: insertError } =
              await this.clinicClient
                .from("patients")
                .insert(patientData)
                .select()
                .single();

            if (insertError) {
              throw new Error(
                `Failed to insert patient: ${insertError.message}`
              );
            }

            // Create reference in central database
            await this.centralClient.from("clinic_patient_references").insert({
              clinic_id: this.options.clinicId,
              central_auth_user_id: patient.auth_user_id,
              clinic_patient_id: clinicPatient.id,
              email: patient.email,
            });

            // Mark as migrated in central database
            await this.centralClient
              .from("patients")
              .update({
                migrated_to_clinic_db: true,
                clinic_database_patient_id: clinicPatient.id,
              })
              .eq("id", patient.id);

            this.log(`  ✓ Migrated patient: ${patient.email}`);
          } else {
            this.log(`  [DRY RUN] Would migrate patient: ${patient.email}`);
          }

          this.stats.patientsProcessed++;
        } catch (error) {
          console.error(`  ✗ Error migrating patient ${patient.email}:`, error);
          this.stats.errors++;
        }
      }
    } catch (error) {
      console.error("✗ Patient migration failed:", error);
      this.stats.errors++;
    }
  }

  async migrateAppointments() {
    try {
      this.log("Starting appointment migration...");

      // Fetch appointments for this clinic from central database
      const { data: appointments, error } = await this.centralClient
        .from("appointments")
        .select("*")
        .eq("clinic_id", this.options.clinicId);

      if (error) {
        throw new Error(`Failed to fetch appointments: ${error.message}`);
      }

      if (!appointments || appointments.length === 0) {
        this.log("No appointments to migrate");
        return;
      }

      this.log(`Found ${appointments.length} appointments to migrate`);

      for (const appointment of appointments) {
        try {
          // Get mapped patient ID
          const { data: patientRef } = await this.centralClient
            .from("clinic_patient_references")
            .select("clinic_patient_id")
            .eq("clinic_id", this.options.clinicId)
            .eq("central_auth_user_id", appointment.patient_id) // Assuming patient_id is the auth_user_id
            .single();

          if (!patientRef?.clinic_patient_id) {
            this.log(
              `  ⚠ Skipping appointment - patient not found in clinic database`
            );
            continue;
          }

          const appointmentData = {
            patient_id: patientRef.clinic_patient_id,
            practitioner_id: appointment.practitioner_id,
            service_id: appointment.service_id,
            appointment_date: appointment.appointment_date,
            appointment_time: appointment.appointment_time,
            status: appointment.status,
            notes: appointment.notes,
            ai_recommended: appointment.ai_recommended,
            ai_recommendation_reason: appointment.ai_recommendation_reason,
          };

          if (!this.options.dryRun) {
            const { error: insertError } = await this.clinicClient
              .from("appointments")
              .insert(appointmentData);

            if (insertError) {
              throw new Error(
                `Failed to insert appointment: ${insertError.message}`
              );
            }

            this.log(`  ✓ Migrated appointment: ${appointment.id}`);
          } else {
            this.log(
              `  [DRY RUN] Would migrate appointment: ${appointment.id}`
            );
          }

          this.stats.appointmentsMigrated++;
        } catch (error) {
          console.error(
            `  ✗ Error migrating appointment ${appointment.id}:`,
            error
          );
          this.stats.errors++;
        }
      }
    } catch (error) {
      console.error("✗ Appointment migration failed:", error);
      this.stats.errors++;
    }
  }

  async migrateDocuments() {
    try {
      this.log("Starting document migration...");

      // Fetch patient IDs for this clinic
      const { data: patientRefs } = await this.centralClient
        .from("clinic_patient_references")
        .select("clinic_patient_id, central_auth_user_id")
        .eq("clinic_id", this.options.clinicId);

      if (!patientRefs || patientRefs.length === 0) {
        this.log("No patients to migrate documents for");
        return;
      }

      const centralPatientIds = patientRefs.map(
        (ref) => ref.central_auth_user_id
      );

      // Fetch documents for patients in this clinic
      const { data: documents, error } = await this.centralClient
        .from("patient_documents")
        .select("*")
        .in("patient_id", centralPatientIds);

      if (error) {
        throw new Error(`Failed to fetch documents: ${error.message}`);
      }

      if (!documents || documents.length === 0) {
        this.log("No documents to migrate");
        return;
      }

      this.log(`Found ${documents.length} documents to migrate`);

      for (const document of documents) {
        try {
          const patientRef = patientRefs.find(
            (ref) => ref.central_auth_user_id === document.patient_id
          );

          if (!patientRef) {
            this.log(`  ⚠ Skipping document - patient mapping not found`);
            continue;
          }

          const documentData = {
            patient_id: patientRef.clinic_patient_id,
            file_name: document.file_name,
            file_url: document.file_url,
            file_type: document.file_type,
            file_size: document.file_size,
            document_type: document.document_type,
            description: document.description,
            ai_analysis: document.ai_analysis,
            ai_recommended_specialty: document.ai_recommended_specialty,
            ai_summary: document.ai_summary,
            uploaded_at: document.uploaded_at,
            analyzed_at: document.analyzed_at,
          };

          if (!this.options.dryRun) {
            const { error: insertError } = await this.clinicClient
              .from("patient_documents")
              .insert(documentData);

            if (insertError) {
              throw new Error(
                `Failed to insert document: ${insertError.message}`
              );
            }

            this.log(`  ✓ Migrated document: ${document.file_name}`);
          } else {
            this.log(
              `  [DRY RUN] Would migrate document: ${document.file_name}`
            );
          }

          this.stats.documentsMigrated++;
        } catch (error) {
          console.error(
            `  ✗ Error migrating document ${document.file_name}:`,
            error
          );
          this.stats.errors++;
        }
      }
    } catch (error) {
      console.error("✗ Document migration failed:", error);
      this.stats.errors++;
    }
  }

  async run() {
    try {
      console.log("================================================");
      console.log("MediFlow Clinic Data Migration");
      console.log("================================================");
      console.log(`Clinic ID: ${this.options.clinicId}`);
      console.log(`Dry Run: ${this.options.dryRun}`);
      console.log("");

      await this.initialize();
      await this.migratePatients();
      await this.migrateAppointments();
      await this.migrateDocuments();

      this.log("");
      this.log("================================================");
      this.log("Migration Summary");
      this.log("================================================");
      this.log(`Patients Processed: ${this.stats.patientsProcessed}`);
      this.log(`Appointments Migrated: ${this.stats.appointmentsMigrated}`);
      this.log(`Documents Migrated: ${this.stats.documentsMigrated}`);
      this.log(`Errors: ${this.stats.errors}`);
      this.log("");

      if (this.options.dryRun) {
        this.log("This was a DRY RUN. No data was actually modified.");
      } else {
        this.log("✓ Migration completed successfully!");
      }
    } catch (error) {
      console.error("✗ Migration failed:", error);
      process.exit(1);
    }
  }

  private log(message: string) {
    if (this.options.verbose) {
      console.log(message);
    }
  }
}

// Parse command line arguments
const args = process.argv.slice(2);
const clinicId = args
  .find((arg) => arg.startsWith("--clinic-id="))
  ?.split("=")[1];
const dryRun = args.includes("--dry-run");
const verbose = args.includes("--verbose") || !dryRun; // Always verbose unless dry run

if (!clinicId) {
  console.error("Error: --clinic-id is required");
  console.error(
    "Usage: npx ts-node scripts/migrate-clinic-data.ts --clinic-id <clinic-uuid> [--dry-run] [--verbose]"
  );
  process.exit(1);
}

const migrator = new ClinicDataMigrator({
  clinicId,
  dryRun,
  verbose,
});

migrator.run().catch((error) => {
  console.error("Fatal error:", error);
  process.exit(1);
});
