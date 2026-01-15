# Per-Clinic Database - Quick Reference

## What Changed?

**Before**: All clinics' patients, documents, and appointments in one shared database
**After**: Each clinic has its own separate Supabase database for patient data

## Key Components Created

### 1. Utility: `clinic-supabase.ts`

```typescript
// Get client for clinic's database
const clinicClient = await getClinicSupabaseClient(clinicId);

// Query clinic's patient data
const { data: patients } = await clinicClient.from("patients").select("*");

// Store new clinic database credentials
await storeClinicDatabaseCredentials(
  clinicId,
  supabaseUrl,
  anonKey,
  serviceRoleKey,
  projectId
);
```

### 2. Auth Hook: `use-auth-clinic-db.tsx`

- Updated authentication context
- Fetches patient from clinic's database
- Validates clinic access
- Manages clinic context

### 3. Database Schema: `clinic_database_schema.sql`

Schema for each clinic's database includes:

- `patients` - Patient profiles
- `appointments` - Scheduling
- `patient_documents` - Medical records
- `practitioners` - Doctors/staff
- `clinic_services` - Services offered
- `onboarding_questions` - Clinic-specific forms
- `audit_logs` - Security audit trail

### 4. Central Database Migration: `006_per_clinic_database_setup.sql`

New tables in central database:

- `clinic_database_references` - Clinic database credentials
- `clinic_configurations` - Clinic settings
- `clinic_patient_references` - Patient mapping
- `clinic_database_audit_log` - Audit trail

## Implementation Checklist

- [ ] Read `IMPLEMENTATION_GUIDE.md`
- [ ] Backup current database
- [ ] Apply migration `006` to central database
- [ ] Create new Supabase project for first clinic
- [ ] Apply `clinic_database_schema.sql` to clinic project
- [ ] Enable RLS on clinic database
- [ ] Store clinic credentials in central DB
- [ ] Run migration script for existing data
- [ ] Test patient isolation
- [ ] Update API routes to use `getClinicSupabaseClient()`
- [ ] Deploy updated application
- [ ] Monitor performance
- [ ] Repeat for remaining clinics

## Code Examples

### In API Routes

```typescript
// /api/appointments.ts
import { getClinicSupabaseClient } from "@/lib/clinic-supabase";

export async function GET(req: Request) {
  const clinicId = req.nextUrl.searchParams.get("clinic_id");
  const clinicClient = await getClinicSupabaseClient(clinicId!);

  const { data } = await clinicClient
    .from("appointments")
    .select("*")
    .eq("status", "scheduled");

  return Response.json(data);
}
```

### In Components

```typescript
'use client';
import { useAuth } from '@/hooks/use-auth-clinic-db';

export function PatientDashboard() {
  const { patient, clinicId } = useAuth();

  // Clinic context is available
  // Patient data is from clinic's database

  return <div>{patient?.first_name}</div>;
}
```

### Patient Registration

```typescript
const { signUp } = useAuth();

// Sign up with clinic
await signUp(
  email,
  password,
  firstName,
  lastName,
  clinicId // Association with clinic
);
```

## Database Relationships

### Central Database

```
clinics
├── clinic_admins (many)
├── clinic_database_references (one per clinic)
├── clinic_configurations (one per clinic)
├── clinic_patient_references (many patients)
└── clinic_database_audit_log (many operations)
```

### Per-Clinic Database

```
patients
├── appointments (many)
├── patient_documents (many)
└── patient_question_responses (many)

practitioners
├── practitioner_services (many services)
└── appointments (many)

clinic_services
├── practitioner_services (many practitioners)
└── appointments (many)
```

## Security Best Practices

✅ **Do**:

- Store service role keys encrypted in database
- Enable RLS on all clinic database tables
- Use clinic client on server-side only
- Cache clinic clients for performance
- Log all database operations
- Validate clinic access before queries

❌ **Don't**:

- Expose service role keys in client code
- Mix clinic databases in single query
- Skip RLS configuration
- Cache credentials in localStorage
- Allow direct database access from client

## Performance Tips

1. **Client Caching**

   - Clinic clients are cached automatically
   - No need to recreate per request

2. **Connection Pooling**

   - Supabase handles connection pooling
   - Scale up database size if needed

3. **Indexes**

   - clinic_database_schema.sql includes indexes
   - Monitor slow queries in each clinic database

4. **Monitoring**
   - Check clinic_database_audit_log
   - Monitor error rates per clinic
   - Review database size growth

## Troubleshooting

### "Clinic database credentials not found"

```typescript
// Verify credentials stored in central DB
const { data } = await supabaseAdmin
  .from("clinic_database_references")
  .select("*")
  .eq("clinic_id", clinicId)
  .single();
```

### "Patient data not found"

```typescript
// Check if patient exists in clinic database
const clinicClient = await getClinicSupabaseClient(clinicId);
const { data } = await clinicClient
  .from("patients")
  .select("*")
  .eq("email", email);
```

### "RLS policy violations"

```sql
-- Verify RLS is enabled on tables
SELECT * FROM pg_policies WHERE tablename = 'patients';

-- Example RLS policy
CREATE POLICY "Users can view own data"
  ON patients
  FOR SELECT
  USING (auth.uid() = auth_user_id);
```

## File Locations

```
mediflow/
├── CLINIC_DATABASE_ARCHITECTURE.md
├── IMPLEMENTATION_GUIDE.md
├── IMPLEMENTATION_SUMMARY.md (this file)
├── supabase/
│   ├── migrations/
│   │   └── 006_per_clinic_database_setup.sql
│   └── clinic_database_schema.sql
├── scripts/
│   ├── setup-clinic-database.sh
│   └── migrate-clinic-data.ts
└── src/
    ├── lib/
    │   └── clinic-supabase.ts
    └── hooks/
        └── use-auth-clinic-db.tsx
```

## Quick Start Command Reference

```bash
# Set up new clinic database (interactive)
./scripts/setup-clinic-database.sh "clinic-uuid" "Clinic Name"

# Migrate existing data to clinic database (dry run first)
npx ts-node scripts/migrate-clinic-data.ts \
  --clinic-id="clinic-uuid" \
  --dry-run \
  --verbose

# Apply central database migration
# (Use Supabase dashboard SQL editor)

# Apply clinic database schema
# (Copy clinic_database_schema.sql to clinic's Supabase project)
```

## Contact & Support

For issues or questions:

1. Check `IMPLEMENTATION_GUIDE.md` Troubleshooting section
2. Review `CLINIC_DATABASE_ARCHITECTURE.md` for design questions
3. Check application logs for errors
4. Review clinic_database_audit_log for operations history

---

**Last Updated**: January 15, 2026
**Version**: 1.0 - Initial Architecture Setup
