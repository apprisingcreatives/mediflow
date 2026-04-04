'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Building2,
  Shield,
  Users,
  Heart,
  Activity,
  ClipboardList,
  Flag,
  CreditCard,
  ArrowRight,
} from 'lucide-react';
import { supabase } from '@/lib/supabase';

interface ClinicRow {
  id: string;
  name: string;
  is_active: boolean;
  subscription_plan: string | null;
  created_at: string;
}

interface ReportRow {
  id: string;
  status: string;
  title: string;
  created_at: string;
}

interface DashboardData {
  totalClinics: number;
  activeClinics: number;
  totalPractitioners: number;
  totalPatients: number;
  recentActivity: Array<{
    id: string;
    type: 'clinic' | 'report';
    description: string;
    createdAt: string;
  }>;
  onboardingSummary: {
    pending: number;
    in_progress: number;
    completed: number;
    stalled: number;
  };
  pendingReportsCount: number;
  plansBreakdown: Array<{ plan: string; count: number }>;
}

function getRelativeTime(dateStr: string): string {
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffMins < 1) return 'just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 30) return `${diffDays}d ago`;
  return date.toLocaleDateString();
}

export default function SuperAdminDashboard() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAll = async () => {
      setLoading(true);

      const [clinicsRes, practitionersRes, patientsRes, reportsRes, onboardingClinicsRes] =
        await Promise.all([
          supabase
            .from('clinics')
            .select('id, name, is_active, subscription_plan, created_at', {
              count: 'exact',
            }),
          supabase
            .from('practitioners')
            .select('id', { count: 'exact', head: true }),
          supabase.from('patients').select('id', { count: 'exact', head: true }),
          supabase
            .from('user_reports')
            .select('id, status, title, created_at')
            .order('created_at', { ascending: false })
            .limit(5),
          supabase
            .from('clinics')
            .select(`
              id, updated_at,
              clinic_admins(id, auth_user_id),
              clinic_services(id),
              practitioners(id),
              patient_clinics(id)
            `),
        ]);

      const clinics: ClinicRow[] = clinicsRes.data ?? [];
      const totalClinics = clinicsRes.count ?? clinics.length;
      const activeClinics = clinics.filter((c) => c.is_active).length;

      const totalPractitioners = practitionersRes.count ?? 0;
      const totalPatients = patientsRes.count ?? 0;

      // Recent activity: last 5 clinics + recent reports interleaved by date
      const recentClinics = [...clinics]
        .sort(
          (a, b) =>
            new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        )
        .slice(0, 5)
        .map((c) => ({
          id: `clinic-${c.id}`,
          type: 'clinic' as const,
          description: `New clinic registered: ${c.name}`,
          createdAt: c.created_at,
        }));

      const reports: ReportRow[] = reportsRes.data ?? [];
      const recentReports = reports.map((r) => ({
        id: `report-${r.id}`,
        type: 'report' as const,
        description: `Report submitted: ${r.title}`,
        createdAt: r.created_at,
      }));

      const recentActivity = [...recentClinics, ...recentReports]
        .sort(
          (a, b) =>
            new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        )
        .slice(0, 5);

      // Onboarding summary (computed from related data)
      const STALE_DAYS = 7;
      const staleThreshold = new Date(Date.now() - STALE_DAYS * 24 * 60 * 60 * 1000);
      const onboardingSummary = { pending: 0, in_progress: 0, completed: 0, stalled: 0 };
      for (const c of (onboardingClinicsRes.data ?? []) as any[]) {
        const hasAdmin = (c.clinic_admins || []).some((a: any) => a.auth_user_id !== null);
        const hasServices = (c.clinic_services || []).length > 0;
        const hasPractitioners = (c.practitioners || []).length > 0;
        const hasPatient = (c.patient_clinics || []).length > 0;
        const allComplete = hasAdmin && hasServices && hasPractitioners && hasPatient;
        const isStale = new Date(c.updated_at) < staleThreshold;
        if (allComplete) onboardingSummary.completed++;
        else if (!allComplete && isStale) onboardingSummary.stalled++;
        else if (hasServices || hasPractitioners || hasPatient) onboardingSummary.in_progress++;
        else onboardingSummary.pending++;
      }

      // Pending reports count
      const pendingReportsCount = reports.filter(
        (r) => r.status === 'pending'
      ).length;

      // Plans breakdown
      const planMap: Record<string, number> = {};
      for (const c of clinics) {
        const plan = c.subscription_plan ?? 'none';
        planMap[plan] = (planMap[plan] ?? 0) + 1;
      }
      const plansBreakdown = Object.entries(planMap).map(([plan, count]) => ({
        plan,
        count,
      }));

      setData({
        totalClinics,
        activeClinics,
        totalPractitioners,
        totalPatients,
        recentActivity,
        onboardingSummary,
        pendingReportsCount,
        plansBreakdown,
      });
      setLoading(false);
    };

    fetchAll();
  }, []);

  const statCards = data
    ? [
        {
          label: 'Total Clinics',
          value: data.totalClinics,
          icon: Building2,
          iconColor: 'text-clinic-teal',
          bg: 'bg-clinic-teal/10',
        },
        {
          label: 'Active Clinics',
          value: data.activeClinics,
          icon: Shield,
          iconColor: 'text-green-500',
          bg: 'bg-green-500/10',
        },
        {
          label: 'Total Practitioners',
          value: data.totalPractitioners,
          icon: Users,
          iconColor: 'text-clinic-ai',
          bg: 'bg-clinic-ai/10',
        },
        {
          label: 'Total Patients',
          value: data.totalPatients,
          icon: Heart,
          iconColor: 'text-red-500',
          bg: 'bg-red-500/10',
        },
      ]
    : [];

  const onboardingStatusConfig = [
    {
      key: 'pending' as const,
      label: 'Pending',
      dotClass: 'bg-yellow-400',
    },
    {
      key: 'in_progress' as const,
      label: 'In Progress',
      dotClass: 'bg-clinic-teal',
    },
    {
      key: 'completed' as const,
      label: 'Completed',
      dotClass: 'bg-green-500',
    },
    {
      key: 'stalled' as const,
      label: 'Stalled',
      dotClass: 'bg-red-500',
    },
  ];

  return (
    <div>
      <h2 className='font-display text-xl font-bold text-clinic-navy dark:text-white mb-6'>
        Command Center
      </h2>

      {/* Stat Cards */}
      <div className='grid sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8'>
        {loading
          ? Array.from({ length: 4 }).map((_, i) => (
              <div
                key={i}
                className='bg-white dark:bg-slate-800 rounded-2xl shadow-glass p-6 animate-pulse'
              >
                <div className='flex items-center gap-4'>
                  <div className='w-12 h-12 rounded-xl bg-clinic-navy/5 dark:bg-white/5' />
                  <div className='space-y-2'>
                    <div className='h-3 w-24 bg-clinic-navy/5 dark:bg-white/5 rounded' />
                    <div className='h-6 w-16 bg-clinic-navy/10 dark:bg-white/10 rounded' />
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
                      <Icon className={`w-6 h-6 ${card.iconColor}`} />
                    </div>
                    <div>
                      <p className='text-sm text-clinic-text/60 dark:text-white/60'>
                        {card.label}
                      </p>
                      <p className='text-2xl font-display font-bold text-clinic-navy dark:text-white'>
                        {card.value.toLocaleString()}
                      </p>
                    </div>
                  </div>
                </div>
              );
            })}
      </div>

      {/* Widgets Grid */}
      <div className='grid md:grid-cols-2 gap-6'>
        {/* Recent Activity */}
        <div className='bg-white dark:bg-slate-800 rounded-2xl shadow-glass p-6'>
          <div className='flex items-center gap-2 mb-4'>
            <Activity className='w-5 h-5 text-clinic-teal' />
            <h3 className='font-display text-lg font-semibold text-clinic-navy dark:text-white'>
              Recent Activity
            </h3>
          </div>

          {loading ? (
            <div className='space-y-3'>
              {Array.from({ length: 5 }).map((_, i) => (
                <div
                  key={i}
                  className='h-12 bg-clinic-navy/5 dark:bg-white/5 rounded-xl animate-pulse'
                />
              ))}
            </div>
          ) : data?.recentActivity.length === 0 ? (
            <p className='text-sm text-clinic-text/60 dark:text-white/60'>
              No recent activity.
            </p>
          ) : (
            <ul className='space-y-3'>
              {data?.recentActivity.map((item) => (
                <li key={item.id} className='flex items-start gap-3'>
                  <div className='mt-0.5 w-8 h-8 rounded-lg bg-clinic-navy/5 dark:bg-white/5 flex items-center justify-center flex-shrink-0'>
                    {item.type === 'clinic' ? (
                      <Building2 className='w-4 h-4 text-clinic-teal' />
                    ) : (
                      <Flag className='w-4 h-4 text-red-400' />
                    )}
                  </div>
                  <div className='flex-1 min-w-0'>
                    <p className='text-sm text-clinic-navy dark:text-white truncate'>
                      {item.description}
                    </p>
                    <p className='text-xs text-clinic-text/50 dark:text-white/50'>
                      {getRelativeTime(item.createdAt)}
                    </p>
                  </div>
                </li>
              ))}
            </ul>
          )}

          <div className='mt-4 pt-4 border-t border-clinic-navy/5 dark:border-white/5'>
            <Link
              href='/super-admin/clinics'
              className='text-sm text-clinic-teal hover:underline flex items-center gap-1'
            >
              View all clinics <ArrowRight className='w-3 h-3' />
            </Link>
          </div>
        </div>

        {/* Onboarding Summary */}
        <div className='bg-white dark:bg-slate-800 rounded-2xl shadow-glass p-6'>
          <div className='flex items-center gap-2 mb-4'>
            <ClipboardList className='w-5 h-5 text-clinic-ai' />
            <h3 className='font-display text-lg font-semibold text-clinic-navy dark:text-white'>
              Onboarding Summary
            </h3>
          </div>

          {loading ? (
            <div className='space-y-3'>
              {Array.from({ length: 4 }).map((_, i) => (
                <div
                  key={i}
                  className='h-8 bg-clinic-navy/5 dark:bg-white/5 rounded-xl animate-pulse'
                />
              ))}
            </div>
          ) : (
            <ul className='space-y-3'>
              {onboardingStatusConfig.map(({ key, label, dotClass }) => (
                <li
                  key={key}
                  className='flex items-center justify-between py-1'
                >
                  <div className='flex items-center gap-2'>
                    <span
                      className={`w-2.5 h-2.5 rounded-full ${dotClass}`}
                    />
                    <span className='text-sm text-clinic-navy dark:text-white'>
                      {label}
                    </span>
                  </div>
                  <span className='text-sm font-semibold text-clinic-navy dark:text-white'>
                    {data?.onboardingSummary[key] ?? 0}
                  </span>
                </li>
              ))}
            </ul>
          )}

          <div className='mt-4 pt-4 border-t border-clinic-navy/5 dark:border-white/5'>
            <Link
              href='/super-admin/onboarding'
              className='text-sm text-clinic-teal hover:underline flex items-center gap-1'
            >
              View all <ArrowRight className='w-3 h-3' />
            </Link>
          </div>
        </div>

        {/* Pending Reports */}
        <div className='bg-white dark:bg-slate-800 rounded-2xl shadow-glass p-6'>
          <div className='flex items-center gap-2 mb-4'>
            <Flag className='w-5 h-5 text-red-400' />
            <h3 className='font-display text-lg font-semibold text-clinic-navy dark:text-white'>
              Pending Reports
            </h3>
          </div>

          {loading ? (
            <div className='h-16 bg-clinic-navy/5 dark:bg-white/5 rounded-xl animate-pulse' />
          ) : (
            <div className='flex items-center gap-4 py-2'>
              <div className='w-14 h-14 rounded-xl bg-red-500/10 flex items-center justify-center'>
                <Flag className='w-7 h-7 text-red-500' />
              </div>
              <div>
                <p className='text-3xl font-display font-bold text-clinic-navy dark:text-white'>
                  {data?.pendingReportsCount ?? 0}
                </p>
                <p className='text-sm text-clinic-text/60 dark:text-white/60'>
                  {data?.pendingReportsCount === 1 ? 'report' : 'reports'}{' '}
                  awaiting review
                </p>
              </div>
            </div>
          )}

          <div className='mt-4 pt-4 border-t border-clinic-navy/5 dark:border-white/5'>
            <Link
              href='/super-admin/reports'
              className='text-sm text-clinic-teal hover:underline flex items-center gap-1'
            >
              View reports <ArrowRight className='w-3 h-3' />
            </Link>
          </div>
        </div>

        {/* Plans Breakdown */}
        <div className='bg-white dark:bg-slate-800 rounded-2xl shadow-glass p-6'>
          <div className='flex items-center gap-2 mb-4'>
            <CreditCard className='w-5 h-5 text-clinic-ai' />
            <h3 className='font-display text-lg font-semibold text-clinic-navy dark:text-white'>
              Plans Breakdown
            </h3>
          </div>

          {loading ? (
            <div className='space-y-3'>
              {Array.from({ length: 3 }).map((_, i) => (
                <div
                  key={i}
                  className='h-8 bg-clinic-navy/5 dark:bg-white/5 rounded-xl animate-pulse'
                />
              ))}
            </div>
          ) : data?.plansBreakdown.length === 0 ? (
            <p className='text-sm text-clinic-text/60 dark:text-white/60'>
              No plan data available.
            </p>
          ) : (
            <ul className='space-y-2'>
              {data?.plansBreakdown.map(({ plan, count }) => (
                <li
                  key={plan}
                  className='flex items-center justify-between py-1.5 border-b border-clinic-navy/5 dark:border-white/5 last:border-0'
                >
                  <span className='text-sm capitalize text-clinic-navy dark:text-white'>
                    {plan === 'none' ? 'No Plan' : plan}
                  </span>
                  <span className='text-sm font-semibold text-clinic-navy dark:text-white'>
                    {count} {count === 1 ? 'clinic' : 'clinics'}
                  </span>
                </li>
              ))}
            </ul>
          )}

          <div className='mt-4 pt-4 border-t border-clinic-navy/5 dark:border-white/5'>
            <Link
              href='/super-admin/subscription-plans'
              className='text-sm text-clinic-teal hover:underline flex items-center gap-1'
            >
              Manage plans <ArrowRight className='w-3 h-3' />
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
