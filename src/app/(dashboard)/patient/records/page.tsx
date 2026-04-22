'use client';

import { useState, useEffect, useCallback } from 'react';
import { Plus, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks/use-auth';
import { HealthSummary } from '@/components/patient/dashboard';
import { DocumentUploadForm } from '@/components/documents/DocumentUploadForm';
import { DocumentList } from '@/components/documents/DocumentList';
import usePatientDocuments from '@/hooks/usePatientDocuments';

export default function PatientRecordsPage() {
  const { patient } = useAuth();
  const { documents, loading, fetchDocuments } = usePatientDocuments();

  const [showUpload, setShowUpload] = useState(false);

  const refreshDocuments = useCallback(() => {
    if (!patient) return;
    fetchDocuments(patient.id);
  }, [patient, fetchDocuments]);

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
            onUploadComplete={() => {
              setShowUpload(false);
              refreshDocuments();
            }}
            onCancel={() => setShowUpload(false)}
          />
        </div>
      )}

      {/* Document list */}
      <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-glass p-6">
        <h2 className="font-display font-semibold text-clinic-navy dark:text-white mb-4">
          Documents
        </h2>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-6 h-6 animate-spin text-clinic-teal" />
          </div>
        ) : (
          <DocumentList
            documents={documents}
            patientId={patient.id}
            canView
            canDelete
            onRefresh={refreshDocuments}
          />
        )}
      </div>
    </div>
  );
}
