'use client';

import { useState, useEffect } from 'react';
import { FileText, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { PatientDocument } from '@/types/database';
import usePatientDocuments from '@/hooks/usePatientDocuments';

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
}: DocumentVerifyDialogProps) {
  const { getDownloadUrl } = usePatientDocuments();

  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [previewLoading, setPreviewLoading] = useState(true);

  const documentTypeName = document.description ?? null;

  useEffect(() => {
    let cancelled = false;
    setPreviewLoading(true);
    getDownloadUrl(patientId, document.id).then((url) => {
      if (!cancelled) {
        setPreviewUrl(url);
        setPreviewLoading(false);
      }
    });
    return () => {
      cancelled = true;
    };
  }, [patientId, document.id]);

  const renderPreview = () => {
    if (previewLoading) {
      return (
        <div className="flex items-center justify-center h-48 rounded-lg border border-clinic-navy/10 dark:border-white/10 bg-clinic-bg dark:bg-slate-800/50">
          <Loader2 className="h-6 w-6 animate-spin text-clinic-teal" />
        </div>
      );
    }

    if (!previewUrl) {
      return (
        <div className="flex items-center justify-center h-48 rounded-lg border border-clinic-navy/10 dark:border-white/10 bg-clinic-bg dark:bg-slate-800/50">
          <p className="text-sm text-muted-foreground">Could not load preview.</p>
        </div>
      );
    }

    const mime = document.mime_type ?? '';

    if (mime.includes('pdf')) {
      return (
        <iframe
          src={previewUrl}
          className="w-full h-[70vh] rounded-lg border border-clinic-navy/10 dark:border-white/10"
          title={document.file_name}
        />
      );
    }

    if (mime.startsWith('image/')) {
      return (
        <div className="rounded-lg border border-clinic-navy/10 dark:border-white/10 overflow-hidden bg-clinic-bg dark:bg-slate-800/50 flex items-center justify-center p-2">
          <img
            src={previewUrl}
            alt={document.file_name}
            className="max-h-[70vh] max-w-full object-contain rounded"
          />
        </div>
      );
    }

    return (
      <div className="flex items-center justify-center h-24 rounded-lg border border-clinic-navy/10 dark:border-white/10 bg-clinic-bg dark:bg-slate-800/50">
        <p className="text-sm text-muted-foreground">Preview not available for this file type.</p>
      </div>
    );
  };

  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[90vw] sm:max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-clinic-navy dark:text-white font-display">
            {document.file_name}
          </DialogTitle>
        </DialogHeader>

        <div className="flex items-start gap-3 rounded-xl border border-clinic-navy/10 dark:border-white/10 bg-clinic-bg dark:bg-slate-800/50 p-4">
          <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-clinic-teal/10 flex items-center justify-center">
            <FileText className="h-5 w-5 text-clinic-teal" />
          </div>
          <div className="min-w-0">
            <p className="text-sm font-medium text-clinic-text truncate">
              {document.file_name}
            </p>
            {documentTypeName && (
              <p className="text-xs text-muted-foreground mt-0.5">
                {documentTypeName}
              </p>
            )}
          </div>
        </div>

        {renderPreview()}

        <DialogFooter>
          <Button type="button" variant="outline" onClick={onClose}>
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
