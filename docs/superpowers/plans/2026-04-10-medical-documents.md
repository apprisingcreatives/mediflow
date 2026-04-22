# Medical Document Upload & Viewing Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Enable patients to upload medical documents anytime, and allow practitioners/clinic admins to view, download, and verify/reject them — scoped to their clinic only.

**Architecture:** Extend the existing `patient_documents` table with new columns (clinic_id, status, verification fields). Build API routes under `/api/patients/[patientId]/documents` for CRUD + verification. Create shared frontend components (DocumentUploadForm, DocumentList, DocumentVerifyDialog) used by patient records page, clinic admin patient view, and practitioner patient view.

**Tech Stack:** Next.js 14 App Router, Supabase (Postgres + Storage + RLS), TypeScript, Tailwind CSS, Radix UI components, lucide-react icons, date-fns.

**Spec:** `docs/superpowers/specs/2026-04-10-medical-documents-design.md`

---

## File Structure

### New Files
| File | Responsibility |
|------|---------------|
| `supabase/migrations/20260410000000_extend_patient_documents.sql` | Alter table, update RLS policies |
| `src/lib/constants.ts` | Global upload defaults (max size, allowed types) |
| `src/hooks/usePatientDocuments.ts` | Client hook for document CRUD operations |
| `src/app/api/patients/[patientId]/documents/route.ts` | GET (list) + POST (upload) documents |
| `src/app/api/patients/[patientId]/documents/[documentId]/route.ts` | PATCH (verify/reject) + DELETE document |
| `src/app/api/patients/[patientId]/documents/[documentId]/download/route.ts` | GET signed download URL |
| `src/components/documents/DocumentUploadForm.tsx` | Upload form with clinic/type selectors + drag-and-drop |
| `src/components/documents/DocumentList.tsx` | Document list with status badges + actions |
| `src/components/documents/DocumentVerifyDialog.tsx` | Approve/reject modal dialog |
| `src/app/(clinic)/clinic/[clinicId]/patients/[patientId]/documents/page.tsx` | Clinic admin document view |
| `src/app/(practitioner)/practitioner/[practitionerId]/clinic/[clinicId]/patients/[patientId]/documents/page.tsx` | Practitioner document view |

### Modified Files
| File | Change |
|------|--------|
| `src/app/(dashboard)/patient/records/page.tsx` | Replace placeholder with full document management |
| `src/app/(clinic)/clinic/[clinicId]/patients/[patientId]/history/page.tsx` | Add "Documents" tab |

---

## Task 1: Database Migration

**Files:**
- Create: `supabase/migrations/20260410000000_extend_patient_documents.sql`

- [ ] **Step 1: Create migration file**

```sql
-- Extend patient_documents table for medical document management
-- Adds clinic scoping, verification workflow, and file metadata

-- =============================================
-- 1. Add new columns
-- =============================================
ALTER TABLE public.patient_documents
  ADD COLUMN IF NOT EXISTS clinic_id UUID REFERENCES public.clinics(id),
  ADD COLUMN IF NOT EXISTS document_type_id UUID REFERENCES public.clinic_required_documents(id),
  ADD COLUMN IF NOT EXISTS file_path TEXT,
  ADD COLUMN IF NOT EXISTS mime_type TEXT,
  ADD COLUMN IF NOT EXISTS file_size_bytes BIGINT,
  ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  ADD COLUMN IF NOT EXISTS verified_by UUID REFERENCES auth.users(id),
  ADD COLUMN IF NOT EXISTS verified_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS rejection_reason TEXT,
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT now();

-- =============================================
-- 2. Add index for clinic-scoped queries
-- =============================================
CREATE INDEX IF NOT EXISTS idx_patient_documents_clinic
  ON public.patient_documents(clinic_id);

CREATE INDEX IF NOT EXISTS idx_patient_documents_status
  ON public.patient_documents(status);

-- =============================================
-- 3. Drop old clinic admin policies (they use patient_clinics without clinic_id scoping)
-- =============================================
DROP POLICY IF EXISTS "patient_documents_clinic_admins_select" ON public.patient_documents;
DROP POLICY IF EXISTS "patient_documents_clinic_admins_insert" ON public.patient_documents;
DROP POLICY IF EXISTS "patient_documents_clinic_admins_update" ON public.patient_documents;

-- =============================================
-- 4. Create new RLS policies
-- =============================================

-- Clinic admins: SELECT documents scoped to their clinic
CREATE POLICY "patient_documents_clinic_admins_select" ON public.patient_documents
  FOR SELECT TO authenticated
  USING (EXISTS (
    SELECT 1 FROM clinic_admins ca
    WHERE ca.auth_user_id = auth.uid()
    AND ca.clinic_id = patient_documents.clinic_id
    AND ca.is_active = true
  ));

-- Clinic admins: UPDATE documents for verification (their clinic only)
CREATE POLICY "patient_documents_clinic_admins_update" ON public.patient_documents
  FOR UPDATE TO authenticated
  USING (EXISTS (
    SELECT 1 FROM clinic_admins ca
    WHERE ca.auth_user_id = auth.uid()
    AND ca.clinic_id = patient_documents.clinic_id
    AND ca.is_active = true
  ));

-- Practitioners: SELECT documents scoped to their clinic
CREATE POLICY "patient_documents_practitioners_select" ON public.patient_documents
  FOR SELECT TO authenticated
  USING (EXISTS (
    SELECT 1 FROM practitioners p
    WHERE p.auth_user_id = auth.uid()
    AND p.clinic_id = patient_documents.clinic_id
    AND p.is_active = true
  ));

-- Practitioners: UPDATE documents for verification (their clinic only)
CREATE POLICY "patient_documents_practitioners_update" ON public.patient_documents
  FOR UPDATE TO authenticated
  USING (EXISTS (
    SELECT 1 FROM practitioners p
    WHERE p.auth_user_id = auth.uid()
    AND p.clinic_id = patient_documents.clinic_id
    AND p.is_active = true
  ));

-- Patients: INSERT their own documents
CREATE POLICY "patient_documents_patients_insert" ON public.patient_documents
  FOR INSERT TO authenticated
  WITH CHECK (patient_id = get_patient_id_for_user());

-- Patients: DELETE their own pending documents only
CREATE POLICY "patient_documents_patients_delete" ON public.patient_documents
  FOR DELETE TO authenticated
  USING (patient_id = get_patient_id_for_user() AND status = 'pending');
```

