'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import { cn } from '@/lib/utils';
import {
  ArrowLeft,
  Building2,
  Mail,
  MapPin,
  Phone,
  Globe,
  Loader2,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import {
  useGetFeatures,
  useGetClinicFeatures,
  usePutClinicFeatures,
} from '@/hooks';
import { Clinic } from '@/types/database';
import { AIFeature } from '@/hooks/useGetFeatures';

// ─── Types ────────────────────────────────────────────────────────────────────

type Tab = 'overview' | 'ai-features' | 'admins' | 'billing';

interface ClinicStats {
  services: number;
  practitioners: number;
  patients: number;
}

interface ClinicAdmin {
  id: string;
  clinic_id: string;
  email: string;
  name: string;
  role: string;
  is_active: boolean;
  created_at: string;
}

interface ClinicPayment {
  id: string;
  clinic_id: string;
  amount: number;
  currency: string;
  status: string;
  created_at: string;
}

// ─── Badge helpers ─────────────────────────────────────────────────────────────

const PLAN_BADGE_CLASSES: Record<string, string> = {
  starter: 'bg-clinic-navy/10 text-clinic-navy dark:bg-clinic-navy/20 dark:text-white',
  professional:
    'bg-clinic-ai/10 text-clinic-ai dark:bg-clinic-ai/20 dark:text-clinic-ai',
  enterprise:
    'bg-yellow-400/20 text-yellow-700 dark:bg-yellow-400/20 dark:text-yellow-300',
};

function getPlanBadgeClass(plan: string | null | undefined): string {
  if (!plan) return 'bg-clinic-navy/10 text-clinic-navy dark:bg-white/10 dark:text-white/60';
  return (
    PLAN_BADGE_CLASSES[plan.toLowerCase()] ??
    'bg-clinic-navy/10 text-clinic-navy dark:bg-white/10 dark:text-white'
  );
}

function getPaymentStatusClass(status: string | null | undefined): string {
  switch (status) {
    case 'active':
      return 'bg-green-500/10 text-green-600 dark:text-green-400';
    case 'trial':
      return 'bg-blue-500/10 text-blue-600 dark:text-blue-400';
    case 'past_due':
      return 'bg-orange-500/10 text-orange-600 dark:text-orange-400';
    case 'canceled':
      return 'bg-red-500/10 text-red-500 dark:text-red-400';
    default:
      return 'bg-gray-500/10 text-gray-500 dark:text-gray-400';
  }
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function ClinicDetailPage() {
  const params = useParams();
  const clinicId = params.clinicId as string;

  // Core state
  const [clinic, setClinic] = useState<Clinic | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<Tab>('overview');
  // Stats
  const [stats, setStats] = useState<ClinicStats>({ services: 0, practitioners: 0, patients: 0 });

  // Admins tab
  const [admins, setAdmins] = useState<ClinicAdmin[]>([]);
  const [adminsLoading, setAdminsLoading] = useState(false);

  // Billing tab
  const [payments, setPayments] = useState<ClinicPayment[]>([]);
  const [paymentsLoading, setPaymentsLoading] = useState(false);

  // AI Features hooks
  const { features, fetchFeatures } = useGetFeatures();
  const { clinicFeatures, fetchClinicFeatures } = useGetClinicFeatures();
  const { toggleClinicFeature, loading: togglingFeature } = usePutClinicFeatures();

  // ── Fetch main clinic data + stats ──────────────────────────────────────────

  const loadClinic = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('clinics')
        .select('*')
        .eq('id', clinicId)
        .single();

      if (error) throw error;
      setClinic(data);

      // Fetch counts in parallel
      const [servicesRes, practitionersRes, patientsRes] = await Promise.all([
        supabase
          .from('clinic_services')
          .select('id', { count: 'exact', head: true })
          .eq('clinic_id', clinicId),
        supabase
          .from('practitioners')
          .select('id', { count: 'exact', head: true })
          .eq('clinic_id', clinicId),
        supabase
          .from('patients')
          .select('id', { count: 'exact', head: true })
          .eq('clinic_id', clinicId),
      ]);

      setStats({
        services: servicesRes.count ?? 0,
        practitioners: practitionersRes.count ?? 0,
        patients: patientsRes.count ?? 0,
      });
    } catch (err) {
      console.error('Failed to load clinic:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (clinicId) {
      loadClinic();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [clinicId]);

  // ── Load tab-specific data on demand ────────────────────────────────────────

  useEffect(() => {
    if (activeTab === 'ai-features') {
      fetchFeatures();
      fetchClinicFeatures({ clinicId });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab, clinicId]);

  useEffect(() => {
    if (activeTab === 'admins' && clinicId) {
      setAdminsLoading(true);
      supabase
        .from('clinic_admins')
        .select('*')
        .eq('clinic_id', clinicId)
        .then(({ data, error }) => {
          if (!error) setAdmins(data ?? []);
          setAdminsLoading(false);
        });
    }
  }, [activeTab, clinicId]);

  useEffect(() => {
    if (activeTab === 'billing' && clinicId) {
      (async () => {
        setPaymentsLoading(true);
        try {
          const { data, error } = await supabase
            .from('clinic_payments')
            .select('*')
            .eq('clinic_id', clinicId)
            .order('created_at', { ascending: false });
          if (!error) setPayments(data ?? []);
        } catch {
          // Table might not exist yet
          setPayments([]);
        } finally {
          setPaymentsLoading(false);
        }
      })();
    }
  }, [activeTab, clinicId]);

  // ── AI feature toggle ────────────────────────────────────────────────────────

  const getAdminId = (): string => {
    try {
      const raw = localStorage.getItem('superAdmin');
      if (!raw) return '';
      const parsed = JSON.parse(raw);
      return parsed?.id ?? '';
    } catch {
      return '';
    }
  };

  const isFeatureEnabled = (featureId: string): boolean => {
    const cf = clinicFeatures.find((f) => f.feature_id === featureId);
    return cf?.is_enabled ?? false;
  };

  const handleToggleFeature = async (feature: AIFeature) => {
    const currentlyEnabled = isFeatureEnabled(feature.id);
    try {
      await toggleClinicFeature({
        clinicId,
        featureId: feature.id,
        isEnabled: !currentlyEnabled,
        enabledBy: getAdminId(),
      });
    } catch {
      // Error handled by hook
    }
  };

  // ── Tab definitions ──────────────────────────────────────────────────────────

  const tabs: { id: Tab; label: string }[] = [
    { id: 'overview', label: 'Overview' },
    { id: 'ai-features', label: 'AI Features' },
    { id: 'admins', label: 'Admins' },
    { id: 'billing', label: 'Billing' },
  ];

  // ─── Loading skeleton ────────────────────────────────────────────────────────

  if (loading) {
    return (
      <div className='flex items-center justify-center h-64'>
        <Loader2 className='w-8 h-8 animate-spin text-clinic-teal' />
      </div>
    );
  }

  if (!clinic) {
    return (
      <div className='flex flex-col items-center justify-center h-64 gap-4'>
        <Building2 className='w-12 h-12 text-clinic-navy/20 dark:text-white/20' />
        <p className='text-clinic-text/60 dark:text-white/60'>Clinic not found.</p>
        <Link href='/super-admin/clinics'>
          <Button variant='outline' size='sm'>
            Back to Clinics
          </Button>
        </Link>
      </div>
    );
  }

  // ─── Render ──────────────────────────────────────────────────────────────────

  return (
    <div className='space-y-6'>
      {/* Back button */}
      <Link
        href='/super-admin/clinics'
        className='inline-flex items-center gap-2 text-sm text-clinic-text/60 dark:text-white/60 hover:text-clinic-navy dark:hover:text-white transition-colors'
      >
        <ArrowLeft className='w-4 h-4' />
        Back to Clinics
      </Link>

      {/* Clinic header */}
      <div className='bg-white dark:bg-slate-800 rounded-2xl shadow-glass p-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4'>
        <div className='flex items-center gap-4'>
          <div className='w-12 h-12 rounded-xl bg-clinic-teal/10 flex items-center justify-center shrink-0'>
            <Building2 className='w-6 h-6 text-clinic-teal' />
          </div>
          <div>
            <h1 className='font-display text-xl font-bold text-clinic-navy dark:text-white'>
              {clinic.name}
            </h1>
            <p className='text-sm text-clinic-text/60 dark:text-white/60'>{clinic.email}</p>
          </div>
        </div>
        <div className='flex items-center gap-2 flex-wrap'>
          {clinic.subscription_plan && (
            <span
              className={cn(
                'text-xs px-2.5 py-1 rounded-full capitalize font-medium',
                getPlanBadgeClass(clinic.subscription_plan),
              )}
            >
              {clinic.subscription_plan}
            </span>
          )}
          <span
            className={cn(
              'text-xs px-2.5 py-1 rounded-full font-medium',
              clinic.is_active
                ? 'bg-green-500/10 text-green-600 dark:text-green-400'
                : 'bg-red-500/10 text-red-500 dark:text-red-400',
            )}
          >
            {clinic.is_active ? 'Active' : 'Inactive'}
          </span>
        </div>
      </div>

      {/* Tabs */}
      <div className='border-b border-clinic-navy/10 dark:border-white/10'>
        <div className='flex gap-1 overflow-x-auto'>
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={cn(
                'px-4 py-2 text-sm font-medium border-b-2 transition-colors whitespace-nowrap',
                activeTab === tab.id
                  ? 'border-clinic-teal text-clinic-teal'
                  : 'border-transparent text-clinic-text/60 hover:text-clinic-navy dark:text-white/60 dark:hover:text-white',
              )}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Tab content */}
      <div>
        {/* ── Overview Tab ── */}
        {activeTab === 'overview' && (
          <div className='space-y-6'>
            {/* Clinic info card */}
            <div className='bg-white dark:bg-slate-800 rounded-2xl shadow-glass p-6'>
              <h2 className='font-display text-lg font-semibold text-clinic-navy dark:text-white mb-5'>
                Clinic Information
              </h2>

              <div className='grid grid-cols-1 sm:grid-cols-2 gap-5'>
                <div>
                  <p className='text-sm text-clinic-text/60 dark:text-white/60 mb-1 flex items-center gap-1.5'>
                    <Building2 className='w-3.5 h-3.5' /> Name
                  </p>
                  <p className='text-sm font-medium text-clinic-navy dark:text-white'>
                    {clinic.name}
                  </p>
                </div>

                <div>
                  <p className='text-sm text-clinic-text/60 dark:text-white/60 mb-1 flex items-center gap-1.5'>
                    <Mail className='w-3.5 h-3.5' /> Email
                  </p>
                  <p className='text-sm font-medium text-clinic-navy dark:text-white'>
                    {clinic.email}
                  </p>
                </div>

                <div>
                  <p className='text-sm text-clinic-text/60 dark:text-white/60 mb-1 flex items-center gap-1.5'>
                    <Phone className='w-3.5 h-3.5' /> Phone
                  </p>
                  <p className='text-sm font-medium text-clinic-navy dark:text-white'>
                    {clinic.phone ?? '—'}
                  </p>
                </div>

                <div>
                  <p className='text-sm text-clinic-text/60 dark:text-white/60 mb-1 flex items-center gap-1.5'>
                    <MapPin className='w-3.5 h-3.5' /> Address
                  </p>
                  <p className='text-sm font-medium text-clinic-navy dark:text-white'>
                    {clinic.address ? `${clinic.address}${clinic.city ? ', ' + clinic.city : ''}` : '—'}
                  </p>
                </div>

                <div>
                  <p className='text-sm text-clinic-text/60 dark:text-white/60 mb-1 flex items-center gap-1.5'>
                    <MapPin className='w-3.5 h-3.5' /> City
                  </p>
                  <p className='text-sm font-medium text-clinic-navy dark:text-white'>
                    {clinic.city ?? '—'}
                  </p>
                </div>

                <div>
                  <p className='text-sm text-clinic-text/60 dark:text-white/60 mb-1 flex items-center gap-1.5'>
                    <Globe className='w-3.5 h-3.5' /> Slug
                  </p>
                  <p className='text-sm font-medium text-clinic-navy dark:text-white font-mono'>
                    {clinic.slug ?? '—'}
                  </p>
                </div>
              </div>
            </div>

            {/* Stats row */}
            <div className='grid grid-cols-3 gap-4'>
              {[
                { label: 'Services', value: stats.services },
                { label: 'Practitioners', value: stats.practitioners },
                { label: 'Patients', value: stats.patients },
              ].map(({ label, value }) => (
                <div
                  key={label}
                  className='bg-white dark:bg-slate-800 rounded-2xl shadow-glass p-5 text-center'
                >
                  <p className='text-2xl font-bold text-clinic-navy dark:text-white'>{value}</p>
                  <p className='text-sm text-clinic-text/60 dark:text-white/60 mt-1'>{label}</p>
                </div>
              ))}
            </div>

            {/* Subscription info */}
            <div className='bg-white dark:bg-slate-800 rounded-2xl shadow-glass p-6'>
              <h2 className='font-display text-lg font-semibold text-clinic-navy dark:text-white mb-5'>
                Subscription
              </h2>
              <div className='grid grid-cols-1 sm:grid-cols-2 gap-5'>
                <div>
                  <p className='text-sm text-clinic-text/60 dark:text-white/60 mb-1'>Plan</p>
                  {clinic.subscription_plan ? (
                    <span
                      className={cn(
                        'text-xs px-2.5 py-1 rounded-full capitalize font-medium',
                        getPlanBadgeClass(clinic.subscription_plan),
                      )}
                    >
                      {clinic.subscription_plan}
                    </span>
                  ) : (
                    <p className='text-sm font-medium text-clinic-navy dark:text-white'>—</p>
                  )}
                </div>

                <div>
                  <p className='text-sm text-clinic-text/60 dark:text-white/60 mb-1'>
                    Payment Status
                  </p>
                  {clinic.payment_status ? (
                    <span
                      className={cn(
                        'text-xs px-2.5 py-1 rounded-full capitalize font-medium',
                        getPaymentStatusClass(clinic.payment_status),
                      )}
                    >
                      {clinic.payment_status.replace('_', ' ')}
                    </span>
                  ) : (
                    <p className='text-sm font-medium text-clinic-navy dark:text-white'>—</p>
                  )}
                </div>

                <div>
                  <p className='text-sm text-clinic-text/60 dark:text-white/60 mb-1'>
                    Trial Start
                  </p>
                  <p className='text-sm font-medium text-clinic-navy dark:text-white'>
                    {clinic.trial_start_date
                      ? new Date(clinic.trial_start_date).toLocaleDateString()
                      : '—'}
                  </p>
                </div>

                <div>
                  <p className='text-sm text-clinic-text/60 dark:text-white/60 mb-1'>Trial End</p>
                  <p className='text-sm font-medium text-clinic-navy dark:text-white'>
                    {clinic.trial_end_date
                      ? new Date(clinic.trial_end_date).toLocaleDateString()
                      : '—'}
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ── AI Features Tab ── */}
        {activeTab === 'ai-features' && (
          <div className='bg-white dark:bg-slate-800 rounded-2xl shadow-glass p-6'>
            <h2 className='font-display text-lg font-semibold text-clinic-navy dark:text-white mb-5'>
              AI Features
            </h2>

            {features.length === 0 ? (
              <p className='text-sm text-clinic-text/60 dark:text-white/60'>
                No AI features available.
              </p>
            ) : (
              <div className='space-y-4'>
                {features.map((feature) => {
                  const enabled = isFeatureEnabled(feature.id);
                  return (
                    <div
                      key={feature.id}
                      className='flex items-center justify-between gap-4 py-3 border-b border-clinic-navy/5 dark:border-white/5 last:border-0'
                    >
                      <div className='flex-1 min-w-0'>
                        <div className='flex items-center gap-2 flex-wrap'>
                          <p className='text-sm font-medium text-clinic-navy dark:text-white'>
                            {feature.name}
                          </p>
                          {feature.is_premium && (
                            <span className='text-xs px-1.5 py-0.5 rounded bg-yellow-400/20 text-yellow-700 dark:text-yellow-300'>
                              Premium
                            </span>
                          )}
                          {feature.category && (
                            <span className='text-xs px-1.5 py-0.5 rounded bg-clinic-navy/5 dark:bg-white/5 text-clinic-text/60 dark:text-white/60'>
                              {feature.category}
                            </span>
                          )}
                        </div>
                        {feature.description && (
                          <p className='text-xs text-clinic-text/50 dark:text-white/50 mt-0.5 truncate'>
                            {feature.description}
                          </p>
                        )}
                      </div>
                      <Switch
                        checked={enabled}
                        onCheckedChange={() => handleToggleFeature(feature)}
                        disabled={togglingFeature}
                        aria-label={`Toggle ${feature.name}`}
                      />
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* ── Admins Tab ── */}
        {activeTab === 'admins' && (
          <div className='bg-white dark:bg-slate-800 rounded-2xl shadow-glass p-6'>
            <h2 className='font-display text-lg font-semibold text-clinic-navy dark:text-white mb-5'>
              Clinic Admins
            </h2>

            {adminsLoading ? (
              <div className='flex items-center justify-center py-12'>
                <Loader2 className='w-6 h-6 animate-spin text-clinic-teal' />
              </div>
            ) : admins.length === 0 ? (
              <div className='flex flex-col items-center justify-center py-12 text-center'>
                <Building2 className='w-10 h-10 text-clinic-navy/20 dark:text-white/20 mb-3' />
                <p className='text-sm text-clinic-text/60 dark:text-white/60'>
                  No admins found for this clinic.
                </p>
              </div>
            ) : (
              <div className='space-y-3'>
                {admins.map((admin) => (
                  <div
                    key={admin.id}
                    className='flex items-center justify-between gap-4 p-4 rounded-xl border border-clinic-navy/5 dark:border-white/5'
                  >
                    <div>
                      <p className='text-sm font-medium text-clinic-navy dark:text-white'>
                        {admin.name}
                      </p>
                      <div className='flex items-center gap-1.5 mt-0.5'>
                        <Mail className='w-3 h-3 text-clinic-text/40 dark:text-white/40' />
                        <p className='text-xs text-clinic-text/60 dark:text-white/60'>
                          {admin.email}
                        </p>
                      </div>
                    </div>
                    <span
                      className={cn(
                        'text-xs px-2.5 py-1 rounded-full font-medium',
                        admin.is_active
                          ? 'bg-green-500/10 text-green-600 dark:text-green-400'
                          : 'bg-red-500/10 text-red-500 dark:text-red-400',
                      )}
                    >
                      {admin.is_active ? 'Active' : 'Inactive'}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ── Billing Tab ── */}
        {activeTab === 'billing' && (
          <div className='space-y-6'>
            {/* Subscription summary */}
            <div className='bg-white dark:bg-slate-800 rounded-2xl shadow-glass p-6'>
              <h2 className='font-display text-lg font-semibold text-clinic-navy dark:text-white mb-5'>
                Subscription Summary
              </h2>
              <div className='grid grid-cols-1 sm:grid-cols-2 gap-5'>
                <div>
                  <p className='text-sm text-clinic-text/60 dark:text-white/60 mb-1'>Plan</p>
                  {clinic.subscription_plan ? (
                    <span
                      className={cn(
                        'text-xs px-2.5 py-1 rounded-full capitalize font-medium',
                        getPlanBadgeClass(clinic.subscription_plan),
                      )}
                    >
                      {clinic.subscription_plan}
                    </span>
                  ) : (
                    <p className='text-sm font-medium text-clinic-navy dark:text-white'>—</p>
                  )}
                </div>

                <div>
                  <p className='text-sm text-clinic-text/60 dark:text-white/60 mb-1'>
                    Payment Status
                  </p>
                  {clinic.payment_status ? (
                    <span
                      className={cn(
                        'text-xs px-2.5 py-1 rounded-full capitalize font-medium',
                        getPaymentStatusClass(clinic.payment_status),
                      )}
                    >
                      {clinic.payment_status.replace('_', ' ')}
                    </span>
                  ) : (
                    <p className='text-sm font-medium text-clinic-navy dark:text-white'>—</p>
                  )}
                </div>

                <div>
                  <p className='text-sm text-clinic-text/60 dark:text-white/60 mb-1'>
                    Trial Start
                  </p>
                  <p className='text-sm font-medium text-clinic-navy dark:text-white'>
                    {clinic.trial_start_date
                      ? new Date(clinic.trial_start_date).toLocaleDateString()
                      : '—'}
                  </p>
                </div>

                <div>
                  <p className='text-sm text-clinic-text/60 dark:text-white/60 mb-1'>Trial End</p>
                  <p className='text-sm font-medium text-clinic-navy dark:text-white'>
                    {clinic.trial_end_date
                      ? new Date(clinic.trial_end_date).toLocaleDateString()
                      : '—'}
                  </p>
                </div>
              </div>
            </div>

            {/* Payment history */}
            <div className='bg-white dark:bg-slate-800 rounded-2xl shadow-glass p-6'>
              <h2 className='font-display text-lg font-semibold text-clinic-navy dark:text-white mb-5'>
                Payment History
              </h2>

              {paymentsLoading ? (
                <div className='flex items-center justify-center py-12'>
                  <Loader2 className='w-6 h-6 animate-spin text-clinic-teal' />
                </div>
              ) : payments.length === 0 ? (
                <div className='flex flex-col items-center justify-center py-12 text-center'>
                  <p className='text-sm text-clinic-text/60 dark:text-white/60'>
                    No payment history found.
                  </p>
                </div>
              ) : (
                <div className='overflow-x-auto'>
                  <table className='w-full text-sm'>
                    <thead>
                      <tr className='border-b border-clinic-navy/5 dark:border-white/5'>
                        <th className='text-left py-2 pr-4 text-clinic-text/60 dark:text-white/60 font-medium'>
                          Date
                        </th>
                        <th className='text-left py-2 pr-4 text-clinic-text/60 dark:text-white/60 font-medium'>
                          Amount
                        </th>
                        <th className='text-left py-2 text-clinic-text/60 dark:text-white/60 font-medium'>
                          Status
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {payments.map((payment) => (
                        <tr
                          key={payment.id}
                          className='border-b border-clinic-navy/5 dark:border-white/5 last:border-0'
                        >
                          <td className='py-3 pr-4 text-clinic-navy dark:text-white'>
                            {new Date(payment.created_at).toLocaleDateString()}
                          </td>
                          <td className='py-3 pr-4 text-clinic-navy dark:text-white'>
                            {new Intl.NumberFormat('en-US', {
                              style: 'currency',
                              currency: payment.currency ?? 'USD',
                            }).format(payment.amount / 100)}
                          </td>
                          <td className='py-3'>
                            <span
                              className={cn(
                                'text-xs px-2 py-0.5 rounded-full capitalize font-medium',
                                payment.status === 'succeeded' || payment.status === 'paid'
                                  ? 'bg-green-500/10 text-green-600 dark:text-green-400'
                                  : payment.status === 'pending'
                                    ? 'bg-blue-500/10 text-blue-600 dark:text-blue-400'
                                    : 'bg-red-500/10 text-red-500 dark:text-red-400',
                              )}
                            >
                              {payment.status}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

    </div>
  );
}
