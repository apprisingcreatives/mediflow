# Per-Clinic Database Implementation Checklist

## Pre-Implementation

### Planning & Preparation

- [ ] Read `QUICK_REFERENCE.md` (15 min)
- [ ] Read `CLINIC_DATABASE_ARCHITECTURE.md` (20 min)
- [ ] Read `IMPLEMENTATION_GUIDE.md` (30 min)
- [ ] Review database schema: `clinic_database_schema.sql` (15 min)
- [ ] Gather Supabase account credentials
- [ ] Schedule implementation window with zero downtime
- [ ] Backup current database
- [ ] Notify stakeholders of changes

### Environment Setup

- [ ] Node.js 18+ installed
- [ ] TypeScript configured
- [ ] Supabase CLI installed (optional but helpful)
- [ ] Access to multiple Supabase projects
- [ ] SSH access to production environment
- [ ] Database backup tools ready

---

## Phase 1: Central Database Preparation

### Central Database Migration

- [ ] Backup central Supabase database
- [ ] Go to Supabase project → SQL Editor
- [ ] Create new query
- [ ] Copy contents of `supabase/migrations/006_per_clinic_database_setup.sql`
- [ ] Execute the SQL
- [ ] Verify new tables created:
  - [ ] `clinic_database_references`
  - [ ] `clinic_configurations`
  - [ ] `clinic_patient_references`
  - [ ] `clinic_database_audit_log`

### Verify Migration

```sql
-- Run these queries to verify:
SELECT COUNT(*) FROM clinic_database_references;
SELECT COUNT(*) FROM clinic_configurations;
SELECT COUNT(*) FROM clinic_database_audit_log;
```

- [ ] All tables exist and are empty
- [ ] No errors in migration

---

## Phase 2: First Clinic Database Setup

### Create Clinic Supabase Project

- [ ] Go to https://app.supabase.com
- [ ] Click "New project"
- [ ] Project name: `clinic-{clinic-name}`
- [ ] Select appropriate region
- [ ] Note database password
- [ ] Wait for project initialization (5-10 min)
- [ ] Note the Project ID
- [ ] Note the Project URL

### Collect Credentials

From new clinic project → Settings → API:

- [ ] Copy Project URL → `SUPABASE_URL`
- [ ] Copy `anon` public key → `SUPABASE_ANON_KEY`
- [ ] Copy `service_role` secret key → `SUPABASE_SERVICE_ROLE_KEY`
- [ ] Store securely (will encrypt and store in central DB)

### Apply Clinic Database Schema

In clinic project → SQL Editor:

- [ ] Create new query
- [ ] Copy `supabase/clinic_database_schema.sql`
- [ ] Execute the SQL
- [ ] Verify table creation:
  - [ ] `patients`
  - [ ] `practitioners`
  - [ ] `clinic_services`
  - [ ] `appointments`
  - [ ] `patient_documents`
  - [ ] `onboarding_questions`
  - [ ] `required_documents`
  - [ ] `patient_question_responses`
  - [ ] `ai_treatment_predictions`
  - [ ] `audit_logs`
  - [ ] `notification_preferences`
  - [ ] `sent_notifications`

### Enable Row Level Security (RLS)

For each table in clinic database:

- [ ] `patients` → Enable RLS
- [ ] `appointments` → Enable RLS
- [ ] `patient_documents` → Enable RLS
- [ ] `patient_question_responses` → Enable RLS
- [ ] `ai_treatment_predictions` → Enable RLS
- [ ] `sent_notifications` → Enable RLS

### Create RLS Policies (per table)

```sql
-- Example for patients table (execute in clinic database):
CREATE POLICY "Users can view own patient data"
  ON patients
  FOR SELECT
  USING (auth.uid() = auth_user_id);

CREATE POLICY "Users can update own patient data"
  ON patients
  FOR UPDATE
  USING (auth.uid() = auth_user_id)
  WITH CHECK (auth.uid() = auth_user_id);
```

- [ ] Create SELECT policy for patients
- [ ] Create UPDATE policy for patients
- [ ] Create SELECT policy for appointments
- [ ] Create INSERT policy for appointments
- [ ] Create SELECT policy for documents
- [ ] Create INSERT policy for documents
- [ ] Test RLS policies

### Store Clinic Credentials in Central Database

Option A: Using direct SQL in central database:

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
  'service-role-key'
);
```

- [ ] Clinic credentials inserted

Option B: Using application API (when available):

- [ ] Call clinic setup API endpoint
- [ ] Provide clinic ID and credentials
- [ ] Verify storage in `clinic_database_references`

### Verify Clinic Database Connection

```bash
# From your application:
npm run verify:clinic-db -- --clinic-id="clinic-uuid"
```

- [ ] Connection successful
- [ ] Tables accessible
- [ ] RLS policies working

---

## Phase 3: Data Migration

### Prepare for Migration

- [ ] Backup central database again
- [ ] Backup clinic database
- [ ] Notify clinic admins of maintenance window
- [ ] Schedule during low-traffic period

### Run Dry-Run Migration

```bash
npx ts-node scripts/migrate-clinic-data.ts \
  --clinic-id="clinic-uuid" \
  --dry-run \
  --verbose
