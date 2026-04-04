'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import useGetSubscriptionPlans from '@/hooks/useGetSubscriptionPlans';
import useSubscriptionPlanMutations from '@/hooks/useSubscriptionPlanMutations';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Plus, Edit, CreditCard, Loader2 } from 'lucide-react';
import type { SubscriptionPlan } from '@/types/super-admin';

function generateSlug(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

interface PlanFormState {
  name: string;
  slug: string;
  price: string;
  currency: string;
  billing_cycle: string;
  description: string;
  features: string;
  max_practitioners: string;
  max_patients: string;
  is_active: boolean;
  sort_order: string;
}

const EMPTY_FORM: PlanFormState = {
  name: '',
  slug: '',
  price: '',
  currency: 'PHP',
  billing_cycle: 'monthly',
  description: '',
  features: '',
  max_practitioners: '',
  max_patients: '',
  is_active: true,
  sort_order: '0',
};

export default function SubscriptionPlansPage() {
  const { plans, loading, fetchPlans } = useGetSubscriptionPlans();
  const { createPlan, updatePlan, togglePlanActive, loading: saving } = useSubscriptionPlanMutations();

  const [clinicCounts, setClinicCounts] = useState<Record<string, number>>({});
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingPlan, setEditingPlan] = useState<SubscriptionPlan | null>(null);
  const [form, setForm] = useState<PlanFormState>(EMPTY_FORM);

  useEffect(() => {
    fetchPlans();
    fetchClinicCounts();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function fetchClinicCounts() {
    const { data } = await supabase.from('clinics').select('subscription_plan');
    if (!data) return;
    const counts: Record<string, number> = {};
    for (const row of data) {
      const key = row.subscription_plan ?? 'none';
      counts[key] = (counts[key] ?? 0) + 1;
    }
    setClinicCounts(counts);
  }

  function openAddDialog() {
    setEditingPlan(null);
    setForm(EMPTY_FORM);
    setDialogOpen(true);
  }

  function openEditDialog(plan: SubscriptionPlan) {
    setEditingPlan(plan);
    setForm({
      name: plan.name,
      slug: plan.slug,
      price: String(plan.price),
      currency: plan.currency,
      billing_cycle: plan.billing_cycle,
      description: plan.description ?? '',
      features: plan.features.join('\n'),
      max_practitioners: plan.max_practitioners != null ? String(plan.max_practitioners) : '',
      max_patients: plan.max_patients != null ? String(plan.max_patients) : '',
      is_active: plan.is_active,
      sort_order: String(plan.sort_order),
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
      price: parseFloat(form.price) || 0,
      currency: form.currency,
      billing_cycle: form.billing_cycle,
      description: form.description || null,
      features: form.features
        .split('\n')
        .map((f) => f.trim())
        .filter(Boolean),
      max_practitioners: form.max_practitioners ? parseInt(form.max_practitioners, 10) : null,
      max_patients: form.max_patients ? parseInt(form.max_patients, 10) : null,
      is_active: form.is_active,
      sort_order: parseInt(form.sort_order, 10) || 0,
    };

    try {
      if (editingPlan) {
        await updatePlan(editingPlan.id, payload);
      } else {
        await createPlan(payload);
      }
      setDialogOpen(false);
      await fetchPlans();
    } catch {
      // error is stored in the hook
    }
  }

  async function handleToggleActive(plan: SubscriptionPlan, checked: boolean) {
    await togglePlanActive(plan.id, checked);
    await fetchPlans();
  }

  function formatPrice(plan: SubscriptionPlan) {
    const formatted = new Intl.NumberFormat('en-PH').format(plan.price);
    return `${plan.currency} ${formatted}/${plan.billing_cycle}`;
  }

  return (
    <div>
      {/* Page header */}
      <div className='flex items-center justify-between mb-6'>
        <h2 className='font-display text-xl font-bold text-clinic-navy dark:text-white'>
          Subscription Plans
        </h2>
        <Button onClick={openAddDialog} className='flex items-center gap-2'>
          <Plus className='w-4 h-4' />
          Add Plan
        </Button>
      </div>

      {/* Loading state */}
      {loading && (
        <div className='flex items-center justify-center py-16'>
          <Loader2 className='w-6 h-6 animate-spin text-clinic-teal' />
        </div>
      )}

      {/* Empty state */}
      {!loading && plans.length === 0 && (
        <div className='flex flex-col items-center justify-center py-16 text-center'>
          <CreditCard className='w-12 h-12 text-clinic-navy/20 dark:text-white/20 mb-4' />
          <p className='text-clinic-text/60 dark:text-white/60 text-sm'>
            No subscription plans found. Add one to get started.
          </p>
        </div>
      )}

      {/* Plans grid */}
      {!loading && plans.length > 0 && (
        <div className='grid gap-4 sm:grid-cols-2 lg:grid-cols-3'>
          {plans.map((plan) => (
            <div
              key={plan.id}
              className='bg-white dark:bg-slate-800 rounded-2xl shadow-glass p-6 flex flex-col gap-3'
            >
              {/* Header row */}
              <div className='flex items-start justify-between gap-2'>
                <div className='min-w-0'>
                  <p className='font-display font-semibold text-clinic-navy dark:text-white truncate'>
                    {plan.name}
                  </p>
                  <p className='text-xs text-clinic-text/40 dark:text-white/40 mt-0.5'>
                    {plan.slug}
                  </p>
                </div>
                <Button
                  variant='ghost'
                  size='sm'
                  className='shrink-0'
                  onClick={() => openEditDialog(plan)}
                >
                  <Edit className='w-4 h-4' />
                </Button>
              </div>

              {/* Price */}
              <div>
                <span className='text-2xl font-bold text-clinic-teal'>
                  {plan.currency} {new Intl.NumberFormat('en-PH').format(plan.price)}
                </span>
                <span className='text-sm text-clinic-text/60 dark:text-white/60 ml-1'>
                  /{plan.billing_cycle}
                </span>
              </div>

              {/* Description */}
              {plan.description && (
                <p className='text-sm text-clinic-text/60 dark:text-white/60 line-clamp-2'>
                  {plan.description}
                </p>
              )}

              {/* Clinic count badge + active toggle */}
              <div className='flex items-center justify-between mt-auto pt-2 border-t border-clinic-navy/10 dark:border-white/10'>
                <span className='text-xs px-2 py-0.5 rounded-full bg-clinic-navy/10 text-clinic-navy dark:bg-white/10 dark:text-white'>
                  {clinicCounts[plan.slug] ?? 0} clinic
                  {(clinicCounts[plan.slug] ?? 0) !== 1 ? 's' : ''}
                </span>
                <div className='flex items-center gap-2'>
                  <span className='text-xs text-clinic-text/50 dark:text-white/50'>
                    {plan.is_active ? 'Active' : 'Inactive'}
                  </span>
                  <Switch
                    checked={plan.is_active}
                    onCheckedChange={(checked) => handleToggleActive(plan, checked)}
                  />
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add / Edit dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className='max-w-lg max-h-[90vh] overflow-y-auto'>
          <DialogHeader>
            <DialogTitle>
              {editingPlan ? 'Edit Plan' : 'Add Plan'}
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
                placeholder='e.g. Basic Plan'
              />
            </div>

            {/* Slug */}
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

            {/* Price + Currency row */}
            <div className='grid grid-cols-2 gap-3'>
              <div>
                <label className='text-sm font-medium text-clinic-text/70 dark:text-white/70 mb-1 block'>
                  Price
                </label>
                <Input
                  type='number'
                  min={0}
                  step='0.01'
                  value={form.price}
                  onChange={(e) => setForm((prev) => ({ ...prev, price: e.target.value }))}
                  placeholder='0.00'
                />
              </div>
              <div>
                <label className='text-sm font-medium text-clinic-text/70 dark:text-white/70 mb-1 block'>
                  Currency
                </label>
                <Input
                  value={form.currency}
                  onChange={(e) => setForm((prev) => ({ ...prev, currency: e.target.value }))}
                  placeholder='PHP'
                />
              </div>
            </div>

            {/* Billing cycle */}
            <div>
              <label className='text-sm font-medium text-clinic-text/70 dark:text-white/70 mb-1 block'>
                Billing Cycle
              </label>
              <select
                value={form.billing_cycle}
                onChange={(e) => setForm((prev) => ({ ...prev, billing_cycle: e.target.value }))}
                className='w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2'
              >
                <option value='monthly'>Monthly</option>
                <option value='yearly'>Yearly</option>
              </select>
            </div>

            {/* Description */}
            <div>
              <label className='text-sm font-medium text-clinic-text/70 dark:text-white/70 mb-1 block'>
                Description
              </label>
              <textarea
                value={form.description}
                onChange={(e) => setForm((prev) => ({ ...prev, description: e.target.value }))}
                placeholder='Brief description of this plan…'
                rows={2}
                className='w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 resize-none'
              />
            </div>

            {/* Features */}
            <div>
              <label className='text-sm font-medium text-clinic-text/70 dark:text-white/70 mb-1 block'>
                Features{' '}
                <span className='font-normal text-clinic-text/40 dark:text-white/40'>
                  (one per line)
                </span>
              </label>
              <textarea
                value={form.features}
                onChange={(e) => setForm((prev) => ({ ...prev, features: e.target.value }))}
                placeholder={'Unlimited appointments\nEmail support\nBasic analytics'}
                rows={4}
                className='w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 resize-none'
              />
            </div>

            {/* Max practitioners + patients */}
            <div className='grid grid-cols-2 gap-3'>
              <div>
                <label className='text-sm font-medium text-clinic-text/70 dark:text-white/70 mb-1 block'>
                  Max Practitioners
                  <span className='font-normal ml-1 text-clinic-text/40 dark:text-white/40'>
                    (optional)
                  </span>
                </label>
                <Input
                  type='number'
                  min={1}
                  value={form.max_practitioners}
                  onChange={(e) =>
                    setForm((prev) => ({ ...prev, max_practitioners: e.target.value }))
                  }
                  placeholder='Unlimited'
                />
              </div>
              <div>
                <label className='text-sm font-medium text-clinic-text/70 dark:text-white/70 mb-1 block'>
                  Max Patients
                  <span className='font-normal ml-1 text-clinic-text/40 dark:text-white/40'>
                    (optional)
                  </span>
                </label>
                <Input
                  type='number'
                  min={1}
                  value={form.max_patients}
                  onChange={(e) =>
                    setForm((prev) => ({ ...prev, max_patients: e.target.value }))
                  }
                  placeholder='Unlimited'
                />
              </div>
            </div>

            {/* Sort order */}
            <div>
              <label className='text-sm font-medium text-clinic-text/70 dark:text-white/70 mb-1 block'>
                Sort Order
              </label>
              <Input
                type='number'
                min={0}
                value={form.sort_order}
                onChange={(e) => setForm((prev) => ({ ...prev, sort_order: e.target.value }))}
                placeholder='0'
              />
            </div>

            {/* Is Active toggle */}
            <div className='flex items-center justify-between'>
              <label className='text-sm font-medium text-clinic-text/70 dark:text-white/70'>
                Active
              </label>
              <Switch
                checked={form.is_active}
                onCheckedChange={(checked) =>
                  setForm((prev) => ({ ...prev, is_active: checked }))
                }
              />
            </div>

            {/* Actions */}
            <div className='flex justify-end gap-2 pt-2'>
              <Button variant='outline' onClick={() => setDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleSave} disabled={saving || !form.name || !form.price}>
                {saving && <Loader2 className='w-4 h-4 mr-2 animate-spin' />}
                {editingPlan ? 'Save Changes' : 'Create Plan'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
