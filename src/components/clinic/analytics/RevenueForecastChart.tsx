'use client';

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Area,
  Legend,
} from 'recharts';
import { Info } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import type { RevenueForecastPoint } from '@/types/database';

const formatCurrency = (value: number) =>
  new Intl.NumberFormat('en-PH', { style: 'currency', currency: 'PHP', maximumFractionDigits: 0 }).format(value);

interface RevenueForecastChartProps {
  revenueForecast: RevenueForecastPoint[];
  hasEnoughData: boolean;
}

export function RevenueForecastChart({
  revenueForecast,
  hasEnoughData,
}: RevenueForecastChartProps) {
  const historicalData = revenueForecast.filter((d) => !d.is_forecast);
  const forecastData = revenueForecast.filter((d) => d.is_forecast);

  // Build chart data: the last historical point is also set on the forecast key
  // so the two Area lines connect visually at the transition point.
  const displayData = revenueForecast.map((d, i) => {
    const nextIsForecast =
      i < revenueForecast.length - 1 ? revenueForecast[i + 1].is_forecast : false;
    return {
      month: d.month_label,
      historical: !d.is_forecast ? d.revenue : undefined,
      forecast: d.is_forecast
        ? d.revenue
        : nextIsForecast
        ? d.revenue   // bridge: carry last historical value into forecast line
        : undefined,
    };
  });

  return (
    <div className="space-y-6">
      {!hasEnoughData && (
        <div className="flex items-start gap-3 p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl">
          <Info className="w-5 h-5 text-blue-500 flex-shrink-0 mt-0.5" />
          <p className="text-sm text-blue-700 dark:text-blue-300">
            Need at least 2 months of data for forecasting. Showing historical revenue only.
          </p>
        </div>
      )}

      <Card className="bg-white dark:bg-slate-800 shadow-glass border-0 rounded-2xl">
        <CardHeader className="pb-2">
          <CardTitle className="text-base font-semibold text-clinic-navy dark:text-white">
            Revenue Trend & Forecast
          </CardTitle>
          <p className="text-xs text-clinic-text/50 dark:text-white/50">
            Solid line: historical revenue — Dashed line: AI-generated forecast
          </p>
        </CardHeader>
        <CardContent>
          {revenueForecast.length === 0 ? (
            <p className="text-sm text-clinic-text/50 dark:text-white/50 py-8 text-center">
              No revenue data available
            </p>
          ) : (
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={displayData} margin={{ top: 4, right: 16, left: 8, bottom: 0 }}>
                <defs>
                  <linearGradient id="historicalGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#0d9488" stopOpacity={0.15} />
                    <stop offset="95%" stopColor="#0d9488" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="forecastGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#6366f1" stopOpacity={0.08} />
                    <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" opacity={0.1} />
                <XAxis
                  dataKey="month"
                  fontSize={11}
                  tick={{ fill: '#64748b' }}
                />
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
                  formatter={(v: number, name: string) => [
                    formatCurrency(v),
                    name === 'historical' ? 'Historical Revenue' : 'Forecast Revenue',
                  ]}
                  contentStyle={{
                    borderRadius: '8px',
                    border: '1px solid #e2e8f0',
                    fontSize: '12px',
                  }}
                />
                <Legend
                  formatter={(value) => (
                    <span className="text-xs text-clinic-text/70 dark:text-white/70">
                      {value === 'historical' ? 'Historical' : 'Forecast'}
                    </span>
                  )}
                />
                {/* Historical — solid line with area fill */}
                <Area
                  type="monotone"
                  dataKey="historical"
                  stroke="#0d9488"
                  strokeWidth={2.5}
                  fill="url(#historicalGradient)"
                  dot={false}
                  connectNulls={false}
                  name="historical"
                />
                {/* Forecast — dashed line with lighter area fill */}
                <Area
                  type="monotone"
                  dataKey="forecast"
                  stroke="#6366f1"
                  strokeWidth={2}
                  strokeDasharray="6 3"
                  fill="url(#forecastGradient)"
                  dot={false}
                  connectNulls={false}
                  name="forecast"
                />
              </LineChart>
            </ResponsiveContainer>
          )}
        </CardContent>
      </Card>

      {/* Summary row */}
      {revenueForecast.length > 0 && (
        <div className="grid sm:grid-cols-3 gap-4">
          <div className="p-4 bg-white dark:bg-slate-800 rounded-2xl shadow-glass">
            <p className="text-xs text-clinic-text/60 dark:text-white/60 mb-1">Historical Months</p>
            <p className="text-2xl font-display font-bold text-clinic-navy dark:text-white">
              {historicalData.length}
            </p>
          </div>
          <div className="p-4 bg-white dark:bg-slate-800 rounded-2xl shadow-glass">
            <p className="text-xs text-clinic-text/60 dark:text-white/60 mb-1">Forecasted Months</p>
            <p className="text-2xl font-display font-bold text-clinic-navy dark:text-white">
              {forecastData.length}
            </p>
          </div>
          <div className="p-4 bg-white dark:bg-slate-800 rounded-2xl shadow-glass">
            <p className="text-xs text-clinic-text/60 dark:text-white/60 mb-1">Projected Revenue</p>
            <p className="text-2xl font-display font-bold text-clinic-teal">
              {formatCurrency(forecastData.reduce((sum, d) => sum + d.revenue, 0))}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
