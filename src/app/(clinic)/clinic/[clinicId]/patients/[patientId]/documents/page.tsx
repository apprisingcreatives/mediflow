'use client';

import { useState, useEffect, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { DocumentList } from '@/components/documents/DocumentList';
import usePatientDocuments from '@/hooks/usePatientDocuments';
import { supabase } from '@/lib/supabase';

export default function ClinicPatientDocumentsPage() {
  const params = useParams();
  const router = useRouter();
  const clinicId = params.clinicId as string;
  const patientId = params.patientId as string;

  const { documents, loading, fetchDocuments } = usePatientDocuments();
  const [patientName, setPatientName] = useState('');

  useEffect(() => {
    if (!patientId) return;

    const loadData = async () => {
      const { data: patient } = await supabase
        .from('patients')
        .select('first_name, last_name')
        .eq('id', patientId)
        .single();

      if (patient) {
        setPatientName(`${patient.first_name} ${patient.last_name}`);
      }

      fetchDocuments(patientId);
    };

    loadData();
  }, [patientId, fetchDocuments]);

  const refreshDocuments = useCallback(() => {
    fetchDocuments(patientId);
  }, [patientId, fetchDocuments]);

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

      <div className="mb-6">
        <h1 className="font-display text-xl font-bold text-clinic-navy dark:text-white">
          {patientName ? `${patientName}'s Documents` : 'Patient Documents'}
        </h1>
        <p className="text-sm text-clinic-text/60 dark:text-white/60">
          View patient medical documents
        </p>
      </div>

      <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-glass p-6">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-6 h-6 animate-spin text-clinic-teal" />
          </div>
        ) : (
          <DocumentList
            documents={documents}
            patientId={patientId}
            canView
            onRefresh={refreshDocuments}
          />
        )}
      </div>
    </div>
  );
}
