'use client';

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import type { ServicePopularity } from '@/types/database';

const formatCurrency = (value: number) =>
  new Intl.NumberFormat('en-PH', { style: 'currency', currency: 'PHP' }).format(value);

interface ServiceTrendsChartProps {
  serviceTrends: ServicePopularity[];
}

export function ServiceTrendsChart({ serviceTrends }: ServiceTrendsChartProps) {
  const sorted = [...serviceTrends].sort((a, b) => b.booking_count - a.booking_count);
  const top10 = sorted.slice(0, 10);

  return (
    <div className="space-y-6">
      {/* Bar Chart — top 10 by bookings */}
      <Card className="bg-white dark:bg-slate-800 shadow-glass border-0 rounded-2xl">
        <CardHeader className="pb-2">
          <CardTitle className="text-base font-semibold text-clinic-navy dark:text-white">
            Top Services by Bookings
          </CardTitle>
        </CardHeader>
        <CardContent>
          {top10.length === 0 ? (
            <p className="text-sm text-clinic-text/50 dark:text-white/50 py-8 text-center">
              No service data available
            </p>
          ) : (
            <ResponsiveContainer width="100%" height={240}>
              <BarChart
                data={top10}
                margin={{ top: 4, right: 8, left: -16, bottom: 40 }}
              >
                <CartesianGrid strokeDasharray="3 3" opacity={0.1} />
                <XAxis
                  dataKey="service_name"
                  fontSize={10}
                  tick={{ fill: '#64748b' }}
                  angle={-35}
                  textAnchor="end"
                  interval={0}
                />
                <YAxis fontSize={11} tick={{ fill: '#64748b' }} />
                <Tooltip
                  formatter={(v: number) => [v, 'Bookings']}
                  contentStyle={{
                    borderRadius: '8px',
                    border: '1px solid #e2e8f0',
                    fontSize: '12px',
                  }}
                />
                <Bar dataKey="booking_count" fill="#0d9488" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </CardContent>
      </Card>

      {/* Service Performance Table */}
      <Card className="bg-white dark:bg-slate-800 shadow-glass border-0 rounded-2xl overflow-hidden">
        <CardHeader className="pb-2">
          <CardTitle className="text-base font-semibold text-clinic-navy dark:text-white">
            Service Performance
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {sorted.length === 0 ? (
            <p className="text-sm text-clinic-text/50 dark:text-white/50 py-8 text-center">
              No service data available
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-clinic-navy/5 dark:bg-white/5">
                  <tr>
                    <th className="px-5 py-3 text-left text-xs font-medium text-clinic-text/60 dark:text-white/60 uppercase tracking-wide">
                      Service
                    </th>
                    <th className="px-5 py-3 text-right text-xs font-medium text-clinic-text/60 dark:text-white/60 uppercase tracking-wide">
                      Bookings
                    </th>
                    <th className="px-5 py-3 text-right text-xs font-medium text-clinic-text/60 dark:text-white/60 uppercase tracking-wide">
                      Completed
                    </th>
                    <th className="px-5 py-3 text-right text-xs font-medium text-clinic-text/60 dark:text-white/60 uppercase tracking-wide">
                      Completion %
                    </th>
                    <th className="px-5 py-3 text-right text-xs font-medium text-clinic-text/60 dark:text-white/60 uppercase tracking-wide">
                      Revenue
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-clinic-navy/10 dark:divide-white/10">
                  {sorted.map((service, index) => (
                    <tr
                      key={service.service_id}
                      className={
                        index < 3
                          ? 'bg-clinic-teal/5 dark:bg-clinic-teal/10 hover:bg-clinic-teal/10 dark:hover:bg-clinic-teal/15'
                          : 'hover:bg-clinic-navy/5 dark:hover:bg-white/5'
                      }
                    >
                      <td className="px-5 py-3 text-sm font-medium text-clinic-navy dark:text-white">
                        <div className="flex items-center gap-2">
                          {index < 3 && (
                            <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-clinic-teal text-white text-xs font-bold flex-shrink-0">
                              {index + 1}
                            </span>
                          )}
                          {service.service_name}
                        </div>
                      </td>
                      <td className="px-5 py-3 text-sm text-right text-clinic-navy dark:text-white">
                        {service.booking_count}
                      </td>
                      <td className="px-5 py-3 text-sm text-right text-clinic-navy dark:text-white">
                        {service.completed_count}
                      </td>
                      <td className="px-5 py-3 text-sm text-right">
                        <span
                          className={
                            service.completion_rate >= 80
                              ? 'text-green-600'
                              : service.completion_rate >= 50
                              ? 'text-amber-600'
                              : 'text-red-600'
                          }
                        >
                          {service.completion_rate.toFixed(1)}%
                        </span>
                      </td>
                      <td className="px-5 py-3 text-sm text-right text-clinic-navy dark:text-white">
                        {formatCurrency(service.revenue)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
