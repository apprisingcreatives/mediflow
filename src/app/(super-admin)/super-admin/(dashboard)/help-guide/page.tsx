'use client';

import { useState, useEffect } from 'react';
import useGetHelpGuides from '@/hooks/useGetHelpGuides';
import useHelpGuideMutations from '@/hooks/useHelpGuideMutations';
import { HelpGuideCategory, HelpGuide, HelpGuideFaq } from '@/types/super-admin';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Plus, Edit, Trash2, BookOpen, Loader2, MessageSquare } from 'lucide-react';

const CATEGORIES: { value: HelpGuideCategory; label: string }[] = [
  { value: 'patient', label: 'Patient' },
  { value: 'clinic_admin', label: 'Clinic Admin' },
  { value: 'practitioner', label: 'Practitioner' },
];

interface GuideFormState {
  title: string;
  body: string;
  category: HelpGuideCategory;
  sort_order: string;
  is_published: boolean;
}

interface FaqFormState {
  question: string;
  answer: string;
  sort_order: string;
}

const EMPTY_GUIDE_FORM = (category: HelpGuideCategory): GuideFormState => ({
  title: '',
  body: '',
  category,
  sort_order: '0',
  is_published: false,
});

const EMPTY_FAQ_FORM: FaqFormState = {
  question: '',
  answer: '',
  sort_order: '0',
};

