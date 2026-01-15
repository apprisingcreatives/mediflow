# Per-Clinic Database Implementation Guide

## Overview

This guide provides step-by-step instructions for migrating from a shared database architecture to a per-clinic database architecture in MediFlow.

## Architecture Changes

### Before (Current - Shared Database)

```
Central Supabase Project
├── clinics
├── clinic_admins
├── patients (all clinics)
├── appointments (all clinics)
├── patient_documents (all clinics)
└── [other tables]
```

### After (Per-Clinic Databases)

```
Central Supabase Project
├── clinics
├── clinic_admins
├── clinic_database_references
├── clinic_configurations
├── clinic_patient_references
└── [audit & config tables]

Clinic A Database
├── patients (clinic A only)
├── appointments (clinic A only)
├── patient_documents (clinic A only)
├── practitioners
├── clinic_services
└── [all clinic-specific tables]

Clinic B Database
├── patients (clinic B only)
├── [same structure as Clinic A]
```

## Implementation Steps

### Phase 1: Prepare Central Database

1. **Apply migration 006**

   ```bash
   # This adds clinic database reference tables to central database
   # File: supabase/migrations/006_per_clinic_database_setup.sql
   ```

2. **Verify new tables created**
   - `clinic_database_references` - Store clinic database credentials
   - `clinic_configurations` - Clinic-specific settings
   - `clinic_patient_references` - Map central auth to clinic-specific patients
   - `clinic_database_audit_log` - Track database operations

### Phase 2: Set Up Per-Clinic Databases

For each clinic, you'll need:

1. **Create new Supabase project**

   - Visit https://app.supabase.com
   - Create new project named: `clinic-{clinic-name}`
   - Note the project URL, anon key, and service role key

2. **Apply clinic schema**

   - Copy contents of `supabase/clinic_database_schema.sql`
   - In new Supabase project → SQL Editor → Create new query
   - Paste and execute the schema

3. **Enable Row Level Security**

   - For each patient-related table (patients, appointments, documents)
   - Enable RLS in table settings
   - Create policies:

     ```sql
     -- Allow patients to read their own data
     CREATE POLICY "Users can view own patient data"
     ON patients FOR SELECT
     USING (auth.uid() = auth_user_id);

     -- Allow authenticated users to insert their own patient record
     CREATE POLICY "Users can insert own patient record"
     ON patients FOR INSERT
     WITH CHECK (auth.uid() = auth_user_id);
     ```

4. **Store credentials in central database**
   - Use the application admin panel or API
   - Or directly insert via SQL:
     ```sql
     INSERT INTO clinic_database_references (
       clinic_id,
       supabase_project_id,
       supabase_url,
       anon_key,
       service_role_key
     ) VALUES (
       'clinic-uuid',
       'project-id',
       'https://...',
       'anon-key',
       'service-key'
     );
     ```

### Phase 3: Migrate Existing Data

1. **Create migration script**

   ```bash
   # Script: scripts/migrate-clinic-data.ts
   # This script will:
   # - Read patient data from central database
   # - Create equivalent records in clinic database
   # - Create references in clinic_patient_references
   # - Mark patients as migrated
   ```

2. **Run migration per clinic**

   ```bash
   npm run migrate:clinic-data -- --clinic-id {clinic-uuid}
   ```

3. **Verify data integrity**
   ```bash
   npm run verify:clinic-data -- --clinic-id {clinic-uuid}
   ```

### Phase 4: Update Application Code

Files that need updates:

1. **`src/lib/clinic-supabase.ts`** ✓ (Already created)

   - Provides `getClinicSupabaseClient()` function
   - Caches clinic database clients
   - Handles credential retrieval

2. **`src/hooks/use-auth-clinic-db.tsx`** ✓ (Already created)

   - Updated useAuth hook
   - Fetches patient from clinic database
   - Manages clinic context

3. **API Routes** (Need updates)

   ```typescript
   // Example: /api/appointments
   import { getClinicSupabaseClient } from "@/lib/clinic-supabase";

   export async function GET(req: Request) {
     const clinicId = req.nextUrl.searchParams.get("clinic_id");
     const clinicClient = await getClinicSupabaseClient(clinicId!);

     const { data } = await clinicClient.from("appointments").select("*");

     return Response.json(data);
   }
   ```

4. **Components** (Need updates)
   - Update any direct database queries
   - Use clinic context to determine which database to query
   - Example locations:
     - `src/app/(clinic)/clinic/dashboard/page.tsx`
     - `src/app/clinic/[clinicId]/patient/page.tsx`
     - Patient appointment booking flows

### Phase 5: Test and Validate

1. **Unit tests**

   ```bash
   npm test -- --testPathPattern=clinic-supabase
   ```

