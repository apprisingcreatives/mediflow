'use client';

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
} from 'recharts';
import { MapPin } from 'lucide-react';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import type { DemographicsData } from '@/hooks/useAdvancedAnalytics';

const PIE_COLORS = ['#0d9488', '#6366f1', '#f59e0b', '#94a3b8'];

interface DemographicsChartsProps {
  demographics: DemographicsData;
}

export function DemographicsCharts({ demographics }: DemographicsChartsProps) {
  const { age_groups, genders, cities } = demographics;

  const maxCityCount = cities.length > 0
    ? Math.max(...cities.map((c) => c.count))
    : 1;

  return (
    <div className="space-y-6">
      <div className="grid lg:grid-cols-2 gap-6">
        {/* Age Distribution */}
        <Card className="bg-white dark:bg-slate-800 shadow-glass border-0 rounded-2xl">
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-semibold text-clinic-navy dark:text-white">
              Age Distribution
            </CardTitle>
          </CardHeader>
          <CardContent>
            {age_groups.length === 0 ? (
              <p className="text-sm text-clinic-text/50 dark:text-white/50 py-8 text-center">
                No age data available
              </p>
            ) : (
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={age_groups} margin={{ top: 4, right: 8, left: -16, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" opacity={0.1} />
                  <XAxis
                    dataKey="group"
                    fontSize={11}
                    tick={{ fill: '#64748b' }}
                  />
                  <YAxis fontSize={11} tick={{ fill: '#64748b' }} />
                  <Tooltip
                    formatter={(v: number) => [v, 'Patients']}
                    contentStyle={{
                      borderRadius: '8px',
                      border: '1px solid #e2e8f0',
                      fontSize: '12px',
                    }}
                  />
                  <Bar dataKey="count" fill="#0d9488" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        {/* Gender Distribution */}
        <Card className="bg-white dark:bg-slate-800 shadow-glass border-0 rounded-2xl">
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-semibold text-clinic-navy dark:text-white">
              Gender Distribution
            </CardTitle>
          </CardHeader>
          <CardContent>
            {genders.length === 0 ? (
              <p className="text-sm text-clinic-text/50 dark:text-white/50 py-8 text-center">
                No gender data available
              </p>
            ) : (
              <ResponsiveContainer width="100%" height={220}>
                <PieChart>
                  <Pie
                    data={genders}
                    dataKey="count"
                    nameKey="gender"
                    cx="50%"
                    cy="50%"
                    outerRadius={80}
                    label={({ gender, percent }) =>
                      `${gender} ${(percent * 100).toFixed(0)}%`
                    }
                    labelLine={false}
                  >
                    {genders.map((_, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={PIE_COLORS[index % PIE_COLORS.length]}
                      />
                    ))}
                  </Pie>
                  <Legend
                    formatter={(value) => (
                      <span className="text-xs text-clinic-text/70 dark:text-white/70">
                        {value}
                      </span>
                    )}
                  />
                  <Tooltip
                    formatter={(v: number, name: string) => [v, name]}
                    contentStyle={{
                      borderRadius: '8px',
                      border: '1px solid #e2e8f0',
                      fontSize: '12px',
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Top Cities */}
      <Card className="bg-white dark:bg-slate-800 shadow-glass border-0 rounded-2xl">
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 text-base font-semibold text-clinic-navy dark:text-white">
            <MapPin className="w-4 h-4 text-clinic-teal" />
            Patient Locations
          </CardTitle>
        </CardHeader>
        <CardContent>
          {cities.length === 0 ? (
            <p className="text-sm text-clinic-text/50 dark:text-white/50 py-4 text-center">
              No location data available
            </p>
          ) : (
            <div className="space-y-3">
              {cities.slice(0, 10).map((city, index) => {
                const barWidth = Math.round((city.count / maxCityCount) * 100);
                return (
                  <div key={city.city} className="flex items-center gap-3">
                    <span className="w-5 text-xs font-medium text-clinic-text/40 dark:text-white/40 text-right flex-shrink-0">
                      {index + 1}
                    </span>
                    <span className="w-32 text-sm font-medium text-clinic-navy dark:text-white truncate flex-shrink-0">
                      {city.city}
                    </span>
                    <div className="flex-1 h-2 bg-clinic-navy/5 dark:bg-white/5 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-clinic-teal rounded-full transition-all duration-500"
                        style={{ width: `${barWidth}%` }}
                      />
                    </div>
                    <span className="w-10 text-xs text-clinic-text/60 dark:text-white/60 text-right flex-shrink-0">
                      {city.count}
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
