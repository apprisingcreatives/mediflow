'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  ArrowLeft,
  Plus,
  Pencil,
  Trash2,
  Loader2,
  FileText,
  GripVertical,
  Save,
  X,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { useClinicContext } from '../../layout';
import { ClinicRequiredDocument } from '@/types/database';
import { toast } from 'sonner';

interface DocTypeForm {
  document_name: string;
  document_description: string;
  is_required: boolean;
  allowed_file_types: string;
  max_file_size_mb: number;
  category: string;
}

const emptyForm: DocTypeForm = {
  document_name: '',
  document_description: '',
  is_required: false,
  allowed_file_types: 'pdf,jpg,jpeg,png,webp',
  max_file_size_mb: 10,
  category: '',
};

export default function DocumentTypesPage() {
  const { clinic } = useClinicContext();
  const router = useRouter();
  const clinicId = clinic?.id;

  const [docTypes, setDocTypes] = useState<ClinicRequiredDocument[]>([]);
  const [loading, setLoading] = useState(true);
  const [showDialog, setShowDialog] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<DocTypeForm>(emptyForm);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const fetchDocTypes = async () => {
    if (!clinicId) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/clinic/${clinicId}/onboarding/documents`);
      if (res.ok) {
        const data = await res.json();
        setDocTypes(data.documents ?? []);
      }
    } catch {
      toast.error('Failed to load document types');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDocTypes();
  }, [clinicId]);

  const openCreate = () => {
    setEditingId(null);
    setForm(emptyForm);
    setShowDialog(true);
  };

  const openEdit = (doc: ClinicRequiredDocument) => {
    setEditingId(doc.id);
    setForm({
      document_name: doc.document_name,
      document_description: doc.document_description || '',
      is_required: doc.is_required,
      allowed_file_types: doc.allowed_file_types || 'pdf,jpg,jpeg,png,webp',
      max_file_size_mb: doc.max_file_size_mb,
      category: doc.category || '',
    });
    setShowDialog(true);
  };

  const handleSave = async () => {
    if (!clinicId || !form.document_name.trim()) return;
    setSaving(true);

    try {
      const body = {
        document_name: form.document_name.trim(),
        document_description: form.document_description.trim() || null,
        is_required: form.is_required,
        allowed_file_types: form.allowed_file_types.trim() || null,
        max_file_size_mb: form.max_file_size_mb,
        category: form.category.trim() || null,
        display_order: editingId
          ? undefined
          : docTypes.length,
      };

      const url = editingId
        ? `/api/clinic/${clinicId}/onboarding/documents/${editingId}`
        : `/api/clinic/${clinicId}/onboarding/documents`;

      const res = await fetch(url, {
        method: editingId ? 'PATCH' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || 'Failed to save');
      }

      toast.success(editingId ? 'Document type updated' : 'Document type created');
      setShowDialog(false);
      fetchDocTypes();
    } catch (err: any) {
      toast.error(err.message || 'Failed to save document type');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!clinicId) return;
    setDeletingId(id);

    try {
      const res = await fetch(`/api/clinic/${clinicId}/onboarding/documents/${id}`, {
        method: 'DELETE',
      });

      if (!res.ok) throw new Error('Failed to delete');

      toast.success('Document type removed');
      setDocTypes((prev) => prev.filter((d) => d.id !== id));
    } catch {
      toast.error('Failed to remove document type');
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <Button
          variant="ghost"
          size="sm"
          className="mb-2"
          onClick={() => router.push(`/clinic/${clinicId}/settings`)}
        >
          <ArrowLeft className="w-4 h-4 mr-1" />
          Back to Settings
        </Button>
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-display font-bold text-clinic-navy dark:text-white">
              Document Types
            </h2>
            <p className="text-clinic-text/60 dark:text-white/60">
              Configure the types of documents patients can upload
            </p>
          </div>
          <Button
            onClick={openCreate}
            className="bg-clinic-teal hover:bg-clinic-teal/90 text-white"
          >
            <Plus className="w-4 h-4 mr-2" />
            Add Document Type
          </Button>
        </div>
      </div>

      {/* Document types list */}
      <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-glass p-6">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-6 h-6 animate-spin text-clinic-teal" />
          </div>
        ) : docTypes.length === 0 ? (
          <div className="text-center py-12">
            <FileText className="w-12 h-12 text-clinic-text/20 dark:text-white/20 mx-auto mb-4" />
            <p className="text-clinic-text/60 dark:text-white/60 mb-2">
              No document types configured
            </p>
            <p className="text-sm text-clinic-text/40 dark:text-white/40">
              Add document types so patients know what to upload
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {docTypes.map((doc) => (
              <div
                key={doc.id}
                className="flex items-center gap-4 p-4 rounded-xl border border-clinic-navy/5 dark:border-white/5"
              >
                <GripVertical className="w-4 h-4 text-clinic-text/20 dark:text-white/20 shrink-0" />

                <div className="w-10 h-10 rounded-lg bg-clinic-navy/5 dark:bg-white/5 flex items-center justify-center shrink-0">
                  <FileText className="w-5 h-5 text-clinic-navy/40 dark:text-white/40" />
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="font-medium text-clinic-navy dark:text-white">
                      {doc.document_name}
                    </p>
                    {doc.is_required && (
                      <Badge variant="secondary" className="bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400 text-xs">
                        Required
                      </Badge>
                    )}
                    {doc.category && (
                      <Badge variant="secondary" className="text-xs">
                        {doc.category}
                      </Badge>
                    )}
                  </div>
                  {doc.document_description && (
                    <p className="text-sm text-clinic-text/50 dark:text-white/50 mt-0.5 truncate">
                      {doc.document_description}
                    </p>
                  )}
                  <div className="flex items-center gap-3 mt-1 text-xs text-clinic-text/40 dark:text-white/40">
                    <span>Max: {doc.max_file_size_mb}MB</span>
                    {doc.allowed_file_types && (
                      <span>Types: {doc.allowed_file_types}</span>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-1 shrink-0">
                  <Button variant="ghost" size="sm" onClick={() => openEdit(doc)}>
                    <Pencil className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDelete(doc.id)}
                    disabled={deletingId === doc.id}
                    className="text-red-500 hover:text-red-700"
                  >
                    {deletingId === doc.id ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Trash2 className="w-4 h-4" />
                    )}
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Create/Edit Dialog */}
      <Dialog open={showDialog} onOpenChange={(open) => !open && setShowDialog(false)}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>
              {editingId ? 'Edit Document Type' : 'Add Document Type'}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label className="text-clinic-navy dark:text-white">
                Name <span className="text-red-500">*</span>
              </Label>
              <Input
                value={form.document_name}
                onChange={(e) => setForm({ ...form, document_name: e.target.value })}
                placeholder="e.g. Lab Results, Prescription, X-Ray"
              />
            </div>

            <div className="space-y-2">
              <Label className="text-clinic-navy dark:text-white">Description</Label>
              <Textarea
                value={form.document_description}
                onChange={(e) => setForm({ ...form, document_description: e.target.value })}
                placeholder="Brief description of this document type"
                rows={2}
              />
            </div>

            <div className="space-y-2">
              <Label className="text-clinic-navy dark:text-white">Category</Label>
              <Input
                value={form.category}
                onChange={(e) => setForm({ ...form, category: e.target.value })}
                placeholder="e.g. Medical, Insurance, Identity"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-clinic-navy dark:text-white">
                  Allowed File Types
                </Label>
                <Input
                  value={form.allowed_file_types}
                  onChange={(e) => setForm({ ...form, allowed_file_types: e.target.value })}
                  placeholder="pdf,jpg,png"
                />
                <p className="text-xs text-clinic-text/40 dark:text-white/40">
                  Comma-separated extensions
                </p>
              </div>

              <div className="space-y-2">
                <Label className="text-clinic-navy dark:text-white">
                  Max File Size (MB)
                </Label>
                <Input
                  type="number"
                  min={1}
                  max={50}
                  value={form.max_file_size_mb}
                  onChange={(e) => setForm({ ...form, max_file_size_mb: Number(e.target.value) })}
                />
              </div>
            </div>

            <div className="flex items-center justify-between pt-2">
              <div>
                <p className="font-medium text-sm text-clinic-navy dark:text-white">
                  Required Document
                </p>
                <p className="text-xs text-clinic-text/50 dark:text-white/50">
                  Patients must upload this during onboarding
                </p>
              </div>
              <Switch
                checked={form.is_required}
                onCheckedChange={(checked) => setForm({ ...form, is_required: checked })}
              />
            </div>
          </div>

          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setShowDialog(false)} disabled={saving}>
              Cancel
            </Button>
            <Button
              onClick={handleSave}
              disabled={!form.document_name.trim() || saving}
              className="bg-clinic-teal hover:bg-clinic-teal/90 text-white"
            >
              {saving ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <Save className="w-4 h-4 mr-2" />
              )}
              {editingId ? 'Update' : 'Create'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
