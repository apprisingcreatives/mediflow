'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useGetClinics, useClinicMutations } from '@/hooks';
import {
  Search,
  Mail,
  MapPin,
  Building2,
  Plus,
  Loader2,
  CheckCircle2,
  AlertCircle,
} from 'lucide-react';

type ActiveFilter = 'all' | 'active' | 'inactive';

const PLAN_BADGE_CLASSES: Record<string, string> = {
  starter:
    'bg-clinic-navy/10 text-clinic-navy dark:bg-clinic-navy/20 dark:text-white',
  professional:
    'bg-clinic-ai/10 text-clinic-ai dark:bg-clinic-ai/20 dark:text-clinic-ai',
  enterprise:
    'bg-yellow-400/20 text-yellow-700 dark:bg-yellow-400/20 dark:text-yellow-300',
};

function getPlanBadgeClass(plan: string | null | undefined): string {
  if (!plan)
    return 'bg-clinic-navy/10 text-clinic-navy dark:bg-white/10 dark:text-white/60';
  return (
    PLAN_BADGE_CLASSES[plan.toLowerCase()] ??
    'bg-clinic-navy/10 text-clinic-navy dark:bg-white/10 dark:text-white'
  );
}

// ─── Add Clinic Form State ─────────────────────────────────────────────────────

interface ClinicFormData {
  name: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  description: string;
  subscription_plan: string;
}

const EMPTY_FORM: ClinicFormData = {
  name: '',
  email: '',
  phone: '',
  address: '',
  city: '',
  description: '',
  subscription_plan: 'starter',
};