```

- [ ] Review output
- [ ] Verify patient counts
- [ ] Verify appointment counts
- [ ] Verify document counts
- [ ] Check for errors

### Verify Dry-Run Results

The script should output:

- [ ] Patients Processed: [number]
- [ ] Appointments Migrated: [number]
- [ ] Documents Migrated: [number]
- [ ] Errors: 0
- [ ] Message: "This was a DRY RUN"

### Execute Real Migration

```bash
npx ts-node scripts/migrate-clinic-data.ts \
  --clinic-id="clinic-uuid" \
  --verbose
```

- [ ] Migration started
- [ ] Monitor for errors
- [ ] Review final statistics
- [ ] Verify success message

### Verify Migration Results

In clinic database, run:

```sql
-- Check patient counts
SELECT COUNT(*) as patient_count FROM patients;

-- Check appointment counts
SELECT COUNT(*) as appointment_count FROM appointments;

-- Check document counts
SELECT COUNT(*) as document_count FROM patient_documents;
```

- [ ] Patient count matches expected
- [ ] Appointment count matches expected
- [ ] Document count matches expected

### Verify Central Database References

```sql
-- Check in central database:
SELECT COUNT(*) FROM clinic_patient_references
WHERE clinic_id = 'clinic-uuid';
```

- [ ] References created for all patients
- [ ] clinic_patient_id values are populated

---

## Phase 4: Application Code Updates

### Update API Routes

For each API endpoint that accesses patient data:

- [ ] Change from `supabase` to clinic-specific client
- [ ] Use `getClinicSupabaseClient(clinicId)`
- [ ] Test endpoint returns correct clinic data
- [ ] Verify no cross-clinic data leakage

Example routes to update:

- [ ] `/api/appointments`
- [ ] `/api/patients`
- [ ] `/api/documents`
- [ ] `/api/practitioners`
- [ ] `/api/services`
- [ ] Any other patient-related endpoints

### Update React Components

Components that need updates:

- [ ] Dashboard pages
- [ ] Patient profile pages
- [ ] Appointment booking
- [ ] Document upload
- [ ] Admin panels
- [ ] Reporting pages

For each component:

- [ ] Verify uses clinic context
- [ ] Verify loads from clinic database
- [ ] Test with multiple clinics
- [ ] Verify no data crossover

### Update Authentication Hook

- [ ] Replace `use-auth.tsx` with `use-auth-clinic-db.tsx` (or merge)
- [ ] Test login flow
- [ ] Test patient data loading
- [ ] Test clinic context assignment
- [ ] Test clinic access validation

### Test Type Safety

- [ ] Update TypeScript types in `src/types/database.ts`
- [ ] Run `npm run type-check`
- [ ] Fix any type errors
- [ ] No TypeScript warnings

---

## Phase 5: Testing & Validation

### Unit Tests

```bash
npm test -- --testPathPattern=clinic
```

- [ ] All tests pass
- [ ] clinic-supabase tests pass
- [ ] getClinicSupabaseClient works
- [ ] credential retrieval works

### Integration Tests

- [ ] Test complete user flow:
  - [ ] Register patient with clinic
  - [ ] Login to clinic
  - [ ] View appointments
  - [ ] Book appointment
  - [ ] Upload documents

### Data Isolation Tests

Create test scenario:

- [ ] Create Clinic A test database
- [ ] Create Clinic B test database
- [ ] Register patient in Clinic A
- [ ] Attempt to access patient from Clinic B
- [ ] Verify access denied

Steps:

- [ ] Patient A can only see their Clinic A data
- [ ] Patient A cannot see other clinic's patients
- [ ] Patient A cannot see other patient's documents
- [ ] Cross-clinic queries return no results

### Performance Tests

- [ ] Query response times acceptable
- [ ] Client caching working
- [ ] No connection pool exhaustion
- [ ] Database size reasonable

---

## Phase 6: Staging Deployment

### Deploy to Staging

- [ ] Build updated application
- [ ] Deploy to staging environment
- [ ] Verify all services running
- [ ] Check logs for errors

### Staging Testing

- [ ] Test clinic registration flow
- [ ] Test patient login
- [ ] Test data isolation
- [ ] Test all critical paths
- [ ] Verify no errors in logs

### Get Stakeholder Sign-Off

- [ ] Clinic admins test their dashboards
- [ ] Verify no issues reported
- [ ] Performance acceptable
- [ ] Ready for production

---

## Phase 7: Production Deployment

### Pre-Deployment Checklist

- [ ] All code reviewed and merged
- [ ] All tests passing
- [ ] Staging validation complete
- [ ] Backups verified
- [ ] Rollback plan prepared
- [ ] Team on standby
- [ ] Monitoring alerts configured

### Deploy to Production

- [ ] Build production bundle
- [ ] Deploy application
- [ ] Verify all services running
- [ ] Check application logs
- [ ] Monitor error rates

### Post-Deployment Validation

- [ ] Test clinic login
- [ ] Test patient dashboard
- [ ] Test appointment booking
- [ ] Test document operations
- [ ] Verify no data issues
- [ ] Check performance metrics

### Monitor for 24-48 Hours

- [ ] Check error logs regularly
- [ ] Monitor database performance
- [ ] Monitor application metrics
- [ ] Respond to any issues immediately
- [ ] Verify no data corruption

---

## Phase 8: Repeat for Additional Clinics

For each additional clinic:

- [ ] Repeat Phase 2 (Create clinic database)
- [ ] Repeat Phase 3 (Migrate data)
- [ ] Test clinic-specific setup
- [ ] Deploy and validate

Repeat checklist for:

- [ ] Clinic 2: ******\_\_\_\_******
- [ ] Clinic 3: ******\_\_\_\_******
- [ ] Clinic 4: ******\_\_\_\_******
- [ ] Clinic N: ******\_\_\_\_******

---

## Phase 9: Cleanup & Optimization

### Remove Legacy Code

- [ ] Remove shared database patient code
- [ ] Remove old clinic-specific migrations
- [ ] Keep `src/lib/supabase.ts` for central DB only
- [ ] Archive `src/hooks/use-auth.tsx` or remove

### Documentation Updates

- [ ] Update main README
- [ ] Document new clinic setup process
- [ ] Document API changes
- [ ] Update troubleshooting guide

### Database Optimization

- [ ] Review and optimize indexes
- [ ] Analyze slow queries
- [ ] Optimize RLS policies if needed
- [ ] Archive historical data

### Monitoring Setup

- [ ] Set up per-clinic performance monitoring
- [ ] Set up alerts for database issues
- [ ] Set up alerts for RLS violations
- [ ] Regular audit log review

---

## Rollback Plan

If critical issues occur:

### Immediate Actions

- [ ] Stop new registrations
- [ ] Route existing users to old system
- [ ] Assess severity
- [ ] Gather error logs

### Rollback Steps

1. [ ] Revert application deployment
2. [ ] Direct patients back to old URLs
3. [ ] Restore old database if needed
4. [ ] Notify users of issue
5. [ ] Post-mortem and fix root cause

### Re-Deployment

- [ ] Fix identified issues
- [ ] Extend testing period
- [ ] Get additional approvals
- [ ] Deploy with more monitoring

---

## Post-Implementation

### Week 1

- [ ] Daily monitoring
- [ ] Address any issues immediately
- [ ] Collect user feedback
- [ ] Monitor performance metrics

### Month 1

- [ ] Weekly review of logs
- [ ] Verify data integrity
- [ ] Optimize based on real usage
- [ ] Plan additional clinics

### Month 3

- [ ] Archive old shared database (if applicable)
- [ ] Full system performance review
- [ ] Security audit
- [ ] Plan scaling strategy

---

## Success Criteria

✅ **All of the following must be true:**

1. **Data Isolation**

   - [ ] Each clinic database contains only that clinic's data
   - [ ] No cross-clinic data visible
   - [ ] RLS policies enforce data boundaries

2. **Performance**

   - [ ] Query times acceptable (< 500ms for most queries)
   - [ ] No connection pool issues
   - [ ] Client caching effective

3. **Functionality**

   - [ ] All features working in clinic databases
   - [ ] Patient login works
   - [ ] Appointments function properly
   - [ ] Documents upload and display

4. **Security**

   - [ ] RLS policies enforced
   - [ ] Service keys not exposed
   - [ ] Audit logs complete
   - [ ] No unauthorized access

5. **Operations**
   - [ ] Clinic databases easy to manage
   - [ ] Backups working
   - [ ] Monitoring in place
   - [ ] Documentation complete

---

## Sign-Off

- [ ] Technical Lead Approval
- [ ] Security Review Approval
- [ ] Product Management Approval
- [ ] Operations Approval
- [ ] Stakeholder Sign-Off

---

**Implementation Date**: ******\_\_\_******
**Completed By**: ******\_\_\_******
**Reviewed By**: ******\_\_\_******

---

**For questions or clarifications, refer to:**

- Architecture → `CLINIC_DATABASE_ARCHITECTURE.md`
- Implementation → `IMPLEMENTATION_GUIDE.md`
- Quick Help → `QUICK_REFERENCE.md`
