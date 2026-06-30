'use client';

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import type { BranchComparison } from '@/types/database';

const formatCurrency = (value: number) =>
  new Intl.NumberFormat('en-PH', {
    style: 'currency',
    currency: 'PHP',
    maximumFractionDigits: 0,
  }).format(value);

interface BranchComparisonChartProps {
  data: BranchComparison[];
}

const COLORS = {
  appointments: '#0d9488',
  completed: '#22c55e',
  cancelled: '#ef4444',
  patients: '#6366f1',
  revenue: '#0d9488',
  avgDaily: '#f59e0b',
};

export function BranchComparisonChart({ data }: BranchComparisonChartProps) {
  if (data.length === 0) {
    return (
      <div className="text-center py-16">
        <p className="text-sm text-clinic-text/50 dark:text-white/50">
          No branch data available for comparison
        </p>
      </div>
    );
  }

  const chartData = data.map((b) => ({
    name: b.branch_name,
    'Appointments': b.appointment_count,
    'Completed': b.completed_count,
    'Cancelled': b.cancelled_count,
    'Unique Patients': b.unique_patients,
  }));

  const revenueData = data.map((b) => ({
    name: b.branch_name,
    Revenue: b.revenue,
  }));

  const performanceData = data.map((b) => ({
    name: b.branch_name,
    'Avg Daily Appts': b.avg_daily_appointments,
    'Completion Rate': b.appointment_count > 0
      ? Math.round((b.completed_count / b.appointment_count) * 100)
      : 0,
  }));

  return (
    <div className="space-y-6">
      {/* Summary cards */}
      <div className="grid sm:grid-cols-3 gap-4">
        <div className="p-4 bg-white dark:bg-slate-800 rounded-2xl shadow-glass">
          <p className="text-xs text-clinic-text/60 dark:text-white/60 mb-1">Total Branches</p>
          <p className="text-2xl font-display font-bold text-clinic-navy dark:text-white">
            {data.length}
          </p>
        </div>
        <div className="p-4 bg-white dark:bg-slate-800 rounded-2xl shadow-glass">
          <p className="text-xs text-clinic-text/60 dark:text-white/60 mb-1">Total Appointments</p>
          <p className="text-2xl font-display font-bold text-clinic-navy dark:text-white">
            {data.reduce((s, b) => s + b.appointment_count, 0)}
          </p>
        </div>
        <div className="p-4 bg-white dark:bg-slate-800 rounded-2xl shadow-glass">
          <p className="text-xs text-clinic-text/60 dark:text-white/60 mb-1">Total Revenue</p>
          <p className="text-2xl font-display font-bold text-clinic-teal">
            {formatCurrency(data.reduce((s, b) => s + b.revenue, 0))}
          </p>
        </div>
      </div>

      {/* Appointment volume by branch */}
      <Card className="bg-white dark:bg-slate-800 shadow-glass border-0 rounded-2xl">
        <CardHeader className="pb-2">
          <CardTitle className="text-base font-semibold text-clinic-navy dark:text-white">
            Appointments by Branch
          </CardTitle>
          <p className="text-xs text-clinic-text/50 dark:text-white/50">
            Total, completed, and cancelled appointments per branch
          </p>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={chartData} margin={{ top: 4, right: 16, left: 8, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" opacity={0.1} />
              <XAxis dataKey="name" fontSize={11} tick={{ fill: '#64748b' }} />
              <YAxis fontSize={11} tick={{ fill: '#64748b' }} />
              <Tooltip
                contentStyle={{
                  borderRadius: '8px',
                  border: '1px solid #e2e8f0',
                  fontSize: '12px',
                }}
              />
              <Legend
                formatter={(value) => (
                  <span className="text-xs text-clinic-text/70 dark:text-white/70">{value}</span>
                )}
              />
              <Bar dataKey="Appointments" fill={COLORS.appointments} radius={[4, 4, 0, 0]} />
              <Bar dataKey="Completed" fill={COLORS.completed} radius={[4, 4, 0, 0]} />
              <Bar dataKey="Cancelled" fill={COLORS.cancelled} radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Revenue by branch */}
      <Card className="bg-white dark:bg-slate-800 shadow-glass border-0 rounded-2xl">
        <CardHeader className="pb-2">
          <CardTitle className="text-base font-semibold text-clinic-navy dark:text-white">
            Revenue by Branch
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={revenueData} margin={{ top: 4, right: 16, left: 8, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" opacity={0.1} />
              <XAxis dataKey="name" fontSize={11} tick={{ fill: '#64748b' }} />
              <YAxis
                fontSize={11}
                tick={{ fill: '#64748b' }}
                tickFormatter={(v) =>
                  new Intl.NumberFormat('en-PH', {
                    notation: 'compact',
                    compactDisplay: 'short',
                  }).format(v)
                }
              />
              <Tooltip
                formatter={(v: number) => [formatCurrency(v), 'Revenue']}
                contentStyle={{
                  borderRadius: '8px',
                  border: '1px solid #e2e8f0',
                  fontSize: '12px',
                }}
              />
              <Bar dataKey="Revenue" fill={COLORS.revenue} radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Performance metrics */}
      <Card className="bg-white dark:bg-slate-800 shadow-glass border-0 rounded-2xl">
        <CardHeader className="pb-2">
          <CardTitle className="text-base font-semibold text-clinic-navy dark:text-white">
            Branch Performance
          </CardTitle>
          <p className="text-xs text-clinic-text/50 dark:text-white/50">
            Average daily appointments and completion rate (%)
          </p>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={performanceData} margin={{ top: 4, right: 16, left: 8, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" opacity={0.1} />
              <XAxis dataKey="name" fontSize={11} tick={{ fill: '#64748b' }} />
              <YAxis fontSize={11} tick={{ fill: '#64748b' }} />
              <Tooltip
                contentStyle={{
                  borderRadius: '8px',
                  border: '1px solid #e2e8f0',
                  fontSize: '12px',
                }}
                formatter={(v: number, name: string) => [
                  name === 'Completion Rate' ? `${v}%` : v.toFixed(1),
                  name,
                ]}
              />
              <Legend
                formatter={(value) => (
                  <span className="text-xs text-clinic-text/70 dark:text-white/70">{value}</span>
                )}
              />
              <Bar dataKey="Avg Daily Appts" fill={COLORS.avgDaily} radius={[4, 4, 0, 0]} />
              <Bar dataKey="Completion Rate" fill={COLORS.patients} radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  );
}
