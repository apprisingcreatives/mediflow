'use client';

import { useMemo, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Building2, Loader2 } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useAuth } from '@/hooks/use-auth';
import useGetAppointments, { Appointment } from '@/hooks/useGetAppointments';
import useActivityLogs from '@/hooks/useActivityLogs';
import { VisitHistoryCard } from '@/components/activity/VisitHistoryCard';
import { ActivityTimeline } from '@/components/activity/ActivityTimeline';

interface ClinicGroup {
  clinicId: string;
  clinicName: string;
  clinicAddress: string | null;
  appointments: Appointment[];
}

function groupByClinic(appointments: Appointment[]): ClinicGroup[] {
  const map = new Map<string, ClinicGroup>();

  for (const apt of appointments) {
    const clinicId = apt.clinic_id;
    const clinicName = apt.clinic?.name || 'Unknown Clinic';
    const clinicAddress = apt.clinic?.address || null;

    if (!map.has(clinicId)) {
      map.set(clinicId, { clinicId, clinicName, clinicAddress, appointments: [] });
    }
    map.get(clinicId)!.appointments.push(apt);
  }

  // Sort each clinic's appointments by date descending
  for (const group of map.values()) {
    group.appointments.sort(
      (a, b) =>
        b.appointment_date.localeCompare(a.appointment_date) ||
        b.appointment_time.localeCompare(a.appointment_time),
    );
  }

  // Sort clinics by most recent appointment first
  return Array.from(map.values()).sort(
    (a, b) =>
      b.appointments[0].appointment_date.localeCompare(a.appointments[0].appointment_date),
  );
}

export default function PatientHistoryPage() {
  const router = useRouter();
  const { patient, isLoading: authLoading } = useAuth();
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

  const clinicGroups = useMemo(() => groupByClinic(appointments), [appointments]);
  const totalVisits = useMemo(
    () => appointments.filter((a) => a.status === 'completed').length,
    [appointments],
  );

  if (authLoading || apptLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="w-8 h-8 animate-spin text-clinic-teal" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
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

        <TabsContent value="visits" className="space-y-6">
          {clinicGroups.length === 0 ? (
            <p className="text-center py-12 text-clinic-text/50 dark:text-white/50">
              No appointments yet.
            </p>
          ) : (
            clinicGroups.map((group) => (
              <div key={group.clinicId} className="space-y-3">
                <div className="flex items-center gap-2">
                  <Building2 className="w-4 h-4 text-clinic-teal" />
                  <h2 className="font-display font-semibold text-clinic-navy dark:text-white">
                    {group.clinicName}
                  </h2>
                  {group.clinicAddress && (
                    <span className="text-xs text-clinic-text/50 dark:text-white/50">
                      — {group.clinicAddress}
                    </span>
                  )}
                  <span className="ml-auto text-xs text-clinic-text/50 dark:text-white/50">
                    {group.appointments.length} visit{group.appointments.length !== 1 ? 's' : ''}
                  </span>
                </div>
                {group.appointments.map((appointment, index) => (
                  <VisitHistoryCard
                    key={appointment.id}
                    appointment={appointment}
                    perspective="patient"
                    defaultExpanded={index === 0}
                  />
                ))}
              </div>
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
  );
}