2. **Integration tests**

   - Register patient with clinic
   - Book appointment
   - Upload documents
   - Verify clinic isolation

3. **Data integrity checks**
   - Verify patient can only see their data
   - Verify clinic A patients can't see clinic B data
   - Verify documents are in correct database

### Phase 6: Deployment

1. **Backup all data**

   ```bash
   # Backup central database
   # Backup each clinic database
   ```

2. **Deploy application updates**

   ```bash
   git push origin per-clinic-database
   npm run build
   npm run start
   ```

3. **Monitor**

   - Check application logs
   - Monitor clinic database connections
   - Verify no data migration errors

4. **Cleanup**
   - Archive old central patient data (if keeping for history)
   - Update documentation
   - Remove old shared-database code

## File Structure

```
mediflow/
├── supabase/
│   ├── migrations/
│   │   ├── 001_clinic_system.sql
│   │   ├── 002_patients_and_documents.sql
│   │   ├── 003_clinic_trial_and_payments.sql
│   │   ├── 004_clinic_specific_patients.sql
│   │   ├── 005_patient_onboarding_system.sql
│   │   └── 006_per_clinic_database_setup.sql ✓ NEW
│   └── clinic_database_schema.sql ✓ NEW
├── scripts/
│   ├── setup-clinic-database.sh ✓ NEW
│   └── migrate-clinic-data.ts (TODO)
├── src/
│   ├── lib/
│   │   ├── supabase.ts (keep for central DB)
│   │   └── clinic-supabase.ts ✓ NEW
│   ├── hooks/
│   │   ├── use-auth.tsx (keep old version)
│   │   └── use-auth-clinic-db.tsx ✓ NEW
│   ├── app/
│   │   └── (update all routes to use clinic DB)
│   └── types/
│       └── database.ts (update types)
└── CLINIC_DATABASE_ARCHITECTURE.md ✓ NEW
```

## Configuration

### Environment Variables

No new environment variables needed. Clinic database credentials are stored in the central database.

### Runtime Configuration

Clinic database selection happens via:

1. URL parameter: `/clinic/[clinicId]/patient`
2. Search parameter: `?clinic_id=xxx`
3. Auth context (after login)

## Security Considerations

1. **Credential Storage**

   - Store service role keys encrypted in database
   - Never expose in client-side code
   - Only use admin keys on server-side

2. **Row Level Security (RLS)**

   - Enable RLS on all patient-related tables
   - Each patient can only access their own data
   - Example policies included in clinic_database_schema.sql

3. **Audit Logging**

   - All database operations logged in clinic_database_audit_log
   - Track who accessed what and when
   - Maintain compliance audit trail

4. **Data Isolation**
   - Complete clinic separation at database level
   - No cross-clinic queries possible
   - Even if application bug, data still isolated

## Rollback Plan

If issues occur:

1. **Immediate rollback** (if no data has been migrated)

   - Keep central database as is
   - Don't apply migrations
   - Continue with shared database

2. **Partial rollback** (if some clinics migrated)

   - Keep clinic databases as they are
   - Route clinic A to clinic database
   - Route clinic B to central database (temporary)

3. **Full rollback** (after migration)
   - Requires data sync from clinic databases back to central
   - Time-consuming but possible
   - Recommended to test thoroughly before going live

## Performance Considerations

- **Pros**:

  - Smaller databases = faster queries
  - Can scale each clinic database independently
  - No query interference between clinics
  - Can use different database sizes for different tiers

- **Cons**:
  - Slightly higher latency (network to clinic database)
  - More connections to manage (caching helps)
  - Need to maintain multiple databases
  - Requires clinic database client management

**Mitigation**:

- Use client caching in `clinic-supabase.ts`
- Connection pooling at Supabase level
- Monitor performance metrics

## Monitoring

Monitor these metrics:

1. **Database Health**

   - Clinic database connection success rate
   - Query response times per clinic
   - Database size growth

2. **Application Metrics**

   - Cache hit rate for clinic clients
   - Error rate for clinic database operations
   - Auth success/failure rates

3. **Audit**
   - Review clinic_database_audit_log regularly
   - Track schema changes
   - Monitor credential rotation

## Support and Troubleshooting

### Common Issues

1. **"Clinic database credentials not found"**

   - Check if clinic_database_references entry exists
   - Verify clinic_id is correct
   - Ensure credentials are complete

2. **"Connection timeout to clinic database"**

   - Check Supabase project status
   - Verify network connectivity
   - Check if rate limits exceeded

3. **"Patient data not found"**
   - Verify patient exists in clinic database
   - Check auth_user_id matches
   - Review clinic_patient_references table

See `CLINIC_DATABASE_ARCHITECTURE.md` for more details.