export default function ClinicsListPage() {
  const { clinics, loading, sendRequest } = useGetClinics({ showAll: true });
  const { createClinic, loading: creating, error: createError, clearError } = useClinicMutations();
  const [search, setSearch] = useState('');
  const [activeFilter, setActiveFilter] = useState<ActiveFilter>('all');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [formData, setFormData] = useState<ClinicFormData>(EMPTY_FORM);
  const [successMessage, setSuccessMessage] = useState('');

  useEffect(() => {
    sendRequest();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Clear messages when dialog opens/closes
  useEffect(() => {
    if (!dialogOpen) {
      setFormData(EMPTY_FORM);
      setSuccessMessage('');
      clearError();
    }
  }, [dialogOpen, clearError]);

  const filtered = clinics.filter((clinic) => {
    const q = search.toLowerCase();
    const matchesSearch =
      !q ||
      clinic.name.toLowerCase().includes(q) ||
      (clinic.email ?? '').toLowerCase().includes(q) ||
      (clinic.city ?? '').toLowerCase().includes(q);

    const matchesActive =
      activeFilter === 'all' ||
      (activeFilter === 'active' && clinic.is_active) ||
      (activeFilter === 'inactive' && !clinic.is_active);

    return matchesSearch && matchesActive;
  });

  const filterButtons: { label: string; value: ActiveFilter }[] = [
    { label: 'All', value: 'all' },
    { label: 'Active', value: 'active' },
    { label: 'Inactive', value: 'inactive' },
  ];

  const handleCreateClinic = async () => {
    if (!formData.name.trim() || !formData.email.trim()) return;

    const result = await createClinic({
      name: formData.name.trim(),
      email: formData.email.trim(),
      phone: formData.phone.trim() || null,
      address: formData.address.trim() || null,
      city: formData.city.trim() || null,
      description: formData.description.trim() || null,
      subscription_plan: formData.subscription_plan,
    });

    if (result) {
      setSuccessMessage(`"${result.name}" has been created successfully.`);
      setFormData(EMPTY_FORM);
      sendRequest(); // Refresh list
      // Auto-close after a short delay
      setTimeout(() => {
        setDialogOpen(false);
      }, 1500);
    }
  };

  const updateField = (field: keyof ClinicFormData, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  return (
    <div>
      <div className='flex items-center justify-between mb-6'>
        <h2 className='font-display text-xl font-bold text-clinic-navy dark:text-white'>
          Clinics
        </h2>

        {/* Add Clinic Dialog */}
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button
              id='add-clinic-button'
              className='bg-clinic-teal hover:bg-clinic-teal/90 text-white gap-2'
            >
              <Plus className='w-4 h-4' />
              Add Clinic
            </Button>
          </DialogTrigger>
          <DialogContent className='sm:max-w-lg max-h-[90vh] overflow-y-auto'>
            <DialogHeader>
              <DialogTitle className='font-display text-lg font-bold text-clinic-navy dark:text-white'>
                Add New Clinic
              </DialogTitle>
              <DialogDescription className='text-clinic-text/60 dark:text-white/60'>
                Create a new clinic. A 30-day trial will be automatically
                started.
              </DialogDescription>
            </DialogHeader>

            {/* Success message */}
            {successMessage && (
              <div className='flex items-center gap-2 p-3 rounded-lg bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400 text-sm'>
                <CheckCircle2 className='w-4 h-4 shrink-0' />
                {successMessage}
              </div>
            )}

            {/* Error message */}
            {createError && (
              <div className='flex items-center gap-2 p-3 rounded-lg bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 text-sm'>
                <AlertCircle className='w-4 h-4 shrink-0' />
                {createError}
              </div>
            )}

            <div className='space-y-4 py-2'>
              {/* Name */}
              <div className='space-y-2'>
                <Label
                  htmlFor='clinic-name'
                  className='text-sm font-medium text-clinic-navy dark:text-white'
                >
                  Clinic Name *
                </Label>
                <Input
                  id='clinic-name'
                  placeholder='e.g. Manila Medical Center'
                  value={formData.name}
                  onChange={(e) => updateField('name', e.target.value)}
                  className='border-clinic-navy/10 dark:border-white/10'
                />
              </div>

              {/* Email */}
              <div className='space-y-2'>
                <Label
                  htmlFor='clinic-email'
                  className='text-sm font-medium text-clinic-navy dark:text-white'
                >
                  Email *
                </Label>
                <Input
                  id='clinic-email'
                  type='email'
                  placeholder='e.g. info@manilamedical.com'
                  value={formData.email}
                  onChange={(e) => updateField('email', e.target.value)}
                  className='border-clinic-navy/10 dark:border-white/10'
                />
              </div>

              {/* Phone */}
              <div className='space-y-2'>
                <Label
                  htmlFor='clinic-phone'
                  className='text-sm font-medium text-clinic-navy dark:text-white'
                >
                  Phone
                </Label>
                <Input
                  id='clinic-phone'
                  placeholder='e.g. +63 2 8888 1234'
                  value={formData.phone}
                  onChange={(e) => updateField('phone', e.target.value)}
                  className='border-clinic-navy/10 dark:border-white/10'
                />
              </div>

              {/* Address & City row */}
              <div className='grid grid-cols-2 gap-3'>
                <div className='space-y-2'>
                  <Label
                    htmlFor='clinic-address'
                    className='text-sm font-medium text-clinic-navy dark:text-white'
                  >
                    Address
                  </Label>
                  <Input
                    id='clinic-address'
                    placeholder='Street address'
                    value={formData.address}
                    onChange={(e) => updateField('address', e.target.value)}
                    className='border-clinic-navy/10 dark:border-white/10'
                  />
                </div>
                <div className='space-y-2'>
                  <Label
                    htmlFor='clinic-city'
                    className='text-sm font-medium text-clinic-navy dark:text-white'
                  >
                    City
                  </Label>
                  <Input
                    id='clinic-city'
                    placeholder='e.g. Manila'
                    value={formData.city}
                    onChange={(e) => updateField('city', e.target.value)}
                    className='border-clinic-navy/10 dark:border-white/10'
                  />
                </div>
              </div>

              {/* Description */}
              <div className='space-y-2'>
                <Label
                  htmlFor='clinic-description'
                  className='text-sm font-medium text-clinic-navy dark:text-white'
                >
                  Description
                </Label>
                <Textarea
                  id='clinic-description'
                  placeholder='Brief description of the clinic…'
                  value={formData.description}
                  onChange={(e) => updateField('description', e.target.value)}
                  className='border-clinic-navy/10 dark:border-white/10 resize-none'
                  rows={3}
                />
              </div>

              {/* Subscription Plan */}
              <div className='space-y-2'>
                <Label className='text-sm font-medium text-clinic-navy dark:text-white'>
                  Subscription Plan
                </Label>
                <Select
                  value={formData.subscription_plan}
                  onValueChange={(val) => updateField('subscription_plan', val)}
                >
                  <SelectTrigger
                    id='clinic-plan'
                    className='border-clinic-navy/10 dark:border-white/10'
                  >
                    <SelectValue placeholder='Select plan' />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value='starter'>Starter</SelectItem>
                    <SelectItem value='professional'>Professional</SelectItem>
                    <SelectItem value='enterprise'>Enterprise</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <DialogFooter className='gap-2 sm:gap-0'>
              <Button
                variant='outline'
                onClick={() => setDialogOpen(false)}
                disabled={creating}
              >
                Cancel
              </Button>
              <Button
                onClick={handleCreateClinic}
                disabled={
                  creating ||
                  !formData.name.trim() ||
                  !formData.email.trim()
                }
                className='bg-clinic-teal hover:bg-clinic-teal/90 text-white gap-2'
              >
                {creating && <Loader2 className='w-4 h-4 animate-spin' />}
                {creating ? 'Creating…' : 'Create Clinic'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Toolbar */}
      <div className='flex flex-col sm:flex-row gap-3 mb-6'>
        {/* Search */}
        <div className='relative flex-1'>
          <Search className='absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-clinic-text/40 dark:text-white/40' />
          <Input
            className='pl-12 h-12 border-clinic-navy/10 dark:border-white/10'
            placeholder='Search by name, email, or city…'
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        {/* Active/Inactive filter */}
        <div className='flex gap-2'>
          {filterButtons.map(({ label, value }) => (
            <Button
              key={value}
              variant={activeFilter === value ? 'default' : 'outline'}
              size='sm'
              className='h-12 px-4'
              onClick={() => setActiveFilter(value)}
            >
              {label}
            </Button>
          ))}
        </div>
      </div>

      {/* Loading skeletons */}
      {loading && (
        <div className='grid sm:grid-cols-2 lg:grid-cols-3 gap-4'>
          {Array.from({ length: 3 }).map((_, i) => (
            <div
              key={i}
              className='p-4 border rounded-xl border-clinic-navy/10 dark:border-white/10 animate-pulse h-40'
            />
          ))}
        </div>
      )}

      {/* Empty state */}
      {!loading && filtered.length === 0 && (
        <div className='flex flex-col items-center justify-center py-16 text-center'>
          <Building2 className='w-12 h-12 text-clinic-navy/20 dark:text-white/20 mb-4' />
          <p className='text-clinic-text/60 dark:text-white/60 text-sm'>
            No clinics match your current filters.
          </p>
        </div>
      )}

      {/* Clinic cards */}
      {!loading && filtered.length > 0 && (
        <div className='grid sm:grid-cols-2 lg:grid-cols-3 gap-4'>
          {filtered.map((clinic) => (
            <Link
              key={clinic.id}
              href={`/super-admin/clinics/${clinic.id}`}
              className='p-4 border rounded-xl border-clinic-navy/10 dark:border-white/10 hover:border-clinic-teal/50 transition-all bg-white dark:bg-slate-800 block'
            >
              {/* Header */}
              <div className='flex items-start justify-between gap-2 mb-3'>
                <p className='font-display font-semibold text-clinic-navy dark:text-white leading-tight'>
                  {clinic.name}
                </p>
                <div className='flex flex-col items-end gap-1 shrink-0'>
                  {clinic.subscription_plan && (
                    <span
                      className={`text-xs px-2 py-0.5 rounded-full capitalize ${getPlanBadgeClass(clinic.subscription_plan)}`}
                    >
                      {clinic.subscription_plan}
                    </span>
                  )}
                  <span
                    className={`text-xs px-2 py-0.5 rounded-full ${
                      clinic.is_active
                        ? 'bg-green-500/10 text-green-600 dark:text-green-400'
                        : 'bg-red-500/10 text-red-500 dark:text-red-400'
                    }`}
                  >
                    {clinic.is_active ? 'Active' : 'Inactive'}
                  </span>
                </div>
              </div>

              {/* Email & City */}
              <div className='space-y-1 mb-4'>
                {clinic.email && (
                  <div className='flex items-center gap-2'>
                    <Mail className='w-3.5 h-3.5 text-clinic-text/40 dark:text-white/40 shrink-0' />
                    <span className='text-xs text-clinic-text/60 dark:text-white/60 truncate'>
                      {clinic.email}
                    </span>
                  </div>
                )}
                {clinic.city && (
                  <div className='flex items-center gap-2'>
                    <MapPin className='w-3.5 h-3.5 text-clinic-text/40 dark:text-white/40 shrink-0' />
                    <span className='text-xs text-clinic-text/60 dark:text-white/60'>
                      {clinic.city}
                    </span>
                  </div>
                )}
              </div>

              {/* Stats row */}
              <div className='flex items-center gap-4 pt-3 border-t border-clinic-navy/5 dark:border-white/5'>
                <div>
                  <p className='text-sm font-semibold text-clinic-navy dark:text-white'>
                    {clinic.clinic_services?.length ?? 0}
                  </p>
                  <p className='text-xs text-clinic-text/50 dark:text-white/50'>Services</p>
                </div>
                <div>
                  <p className='text-sm font-semibold text-clinic-navy dark:text-white'>
                    {clinic.practitioners?.length ?? 0}
                  </p>
                  <p className='text-xs text-clinic-text/50 dark:text-white/50'>Practitioners</p>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
