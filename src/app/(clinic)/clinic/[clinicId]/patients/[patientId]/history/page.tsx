'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft, Loader2, Mail, Phone } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { supabase } from '@/lib/supabase';
import { Appointment } from '@/hooks/useGetAppointments';
import { ActivityLog } from '@/hooks/useActivityLogs';
import { VisitHistoryCard } from '@/components/activity/VisitHistoryCard';
import { ActivityTimeline } from '@/components/activity/ActivityTimeline';
import { useClinicContext } from '../../../../layout';

interface PatientInfo {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  phone: string | null;
}

export default function PatientHistoryPage() {
  const params = useParams();
  const router = useRouter();
  const { clinicId } = useClinicContext();
  const patientId = params.patientId as string;

  const [patient, setPatient] = useState<PatientInfo | null>(null);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [logs, setLogs] = useState<ActivityLog[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!patientId || !clinicId) return;

    const fetchData = async () => {
      setLoading(true);

      const { data: patientData } = await supabase
        .from('patients')
        .select('id, first_name, last_name, email, phone')
        .eq('id', patientId)
        .single();

      setPatient(patientData);

      const { data: apptData } = await supabase
        .from('appointments')
        .select(`
          *,
          patient:patients (id, first_name, last_name, email, phone),
          practitioner:practitioners (id, name, specialization),
          service:clinic_services (id, name, duration_minutes, price),
          clinic:clinics (id, name, address)
        `)
        .eq('patient_id', patientId)
        .eq('clinic_id', clinicId)
        .order('appointment_date', { ascending: false })
        .order('appointment_time', { ascending: false });

      setAppointments((apptData as Appointment[]) ?? []);

      const { data: logData } = await supabase
        .from('activity_logs')
        .select('*')
        .eq('patient_id', patientId)
        .eq('clinic_id', clinicId)
        .order('created_at', { ascending: false });

      setLogs((logData as ActivityLog[]) ?? []);
      setLoading(false);
    };

    fetchData();
  }, [patientId, clinicId]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <Loader2 className="w-8 h-8 animate-spin text-clinic-teal" />
      </div>
    );
  }

  if (!patient) {
    return (
      <div className="text-center py-24 text-clinic-text/50 dark:text-white/50">
        Patient not found.
      </div>
    );
  }

  const patientName = `${patient.first_name} ${patient.last_name}`;
  const initials = `${patient.first_name[0]}${patient.last_name[0]}`;
  const totalVisits = appointments.filter((a) => a.status === 'completed').length;
  const lastVisit = appointments.find((a) => a.status === 'completed');

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <Button
        variant="ghost"
        size="sm"
        className="mb-4"
        onClick={() => router.push(`/clinic/${clinicId}/patients`)}
      >
        <ArrowLeft className="w-4 h-4 mr-1" />
        Back to Patients
      </Button>

      <div className="flex items-center gap-4 mb-6 pb-4 border-b border-clinic-navy/10 dark:border-white/10">
        <Avatar className="w-12 h-12">
          <AvatarFallback className="bg-clinic-teal text-white font-semibold">
            {initials}
          </AvatarFallback>
        </Avatar>
        <div className="min-w-0">
          <h1 className="text-lg font-display font-bold text-clinic-navy dark:text-white">
            {patientName}
          </h1>
          <div className="flex items-center gap-4 text-sm text-clinic-text/60 dark:text-white/60">
            <span className="flex items-center gap-1">
              <Mail className="w-3.5 h-3.5" /> {patient.email}
            </span>
            {patient.phone && (
              <span className="flex items-center gap-1">
                <Phone className="w-3.5 h-3.5" /> {patient.phone}
              </span>
            )}
          </div>
        </div>
        <div className="ml-auto flex gap-2 shrink-0">
          <span className="bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400 px-3 py-1 rounded-full text-xs font-medium">
            {totalVisits} visits
          </span>
          {lastVisit && (
            <span className="bg-green-50 text-green-700 dark:bg-green-900/30 dark:text-green-400 px-3 py-1 rounded-full text-xs font-medium">
              Last: {lastVisit.appointment_date}
            </span>
          )}
        </div>
      </div>

      <Tabs defaultValue="visits">
        <TabsList className="mb-6">
          <TabsTrigger value="visits">Visit History</TabsTrigger>
          <TabsTrigger value="activity">Activity Log</TabsTrigger>
        </TabsList>

        <TabsContent value="visits" className="space-y-3">
          {appointments.length === 0 ? (
            <p className="text-center py-12 text-clinic-text/50 dark:text-white/50">
              No appointments found for this patient at this clinic.
            </p>
          ) : (
            appointments.map((appointment, index) => (
              <VisitHistoryCard
                key={appointment.id}
                appointment={appointment}
                perspective="clinic_admin"
                patientName={patientName}
                defaultExpanded={index === 0}
              />
            ))
          )}
        </TabsContent>

        <TabsContent value="activity">
          <div className="bg-white dark:bg-slate-800 rounded-xl p-6 shadow-sm">
            <ActivityTimeline logs={logs} perspective="clinic_admin" patientName={patientName} />
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
