'use client';

import { useEffect, useState } from 'react';
import { useGetFeatures } from '@/hooks';
import useFeatureMutations from '@/hooks/useFeatureMutations';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Plus, Edit, Sparkles, Loader2 } from 'lucide-react';
import type { AIFeature } from '@/hooks/useGetFeatures';

function generateSlug(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

interface FeatureFormState {
  name: string;
  slug: string;
  description: string;
  category: string;
  is_premium: boolean;
}

const EMPTY_FORM: FeatureFormState = {
  name: '',
  slug: '',
  description: '',
  category: '',
  is_premium: false,
};

export default function FeaturesPage() {
  const { features, loading, fetchFeatures } = useGetFeatures();
  const { createFeature, updateFeature, loading: saving } = useFeatureMutations();

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingFeature, setEditingFeature] = useState<AIFeature | null>(null);
  const [form, setForm] = useState<FeatureFormState>(EMPTY_FORM);

  useEffect(() => {
    fetchFeatures();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Group features by category
  const grouped = features.reduce<Record<string, AIFeature[]>>((acc, feature) => {
    const cat = feature.category || 'Uncategorized';
    if (!acc[cat]) acc[cat] = [];
    acc[cat].push(feature);
    return acc;
  }, {});

  const categories = Object.keys(grouped).sort();

  function openAddDialog() {
    setEditingFeature(null);
    setForm(EMPTY_FORM);
    setDialogOpen(true);
  }

  function openEditDialog(feature: AIFeature) {
    setEditingFeature(feature);
    setForm({
      name: feature.name,
      slug: feature.slug,
      description: feature.description ?? '',
      category: feature.category,
      is_premium: feature.is_premium,
    });
    setDialogOpen(true);
  }

  function handleNameChange(value: string) {
    setForm((prev) => ({
      ...prev,
      name: value,
      slug: generateSlug(value),
    }));
  }

  async function handleSave() {
    const payload = {
      name: form.name,
      slug: form.slug,
      description: form.description || null,
      category: form.category,
      is_premium: form.is_premium,
    };

    try {
      if (editingFeature) {
        await updateFeature({ id: editingFeature.id, ...payload });
      } else {
        await createFeature(payload);
      }
      setDialogOpen(false);
      await fetchFeatures();
    } catch {
      // error is stored in the hook
    }
  }

  return (
    <div>
      {/* Page header */}
      <div className='flex items-center justify-between mb-6'>
        <h2 className='font-display text-xl font-bold text-clinic-navy dark:text-white'>
          AI Features
        </h2>
        <Button onClick={openAddDialog} className='flex items-center gap-2'>
          <Plus className='w-4 h-4' />
          Add Feature
        </Button>
      </div>

      {/* Loading state */}
      {loading && (
        <div className='flex items-center justify-center py-16'>
          <Loader2 className='w-6 h-6 animate-spin text-clinic-teal' />
        </div>
      )}

      {/* Empty state */}
      {!loading && features.length === 0 && (
        <div className='flex flex-col items-center justify-center py-16 text-center'>
          <Sparkles className='w-12 h-12 text-clinic-navy/20 dark:text-white/20 mb-4' />
          <p className='text-clinic-text/60 dark:text-white/60 text-sm'>
            No AI features found. Add one to get started.
          </p>
        </div>
      )}

      {/* Features grouped by category */}
      {!loading && categories.length > 0 && (
        <div className='space-y-8'>
          {categories.map((category) => (
            <div key={category}>
              {/* Category header */}
              <p className='text-sm uppercase tracking-wider text-clinic-text/40 dark:text-white/40 font-medium mb-3'>
                {category}
              </p>

              <div className='bg-white dark:bg-slate-800 rounded-2xl shadow-glass p-6 space-y-3'>
                {grouped[category].map((feature) => (
                  <div
                    key={feature.id}
                    className='p-4 border rounded-xl border-clinic-navy/10 dark:border-white/10 flex items-start justify-between gap-4'
                  >
                    <div className='flex-1 min-w-0'>
                      <div className='flex items-center gap-2 flex-wrap'>
                        <span className='font-medium text-clinic-navy dark:text-white text-sm'>
                          {feature.name}
                        </span>
                        {feature.is_premium && (
                          <span className='text-xs px-1.5 py-0.5 bg-yellow-100 text-yellow-700 rounded'>
                            Premium
                          </span>
                        )}
                      </div>
                      <p className='text-xs text-clinic-text/40 dark:text-white/40 mt-0.5'>
                        {feature.slug}
                      </p>
                      {feature.description && (
                        <p className='text-sm text-clinic-text/60 dark:text-white/60 mt-1'>
                          {feature.description}
                        </p>
                      )}
                    </div>
                    <Button
                      variant='ghost'
                      size='sm'
                      className='shrink-0'
                      onClick={() => openEditDialog(feature)}
                    >
                      <Edit className='w-4 h-4' />
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add / Edit dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className='max-w-md'>
          <DialogHeader>
            <DialogTitle>
              {editingFeature ? 'Edit Feature' : 'Add Feature'}
            </DialogTitle>
          </DialogHeader>

          <div className='space-y-4 mt-2'>
            {/* Name */}
            <div>
              <label className='text-sm font-medium text-clinic-text/70 dark:text-white/70 mb-1 block'>
                Name
              </label>
              <Input
                value={form.name}
                onChange={(e) => handleNameChange(e.target.value)}
                placeholder='e.g. Smart Scheduling'
              />
            </div>

            {/* Slug (auto-generated) */}
            <div>
              <label className='text-sm font-medium text-clinic-text/70 dark:text-white/70 mb-1 block'>
                Slug
              </label>
              <Input
                value={form.slug}
                onChange={(e) => setForm((prev) => ({ ...prev, slug: e.target.value }))}
                placeholder='auto-generated'
                className='text-clinic-text/60 dark:text-white/60'
              />
            </div>

            {/* Description */}
            <div>
              <label className='text-sm font-medium text-clinic-text/70 dark:text-white/70 mb-1 block'>
                Description
              </label>
              <textarea
                value={form.description}
                onChange={(e) => setForm((prev) => ({ ...prev, description: e.target.value }))}
                placeholder='Brief description of this feature…'
                rows={3}
                className='w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 resize-none'
              />
            </div>

            {/* Category */}
            <div>
              <label className='text-sm font-medium text-clinic-text/70 dark:text-white/70 mb-1 block'>
                Category
              </label>
              <Input
                value={form.category}
                onChange={(e) => setForm((prev) => ({ ...prev, category: e.target.value }))}
                placeholder='e.g. Scheduling, Analytics'
              />
            </div>

            {/* Is Premium toggle */}
            <div className='flex items-center justify-between'>
              <label className='text-sm font-medium text-clinic-text/70 dark:text-white/70'>
                Premium Feature
              </label>
              <Switch
                checked={form.is_premium}
                onCheckedChange={(checked) =>
                  setForm((prev) => ({ ...prev, is_premium: checked }))
                }
              />
            </div>

            {/* Actions */}
            <div className='flex justify-end gap-2 pt-2'>
              <Button variant='outline' onClick={() => setDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleSave} disabled={saving || !form.name || !form.category}>
                {saving && <Loader2 className='w-4 h-4 mr-2 animate-spin' />}
                {editingFeature ? 'Save Changes' : 'Create Feature'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