- [ ] **Step 2: Commit**

```bash
git add supabase/migrations/20260410000000_extend_patient_documents.sql
git commit -m "feat(db): extend patient_documents with clinic scoping and verification"
```

---

## Task 2: Constants & Hook

**Files:**
- Create: `src/lib/constants.ts`
- Create: `src/hooks/usePatientDocuments.ts`

- [ ] **Step 1: Create upload constants**

Create `src/lib/constants.ts`:

```typescript
export const DOCUMENT_UPLOAD_DEFAULTS = {
  maxFileSizeMb: 10,
  maxFileSizeBytes: 10 * 1024 * 1024,
  allowedMimeTypes: [
    'application/pdf',
    'image/jpeg',
    'image/png',
    'image/webp',
  ],
  allowedExtensions: ['.pdf', '.jpg', '.jpeg', '.png', '.webp'],
};
```

- [ ] **Step 2: Create usePatientDocuments hook**

Create `src/hooks/usePatientDocuments.ts`:

```typescript
'use client';

import { useState, useCallback } from 'react';
import { PatientDocument } from '@/types/database';

interface UsePatientDocumentsReturn {
  documents: PatientDocument[];
  loading: boolean;
  error: string | null;
  fetchDocuments: (patientId: string, clinicId?: string) => Promise<void>;
  uploadDocument: (patientId: string, formData: FormData) => Promise<PatientDocument | null>;
  verifyDocument: (
    patientId: string,
    documentId: string,
    status: 'approved' | 'rejected',
    rejectionReason?: string,
  ) => Promise<boolean>;
  deleteDocument: (patientId: string, documentId: string) => Promise<boolean>;
  getDownloadUrl: (patientId: string, documentId: string) => Promise<string | null>;
}

export function usePatientDocuments(): UsePatientDocumentsReturn {
  const [documents, setDocuments] = useState<PatientDocument[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchDocuments = useCallback(async (patientId: string, clinicId?: string) => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      if (clinicId) params.set('clinic_id', clinicId);
      const res = await fetch(`/api/patients/${patientId}/documents?${params}`);
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || 'Failed to fetch documents');
      }
      const data = await res.json();
      setDocuments(data.documents);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  const uploadDocument = useCallback(async (patientId: string, formData: FormData): Promise<PatientDocument | null> => {
    setError(null);
    try {
      const res = await fetch(`/api/patients/${patientId}/documents`, {
        method: 'POST',
        body: formData,
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || 'Failed to upload document');
      }
      const data = await res.json();
      return data.document;
    } catch (err: any) {
      setError(err.message);
      return null;
    }
  }, []);

  const verifyDocument = useCallback(async (
    patientId: string,
    documentId: string,
    status: 'approved' | 'rejected',
    rejectionReason?: string,
  ): Promise<boolean> => {
    setError(null);
    try {
      const res = await fetch(`/api/patients/${patientId}/documents/${documentId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status, rejection_reason: rejectionReason }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || 'Failed to update document');
      }
      return true;
    } catch (err: any) {
      setError(err.message);
      return false;
    }
  }, []);

  const deleteDocument = useCallback(async (patientId: string, documentId: string): Promise<boolean> => {
    setError(null);
    try {
      const res = await fetch(`/api/patients/${patientId}/documents/${documentId}`, {
        method: 'DELETE',
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || 'Failed to delete document');
      }
      return true;
    } catch (err: any) {
      setError(err.message);
      return false;
    }
  }, []);

  const getDownloadUrl = useCallback(async (patientId: string, documentId: string): Promise<string | null> => {
    try {
      const res = await fetch(`/api/patients/${patientId}/documents/${documentId}/download`);
      if (!res.ok) return null;
      const data = await res.json();
      return data.url;
    } catch {
      return null;
    }
  }, []);

  return { documents, loading, error, fetchDocuments, uploadDocument, verifyDocument, deleteDocument, getDownloadUrl };
}
```

- [ ] **Step 3: Commit**

```bash
git add src/lib/constants.ts src/hooks/usePatientDocuments.ts
git commit -m "feat: add document upload constants and usePatientDocuments hook"
```

---

## Task 3: API Routes

**Files:**
- Create: `src/app/api/patients/[patientId]/documents/route.ts`
- Create: `src/app/api/patients/[patientId]/documents/[documentId]/route.ts`
- Create: `src/app/api/patients/[patientId]/documents/[documentId]/download/route.ts`

- [ ] **Step 1: Create GET + POST route for documents list and upload**

Create `src/app/api/patients/[patientId]/documents/route.ts`:

```typescript
import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { DOCUMENT_UPLOAD_DEFAULTS } from '@/lib/constants';

