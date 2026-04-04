'use client';

import { format, parseISO } from 'date-fns';
import { ChevronRight } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { Appointment } from '@/hooks/useGetAppointments';

interface RecentVisitsCardProps {
  appointments: Appointment[];
  loading: boolean;
  maxDisplay?: number;
}

function getStatusColor(status: string): string {
  const colors: Record<string, string> = {
    completed: 'bg-green-100 text-green-700',
    cancelled: 'bg-red-100 text-red-700',
    'no-show': 'bg-gray-100 text-gray-600',
  };
  return colors[status] || 'bg-gray-100 text-gray-600';
}

export function RecentVisitsCard({ appointments, loading, maxDisplay = 3 }: RecentVisitsCardProps) {
  const router = useRouter();

  const pastAppointments = appointments
    .filter((a) => ['completed', 'cancelled', 'no-show'].includes(a.status))
    .sort((a, b) => b.appointment_date.localeCompare(a.appointment_date))
    .slice(0, maxDisplay);

  if (loading || pastAppointments.length === 0) return null;

  return (
    <Card className="border-0 shadow-glass">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="font-display text-lg font-semibold text-clinic-navy dark:text-white">
          Recent Visits
        </CardTitle>
        <Button
          variant="ghost"
          size="sm"
          className="text-clinic-teal"
          onClick={() => router.push('/patient/history')}
        >
          View All
          <ChevronRight className="w-4 h-4 ml-1" />
        </Button>
      </CardHeader>
      <CardContent className="space-y-1">
        {pastAppointments.map((appointment) => (
          <div
            key={appointment.id}
            className="flex items-center justify-between py-2 border-b last:border-0 border-clinic-navy/5 dark:border-white/5"
          >
            <div className="flex items-center gap-2 text-sm min-w-0">
              <span className="font-medium text-clinic-navy dark:text-white shrink-0">
                {format(parseISO(appointment.appointment_date), 'MMM d')}
              </span>
              <span className="text-clinic-text/60 dark:text-white/60 truncate">
                — {appointment.practitioner?.name || 'Doctor'} — {appointment.service?.name || 'Visit'}
              </span>
            </div>
            <Badge variant="outline" className={cn('text-xs shrink-0 ml-2', getStatusColor(appointment.status))}>
              {appointment.status}
            </Badge>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
