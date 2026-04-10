# Medical Document Upload & Viewing System

## Problem Statement

Patients need to upload medical documents (lab results, prescriptions, imaging, etc.) at any time — not just during onboarding. Practitioners and clinic admins need to view, download, and verify/reject these documents, scoped to patients within their clinic only.

## Decisions

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Upload timing | Onboarding + anytime from records page | Patients shouldn't be locked to onboarding-only |
| Document types | Clinic-defined per clinic | Each clinic configures what they accept |
| Clinic association | Patient selects clinic from dropdown | Patient can belong to multiple clinics |
| Verification workflow | Approve / Reject with reason | Clinic staff need to validate document quality |
| File limits | Clinic-defined + global fallback (10MB, PDF/JPG/PNG/WEBP) | Flexibility with safety net |
| Approach | Extend existing `patient_documents` table | 70% infrastructure already exists |

## Database Changes

### Alter `patient_documents` table

Add columns to align with the existing `PatientDocument` TypeScript interface and support verification:

```sql
ALTER TABLE public.patient_documents
  ADD COLUMN clinic_id UUID REFERENCES public.clinics(id),
  ADD COLUMN document_type_id UUID REFERENCES public.clinic_required_documents(id),
  ADD COLUMN file_path TEXT,
  ADD COLUMN mime_type TEXT,
  ADD COLUMN file_size_bytes BIGINT,
  ADD COLUMN status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  ADD COLUMN verified_by UUID REFERENCES auth.users(id),
  ADD COLUMN verified_at TIMESTAMPTZ,
  ADD COLUMN rejection_reason TEXT,
  ADD COLUMN updated_at TIMESTAMPTZ DEFAULT now();

CREATE INDEX idx_patient_documents_clinic ON public.patient_documents(clinic_id);
```

### RLS Policy Changes

**Drop old clinic admin policies** (they use `patient_clinics` without clinic_id scoping) and replace with clinic_id-scoped versions:

```sql
-- Drop existing clinic admin policies
DROP POLICY IF EXISTS "patient_documents_clinic_admins_select" ON public.patient_documents;
DROP POLICY IF EXISTS "patient_documents_clinic_admins_insert" ON public.patient_documents;
DROP POLICY IF EXISTS "patient_documents_clinic_admins_update" ON public.patient_documents;

-- New: Clinic admins see/manage documents for their clinic only
CREATE POLICY "patient_documents_clinic_admins_select" ON public.patient_documents
  FOR SELECT TO authenticated
  USING (EXISTS (
    SELECT 1 FROM clinic_admins ca
    WHERE ca.auth_user_id = auth.uid()
    AND ca.clinic_id = patient_documents.clinic_id
    AND ca.is_active = true
  ));

CREATE POLICY "patient_documents_clinic_admins_update" ON public.patient_documents
  FOR UPDATE TO authenticated
  USING (EXISTS (
    SELECT 1 FROM clinic_admins ca
    WHERE ca.auth_user_id = auth.uid()
    AND ca.clinic_id = patient_documents.clinic_id
    AND ca.is_active = true
  ));

-- New: Practitioners see documents for patients at their clinic
CREATE POLICY "patient_documents_practitioners_select" ON public.patient_documents
  FOR SELECT TO authenticated
  USING (EXISTS (
    SELECT 1 FROM practitioners p
    WHERE p.auth_user_id = auth.uid()
    AND p.clinic_id = patient_documents.clinic_id
    AND p.is_active = true
  ));

-- New: Practitioners can update (for verify/reject)
CREATE POLICY "patient_documents_practitioners_update" ON public.patient_documents
  FOR UPDATE TO authenticated
  USING (EXISTS (
    SELECT 1 FROM practitioners p
    WHERE p.auth_user_id = auth.uid()
    AND p.clinic_id = patient_documents.clinic_id
    AND p.is_active = true
  ));

-- New: Patients can insert their own documents
CREATE POLICY "patient_documents_patients_insert" ON public.patient_documents
  FOR INSERT TO authenticated
  WITH CHECK (patient_id = get_patient_id_for_user());

-- New: Patients can delete their own pending documents
CREATE POLICY "patient_documents_patients_delete" ON public.patient_documents
  FOR DELETE TO authenticated
  USING (patient_id = get_patient_id_for_user() AND status = 'pending');
```

**Kept as-is:**
- `patient_documents_patients_select` — patients see their own documents
- `patient_documents_service_role_all` — service role full access

## API Endpoints

### `POST /api/patients/[patientId]/documents`

Upload a document for a patient.

- **Auth:** Patient uploading for themselves only
- **Body:** `multipart/form-data`
  - `file` (required) — the file to upload
  - `clinic_id` (required) — which clinic this document belongs to
  - `document_type_id` (optional) — clinic-defined document type
  - `description` (optional) — free text description
- **Validation:**
  - If `document_type_id` provided: validate against clinic's `allowed_file_types` and `max_file_size_mb`
  - Otherwise: global defaults (10MB, PDF/JPG/JPEG/PNG/WEBP)
  - Verify patient belongs to the specified clinic via `patient_clinics`
- **Storage path:** `${patientId}/${clinicId}/${timestamp}_${fileName}`
- **Response:** `201` with created document record
- **Activity log:** `document_uploaded`

### `GET /api/patients/[patientId]/documents?clinic_id=xxx`

List documents for a patient, optionally filtered by clinic.

