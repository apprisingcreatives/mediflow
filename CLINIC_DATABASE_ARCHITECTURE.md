# Per-Clinic Database Architecture

## Overview

This document outlines the new multi-database architecture where each clinic has its own separate Supabase project/database.

## Architecture

### 1. Central Database (Main Supabase Project)

**Purpose**: Manage clinics, clinic admins, and global configurations

**Tables**:

- `super_admins` - System administrators
- `clinics` - Clinic information and metadata
  - Added fields: `supabase_url`, `supabase_anon_key`, `supabase_service_key`, `database_created_at`
- `clinic_admins` - Clinic administrator accounts
- `clinic_payments` - Payment history
- `email_templates` - Email notification templates (global)
- `clinic_configs` - Clinic-specific settings

### 2. Per-Clinic Databases (Individual Supabase Projects)

**Purpose**: Store clinic-specific patient data, documents, and appointments

**Tables for each clinic database**:

- `patients` - Patient profiles (clinic-specific)
- `patient_documents` - Patient documents and medical records
- `appointments` - Appointment scheduling
- `clinic_practitioners` - Doctors/practitioners (previously `practitioners`)
- `clinic_services` - Services offered (previously `clinic_services`)
- `patient_question_responses` - Onboarding responses
- `patient_documents_required` - Required document types

## Data Flow

### Patient Registration

1. Patient signs up on clinic landing page → clinic URL captured
2. User created in clinic's Firebase Auth (managed separately)
3. Patient record created in clinic's database
4. Link stored in central database (clinic_patient_references)

### Patient Login

1. Check which clinic context the user is accessing from
2. Authenticate against that clinic's Supabase project
3. Load patient data from clinic's database
4. Validate clinic access before loading dashboard

### Booking/Appointments

1. Patient selects clinic from public listing
2. Checks if patient has an account with that clinic
3. If yes → redirect to clinic login
4. If no → redirect to clinic registration

## Benefits

- ✅ Complete data isolation per clinic
- ✅ No cross-clinic data leakage
- ✅ Clinic can manage their own backups
- ✅ Scalability - can use different database sizes per clinic
- ✅ Compliance - easier to meet HIPAA/data residency requirements
- ✅ Performance - smaller databases = faster queries

## Migration Plan

### Phase 1: Schema Preparation

- Create new migrations for each clinic database
- Update central database schema
- Add clinic database credentials table

### Phase 2: Application Updates

- Implement dynamic Supabase client selection
- Update auth flow to determine clinic context
- Update API routes to use clinic-specific database

### Phase 3: Data Migration

- Create script to migrate existing data
- Create new clinic databases as needed
- Test data integrity

### Phase 4: Cutover

- Disable old single-database code paths
- Monitor clinic databases
- Handle new registrations with per-clinic setup

## Environment Variables

### Central Database

```
NEXT_PUBLIC_SUPABASE_URL=https://central.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=xxx
SUPABASE_SERVICE_ROLE_KEY=xxx
```

### Clinic Databases (Stored in clinics table)

Each clinic record includes:

- `supabase_url` - Clinic's Supabase URL
- `supabase_anon_key` - Clinic's Supabase anon key
- `supabase_service_key` - Clinic's service role key
