'use client';

import { useState, useEffect } from 'react';
import useGetSubscriptionPlans from '@/hooks/useGetSubscriptionPlans';
import useSubscriptionPlanMutations from '@/hooks/useSubscriptionPlanMutations';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Plus, Edit, CreditCard, Loader2 } from 'lucide-react';
import type { SubscriptionPlan } from '@/types/super-admin';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function generateSlug(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

function formatPrice(plan: SubscriptionPlan): string {
  const formatted = new Intl.NumberFormat('en-PH').format(plan.price);
  return `${plan.currency} ${formatted}`;
}

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

const FEATURE_PREVIEW_COUNT = 3;

function FeaturesCellContent({ features }: { features: string[] }) {
  const visible = features.slice(0, FEATURE_PREVIEW_COUNT);
  const overflow = features.length - FEATURE_PREVIEW_COUNT;

  if (features.length === 0) {
    return <span className='text-clinic-text/40 dark:text-white/40 text-xs italic'>None</span>;
  }

  return (
    <div className='flex flex-wrap gap-1'>
      {visible.map((f) => (
        <span
          key={f}
          className='inline-block max-w-[140px] truncate rounded bg-clinic-navy/8 px-1.5 py-0.5 text-[11px] text-clinic-navy dark:bg-white/10 dark:text-white'
          title={f}
        >
          {f}
        </span>
      ))}
      {overflow > 0 && (
        <span className='inline-block rounded bg-clinic-teal/10 px-1.5 py-0.5 text-[11px] font-medium text-clinic-teal'>
          +{overflow} more
        </span>
      )}
    </div>
  );
}

function StatusBadge({ isActive }: { isActive: boolean }) {
  return (
    <Badge
      className={
        isActive
          ? 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-50 dark:bg-emerald-900/30 dark:text-emerald-400 dark:border-emerald-800'
          : 'bg-slate-100 text-slate-500 border-slate-200 hover:bg-slate-100 dark:bg-slate-700 dark:text-slate-400 dark:border-slate-600'
      }
      variant='outline'
    >
      {isActive ? 'Active' : 'Inactive'}
    </Badge>
  );
}

// ---------------------------------------------------------------------------
// Form types
// ---------------------------------------------------------------------------

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
  max_branches: string;
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
  max_branches: '',
  is_active: true,
  sort_order: '0',
};

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

