'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useGetOnboardingStatus } from '@/hooks';
import { ClinicForm } from '@/components/forms/ClinicForm';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Plus, ClipboardList, Mail, Eye } from 'lucide-react';

type StatusFilter = 'all' | 'pending' | 'in_progress' | 'completed' | 'stalled';

const STEP_LABELS: Record<string, string> = {
  clinic_created: 'Clinic Created',
  admin_set_up: 'Admin Set Up',
  services_added: 'Services Added',
  practitioners_added: 'Practitioners Added',
  first_patient: 'First Patient',
};

const STATUS_COLORS: Record<string, string> = {
  pending: 'bg-amber-100 text-amber-700',
  in_progress: 'bg-clinic-teal/10 text-clinic-teal',
  completed: 'bg-green-100 text-green-700',
  stalled: 'bg-red-100 text-red-700',
};

const STATUS_LABELS: Record<string, string> = {
  pending: 'Pending',
  in_progress: 'In Progress',
  completed: 'Completed',
  stalled: 'Stalled',
};

function formatRelativeTime(dateStr: string): string {
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  if (diffDays === 0) return 'Today';
  if (diffDays === 1) return 'Yesterday';
  if (diffDays < 30) return `${diffDays} days ago`;
  return date.toLocaleDateString();
}

export default function OnboardingPage() {
  const { clinics, loading, fetchOnboardingStatus } = useGetOnboardingStatus();
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [isAddClinicOpen, setIsAddClinicOpen] = useState(false);

  useEffect(() => {
    fetchOnboardingStatus();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const counts = {
    pending: clinics.filter((c) => c.status === 'pending').length,
    in_progress: clinics.filter((c) => c.status === 'in_progress').length,
    completed: clinics.filter((c) => c.status === 'completed').length,
    stalled: clinics.filter((c) => c.status === 'stalled').length,
  };

  const filtered =
    statusFilter === 'all' ? clinics : clinics.filter((c) => c.status === statusFilter);

  const statCards = [
    {
      label: 'Pending',
      count: counts.pending,
      color: 'text-amber-500',
      bg: 'bg-amber-500/10',
      icon: ClipboardList,
    },
    {
      label: 'In Progress',
      count: counts.in_progress,
      color: 'text-clinic-teal',
      bg: 'bg-clinic-teal/10',
      icon: ClipboardList,
    },
    {
      label: 'Completed',
      count: counts.completed,
      color: 'text-green-500',
      bg: 'bg-green-500/10',
      icon: ClipboardList,
    },
    {
      label: 'Stalled',
      count: counts.stalled,
      color: 'text-red-500',
      bg: 'bg-red-500/10',
      icon: ClipboardList,
    },
  ];

  const filterTabs: { label: string; value: StatusFilter }[] = [
    { label: 'All', value: 'all' },
    { label: 'Pending', value: 'pending' },
    { label: 'In Progress', value: 'in_progress' },
    { label: 'Completed', value: 'completed' },
    { label: 'Stalled', value: 'stalled' },
  ];

  return (
    <div>
      {/* Header */}
      <div className='flex items-center justify-between mb-6'>
        <h2 className='font-display text-xl font-bold text-clinic-navy dark:text-white'>
          Clinic Onboarding
        </h2>
        <Button onClick={() => setIsAddClinicOpen(true)} className='gap-2'>
          <Plus className='w-4 h-4' />
          Add Clinic
        </Button>
      </div>

      {/* Stat Cards */}
      <div className='grid sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6'>
        {loading
          ? Array.from({ length: 4 }).map((_, i) => (
              <div
                key={i}
                className='bg-white dark:bg-slate-800 rounded-2xl shadow-glass p-6 animate-pulse'
              >
                <div className='flex items-center gap-4'>
                  <div className='w-12 h-12 rounded-xl bg-clinic-navy/5 dark:bg-white/5' />
                  <div className='space-y-2'>
                    <div className='h-3 w-20 bg-clinic-navy/5 dark:bg-white/5 rounded' />
                    <div className='h-6 w-12 bg-clinic-navy/10 dark:bg-white/10 rounded' />
                  </div>
                </div>
              </div>
            ))
          : statCards.map((card) => {
              const Icon = card.icon;
              return (
                <div
                  key={card.label}
                  className='bg-white dark:bg-slate-800 rounded-2xl shadow-glass p-6'
                >
                  <div className='flex items-center gap-4'>
                    <div
                      className={`w-12 h-12 rounded-xl ${card.bg} flex items-center justify-center`}
                    >
                      <Icon className={`w-6 h-6 ${card.color}`} />
                    </div>
                    <div>
                      <p className='text-sm text-clinic-text/60 dark:text-white/60'>
                        {card.label}
                      </p>
                      <p className='text-2xl font-display font-bold text-clinic-navy dark:text-white'>
                        {card.count}
                      </p>
                    </div>
                  </div>
                </div>
              );
            })}
      </div>

      {/* Status filter tabs */}
      <div className='flex gap-2 flex-wrap mb-6'>
        {filterTabs.map(({ label, value }) => (
          <Button
            key={value}
            variant={statusFilter === value ? 'default' : 'outline'}
            size='sm'
            className='h-9 px-4'
            onClick={() => setStatusFilter(value)}
          >
            {label}
          </Button>
        ))}
      </div>

      {/* Loading skeletons */}
      {loading && (
        <div className='grid sm:grid-cols-2 lg:grid-cols-3 gap-4'>
          {Array.from({ length: 6 }).map((_, i) => (
            <div
              key={i}
              className='bg-white dark:bg-slate-800 rounded-2xl shadow-glass p-6 animate-pulse h-52'
            />
          ))}
        </div>
      )}

      {/* Empty state */}
      {!loading && filtered.length === 0 && (
        <div className='flex flex-col items-center justify-center py-16 text-center'>
          <ClipboardList className='w-12 h-12 text-clinic-navy/20 dark:text-white/20 mb-4' />
          <p className='text-clinic-text/60 dark:text-white/60 text-sm'>
            No clinics match the current filter.
          </p>
        </div>
      )}

      {/* Clinic cards */}
      {!loading && filtered.length > 0 && (
        <div className='grid sm:grid-cols-2 lg:grid-cols-3 gap-4'>
          {filtered.map((clinic) => {
            const missingSteps = Object.entries(clinic.steps)
              .filter(([, done]) => !done)
              .map(([key]) => STEP_LABELS[key]);

            return (
              <div
                key={clinic.clinic_id}
                className='bg-white dark:bg-slate-800 rounded-2xl shadow-glass p-6 flex flex-col gap-4'
              >
                {/* Top: name + status badge */}
                <div className='flex items-start justify-between gap-2'>
                  <div>
                    <p className='font-display font-semibold text-clinic-navy dark:text-white leading-tight'>
                      {clinic.clinic_name}
                    </p>
                    <p className='text-xs text-clinic-text/50 dark:text-white/50 mt-0.5'>
                      Registered {formatRelativeTime(clinic.registered_at)}
                    </p>
                  </div>
                  <span
                    className={`text-xs px-2.5 py-1 rounded-full font-medium shrink-0 ${STATUS_COLORS[clinic.status]}`}
                  >
                    {STATUS_LABELS[clinic.status]}
                  </span>
                </div>

                {/* Progress bar */}
                <div>
                  <div className='flex gap-1 mb-1.5'>
                    {Array.from({ length: clinic.total_steps }).map((_, i) => (
                      <div
                        key={i}
                        className={`h-2 flex-1 rounded-full ${
                          i < clinic.completed_steps
                            ? 'bg-clinic-teal'
                            : 'bg-clinic-navy/10 dark:bg-white/10'
                        }`}
                      />
                    ))}
                  </div>
                  <p className='text-xs text-clinic-text/60 dark:text-white/60'>
                    {clinic.completed_steps}/{clinic.total_steps} steps
                  </p>
                </div>

                {/* Missing steps */}
                {missingSteps.length > 0 && (
                  <p className='text-xs text-clinic-text/50 dark:text-white/50'>
                    Missing:{' '}
                    <span className='text-red-500 dark:text-red-400'>
                      {missingSteps.join(', ')}
                    </span>
                  </p>
                )}

                {/* Quick actions */}
                <div className='flex items-center gap-2 pt-2 border-t border-clinic-navy/5 dark:border-white/5'>
                  <Link
                    href={`/super-admin/clinics/${clinic.clinic_id}`}
                    className='flex items-center gap-1.5 text-xs text-clinic-teal hover:underline'
                  >
                    <Eye className='w-3.5 h-3.5' />
                    View Clinic
                  </Link>
                  {clinic.clinic_email && (
                    <a
                      href={`mailto:${clinic.clinic_email}`}
                      className='flex items-center gap-1.5 text-xs text-clinic-text/60 dark:text-white/60 hover:text-clinic-teal dark:hover:text-clinic-teal ml-auto'
                    >
                      <Mail className='w-3.5 h-3.5' />
                      Contact Admin
                    </a>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Add Clinic Dialog */}
      <Dialog open={isAddClinicOpen} onOpenChange={setIsAddClinicOpen}>
        <DialogContent className='max-w-lg'>
          <DialogHeader>
            <DialogTitle>Add New Clinic</DialogTitle>
            <DialogDescription>
              Register a new clinic to begin the onboarding process.
            </DialogDescription>
          </DialogHeader>
          <ClinicForm
            onSuccess={() => {
              setIsAddClinicOpen(false);
              fetchOnboardingStatus();
            }}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
}