export default function HelpGuidePage() {
  const { guides, loading, fetchGuides } = useGetHelpGuides();
  const {
    createGuide,
    updateGuide,
    deleteGuide,
    addFaq,
    updateFaq,
    deleteFaq,
    loading: saving,
  } = useHelpGuideMutations();

  const [activeCategory, setActiveCategory] = useState<HelpGuideCategory>('patient');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingGuide, setEditingGuide] = useState<HelpGuide | null>(null);
  const [guideForm, setGuideForm] = useState<GuideFormState>(EMPTY_GUIDE_FORM('patient'));

  // FAQ state
  const [editingFaq, setEditingFaq] = useState<HelpGuideFaq | null>(null);
  const [faqForm, setFaqForm] = useState<FaqFormState>(EMPTY_FAQ_FORM);
  const [showFaqForm, setShowFaqForm] = useState(false);

  useEffect(() => {
    fetchGuides(activeCategory);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeCategory]);

  function handleCategoryChange(category: HelpGuideCategory) {
    setActiveCategory(category);
  }

  function openAddDialog() {
    setEditingGuide(null);
    setGuideForm(EMPTY_GUIDE_FORM(activeCategory));
    setEditingFaq(null);
    setFaqForm(EMPTY_FAQ_FORM);
    setShowFaqForm(false);
    setDialogOpen(true);
  }

  function openEditDialog(guide: HelpGuide) {
    setEditingGuide(guide);
    setGuideForm({
      title: guide.title,
      body: guide.body ?? '',
      category: guide.category,
      sort_order: String(guide.sort_order),
      is_published: guide.is_published,
    });
    setEditingFaq(null);
    setFaqForm(EMPTY_FAQ_FORM);
    setShowFaqForm(false);
    setDialogOpen(true);
  }

  async function handleSaveGuide() {
    const payload = {
      title: guideForm.title,
      body: guideForm.body || null,
      category: guideForm.category,
      sort_order: parseInt(guideForm.sort_order, 10) || 0,
      is_published: guideForm.is_published,
    };

    try {
      if (editingGuide) {
        await updateGuide(editingGuide.id, payload);
      } else {
        await createGuide(payload);
        setDialogOpen(false);
      }
      await fetchGuides(activeCategory);
    } catch {
      // error stored in hook
    }
  }

  async function handleDeleteGuide(guide: HelpGuide) {
    if (!window.confirm(`Delete guide "${guide.title}"? This will also remove all its FAQs.`)) {
      return;
    }
    try {
      await deleteGuide(guide.id);
      await fetchGuides(activeCategory);
    } catch {
      // error stored in hook
    }
  }

  // FAQ handlers
  function openAddFaqForm() {
    setEditingFaq(null);
    setFaqForm(EMPTY_FAQ_FORM);
    setShowFaqForm(true);
  }

  function openEditFaqForm(faq: HelpGuideFaq) {
    setEditingFaq(faq);
    setFaqForm({
      question: faq.question,
      answer: faq.answer,
      sort_order: String(faq.sort_order),
    });
    setShowFaqForm(true);
  }

  function cancelFaqForm() {
    setEditingFaq(null);
    setFaqForm(EMPTY_FAQ_FORM);
    setShowFaqForm(false);
  }

  async function handleSaveFaq() {
    if (!editingGuide) return;
    const payload = {
      question: faqForm.question,
      answer: faqForm.answer,
      sort_order: parseInt(faqForm.sort_order, 10) || 0,
    };

    try {
      if (editingFaq) {
        await updateFaq(editingFaq.id, payload);
      } else {
        await addFaq(editingGuide.id, payload);
      }
      cancelFaqForm();
      await fetchGuides(activeCategory);
      // Refresh editingGuide with updated FAQs
      const updated = guides.find((g) => g.id === editingGuide.id);
      if (updated) setEditingGuide(updated);
    } catch {
      // error stored in hook
    }
  }

  async function handleDeleteFaq(faq: HelpGuideFaq) {
    if (!window.confirm('Delete this FAQ?')) return;
    try {
      await deleteFaq(faq.id);
      await fetchGuides(activeCategory);
    } catch {
      // error stored in hook
    }
  }

  // Get current FAQs for the guide being edited
  const currentGuide = editingGuide
    ? guides.find((g) => g.id === editingGuide.id) ?? editingGuide
    : null;
  const currentFaqs: HelpGuideFaq[] = currentGuide?.help_guide_faqs ?? [];

  return (
    <div>
      {/* Page header */}
      <div className='flex items-center justify-between mb-6'>
        <h2 className='font-display text-xl font-bold text-clinic-navy dark:text-white'>
          Help Guides
        </h2>
        <Button onClick={openAddDialog} className='flex items-center gap-2'>
          <Plus className='w-4 h-4' />
          Add Guide
        </Button>
      </div>

      {/* Category tabs */}
      <div className='flex gap-2 mb-6'>
        {CATEGORIES.map((cat) => (
          <button
            key={cat.value}
            onClick={() => handleCategoryChange(cat.value)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              activeCategory === cat.value
                ? 'bg-clinic-teal text-white'
                : 'bg-transparent text-clinic-text/60 dark:text-white/60 hover:bg-clinic-navy/5 dark:hover:bg-white/5'
            }`}
          >
            {cat.label}
          </button>
        ))}
      </div>

      {/* Loading state */}
      {loading && (
        <div className='flex items-center justify-center py-16'>
          <Loader2 className='w-6 h-6 animate-spin text-clinic-teal' />
        </div>
      )}

      {/* Empty state */}
      {!loading && guides.length === 0 && (
        <div className='flex flex-col items-center justify-center py-16 text-center'>
          <BookOpen className='w-12 h-12 text-clinic-navy/20 dark:text-white/20 mb-4' />
          <p className='text-clinic-text/60 dark:text-white/60 text-sm'>
            No help guides found for this category. Add one to get started.
          </p>
        </div>
      )}

      {/* Guides grid */}
      {!loading && guides.length > 0 && (
        <div className='grid gap-4 sm:grid-cols-2 lg:grid-cols-3'>
          {guides.map((guide) => {
            const faqCount = guide.help_guide_faqs?.length ?? 0;
            return (
              <div
                key={guide.id}
                className='bg-white dark:bg-slate-800 rounded-2xl shadow-glass p-6 flex flex-col gap-3'
              >
                {/* Header row */}
                <div className='flex items-start justify-between gap-2'>
                  <p className='font-display font-semibold text-clinic-navy dark:text-white min-w-0 truncate'>
                    {guide.title}
                  </p>
                  <div className='flex items-center gap-1 shrink-0'>
                    <Button
                      variant='ghost'
                      size='sm'
                      onClick={() => openEditDialog(guide)}
                    >
                      <Edit className='w-4 h-4' />
                    </Button>
                    <Button
                      variant='ghost'
                      size='sm'
                      onClick={() => handleDeleteGuide(guide)}
                    >
                      <Trash2 className='w-4 h-4 text-red-500' />
                    </Button>
                  </div>
                </div>

                {/* Badges row */}
                <div className='flex items-center gap-2'>
                  {guide.is_published ? (
                    <span className='text-xs px-2 py-0.5 rounded-full bg-green-100 text-green-700'>
                      Published
                    </span>
                  ) : (
                    <span className='text-xs px-2 py-0.5 rounded-full bg-amber-100 text-amber-700'>
                      Draft
                    </span>
                  )}
                  <span className='text-xs px-2 py-0.5 rounded-full bg-clinic-navy/10 text-clinic-navy flex items-center gap-1'>
                    <MessageSquare className='w-3 h-3' />
                    {faqCount} FAQ{faqCount !== 1 ? 's' : ''}
                  </span>
                </div>

                {/* Body preview */}
                {guide.body && (
                  <p className='text-sm text-clinic-text/60 dark:text-white/60 line-clamp-2'>
                    {guide.body}
                  </p>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Add / Edit dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className='max-w-lg max-h-[90vh] overflow-y-auto'>
          <DialogHeader>
            <DialogTitle>{editingGuide ? 'Edit Guide' : 'Add Guide'}</DialogTitle>
          </DialogHeader>

          <div className='space-y-4 mt-2'>
            {/* Title */}
            <div>
              <label className='text-sm font-medium text-clinic-text/70 dark:text-white/70 mb-1 block'>
                Title
              </label>
              <Input
                value={guideForm.title}
                onChange={(e) => setGuideForm((prev) => ({ ...prev, title: e.target.value }))}
                placeholder='e.g. How to book an appointment'
              />
            </div>

            {/* Body */}
            <div>
              <label className='text-sm font-medium text-clinic-text/70 dark:text-white/70 mb-1 block'>
                Body
              </label>
              <textarea
                value={guideForm.body}
                onChange={(e) => setGuideForm((prev) => ({ ...prev, body: e.target.value }))}
                placeholder='Guide content…'
                rows={4}
                className='w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 resize-none'
              />
            </div>

            {/* Category */}
            <div>
              <label className='text-sm font-medium text-clinic-text/70 dark:text-white/70 mb-1 block'>
                Category
              </label>
              <select
                value={guideForm.category}
                onChange={(e) =>
                  setGuideForm((prev) => ({
                    ...prev,
                    category: e.target.value as HelpGuideCategory,
                  }))
                }
                className='w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2'
              >
                {CATEGORIES.map((cat) => (
                  <option key={cat.value} value={cat.value}>
                    {cat.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Sort order */}
            <div>
              <label className='text-sm font-medium text-clinic-text/70 dark:text-white/70 mb-1 block'>
                Sort Order
              </label>
              <Input
                type='number'
                min={0}
                value={guideForm.sort_order}
                onChange={(e) =>
                  setGuideForm((prev) => ({ ...prev, sort_order: e.target.value }))
                }
                placeholder='0'
              />
            </div>

            {/* Published toggle */}
            <div className='flex items-center justify-between'>
              <label className='text-sm font-medium text-clinic-text/70 dark:text-white/70'>
                Published
              </label>
              <Switch
                checked={guideForm.is_published}
                onCheckedChange={(checked) =>
                  setGuideForm((prev) => ({ ...prev, is_published: checked }))
                }
              />
            </div>

            {/* Actions */}
            <div className='flex justify-end gap-2 pt-2'>
              <Button variant='outline' onClick={() => setDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleSaveGuide} disabled={saving || !guideForm.title}>
                {saving && <Loader2 className='w-4 h-4 mr-2 animate-spin' />}
                {editingGuide ? 'Save Changes' : 'Create Guide'}
              </Button>
            </div>

            {/* FAQ management section — only when editing */}
            {editingGuide && (
              <div className='border-t mt-4 pt-4'>
                <div className='flex items-center justify-between mb-3'>
                  <h3 className='text-sm font-semibold text-clinic-navy dark:text-white'>
                    FAQs
                  </h3>
                  {!showFaqForm && (
                    <Button size='sm' variant='outline' onClick={openAddFaqForm}>
                      <Plus className='w-3 h-3 mr-1' />
                      Add FAQ
                    </Button>
                  )}
                </div>

                {/* FAQ list */}
                {currentFaqs.length > 0 && (
                  <div className='space-y-3 mb-3'>
                    {currentFaqs.map((faq) => (
                      <div
                        key={faq.id}
                        className='rounded-lg border border-clinic-navy/10 dark:border-white/10 p-3'
                      >
                        <div className='flex items-start justify-between gap-2'>
                          <div className='min-w-0'>
                            <p className='text-sm font-medium text-clinic-navy dark:text-white'>
                              {faq.question}
                            </p>
                            <p className='text-xs text-clinic-text/60 dark:text-white/60 mt-1'>
                              {faq.answer}
                            </p>
                          </div>
                          <div className='flex items-center gap-1 shrink-0'>
                            <Button
                              variant='ghost'
                              size='sm'
                              onClick={() => openEditFaqForm(faq)}
                            >
                              <Edit className='w-3 h-3' />
                            </Button>
                            <Button
                              variant='ghost'
                              size='sm'
                              onClick={() => handleDeleteFaq(faq)}
                            >
                              <Trash2 className='w-3 h-3 text-red-500' />
                            </Button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* FAQ form */}
                {showFaqForm && (
                  <div className='rounded-lg border border-clinic-teal/30 bg-clinic-teal/5 p-4 space-y-3'>
                    <div>
                      <label className='text-xs font-medium text-clinic-text/70 dark:text-white/70 mb-1 block'>
                        Question
                      </label>
                      <textarea
                        value={faqForm.question}
                        onChange={(e) =>
                          setFaqForm((prev) => ({ ...prev, question: e.target.value }))
                        }
                        placeholder='Enter question…'
                        rows={2}
                        className='w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 resize-none'
                      />
                    </div>
                    <div>
                      <label className='text-xs font-medium text-clinic-text/70 dark:text-white/70 mb-1 block'>
                        Answer
                      </label>
                      <textarea
                        value={faqForm.answer}
                        onChange={(e) =>
                          setFaqForm((prev) => ({ ...prev, answer: e.target.value }))
                        }
                        placeholder='Enter answer…'
                        rows={3}
                        className='w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 resize-none'
                      />
                    </div>
                    <div>
                      <label className='text-xs font-medium text-clinic-text/70 dark:text-white/70 mb-1 block'>
                        Sort Order
                      </label>
                      <Input
                        type='number'
                        min={0}
                        value={faqForm.sort_order}
                        onChange={(e) =>
                          setFaqForm((prev) => ({ ...prev, sort_order: e.target.value }))
                        }
                        placeholder='0'
                      />
                    </div>
                    <div className='flex justify-end gap-2'>
                      <Button size='sm' variant='outline' onClick={cancelFaqForm}>
                        Cancel
                      </Button>
                      <Button
                        size='sm'
                        onClick={handleSaveFaq}
                        disabled={saving || !faqForm.question || !faqForm.answer}
                      >
                        {saving && <Loader2 className='w-3 h-3 mr-1 animate-spin' />}
                        {editingFaq ? 'Save FAQ' : 'Add FAQ'}
                      </Button>
                    </div>
                  </div>
                )}

                {currentFaqs.length === 0 && !showFaqForm && (
                  <p className='text-xs text-clinic-text/40 dark:text-white/40 text-center py-4'>
                    No FAQs yet. Click &quot;Add FAQ&quot; to add one.
                  </p>
                )}
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