export default function SubscriptionPlansPage() {
  const { plans, clinicCounts, loading, fetchPlans } = useGetSubscriptionPlans();
  const { createPlan, updatePlan, togglePlanActive, loading: saving } =
    useSubscriptionPlanMutations();

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingPlan, setEditingPlan] = useState<SubscriptionPlan | null>(null);
  const [form, setForm] = useState<PlanFormState>(EMPTY_FORM);

  useEffect(() => {
    fetchPlans();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Dialog helpers
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
      max_branches: plan.max_branches != null ? String(plan.max_branches) : '',
      is_active: plan.is_active,
      sort_order: String(plan.sort_order),
    });
    setDialogOpen(true);
  }

  function handleNameChange(value: string) {
    setForm((prev) => ({ ...prev, name: value, slug: generateSlug(value) }));
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
      max_branches: form.max_branches ? parseInt(form.max_branches, 10) : null,
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

  // ---------------------------------------------------------------------------
  // Render
  // ---------------------------------------------------------------------------

  return (
    <div>
      {/* Page header */}
      <div className='flex items-center justify-between mb-6'>
        <div>
          <h2 className='font-display text-xl font-bold text-clinic-navy dark:text-white'>
            Subscription Plans
          </h2>
          <p className='text-sm text-clinic-text/50 dark:text-white/50 mt-0.5'>
            Manage clinic subscription tiers and pricing
          </p>
        </div>
        <Button onClick={openAddDialog} className='flex items-center gap-2'>
          <Plus className='w-4 h-4' />
          Add Plan
        </Button>
      </div>

      {/* Loading state */}
      {loading && (
        <div className='flex items-center justify-center py-20'>
          <Loader2 className='w-6 h-6 animate-spin text-clinic-teal' />
        </div>
      )}

      {/* Empty state */}
      {!loading && plans.length === 0 && (
        <div className='flex flex-col items-center justify-center py-20 text-center bg-white dark:bg-slate-800 rounded-2xl shadow-glass'>
          <CreditCard className='w-12 h-12 text-clinic-navy/20 dark:text-white/20 mb-4' />
          <p className='text-clinic-text/60 dark:text-white/60 text-sm'>
            No subscription plans found. Add one to get started.
          </p>
        </div>
      )}

      {/* Plans table */}
      {!loading && plans.length > 0 && (
        <div className='bg-white dark:bg-slate-800 rounded-2xl shadow-glass overflow-hidden'>
          <Table>
            <TableHeader>
              <TableRow className='border-b border-clinic-navy/10 dark:border-white/10 hover:bg-transparent'>
                <TableHead className='text-xs font-semibold uppercase tracking-wide text-clinic-text/50 dark:text-white/50 w-[220px]'>
                  Plan
                </TableHead>
                <TableHead className='text-xs font-semibold uppercase tracking-wide text-clinic-text/50 dark:text-white/50 w-[160px]'>
                  Price
                </TableHead>
                <TableHead className='text-xs font-semibold uppercase tracking-wide text-clinic-text/50 dark:text-white/50 w-[110px]'>
                  Subscribers
                </TableHead>
                <TableHead className='text-xs font-semibold uppercase tracking-wide text-clinic-text/50 dark:text-white/50'>
                  Features
                </TableHead>
                <TableHead className='text-xs font-semibold uppercase tracking-wide text-clinic-text/50 dark:text-white/50 w-[140px]'>
                  Status
                </TableHead>
                <TableHead className='text-xs font-semibold uppercase tracking-wide text-clinic-text/50 dark:text-white/50 w-[80px] text-right'>
                  Actions
                </TableHead>
              </TableRow>
            </TableHeader>

            <TableBody>
              {plans.map((plan) => {
                const subscriberCount = clinicCounts[plan.slug] ?? 0;
                return (
                  <TableRow
                    key={plan.id}
                    className='border-b border-clinic-navy/8 dark:border-white/8 hover:bg-clinic-bg/40 dark:hover:bg-white/5 transition-colors'
                  >
                    {/* Name + slug */}
                    <TableCell className='py-4'>
                      <p className='font-semibold text-sm text-clinic-navy dark:text-white leading-tight'>
                        {plan.name}
                      </p>
                      <p className='text-xs text-clinic-text/40 dark:text-white/40 mt-0.5 font-mono'>
                        {plan.slug}
                      </p>
                    </TableCell>

                    {/* Price */}
                    <TableCell className='py-4'>
                      <span className='font-bold text-clinic-teal text-sm'>
                        {formatPrice(plan)}
                      </span>
                      <span className='text-xs text-clinic-text/50 dark:text-white/50 ml-1'>
                        /{plan.billing_cycle}
                      </span>
                    </TableCell>

                    {/* Subscribers */}
                    <TableCell className='py-4'>
                      <span
                        className={`inline-flex items-center gap-1 text-sm font-medium ${
                          subscriberCount > 0
                            ? 'text-clinic-navy dark:text-white'
                            : 'text-clinic-text/40 dark:text-white/40'
                        }`}
                      >
                        {subscriberCount}
                        <span className='text-xs font-normal text-clinic-text/50 dark:text-white/50'>
                          {subscriberCount === 1 ? 'clinic' : 'clinics'}
                        </span>
                      </span>
                    </TableCell>

                    {/* Features */}
                    <TableCell className='py-4'>
                      <FeaturesCellContent features={plan.features} />
                    </TableCell>

                    {/* Status: badge + toggle */}
                    <TableCell className='py-4'>
                      <div className='flex flex-col gap-2'>
                        <StatusBadge isActive={plan.is_active} />
                        <Switch
                          checked={plan.is_active}
                          onCheckedChange={(checked) => handleToggleActive(plan, checked)}
                          aria-label={`Toggle ${plan.name} active state`}
                        />
                      </div>
                    </TableCell>

                    {/* Actions */}
                    <TableCell className='py-4 text-right'>
                      <Button
                        variant='ghost'
                        size='sm'
                        onClick={() => openEditDialog(plan)}
                        className='text-clinic-text/60 hover:text-clinic-navy dark:text-white/60 dark:hover:text-white'
                        aria-label={`Edit ${plan.name}`}
                      >
                        <Edit className='w-4 h-4' />
                      </Button>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      )}

      {/* Add / Edit dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className='max-w-lg max-h-[90vh] overflow-y-auto'>
          <DialogHeader>
            <DialogTitle>{editingPlan ? 'Edit Plan' : 'Add Plan'}</DialogTitle>
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
                className='text-clinic-text/60 dark:text-white/60 font-mono'
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

            {/* Max practitioners + patients + branches */}
            <div className='grid grid-cols-3 gap-3'>
              <div>
                <label className='text-sm font-medium text-clinic-text/70 dark:text-white/70 mb-1 block'>
                  Max Practitioners
                  <span className='font-normal ml-1 text-clinic-text/40 dark:text-white/40'>
                    (per branch)
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
              <div>
                <label className='text-sm font-medium text-clinic-text/70 dark:text-white/70 mb-1 block'>
                  Max Branches
                  <span className='font-normal ml-1 text-clinic-text/40 dark:text-white/40'>
                    (optional)
                  </span>
                </label>
                <Input
                  type='number'
                  min={1}
                  value={form.max_branches}
                  onChange={(e) =>
                    setForm((prev) => ({ ...prev, max_branches: e.target.value }))
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
                onCheckedChange={(checked) => setForm((prev) => ({ ...prev, is_active: checked }))}
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