- **Auth:** Patient (own), clinic admin (their clinic), practitioner (their clinic)
- **Query params:** `clinic_id` (optional filter)
- **Response:** Array of documents with signed download URLs
- **Access scoping:** RLS handles clinic-level isolation automatically

### `GET /api/patients/[patientId]/documents/[documentId]/download`

Get a signed download URL for a specific document.

- **Auth:** Patient (own), clinic admin (their clinic), practitioner (their clinic)
- **Response:** `{ url: string }` — signed URL valid for 60 seconds
- **Access scoping:** RLS enforced

### `PATCH /api/patients/[patientId]/documents/[documentId]`

Verify or reject a document.

- **Auth:** Clinic admin or practitioner at the document's clinic
- **Body:** `{ status: 'approved' | 'rejected', rejection_reason?: string }`
- **Sets:** `verified_by` (current user), `verified_at` (now), `rejection_reason` (if rejected)
- **Activity log:** `document_verified` or `document_rejected`

### `DELETE /api/patients/[patientId]/documents/[documentId]`

Delete a pending document.

- **Auth:** Patient (own documents, only if status is `pending`)
- **Actions:** Delete from storage bucket, delete DB row
- **Activity log:** `document_deleted`

## Frontend

### Shared Components

#### `DocumentUploadForm`
Location: `src/components/documents/DocumentUploadForm.tsx`

Props:
- `patientId: string`
- `clinics: { id: string; name: string }[]` — patient's clinics for dropdown
- `onUploadComplete: () => void` — refresh callback

Features:
- Clinic selector dropdown (patient's clinics via `patient_clinics`)
- Document type selector (loads clinic-defined types for selected clinic)
- File picker with drag-and-drop zone
- File validation feedback (size, type) before upload
- Upload progress indicator
- Description text input

#### `DocumentList`
Location: `src/components/documents/DocumentList.tsx`

Props:
- `documents: PatientDocument[]`
- `canVerify?: boolean` — show approve/reject actions (for clinic admin/practitioner)
- `canDelete?: boolean` — show delete action (for patient, pending only)
- `onVerify?: (documentId: string, status: string, reason?: string) => void`
- `onDelete?: (documentId: string) => void`

Features:
- File name, document type label, clinic name, upload date
- Status badge: pending (yellow), approved (green), rejected (red)
- Download button (signed URL)
- Rejection reason shown on rejected documents
- Approve/reject buttons when `canVerify` is true
- Delete button for pending docs when `canDelete` is true

#### `DocumentVerifyDialog`
Location: `src/components/documents/DocumentVerifyDialog.tsx`

Modal dialog for approve/reject:
- Document preview/name
- Approve button
- Reject button with required reason textarea

### Pages

#### Patient Records Page
Route: `/patient/records` (replace existing placeholder)
File: `src/app/(dashboard)/patient/records/page.tsx`

- Clinic filter dropdown at top (patient's clinics)
- Upload button opens `DocumentUploadForm`
- `DocumentList` with `canDelete=true` for pending documents
- Rejected documents show reason with re-upload option
- Groups documents or filters by selected clinic

#### Clinic Admin Patient Documents
Route: `/clinic/[clinicId]/patients/[patientId]/documents`
File: `src/app/(clinic)/clinic/[clinicId]/patients/[patientId]/documents/page.tsx`

- Linked from existing patient history page as a tab or button
- `DocumentList` with `canVerify=true`
- Filter by status (all, pending, approved, rejected)
- Download individual files

#### Practitioner Patient Documents
Route: `/practitioner/[practitionerId]/clinic/[clinicId]/patients/[patientId]/documents`
File: `src/app/(practitioner)/practitioner/[practitionerId]/clinic/[clinicId]/patients/[patientId]/documents/page.tsx`

- Same view as clinic admin: `DocumentList` with `canVerify=true`
- Scoped to their clinic (RLS enforced)
- Accessed from appointment details or patient view

### Navigation Changes

- **Patient sidebar:** "Medical Records" already exists at `/patient/records` — no change needed
- **Clinic admin:** Add "View Documents" link on patient history page (`/clinic/[clinicId]/patients/[patientId]/history`)
- **Practitioner:** Add "Documents" link from patient/appointment views

## Type Updates

Update `src/types/database.ts` `PatientDocument` interface (already matches target shape — no changes needed).

Create a new hook `src/hooks/usePatientDocuments.ts`:
- `fetchDocuments(patientId, clinicId?)` — GET documents
- `uploadDocument(patientId, formData)` — POST upload
- `verifyDocument(patientId, documentId, status, reason?)` — PATCH
- `deleteDocument(patientId, documentId)` — DELETE
- `getDownloadUrl(patientId, documentId)` — GET signed URL

## Global Upload Defaults

Defined as constants in a shared location (e.g., `src/lib/constants.ts`):

```typescript
export const DOCUMENT_UPLOAD_DEFAULTS = {
  maxFileSizeMb: 10,
  allowedFileTypes: ['application/pdf', 'image/jpeg', 'image/jpg', 'image/png', 'image/webp'],
  allowedExtensions: ['.pdf', '.jpg', '.jpeg', '.png', '.webp'],
};
```

## Security Considerations

- All document access is RLS-enforced at the database level
- Clinic admins and practitioners can only see documents scoped to their clinic via `clinic_id` match
- Patients can only upload for themselves (`get_patient_id_for_user()`)
- Patients can only delete their own pending documents
- Storage paths include `clinicId` for bucket-level organization
- Signed URLs expire after 60 seconds
- File type and size validated server-side before storage upload