export async function GET(
  request: Request,
  { params }: { params: { patientId: string } },
) {
  try {
    const { patientId } = params;
    const { searchParams } = new URL(request.url);
    const clinicId = searchParams.get('clinic_id');

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    let query = supabase
      .from('patient_documents')
      .select('*, document_type:clinic_required_documents(id, document_name, category)')
      .eq('patient_id', patientId)
      .order('created_at', { ascending: false });

    if (clinicId) {
      query = query.eq('clinic_id', clinicId);
    }

    const { data: documents, error } = await query;

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ documents: documents ?? [] });
  } catch (err) {
    console.error('[documents GET] Server error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(
  request: Request,
  { params }: { params: { patientId: string } },
) {
  try {
    const { patientId } = params;

    // Auth: only patient can upload their own documents
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Verify this is the patient's own account
    const { data: patient } = await supabase
      .from('patients')
      .select('id')
      .eq('id', patientId)
      .eq('auth_user_id', user.id)
      .single();

    if (!patient) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const formData = await request.formData();
    const file = formData.get('file') as File;
    const clinicId = formData.get('clinic_id') as string;
    const documentTypeId = formData.get('document_type_id') as string | null;
    const description = formData.get('description') as string | null;

    if (!file || !clinicId) {
      return NextResponse.json(
        { error: 'File and clinic_id are required' },
        { status: 400 },
      );
    }

    // Verify patient belongs to this clinic
    const { data: membership } = await supabaseAdmin
      .from('patient_clinics')
      .select('id')
      .eq('patient_id', patientId)
      .eq('clinic_id', clinicId)
      .single();

    if (!membership) {
      return NextResponse.json(
        { error: 'Patient does not belong to this clinic' },
        { status: 403 },
      );
    }

    // Determine file limits
    let maxSizeBytes = DOCUMENT_UPLOAD_DEFAULTS.maxFileSizeBytes;
    let allowedExtensions = DOCUMENT_UPLOAD_DEFAULTS.allowedExtensions;
    let documentTypeName: string | null = null;

    if (documentTypeId) {
      const { data: docType } = await supabaseAdmin
        .from('clinic_required_documents')
        .select('*')
        .eq('id', documentTypeId)
        .eq('clinic_id', clinicId)
        .eq('is_active', true)
        .single();

      if (!docType) {
        return NextResponse.json({ error: 'Invalid document type' }, { status: 400 });
      }

      maxSizeBytes = docType.max_file_size_mb * 1024 * 1024;
      if (docType.allowed_file_types) {
        allowedExtensions = docType.allowed_file_types.split(',').map((t: string) => `.${t.trim()}`);
      }
      documentTypeName = docType.document_name;
    }

    // Validate file size
    if (file.size > maxSizeBytes) {
      return NextResponse.json(
        { error: `File size exceeds ${Math.round(maxSizeBytes / (1024 * 1024))}MB limit` },
        { status: 400 },
      );
    }

    // Validate file extension
    const fileExt = `.${file.name.split('.').pop()?.toLowerCase()}`;
    if (!allowedExtensions.includes(fileExt)) {
      return NextResponse.json(
        { error: `File type ${fileExt} not allowed. Allowed: ${allowedExtensions.join(', ')}` },
        { status: 400 },
      );
    }

    // Upload to storage
    const storagePath = `${patientId}/${clinicId}/${Date.now()}_${file.name}`;
    const { data: uploadData, error: uploadError } = await supabaseAdmin.storage
      .from('patient-documents')
      .upload(storagePath, file);

    if (uploadError) {
      return NextResponse.json({ error: uploadError.message }, { status: 500 });
    }

    // Insert document record
    const insertData: Record<string, any> = {
      patient_id: patientId,
      clinic_id: clinicId,
      file_name: file.name,
      file_path: uploadData.path,
      file_size_bytes: file.size,
      mime_type: file.type,
      status: 'pending',
    };
    if (documentTypeId) insertData.document_type_id = documentTypeId;
    if (description) insertData.description = description;

    const { data: document, error: docError } = await supabaseAdmin
      .from('patient_documents')
      .insert(insertData)
      .select('*, document_type:clinic_required_documents(id, document_name, category)')
      .single();

    if (docError) {
      // Cleanup uploaded file on DB failure
      await supabaseAdmin.storage.from('patient-documents').remove([uploadData.path]);
      return NextResponse.json({ error: docError.message }, { status: 500 });
    }

    // Activity log
    await supabaseAdmin.from('activity_logs').insert({
      patient_id: patientId,
      clinic_id: clinicId,
      actor_id: user.id,
      actor_role: 'patient',
      action_type: 'document_uploaded',
      entity_type: 'patient_document',
      entity_id: document.id,
      metadata: {
        file_name: file.name,
        document_type: documentTypeName || 'General',
      },
    });

    return NextResponse.json({ document }, { status: 201 });
  } catch (err) {
    console.error('[documents POST] Server error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
```

- [ ] **Step 2: Create PATCH + DELETE route for single document**

Create `src/app/api/patients/[patientId]/documents/[documentId]/route.ts`:

```typescript
import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { supabaseAdmin } from '@/lib/supabase-admin';

export async function PATCH(
  request: Request,
  { params }: { params: { patientId: string; documentId: string } },
) {
  try {
    const { patientId, documentId } = params;

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { status, rejection_reason } = body as {
      status?: 'approved' | 'rejected';
      rejection_reason?: string;
    };

    if (!status || !['approved', 'rejected'].includes(status)) {
      return NextResponse.json({ error: 'Invalid status' }, { status: 400 });
    }

    if (status === 'rejected' && !rejection_reason) {
      return NextResponse.json(
        { error: 'Rejection reason is required' },
        { status: 400 },
      );
    }

    // Fetch the document to get clinic_id for auth check
    const { data: doc } = await supabaseAdmin
      .from('patient_documents')
      .select('id, clinic_id, file_name')
      .eq('id', documentId)
      .eq('patient_id', patientId)
      .single();

    if (!doc) {
      return NextResponse.json({ error: 'Document not found' }, { status: 404 });
    }

    // Verify user is a clinic admin or practitioner at this clinic
    const { data: clinicAdmin } = await supabaseAdmin
      .from('clinic_admins')
      .select('id')
      .eq('auth_user_id', user.id)
      .eq('clinic_id', doc.clinic_id)
      .eq('is_active', true)
      .maybeSingle();

    const { data: practitioner } = await supabaseAdmin
      .from('practitioners')
      .select('id')
      .eq('auth_user_id', user.id)
      .eq('clinic_id', doc.clinic_id)
      .eq('is_active', true)
      .maybeSingle();

    if (!clinicAdmin && !practitioner) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const actorRole = clinicAdmin ? 'clinic_admin' : 'practitioner';

    // Update document status
    const updateData: Record<string, any> = {
      status,
      verified_by: user.id,
      verified_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    if (status === 'rejected') {
      updateData.rejection_reason = rejection_reason;
    } else {
      updateData.rejection_reason = null;
    }

    const { data: updated, error: updateError } = await supabaseAdmin
      .from('patient_documents')
      .update(updateData)
      .eq('id', documentId)
      .select()
      .single();

    if (updateError) {
      return NextResponse.json({ error: updateError.message }, { status: 500 });
    }

    // Activity log
    await supabaseAdmin.from('activity_logs').insert({
      patient_id: patientId,
      clinic_id: doc.clinic_id,
      actor_id: user.id,
      actor_role: actorRole,
      action_type: status === 'approved' ? 'document_verified' : 'document_rejected',
      entity_type: 'patient_document',
      entity_id: documentId,
      metadata: {
        file_name: doc.file_name,
        status,
        ...(rejection_reason ? { rejection_reason } : {}),
      },
    });

    return NextResponse.json({ document: updated });
  } catch (err) {
    console.error('[documents PATCH] Server error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: { patientId: string; documentId: string } },
) {
  try {
    const { patientId, documentId } = params;

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Verify this is the patient's own document and it's pending
    const { data: patient } = await supabase
      .from('patients')
      .select('id')
      .eq('id', patientId)
      .eq('auth_user_id', user.id)
      .single();

    if (!patient) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Fetch document (must be pending to delete)
    const { data: doc } = await supabaseAdmin
      .from('patient_documents')
      .select('id, file_path, status, clinic_id, file_name')
      .eq('id', documentId)
      .eq('patient_id', patientId)
      .single();

    if (!doc) {
      return NextResponse.json({ error: 'Document not found' }, { status: 404 });
    }

    if (doc.status !== 'pending') {
      return NextResponse.json(
        { error: 'Only pending documents can be deleted' },
        { status: 400 },
      );
    }

    // Delete from storage
    if (doc.file_path) {
      await supabaseAdmin.storage.from('patient-documents').remove([doc.file_path]);
    }

    // Delete DB record
    const { error: deleteError } = await supabaseAdmin
      .from('patient_documents')
      .delete()
      .eq('id', documentId);

    if (deleteError) {
      return NextResponse.json({ error: deleteError.message }, { status: 500 });
    }

    // Activity log
    await supabaseAdmin.from('activity_logs').insert({
      patient_id: patientId,
      clinic_id: doc.clinic_id,
      actor_id: user.id,
      actor_role: 'patient',
      action_type: 'document_deleted',
      entity_type: 'patient_document',
      entity_id: documentId,
      metadata: { file_name: doc.file_name },
    });

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('[documents DELETE] Server error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
```

- [ ] **Step 3: Create download route**

Create `src/app/api/patients/[patientId]/documents/[documentId]/download/route.ts`:

```typescript
import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { supabaseAdmin } from '@/lib/supabase-admin';

export async function GET(
  request: Request,
  { params }: { params: { patientId: string; documentId: string } },
) {
  try {
    const { patientId, documentId } = params;

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // RLS will scope access — fetch the document through the authenticated client
    const { data: doc, error } = await supabase
      .from('patient_documents')
      .select('file_path')
      .eq('id', documentId)
      .eq('patient_id', patientId)
      .single();

    if (error || !doc || !doc.file_path) {
      return NextResponse.json({ error: 'Document not found' }, { status: 404 });
    }

    // Generate signed URL (60 seconds)
    const { data: signedUrl, error: signError } = await supabaseAdmin.storage
      .from('patient-documents')
      .createSignedUrl(doc.file_path, 60);

    if (signError || !signedUrl) {
      return NextResponse.json({ error: 'Failed to generate download URL' }, { status: 500 });
    }

    return NextResponse.json({ url: signedUrl.signedUrl });
  } catch (err) {
    console.error('[documents download] Server error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
```

- [ ] **Step 4: Commit**

```bash
git add "src/app/api/patients/[patientId]/documents/"
git commit -m "feat: add document CRUD and download API routes"
```

---

## Task 4: Shared Frontend Components

**Files:**
- Create: `src/components/documents/DocumentUploadForm.tsx`
- Create: `src/components/documents/DocumentList.tsx`
- Create: `src/components/documents/DocumentVerifyDialog.tsx`

- [ ] **Step 1: Create DocumentUploadForm**

Create `src/components/documents/DocumentUploadForm.tsx`:

```tsx
'use client';

import { useState, useRef, useEffect } from 'react';
import { Upload, X, FileText, Loader2, CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { supabase } from '@/lib/supabase';
import { DOCUMENT_UPLOAD_DEFAULTS } from '@/lib/constants';
import { usePatientDocuments } from '@/hooks/usePatientDocuments';
import { toast } from 'sonner';

interface DocumentUploadFormProps {
  patientId: string;
  clinics: { id: string; name: string }[];
  onUploadComplete: () => void;
  onCancel?: () => void;
}

interface ClinicDocType {
  id: string;
  document_name: string;
  allowed_file_types: string | null;
  max_file_size_mb: number;
}

export function DocumentUploadForm({
  patientId,
  clinics,
  onUploadComplete,
  onCancel,
}: DocumentUploadFormProps) {
  const { uploadDocument } = usePatientDocuments();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [selectedClinicId, setSelectedClinicId] = useState('');
  const [documentTypeId, setDocumentTypeId] = useState('');
  const [description, setDescription] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [docTypes, setDocTypes] = useState<ClinicDocType[]>([]);
  const [loadingTypes, setLoadingTypes] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const [fileError, setFileError] = useState<string | null>(null);

  // Load clinic document types when clinic changes
  useEffect(() => {
    if (!selectedClinicId) {
      setDocTypes([]);
      setDocumentTypeId('');
      return;
    }

    const loadTypes = async () => {
      setLoadingTypes(true);
      const { data } = await supabase
        .from('clinic_required_documents')
        .select('id, document_name, allowed_file_types, max_file_size_mb')
        .eq('clinic_id', selectedClinicId)
        .eq('is_active', true)
        .order('display_order');
      setDocTypes(data ?? []);
      setDocumentTypeId('');
      setLoadingTypes(false);
    };

    loadTypes();
  }, [selectedClinicId]);

  const validateFile = (f: File): string | null => {
    const selectedType = docTypes.find((t) => t.id === documentTypeId);
    const maxBytes = selectedType
      ? selectedType.max_file_size_mb * 1024 * 1024
      : DOCUMENT_UPLOAD_DEFAULTS.maxFileSizeBytes;
    const allowedExts = selectedType?.allowed_file_types
      ? selectedType.allowed_file_types.split(',').map((e) => `.${e.trim().toLowerCase()}`)
      : DOCUMENT_UPLOAD_DEFAULTS.allowedExtensions;

    if (f.size > maxBytes) {
      return `File exceeds ${Math.round(maxBytes / (1024 * 1024))}MB limit`;
    }

    const ext = `.${f.name.split('.').pop()?.toLowerCase()}`;
    if (!allowedExts.includes(ext)) {
      return `File type ${ext} not allowed. Accepted: ${allowedExts.join(', ')}`;
    }

    return null;
  };

  const handleFileSelect = (f: File) => {
    const error = validateFile(f);
    setFileError(error);
    setFile(f);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const droppedFile = e.dataTransfer.files[0];
    if (droppedFile) handleFileSelect(droppedFile);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file || !selectedClinicId || fileError) return;

    setUploading(true);
    const formData = new FormData();
    formData.append('file', file);
    formData.append('clinic_id', selectedClinicId);
    if (documentTypeId) formData.append('document_type_id', documentTypeId);
    if (description.trim()) formData.append('description', description.trim());

    const result = await uploadDocument(patientId, formData);
    setUploading(false);

    if (result) {
      toast.success('Document uploaded successfully');
      setFile(null);
      setDescription('');
      setDocumentTypeId('');
      onUploadComplete();
    } else {
      toast.error('Failed to upload document');
    }
  };

  const formatSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Clinic selector */}
      <div className="space-y-2">
        <Label className="text-clinic-navy dark:text-white">Clinic</Label>
        <Select value={selectedClinicId} onValueChange={setSelectedClinicId}>
          <SelectTrigger>
            <SelectValue placeholder="Select a clinic" />
          </SelectTrigger>
          <SelectContent>
            {clinics.map((c) => (
              <SelectItem key={c.id} value={c.id}>
                {c.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Document type selector */}
      {selectedClinicId && (
        <div className="space-y-2">
          <Label className="text-clinic-navy dark:text-white">Document Type</Label>
          {loadingTypes ? (
            <div className="flex items-center gap-2 text-sm text-clinic-text/60">
              <Loader2 className="w-4 h-4 animate-spin" /> Loading types...
            </div>
          ) : (
            <Select value={documentTypeId} onValueChange={setDocumentTypeId}>
              <SelectTrigger>
                <SelectValue placeholder="Select type (optional)" />
              </SelectTrigger>
              <SelectContent>
                {docTypes.map((dt) => (
                  <SelectItem key={dt.id} value={dt.id}>
                    {dt.document_name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        </div>
      )}

      {/* Drag-and-drop file picker */}
      <div className="space-y-2">
        <Label className="text-clinic-navy dark:text-white">File</Label>
        <div
          onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
          onDragLeave={() => setDragOver(false)}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
          className={`border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-colors ${
            dragOver
              ? 'border-clinic-teal bg-clinic-teal/5'
              : file
                ? 'border-green-300 bg-green-50 dark:border-green-700 dark:bg-green-900/10'
                : 'border-clinic-navy/20 dark:border-white/20 hover:border-clinic-teal/50'
          }`}
        >
          <input
            ref={fileInputRef}
            type="file"
            className="hidden"
            accept={DOCUMENT_UPLOAD_DEFAULTS.allowedExtensions.join(',')}
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) handleFileSelect(f);
            }}
          />
          {file ? (
            <div className="flex items-center justify-center gap-3">
              <FileText className="w-5 h-5 text-green-600" />
              <div className="text-left">
                <p className="text-sm font-medium text-clinic-navy dark:text-white">{file.name}</p>
                <p className="text-xs text-clinic-text/60">{formatSize(file.size)}</p>
              </div>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={(e) => { e.stopPropagation(); setFile(null); setFileError(null); }}
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
          ) : (
            <>
              <Upload className="w-8 h-8 text-clinic-text/30 dark:text-white/30 mx-auto mb-2" />
              <p className="text-sm text-clinic-text/60 dark:text-white/60">
                Drag and drop a file or click to browse
              </p>
              <p className="text-xs text-clinic-text/40 dark:text-white/40 mt-1">
                PDF, JPG, PNG, WEBP up to {DOCUMENT_UPLOAD_DEFAULTS.maxFileSizeMb}MB
              </p>
            </>
          )}
        </div>
        {fileError && (
          <p className="text-sm text-red-500">{fileError}</p>
        )}
      </div>

      {/* Description */}
      <div className="space-y-2">
        <Label className="text-clinic-navy dark:text-white">Description (optional)</Label>
        <Textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Brief description of the document"
          rows={2}
        />
      </div>

      {/* Actions */}
      <div className="flex gap-2 justify-end">
        {onCancel && (
          <Button type="button" variant="outline" onClick={onCancel}>
            Cancel
          </Button>
        )}
        <Button
          type="submit"
          disabled={!file || !selectedClinicId || !!fileError || uploading}
          className="bg-clinic-teal hover:bg-clinic-teal/90 text-white"
        >
          {uploading ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Uploading...
            </>
          ) : (
            <>
              <Upload className="w-4 h-4 mr-2" />
              Upload Document
            </>
          )}
        </Button>
      </div>
    </form>
  );
}
```

- [ ] **Step 2: Create DocumentList**

Create `src/components/documents/DocumentList.tsx`:

```tsx
'use client';

import { useState } from 'react';
import { format, parseISO } from 'date-fns';
import {
  FileText,
  Download,
  Trash2,
  CheckCircle2,
  XCircle,
  Clock,
  AlertTriangle,
  Loader2,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { PatientDocument } from '@/types/database';
import { usePatientDocuments } from '@/hooks/usePatientDocuments';
import { DocumentVerifyDialog } from './DocumentVerifyDialog';
import { toast } from 'sonner';

interface DocumentListProps {
  documents: PatientDocument[];
  patientId: string;
  canVerify?: boolean;
  canDelete?: boolean;
  onRefresh: () => void;
}

const statusConfig = {
  pending: { label: 'Pending', color: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400', icon: Clock },
  approved: { label: 'Approved', color: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400', icon: CheckCircle2 },
  rejected: { label: 'Rejected', color: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400', icon: XCircle },
};

export function DocumentList({
  documents,
  patientId,
  canVerify = false,
  canDelete = false,
  onRefresh,
}: DocumentListProps) {
  const { getDownloadUrl, deleteDocument } = usePatientDocuments();
  const [downloadingId, setDownloadingId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [verifyDoc, setVerifyDoc] = useState<PatientDocument | null>(null);

  const handleDownload = async (doc: PatientDocument) => {
    setDownloadingId(doc.id);
    const url = await getDownloadUrl(patientId, doc.id);
    if (url) {
      window.open(url, '_blank');
    } else {
      toast.error('Failed to get download link');
    }
    setDownloadingId(null);
  };

  const handleDelete = async (doc: PatientDocument) => {
    setDeletingId(doc.id);
    const success = await deleteDocument(patientId, doc.id);
    if (success) {
      toast.success('Document deleted');
      onRefresh();
    } else {
      toast.error('Failed to delete document');
    }
    setDeletingId(null);
  };

  if (documents.length === 0) {
    return (
      <div className="text-center py-12">
        <FileText className="w-12 h-12 text-clinic-text/20 dark:text-white/20 mx-auto mb-4" />
        <p className="text-clinic-text/60 dark:text-white/60">No documents found</p>
      </div>
    );
  }

  return (
    <>
      <div className="space-y-3">
        {documents.map((doc) => {
          const config = statusConfig[doc.status];
          const StatusIcon = config.icon;

          return (
            <div
              key={doc.id}
              className="bg-white dark:bg-slate-800 rounded-xl border border-clinic-navy/5 dark:border-white/5 p-4 flex items-center gap-4"
            >
              {/* File icon */}
              <div className="w-10 h-10 rounded-lg bg-clinic-navy/5 dark:bg-white/5 flex items-center justify-center shrink-0">
                <FileText className="w-5 h-5 text-clinic-navy/40 dark:text-white/40" />
              </div>

              {/* File info */}
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium text-clinic-navy dark:text-white truncate">
                  {doc.file_name}
                </p>
                <div className="flex items-center gap-2 mt-0.5">
                  {doc.document_type && (
                    <span className="text-xs text-clinic-text/50 dark:text-white/50">
                      {(doc.document_type as any).document_name}
                    </span>
                  )}
                  {doc.uploaded_at && (
                    <span className="text-xs text-clinic-text/40 dark:text-white/40">
                      {format(parseISO(doc.uploaded_at), 'MMM d, yyyy')}
                    </span>
                  )}
                  {doc.file_size_bytes && (
                    <span className="text-xs text-clinic-text/40 dark:text-white/40">
                      {(doc.file_size_bytes / (1024 * 1024)).toFixed(1)} MB
                    </span>
                  )}
                </div>
                {doc.status === 'rejected' && doc.rejection_reason && (
                  <div className="flex items-center gap-1 mt-1.5">
                    <AlertTriangle className="w-3 h-3 text-red-500 shrink-0" />
                    <p className="text-xs text-red-500">{doc.rejection_reason}</p>
                  </div>
                )}
              </div>

              {/* Status badge */}
              <Badge variant="secondary" className={`${config.color} shrink-0`}>
                <StatusIcon className="w-3 h-3 mr-1" />
                {config.label}
              </Badge>

              {/* Actions */}
              <div className="flex items-center gap-1 shrink-0">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleDownload(doc)}
                  disabled={downloadingId === doc.id}
                >
                  {downloadingId === doc.id ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Download className="w-4 h-4" />
                  )}
                </Button>

                {canVerify && doc.status === 'pending' && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setVerifyDoc(doc)}
                    className="text-xs"
                  >
                    Review
                  </Button>
                )}

                {canDelete && doc.status === 'pending' && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDelete(doc)}
                    disabled={deletingId === doc.id}
                    className="text-red-500 hover:text-red-700"
                  >
                    {deletingId === doc.id ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Trash2 className="w-4 h-4" />
                    )}
                  </Button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Verify dialog */}
      {verifyDoc && (
        <DocumentVerifyDialog
          document={verifyDoc}
          patientId={patientId}
          onClose={() => setVerifyDoc(null)}
          onComplete={() => {
            setVerifyDoc(null);
            onRefresh();
          }}
        />
      )}
    </>
  );
}
```

- [ ] **Step 3: Create DocumentVerifyDialog**

Create `src/components/documents/DocumentVerifyDialog.tsx`:

```tsx
'use client';

import { useState } from 'react';
import { CheckCircle2, XCircle, FileText, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { PatientDocument } from '@/types/database';
import { usePatientDocuments } from '@/hooks/usePatientDocuments';
import { toast } from 'sonner';

interface DocumentVerifyDialogProps {
  document: PatientDocument;
  patientId: string;
  onClose: () => void;
  onComplete: () => void;
}

export function DocumentVerifyDialog({
  document,
  patientId,
  onClose,
  onComplete,
}: DocumentVerifyDialogProps) {
  const { verifyDocument } = usePatientDocuments();
  const [rejectionReason, setRejectionReason] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [mode, setMode] = useState<'choose' | 'reject'>('choose');

  const handleApprove = async () => {
    setSubmitting(true);
    const success = await verifyDocument(patientId, document.id, 'approved');
    setSubmitting(false);
    if (success) {
      toast.success('Document approved');
      onComplete();
    } else {
      toast.error('Failed to approve document');
    }
  };

  const handleReject = async () => {
    if (!rejectionReason.trim()) return;
    setSubmitting(true);
    const success = await verifyDocument(patientId, document.id, 'rejected', rejectionReason.trim());
    setSubmitting(false);
    if (success) {
      toast.success('Document rejected');
      onComplete();
    } else {
      toast.error('Failed to reject document');
    }
  };

  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Review Document</DialogTitle>
        </DialogHeader>

        <div className="flex items-center gap-3 p-3 bg-clinic-navy/5 dark:bg-white/5 rounded-lg">
          <FileText className="w-5 h-5 text-clinic-navy/40 dark:text-white/40 shrink-0" />
          <div className="min-w-0">
            <p className="text-sm font-medium text-clinic-navy dark:text-white truncate">
              {document.file_name}
            </p>
            {document.document_type && (
              <p className="text-xs text-clinic-text/50 dark:text-white/50">
                {(document.document_type as any).document_name}
              </p>
            )}
          </div>
        </div>

        {mode === 'choose' ? (
          <div className="flex gap-3 py-2">
            <Button
              onClick={handleApprove}
              disabled={submitting}
              className="flex-1 bg-green-600 hover:bg-green-700 text-white"
            >
              {submitting ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <CheckCircle2 className="w-4 h-4 mr-2" />
              )}
              Approve
            </Button>
            <Button
              variant="destructive"
              onClick={() => setMode('reject')}
              disabled={submitting}
              className="flex-1"
            >
              <XCircle className="w-4 h-4 mr-2" />
              Reject
            </Button>
          </div>
        ) : (
          <div className="space-y-3">
            <div className="space-y-2">
              <Label className="text-clinic-navy dark:text-white">
                Rejection Reason <span className="text-red-500">*</span>
              </Label>
              <Textarea
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                placeholder="Explain why this document is being rejected..."
                rows={3}
              />
            </div>
            <DialogFooter className="gap-2">
              <Button variant="outline" onClick={() => setMode('choose')} disabled={submitting}>
                Back
              </Button>
              <Button
                variant="destructive"
                onClick={handleReject}
                disabled={!rejectionReason.trim() || submitting}
              >
                {submitting ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <XCircle className="w-4 h-4 mr-2" />
                )}
                Confirm Rejection
              </Button>
            </DialogFooter>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
```

- [ ] **Step 4: Commit**

```bash
git add src/components/documents/
git commit -m "feat: add DocumentUploadForm, DocumentList, and DocumentVerifyDialog components"
```

---

## Task 5: Patient Records Page

**Files:**
- Modify: `src/app/(dashboard)/patient/records/page.tsx`

- [ ] **Step 1: Replace placeholder with full document management page**

Rewrite `src/app/(dashboard)/patient/records/page.tsx`:

```tsx
'use client';

import { useState, useEffect, useCallback } from 'react';
import { Plus, FileText, Filter, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { usePatientContext } from '../layout';
import { HealthSummary } from '@/components/patient/dashboard';
import { DocumentUploadForm } from '@/components/documents/DocumentUploadForm';
import { DocumentList } from '@/components/documents/DocumentList';
import { usePatientDocuments } from '@/hooks/usePatientDocuments';
import { supabase } from '@/lib/supabase';

interface PatientClinic {
  id: string;
  name: string;
}

export default function PatientRecordsPage() {
  const { patient } = usePatientContext();
  const { documents, loading, fetchDocuments } = usePatientDocuments();

  const [clinics, setClinics] = useState<PatientClinic[]>([]);
  const [selectedClinicId, setSelectedClinicId] = useState<string>('all');
  const [showUpload, setShowUpload] = useState(false);
  const [loadingClinics, setLoadingClinics] = useState(true);

  // Fetch patient's clinics
  useEffect(() => {
    if (!patient) return;

    const loadClinics = async () => {
      const { data } = await supabase
        .from('patient_clinics')
        .select('clinic_id, clinic:clinics(id, name)')
        .eq('patient_id', patient.id);

      const mapped =
        data
          ?.map((pc: any) => ({ id: pc.clinic.id, name: pc.clinic.name }))
          .filter(Boolean) ?? [];
      setClinics(mapped);
      setLoadingClinics(false);
    };

    loadClinics();
  }, [patient]);

  // Fetch documents when clinic filter changes
  const refreshDocuments = useCallback(() => {
    if (!patient) return;
    const clinicFilter = selectedClinicId === 'all' ? undefined : selectedClinicId;
    fetchDocuments(patient.id, clinicFilter);
  }, [patient, selectedClinicId, fetchDocuments]);

  useEffect(() => {
    refreshDocuments();
  }, [refreshDocuments]);

  if (!patient) return null;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold text-clinic-navy dark:text-white">
            Medical Records
          </h1>
          <p className="text-clinic-text/60 dark:text-white/60">
            View your health information and documents
          </p>
        </div>
        <Button
          onClick={() => setShowUpload(!showUpload)}
          className="bg-clinic-teal hover:bg-clinic-teal/90 text-white"
        >
          <Plus className="w-4 h-4 mr-2" />
          Upload Document
        </Button>
      </div>

      {/* Health Summary */}
      <HealthSummary patient={patient} />

      {/* Upload form */}
      {showUpload && (
        <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-glass p-6">
          <h2 className="font-display font-semibold text-clinic-navy dark:text-white mb-4">
            Upload Document
          </h2>
          <DocumentUploadForm
            patientId={patient.id}
            clinics={clinics}
            onUploadComplete={() => {
              setShowUpload(false);
              refreshDocuments();
            }}
            onCancel={() => setShowUpload(false)}
          />
        </div>
      )}

      {/* Clinic filter + document list */}
      <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-glass p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-display font-semibold text-clinic-navy dark:text-white">
            Documents
          </h2>
          {!loadingClinics && clinics.length > 1 && (
            <Select value={selectedClinicId} onValueChange={setSelectedClinicId}>
              <SelectTrigger className="w-48">
                <Filter className="w-4 h-4 mr-2" />
                <SelectValue placeholder="Filter by clinic" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Clinics</SelectItem>
                {clinics.map((c) => (
                  <SelectItem key={c.id} value={c.id}>
                    {c.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-6 h-6 animate-spin text-clinic-teal" />
          </div>
        ) : (
          <DocumentList
            documents={documents}
            patientId={patient.id}
            canDelete
            onRefresh={refreshDocuments}
          />
        )}
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add "src/app/(dashboard)/patient/records/page.tsx"
git commit -m "feat: replace patient records placeholder with document management"
```

---

## Task 6: Clinic Admin Patient Documents Page

**Files:**
- Create: `src/app/(clinic)/clinic/[clinicId]/patients/[patientId]/documents/page.tsx`
- Modify: `src/app/(clinic)/clinic/[clinicId]/patients/[patientId]/history/page.tsx`

- [ ] **Step 1: Create clinic admin documents page**

Create `src/app/(clinic)/clinic/[clinicId]/patients/[patientId]/documents/page.tsx`:

```tsx
'use client';

import { useState, useEffect, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft, Loader2, FileText } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { DocumentList } from '@/components/documents/DocumentList';
import { usePatientDocuments } from '@/hooks/usePatientDocuments';
import { supabase } from '@/lib/supabase';

export default function ClinicPatientDocumentsPage() {
  const params = useParams();
  const router = useRouter();
  const clinicId = params.clinicId as string;
  const patientId = params.patientId as string;

  const { documents, loading, fetchDocuments } = usePatientDocuments();
  const [patientName, setPatientName] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  useEffect(() => {
    if (!patientId || !clinicId) return;

    const loadData = async () => {
      const { data: patient } = await supabase
        .from('patients')
        .select('first_name, last_name')
        .eq('id', patientId)
        .single();

      if (patient) {
        setPatientName(`${patient.first_name} ${patient.last_name}`);
      }

      fetchDocuments(patientId, clinicId);
    };

    loadData();
  }, [patientId, clinicId, fetchDocuments]);

  const refreshDocuments = useCallback(() => {
    fetchDocuments(patientId, clinicId);
  }, [patientId, clinicId, fetchDocuments]);

  const filteredDocs = statusFilter === 'all'
    ? documents
    : documents.filter((d) => d.status === statusFilter);

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <Button
        variant="ghost"
        size="sm"
        className="mb-4"
        onClick={() => router.push(`/clinic/${clinicId}/patients/${patientId}/history`)}
      >
        <ArrowLeft className="w-4 h-4 mr-1" />
        Back to Patient History
      </Button>

      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="font-display text-xl font-bold text-clinic-navy dark:text-white">
            {patientName ? `${patientName}'s Documents` : 'Patient Documents'}
          </h1>
          <p className="text-sm text-clinic-text/60 dark:text-white/60">
            Review and verify patient documents
          </p>
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-40">
            <SelectValue placeholder="Filter status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="pending">Pending</SelectItem>
            <SelectItem value="approved">Approved</SelectItem>
            <SelectItem value="rejected">Rejected</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-glass p-6">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-6 h-6 animate-spin text-clinic-teal" />
          </div>
        ) : (
          <DocumentList
            documents={filteredDocs}
            patientId={patientId}
            canVerify
            onRefresh={refreshDocuments}
          />
        )}
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Add Documents tab to patient history page**

In `src/app/(clinic)/clinic/[clinicId]/patients/[patientId]/history/page.tsx`, add a "Documents" tab to the existing `<Tabs>`.

Add to imports at the top of the file:

```typescript
import { FileText as FileTextIcon } from 'lucide-react';
import Link from 'next/link';
```

Add a new `TabsTrigger` and `TabsContent` inside the existing `<Tabs>` component:

After the existing `<TabsTrigger value="activity">Activity Log</TabsTrigger>` line, add:

```tsx
<TabsTrigger value="documents">Documents</TabsTrigger>
```

After the existing `</TabsContent>` for "activity", add:

```tsx
<TabsContent value="documents">
  <div className="bg-white dark:bg-slate-800 rounded-xl p-6 shadow-sm text-center">
    <FileTextIcon className="w-10 h-10 text-clinic-text/20 dark:text-white/20 mx-auto mb-3" />
    <p className="text-sm text-clinic-text/60 dark:text-white/60 mb-4">
      View and verify patient documents
    </p>
    <Link href={`/clinic/${clinicId}/patients/${patientId}/documents`}>
      <Button className="bg-clinic-teal hover:bg-clinic-teal/90 text-white">
        View Documents
      </Button>
    </Link>
  </div>
</TabsContent>
```

- [ ] **Step 3: Commit**

```bash
git add "src/app/(clinic)/clinic/[clinicId]/patients/[patientId]/documents/page.tsx" "src/app/(clinic)/clinic/[clinicId]/patients/[patientId]/history/page.tsx"
git commit -m "feat: add clinic admin patient documents page and history tab"
```

---

## Task 7: Practitioner Patient Documents Page

**Files:**
- Create: `src/app/(practitioner)/practitioner/[practitionerId]/clinic/[clinicId]/patients/[patientId]/documents/page.tsx`

- [ ] **Step 1: Create practitioner documents page**

Create `src/app/(practitioner)/practitioner/[practitionerId]/clinic/[clinicId]/patients/[patientId]/documents/page.tsx`:

```tsx
'use client';

import { useState, useEffect, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { DocumentList } from '@/components/documents/DocumentList';
import { usePatientDocuments } from '@/hooks/usePatientDocuments';
import { supabase } from '@/lib/supabase';

export default function PractitionerPatientDocumentsPage() {
  const params = useParams();
  const router = useRouter();
  const practitionerId = params.practitionerId as string;
  const clinicId = params.clinicId as string;
  const patientId = params.patientId as string;

  const { documents, loading, fetchDocuments } = usePatientDocuments();
  const [patientName, setPatientName] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  useEffect(() => {
    if (!patientId || !clinicId) return;

    const loadData = async () => {
      const { data: patient } = await supabase
        .from('patients')
        .select('first_name, last_name')
        .eq('id', patientId)
        .single();

      if (patient) {
        setPatientName(`${patient.first_name} ${patient.last_name}`);
      }

      fetchDocuments(patientId, clinicId);
    };

    loadData();
  }, [patientId, clinicId, fetchDocuments]);

  const refreshDocuments = useCallback(() => {
    fetchDocuments(patientId, clinicId);
  }, [patientId, clinicId, fetchDocuments]);

  const filteredDocs = statusFilter === 'all'
    ? documents
    : documents.filter((d) => d.status === statusFilter);

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <Button
        variant="ghost"
        size="sm"
        className="mb-4"
        onClick={() => router.back()}
      >
        <ArrowLeft className="w-4 h-4 mr-1" />
        Back
      </Button>

      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="font-display text-xl font-bold text-clinic-navy dark:text-white">
            {patientName ? `${patientName}'s Documents` : 'Patient Documents'}
          </h1>
          <p className="text-sm text-clinic-text/60 dark:text-white/60">
            Review and verify patient documents
          </p>
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-40">
            <SelectValue placeholder="Filter status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="pending">Pending</SelectItem>
            <SelectItem value="approved">Approved</SelectItem>
            <SelectItem value="rejected">Rejected</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-glass p-6">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-6 h-6 animate-spin text-clinic-teal" />
          </div>
        ) : (
          <DocumentList
            documents={filteredDocs}
            patientId={patientId}
            canVerify
            onRefresh={refreshDocuments}
          />
        )}
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add "src/app/(practitioner)/practitioner/[practitionerId]/clinic/[clinicId]/patients/[patientId]/documents/"
git commit -m "feat: add practitioner patient documents page"
```

---

## Spec Coverage Check

| Spec Requirement | Task |
|-----------------|------|
| Alter patient_documents table | Task 1 |
| RLS: clinic admin scoped by clinic_id | Task 1 |
| RLS: practitioner select/update | Task 1 |
| RLS: patient insert/delete | Task 1 |
| Global upload defaults | Task 2 |
| usePatientDocuments hook | Task 2 |
| POST upload API | Task 3 |
| GET list API | Task 3 |
| GET download API | Task 3 |
| PATCH verify/reject API | Task 3 |
| DELETE document API | Task 3 |
| DocumentUploadForm component | Task 4 |
| DocumentList component | Task 4 |
| DocumentVerifyDialog component | Task 4 |
| Patient records page | Task 5 |
| Clinic admin documents page | Task 6 |
| Documents tab on patient history | Task 6 |
| Practitioner documents page | Task 7 |
| Activity logging | Task 3 (in each API route) |
| Signed URL downloads | Task 3 (download route) |
| File validation (size + type) | Task 3 (POST) + Task 4 (client-side) |
