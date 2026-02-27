'use client';

import { useMemo } from 'react';
import { format, isToday, isTomorrow, parseISO, startOfDay, endOfDay } from 'date-fns';
import { Calendar, Clock, CheckCircle, Users } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Appointment } from '@/hooks/useGetAppointments';

interface PractitionerStatsProps {
  appointments: Appointment[];
}

export function PractitionerStats({ appointments }: PractitionerStatsProps) {
  const stats = useMemo(() => {
    const today = new Date();
    const todayStr = format(today, 'yyyy-MM-dd');
    const tomorrowStr = format(new Date(today.getTime() + 24 * 60 * 60 * 1000), 'yyyy-MM-dd');

    const todayAppointments = appointments.filter(
      (apt) => apt.appointment_date === todayStr && apt.status !== 'cancelled'
    );
    const tomorrowAppointments = appointments.filter(
      (apt) => apt.appointment_date === tomorrowStr && apt.status !== 'cancelled'
    );
    const completedToday = appointments.filter(
      (apt) => apt.appointment_date === todayStr && apt.status === 'completed'
    );
    const uniquePatients = new Set(
      appointments
        .filter((apt) => apt.status !== 'cancelled')
        .map((apt) => apt.patient_id)
    ).size;

    // Find next appointment
    const now = new Date();
    const upcomingAppointments = appointments
      .filter((apt) => {
        if (apt.status === 'cancelled' || apt.status === 'completed') return false;
        const aptDate = parseISO(`${apt.appointment_date}T${apt.appointment_time}`);
        return aptDate >= now;
      })
      .sort((a, b) => {
        const dateA = parseISO(`${a.appointment_date}T${a.appointment_time}`);
        const dateB = parseISO(`${b.appointment_date}T${b.appointment_time}`);
        return dateA.getTime() - dateB.getTime();
      });

    const nextAppointment = upcomingAppointments[0];

    return {
      todayCount: todayAppointments.length,
      tomorrowCount: tomorrowAppointments.length,
      completedToday: completedToday.length,
      uniquePatients,
      nextAppointment,
    };
  }, [appointments]);

  const formatNextAppointment = () => {
    if (!stats.nextAppointment) return 'No upcoming';
    const apt = stats.nextAppointment;
    const time = apt.appointment_time.substring(0, 5);
    const [hours, minutes] = time.split(':');
    const hour = parseInt(hours, 10);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const hour12 = hour % 12 || 12;
    const formattedTime = `${hour12}:${minutes} ${ampm}`;

    if (apt.appointment_date === format(new Date(), 'yyyy-MM-dd')) {
      return `Today at ${formattedTime}`;
    }
    if (apt.appointment_date === format(new Date(Date.now() + 86400000), 'yyyy-MM-dd')) {
      return `Tomorrow at ${formattedTime}`;
    }
    return `${format(parseISO(apt.appointment_date), 'MMM d')} at ${formattedTime}`;
  };

  const statCards = [
    {
      label: "Today's Appointments",
      value: stats.todayCount,
      icon: Calendar,
      color: 'bg-blue-500',
      lightColor: 'bg-blue-100 text-blue-600',
    },
    {
      label: 'Completed Today',
      value: stats.completedToday,
      icon: CheckCircle,
      color: 'bg-green-500',
      lightColor: 'bg-green-100 text-green-600',
    },
    {
      label: 'Tomorrow',
      value: stats.tomorrowCount,
      icon: Clock,
      color: 'bg-amber-500',
      lightColor: 'bg-amber-100 text-amber-600',
    },
    {
      label: 'Total Patients',
      value: stats.uniquePatients,
      icon: Users,
      color: 'bg-purple-500',
      lightColor: 'bg-purple-100 text-purple-600',
    },
  ];

  return (
    <div className="space-y-6">
      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((stat) => (
          <Card
            key={stat.label}
            className="bg-white dark:bg-slate-800 border-clinic-navy/10 dark:border-white/10"
          >
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-clinic-text/60 dark:text-white/60">
                    {stat.label}
                  </p>
                  <p className="text-2xl font-bold text-clinic-navy dark:text-white mt-1">
                    {stat.value}
                  </p>
                </div>
                <div className={`p-3 rounded-xl ${stat.lightColor}`}>
                  <stat.icon className="w-6 h-6" />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Next Appointment Card */}
      {stats.nextAppointment && (
        <Card className="bg-gradient-to-r from-clinic-teal to-clinic-teal/80 text-white border-0">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-white/80 text-sm">Next Appointment</p>
                <p className="text-xl font-bold mt-1">
                  {stats.nextAppointment.patient?.first_name}{' '}
                  {stats.nextAppointment.patient?.last_name}
                </p>
                <p className="text-white/80 text-sm mt-1">
                  {stats.nextAppointment.service?.name || 'General Consultation'}
                </p>
              </div>
              <div className="text-right">
                <p className="text-2xl font-bold">{formatNextAppointment()}</p>
                <p className="text-white/80 text-sm mt-1">
                  {stats.nextAppointment.service?.duration_minutes || 30} minutes
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

export default PractitionerStats;
