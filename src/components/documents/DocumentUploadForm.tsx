'use client';

import { useState, useRef } from 'react';
import { Upload, X, FileText, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { DOCUMENT_UPLOAD_DEFAULTS } from '@/lib/constants';
import usePatientDocuments from '@/hooks/usePatientDocuments';
import { toast } from 'sonner';

interface DocumentUploadFormProps {
  patientId: string;
  onUploadComplete: () => void;
  onCancel?: () => void;
}

export function DocumentUploadForm({
  patientId,
  onUploadComplete,
  onCancel,
}: DocumentUploadFormProps) {
  const { uploadDocument, loading } = usePatientDocuments();

  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [description, setDescription] = useState('');
  const [isDragging, setIsDragging] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const validateFile = (file: File): string | null => {
    if (file.size > DOCUMENT_UPLOAD_DEFAULTS.maxFileSizeBytes) {
      return `File exceeds the ${DOCUMENT_UPLOAD_DEFAULTS.maxFileSizeMb} MB limit.`;
    }

    const ext = '.' + file.name.split('.').pop()?.toLowerCase();
    if (!DOCUMENT_UPLOAD_DEFAULTS.allowedExtensions.includes(ext)) {
      return `File type not allowed. Accepted: ${DOCUMENT_UPLOAD_DEFAULTS.allowedExtensions.join(', ')}`;
    }

    return null;
  };

  const handleFileSelect = (file: File) => {
    const error = validateFile(file);
    if (error) {
      toast.error(error);
      return;
    }
    setSelectedFile(file);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleFileSelect(file);
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) handleFileSelect(file);
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedFile) {
      toast.error('Please select a file to upload.');
      return;
    }

    const formData = new FormData();
    formData.append('file', selectedFile);
    if (description.trim()) {
      formData.append('description', description.trim());
    }

    const result = await uploadDocument(patientId, formData);

    if (result) {
      toast.success('Document uploaded successfully.');
      setSelectedFile(null);
      setDescription('');
      if (fileInputRef.current) fileInputRef.current.value = '';
      onUploadComplete();
    } else {
      toast.error('Failed to upload document. Please try again.');
    }
  };

  const dropZoneBorderClass = selectedFile
    ? 'border-green-500 bg-green-50 dark:bg-green-900/10'
    : isDragging
    ? 'border-clinic-teal bg-clinic-teal/5'
    : 'border-clinic-navy/20 hover:border-clinic-teal/50';

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {/* File drop zone */}
      <div className="space-y-1.5">
        <Label className="text-clinic-text font-medium">
          File <span className="text-red-500">*</span>
        </Label>
        <div
          className={`border-2 border-dashed rounded-xl p-6 transition-colors cursor-pointer ${dropZoneBorderClass}`}
          onClick={() => !selectedFile && fileInputRef.current?.click()}
          onDrop={handleDrop}
          onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
          onDragLeave={() => setIsDragging(false)}
        >
          {selectedFile ? (
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-3 min-w-0">
                <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
                  <FileText className="h-5 w-5 text-green-600 dark:text-green-400" />
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-medium text-clinic-text truncate">
                    {selectedFile.name}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {formatFileSize(selectedFile.size)}
                  </p>
                </div>
              </div>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="flex-shrink-0 h-8 w-8 rounded-full hover:bg-red-100 dark:hover:bg-red-900/30"
                onClick={(e) => {
                  e.stopPropagation();
                  setSelectedFile(null);
                  if (fileInputRef.current) fileInputRef.current.value = '';
                }}
              >
                <X className="h-4 w-4 text-red-500" />
              </Button>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-2 text-center">
              <div className="w-12 h-12 rounded-full bg-clinic-teal/10 flex items-center justify-center">
                <Upload className="h-6 w-6 text-clinic-teal" />
              </div>
              <div>
                <p className="text-sm font-medium text-clinic-text">
                  Drag & drop a file here, or{' '}
                  <span className="text-clinic-teal underline underline-offset-2">
                    browse
                  </span>
                </p>
                <p className="mt-1 text-xs text-muted-foreground">
                  Accepted: {DOCUMENT_UPLOAD_DEFAULTS.allowedExtensions.join(', ')} &mdash; Max{' '}
                  {DOCUMENT_UPLOAD_DEFAULTS.maxFileSizeMb} MB
                </p>
              </div>
            </div>
          )}
        </div>
        <input
          ref={fileInputRef}
          type="file"
          className="hidden"
          accept={DOCUMENT_UPLOAD_DEFAULTS.allowedExtensions.join(',')}
          onChange={handleInputChange}
        />
      </div>

      {/* Description textarea */}
      <div className="space-y-1.5">
        <Label htmlFor="description" className="text-clinic-text font-medium">
          Description{' '}
          <span className="text-xs text-muted-foreground font-normal">(optional)</span>
        </Label>
        <Textarea
          id="description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Add any additional notes about this document..."
          className="resize-none h-20"
        />
      </div>

      {/* Actions */}
      <div className="flex gap-3 justify-end pt-1">
        {onCancel && (
          <Button type="button" variant="outline" onClick={onCancel} disabled={loading}>
            Cancel
          </Button>
        )}
        <Button
          type="submit"
          disabled={loading || !selectedFile}
          className="bg-clinic-teal hover:bg-clinic-teal/90 text-white"
        >
          {loading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Uploading...
            </>
          ) : (
            <>
              <Upload className="mr-2 h-4 w-4" />
              Upload Document
            </>
          )}
        </Button>
      </div>
    </form>
  );
}
