'use client';

import { useState } from 'react';
import { format, parseISO } from 'date-fns';
import {
  FileText,
  Eye,
  Trash2,
  Loader2,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { PatientDocument } from '@/types/database';
import usePatientDocuments from '@/hooks/usePatientDocuments';
import { DocumentVerifyDialog } from './DocumentVerifyDialog';
import { toast } from 'sonner';

interface DocumentListProps {
  documents: PatientDocument[];
  patientId: string;
  canView?: boolean;
  canDelete?: boolean;
  onRefresh: () => void;
}

export function DocumentList({
  documents,
  patientId,
  canView = false,
  canDelete = false,
  onRefresh,
}: DocumentListProps) {
  const { deleteDocument, loading } = usePatientDocuments();

  const [viewingDoc, setViewingDoc] = useState<PatientDocument | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const formatFileSize = (bytes: number | null): string => {
    if (bytes == null) return 'Unknown size';
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  };

  const handleDelete = async (doc: PatientDocument) => {
    setDeletingId(doc.id);
    const success = await deleteDocument(patientId, doc.id);
    if (success) {
      toast.success('Document deleted.');
      onRefresh();
    } else {
      toast.error('Failed to delete document.');
    }
    setDeletingId(null);
  };

  if (documents.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center gap-3 py-12 text-center">
        <div className="w-14 h-14 rounded-full bg-clinic-bg dark:bg-slate-800 flex items-center justify-center">
          <FileText className="h-7 w-7 text-clinic-navy/30 dark:text-white/20" />
        </div>
        <p className="text-sm text-muted-foreground">No documents found</p>
      </div>
    );
  }

  return (
    <>
      <ul className="space-y-3">
        {documents.map((doc) => {
          const docTypeName = doc.description ?? null;
          const isDeleting = deletingId === doc.id;

          return (
            <li
              key={doc.id}
              className="bg-white dark:bg-slate-800 rounded-xl border border-clinic-navy/5 dark:border-white/5 p-4"
            >
              <div className="flex items-start gap-4">
                <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-clinic-teal/10 dark:bg-clinic-teal/20 flex items-center justify-center mt-0.5">
                  <FileText className="h-5 w-5 text-clinic-teal" />
                </div>

                <div className="flex-1 min-w-0">
                  <p
                    className="text-sm font-medium text-clinic-text truncate max-w-xs"
                    title={doc.file_name}
                  >
                    {doc.file_name}
                  </p>
                  <div className="mt-0.5 flex flex-wrap items-center gap-x-2 gap-y-0.5 text-xs text-muted-foreground">
                    {docTypeName && <span>{docTypeName}</span>}
                    {docTypeName && <span>&middot;</span>}
                    <span>
                      {format(parseISO(doc.uploaded_at), 'MMM d, yyyy')}
                    </span>
                    <span>&middot;</span>
                    <span>{formatFileSize(doc.file_size_bytes)}</span>
                  </div>
                </div>
              </div>

              <div className="mt-3 flex flex-wrap items-center gap-2 justify-end">
                {canView && (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setViewingDoc(doc)}
                    disabled={loading}
                    className="h-8 gap-1.5 text-xs border-clinic-teal text-clinic-teal hover:bg-clinic-teal/10"
                  >
                    <Eye className="h-3.5 w-3.5" />
                    View
                  </Button>
                )}

                {canDelete && (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => handleDelete(doc)}
                    disabled={isDeleting || loading}
                    className="h-8 gap-1.5 text-xs border-red-300 text-red-600 hover:bg-red-50 dark:border-red-800 dark:text-red-400 dark:hover:bg-red-900/20"
                  >
                    {isDeleting ? (
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    ) : (
                      <Trash2 className="h-3.5 w-3.5" />
                    )}
                    Delete
                  </Button>
                )}
              </div>
            </li>
          );
        })}
      </ul>

      {viewingDoc && (
        <DocumentVerifyDialog
          document={viewingDoc}
          patientId={patientId}
          onClose={() => setViewingDoc(null)}
          onComplete={() => {
            setViewingDoc(null);
            onRefresh();
          }}
        />
      )}
    </>
  );
}
