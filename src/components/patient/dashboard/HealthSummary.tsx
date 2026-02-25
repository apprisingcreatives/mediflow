'use client';

import { ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { PatientInfo } from './types';
import { getHealthSummary } from './utils';

interface HealthSummaryProps {
  patient: PatientInfo | null;
}

export function HealthSummary({ patient }: HealthSummaryProps) {
  const metrics = getHealthSummary(patient);

  return (
    <Card className="border-0 shadow-glass">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="font-display text-lg font-semibold text-clinic-navy dark:text-white">
          Health Summary
        </CardTitle>
        <Button variant="ghost" size="sm" className="text-clinic-teal">
          View Full History
          <ChevronRight className="w-4 h-4 ml-1" />
        </Button>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {metrics.map((metric) => (
            <div
              key={metric.label}
              className="p-4 rounded-xl bg-clinic-bg/50 dark:bg-slate-700/50"
            >
              <p className="text-xs text-clinic-text/60 dark:text-white/60 mb-1">
                {metric.label}
              </p>
              <p className="text-xl font-display font-bold text-clinic-navy dark:text-white mb-1">
                {metric.value}
              </p>
              <div className="flex items-center gap-1">
                <span
                  className={cn(
                    'w-2 h-2 rounded-full',
                    metric.status === 'normal'
                      ? 'bg-clinic-teal'
                      : metric.status === 'attention'
                        ? 'bg-amber-500'
                        : 'bg-gray-300'
                  )}
                />
                {metric.date && (
                  <span className="text-xs text-clinic-text/50 dark:text-white/50">
                    {metric.date}
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

export default HealthSummary;
