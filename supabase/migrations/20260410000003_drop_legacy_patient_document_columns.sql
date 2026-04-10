-- Drop legacy columns from patient_documents that are no longer used.
-- New uploads use file_path, mime_type, file_size_bytes, and description instead.

ALTER TABLE public.patient_documents
  DROP COLUMN IF EXISTS file_url,
  DROP COLUMN IF EXISTS file_type,
  DROP COLUMN IF EXISTS file_size,
  DROP COLUMN IF EXISTS document_type;
