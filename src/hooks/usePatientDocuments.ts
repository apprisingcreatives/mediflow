'use client';

import { useState, useCallback } from 'react';
import { PatientDocument } from '@/types/database';
import { supabase } from '@/lib/supabase';

const getAuthHeaders = async (): Promise<Record<string, string>> => {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session?.access_token) return {};
  return { Authorization: `Bearer ${session.access_token}` };
};

interface UsePatientDocumentsReturn {
  documents: PatientDocument[];
  loading: boolean;
  error: string | null;
  fetchDocuments: (patientId: string) => Promise<void>;
  uploadDocument: (
    patientId: string,
    formData: FormData
  ) => Promise<PatientDocument | null>;
  deleteDocument: (
    patientId: string,
    documentId: string
  ) => Promise<boolean>;
  getDownloadUrl: (
    patientId: string,
    documentId: string
  ) => Promise<string | null>;
}

const usePatientDocuments = (): UsePatientDocumentsReturn => {
  const [documents, setDocuments] = useState<PatientDocument[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchDocuments = useCallback(
    async (patientId: string) => {
      try {
        setLoading(true);
        setError(null);

        const url = `/api/patients/${patientId}/documents`;
        const headers = await getAuthHeaders();
        const response = await fetch(url, { headers });

        if (!response.ok) {
          const data = await response.json();
          throw new Error(data.error || 'Failed to fetch documents');
        }

        const data = await response.json();
        setDocuments(data.documents ?? data);
      } catch (err) {
        console.error('Failed to fetch documents:', err);
        const errorMessage =
          err instanceof Error ? err.message : 'Failed to fetch documents';
        setError(errorMessage);
      } finally {
        setLoading(false);
      }
    },
    []
  );

  const uploadDocument = useCallback(
    async (
      patientId: string,
      formData: FormData
    ): Promise<PatientDocument | null> => {
      try {
        setLoading(true);
        setError(null);

        const headers = await getAuthHeaders();
        const response = await fetch(
          `/api/patients/${patientId}/documents`,
          {
            method: 'POST',
            headers,
            body: formData,
          }
        );

        if (!response.ok) {
          const data = await response.json();
          throw new Error(data.error || 'Failed to upload document');
        }

        const newDocument: PatientDocument = await response.json();
        setDocuments((prev) => [...prev, newDocument]);
        return newDocument;
      } catch (err) {
        console.error('Failed to upload document:', err);
        const errorMessage =
          err instanceof Error ? err.message : 'Failed to upload document';
        setError(errorMessage);
        return null;
      } finally {
        setLoading(false);
      }
    },
    []
  );

  const deleteDocument = useCallback(
    async (patientId: string, documentId: string): Promise<boolean> => {
      try {
        setLoading(true);
        setError(null);

        const headers = await getAuthHeaders();
        const response = await fetch(
          `/api/patients/${patientId}/documents/${documentId}`,
          {
            method: 'DELETE',
            headers,
          }
        );

        if (!response.ok) {
          const data = await response.json();
          throw new Error(data.error || 'Failed to delete document');
        }

        setDocuments((prev) => prev.filter((doc) => doc.id !== documentId));
        return true;
      } catch (err) {
        console.error('Failed to delete document:', err);
        const errorMessage =
          err instanceof Error ? err.message : 'Failed to delete document';
        setError(errorMessage);
        return false;
      } finally {
        setLoading(false);
      }
    },
    []
  );

  const getDownloadUrl = useCallback(
    async (
      patientId: string,
      documentId: string
    ): Promise<string | null> => {
      try {
        setError(null);

        const headers = await getAuthHeaders();
        const response = await fetch(
          `/api/patients/${patientId}/documents/${documentId}/download`,
          { headers }
        );

        if (!response.ok) {
          const data = await response.json();
          throw new Error(data.error || 'Failed to get download URL');
        }

        const data = await response.json();
        return data.url;
      } catch (err) {
        console.error('Failed to get download URL:', err);
        const errorMessage =
          err instanceof Error
            ? err.message
            : 'Failed to get download URL';
        setError(errorMessage);
        return null;
      }
    },
    []
  );

  return {
    documents,
    loading,
    error,
    fetchDocuments,
    uploadDocument,
    deleteDocument,
    getDownloadUrl,
  };
};

export default usePatientDocuments;
