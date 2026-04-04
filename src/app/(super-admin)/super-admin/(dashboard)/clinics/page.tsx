'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useGetClinics } from '@/hooks';
import { Search, Mail, MapPin, Building2 } from 'lucide-react';

type ActiveFilter = 'all' | 'active' | 'inactive';

const PLAN_BADGE_CLASSES: Record<string, string> = {
  starter: 'bg-clinic-navy/10 text-clinic-navy dark:bg-clinic-navy/20 dark:text-white',
  professional: 'bg-clinic-ai/10 text-clinic-ai dark:bg-clinic-ai/20 dark:text-clinic-ai',
  enterprise: 'bg-yellow-400/20 text-yellow-700 dark:bg-yellow-400/20 dark:text-yellow-300',
};

function getPlanBadgeClass(plan: string | null | undefined): string {
  if (!plan) return 'bg-clinic-navy/10 text-clinic-navy dark:bg-white/10 dark:text-white/60';
  return PLAN_BADGE_CLASSES[plan.toLowerCase()] ?? 'bg-clinic-navy/10 text-clinic-navy dark:bg-white/10 dark:text-white';
}

export default function ClinicsListPage() {
  const { clinics, loading, sendRequest } = useGetClinics();
  const [search, setSearch] = useState('');
  const [activeFilter, setActiveFilter] = useState<ActiveFilter>('all');

  useEffect(() => {
    sendRequest();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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

  return (
    <div>
      <h2 className='font-display text-xl font-bold text-clinic-navy dark:text-white mb-6'>
        Clinics
      </h2>

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
