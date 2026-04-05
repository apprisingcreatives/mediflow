'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2 } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useAuth } from '@/hooks/use-auth';
import useGetAppointments from '@/hooks/useGetAppointments';
import useActivityLogs from '@/hooks/useActivityLogs';
import { VisitHistoryCard } from '@/components/activity/VisitHistoryCard';
import { ActivityTimeline } from '@/components/activity/ActivityTimeline';

export default function PatientHistoryPage() {
  const router = useRouter();
  const { user, patient, isLoading: authLoading } = useAuth();
  const { appointments, loading: apptLoading, fetchAppointments } = useGetAppointments();
  const { logs, loading: logsLoading, fetchLogs } = useActivityLogs();

  useEffect(() => {
    if (!authLoading && !patient) {
      router.push('/');
      return;
    }
    if (patient) {
      fetchAppointments({ patientId: patient.id });
      fetchLogs({ patientId: patient.id });
    }
  }, [patient, authLoading, router, fetchAppointments, fetchLogs]);

  if (authLoading || apptLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-8 h-8 animate-spin text-clinic-teal" />
      </div>
    );
  }

  const pastAppointments = [...appointments]
    .sort((a, b) => b.appointment_date.localeCompare(a.appointment_date) || b.appointment_time.localeCompare(a.appointment_time));

  const totalVisits = appointments.filter((a) => a.status === 'completed').length;

  return (
    <div className="min-h-screen bg-clinic-bg dark:bg-slate-900">
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="flex items-center gap-4 mb-6">
          <div>
            <h1 className="text-xl font-display font-bold text-clinic-navy dark:text-white">
              My History
            </h1>
            <p className="text-sm text-clinic-text/60 dark:text-white/60">
              Your past visits and activity
            </p>
          </div>
          <div className="ml-auto">
            <span className="bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400 px-3 py-1 rounded-full text-xs font-medium">
              {totalVisits} completed visits
            </span>
          </div>
        </div>

        <Tabs defaultValue="visits">
          <TabsList className="mb-6">
            <TabsTrigger value="visits">Visit History</TabsTrigger>
            <TabsTrigger value="activity">Activity Log</TabsTrigger>
          </TabsList>

          <TabsContent value="visits" className="space-y-3">
            {pastAppointments.length === 0 ? (
              <p className="text-center py-12 text-clinic-text/50 dark:text-white/50">
                No appointments yet.
              </p>
            ) : (
              pastAppointments.map((appointment, index) => (
                <VisitHistoryCard
                  key={appointment.id}
                  appointment={appointment}
                  perspective="patient"
                  defaultExpanded={index === 0}
                />
              ))
            )}
          </TabsContent>

          <TabsContent value="activity">
            {logsLoading ? (
              <div className="flex justify-center py-12">
                <Loader2 className="w-6 h-6 animate-spin text-clinic-teal" />
              </div>
            ) : (
              <div className="bg-white dark:bg-slate-800 rounded-xl p-6 shadow-sm">
                <ActivityTimeline logs={logs} perspective="patient" />
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
