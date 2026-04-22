'use client';

import { useState, useEffect, useCallback } from 'react';
import { useParams } from 'next/navigation';
import {
  format,
  startOfMonth,
  endOfMonth,
  addMonths,
  subMonths,
} from 'date-fns';
import axios from 'axios';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Calendar,
  Plus,
  Search,
  Filter,
  List,
  LayoutGrid,
  Loader2,
} from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useClinicContext } from '../layout';
import { AppointmentCalendar } from '@/components/appointments/AppointmentCalendar';
import {
  AppointmentFormModal,
  AppointmentFormData,
  NewPatientData,
} from '@/components/appointments/AppointmentFormModal';
import {
  useGetAppointments,
  useGetPractitioners,
  useGetServices,
  useGetPatients,
  useCreateAppointment,
  useUpdateAppointment,
  Appointment,
  APPOINTMENT_STATUSES,
  Patient,
} from '@/hooks';
import { supabase } from '@/lib/supabase';

type ViewMode = 'calendar' | 'list';

export default function AppointmentsPage() {
  const params = useParams();
  const clinicId = params.clinicId as string;
  const { clinic, isTrialExpired } = useClinicContext();

  // View state
  const [viewMode, setViewMode] = useState<ViewMode>('calendar');
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [practitionerFilter, setPractitionerFilter] = useState<string>('all');

  // Modal state
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [selectedAppointment, setSelectedAppointment] =
    useState<Appointment | null>(null);
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined);
  const [formError, setFormError] = useState<string | null>(null);

  // Hooks - Enable realtime for live updates when patients book appointments
  const {
    appointments,
    loading: appointmentsLoading,
    fetchAppointments,
    unsubscribe,
  } = useGetAppointments({ enableRealtime: true });

  const {
    practitioners,
    loading: practitionersLoading,
    fetchPractitioners,
  } = useGetPractitioners();

  const {
    services,
    loading: servicesLoading,
    fetchServices,
  } = useGetServices();

  const {
    patients,
    loading: patientsLoading,
    fetchPatients,
  } = useGetPatients();

  const {
    createAppointment,
    getAvailableTimeSlots,
    loading: createLoading,
    error: createError,
  } = useCreateAppointment();

  const {
    updateAppointment,
    rescheduleAppointment,
    cancelAppointment,
    updateStatus,
    loading: updateLoading,
    error: updateError,
  } = useUpdateAppointment();

  // Fetch data on mount
  useEffect(() => {
    if (clinicId) {
      fetchPractitioners({ clinicId, includeWorkingHours: true });
      fetchServices({ clinicId });
      fetchPatients({ clinicId });
    }
  }, [clinicId, fetchPractitioners, fetchServices, fetchPatients]);

  // Cleanup realtime subscription on unmount
  useEffect(() => {
    return () => {
      unsubscribe();
    };
  }, [unsubscribe]);

  // Fetch appointments when month changes
  useEffect(() => {
    if (clinicId) {
      const monthStart = startOfMonth(currentMonth);
      const monthEnd = endOfMonth(currentMonth);

      fetchAppointments({
        clinicId,
        startDate: format(monthStart, 'yyyy-MM-dd'),
        endDate: format(monthEnd, 'yyyy-MM-dd'),
        practitionerId:
          practitionerFilter !== 'all' ? practitionerFilter : undefined,
        status: statusFilter !== 'all' ? (statusFilter as any) : undefined,
      });
    }
  }, [
    clinicId,
    currentMonth,
    practitionerFilter,
    statusFilter,
    fetchAppointments,
  ]);

  // Handle month change
  const handleMonthChange = useCallback((date: Date) => {
    setCurrentMonth(date);
  }, []);

  // Handle date click (open new appointment form)
  const handleDateClick = useCallback((date: Date) => {
    setSelectedDate(date);
    setSelectedAppointment(null);
    setIsFormModalOpen(true);
  }, []);

  // Handle appointment click (open edit form)
  const handleAppointmentClick = useCallback((appointment: Appointment) => {
    setSelectedAppointment(appointment);
    setSelectedDate(new Date(appointment.appointment_date));
    setIsFormModalOpen(true);
  }, []);

  // Handle form submit
  const handleFormSubmit = async (data: AppointmentFormData) => {
    setFormError(null);

    try {
      if (selectedAppointment) {
        // Update existing appointment
        const service = services.find((s) => s.id === data.serviceId);
        const result = await rescheduleAppointment({
          appointmentId: selectedAppointment.id,
          practitionerId: data.practitionerId,
          serviceId: data.serviceId,
          newDate: data.appointmentDate,
          newTime: data.appointmentTime,
          durationMinutes: service?.duration_minutes || 30,
        });

        if (
          result &&
          data.status &&
          data.status !== selectedAppointment.status
        ) {
          await updateStatus(selectedAppointment.id, data.status);
        }

        if (result && data.notes !== selectedAppointment.notes) {
          await updateAppointment({
            appointmentId: selectedAppointment.id,
            notes: data.notes,
          });
        }

        toast.success('Appointment updated successfully');
      } else {
        // Create new appointment
        const result = await createAppointment({
          clinicId,
          patientId: data.patientId,
          practitionerId: data.practitionerId,
          serviceId: data.serviceId,
          appointmentDate: data.appointmentDate,
          appointmentTime: data.appointmentTime,
          notes: data.notes,
          bookedBy: 'clinic_admin',
        });

        if (!result) {
          toast.error(createError || 'Failed to create appointment');
          return;
        }

        toast.success('Appointment created successfully');
      }

      // Close modal
      setIsFormModalOpen(false);
      setSelectedAppointment(null);
      setSelectedDate(undefined);
    } catch (err) {
      console.error('Form submit error:', err);
      const message = err instanceof Error ? err.message : 'Failed to save appointment';
      setFormError(message);
      toast.error(message);
    }
  };

  // Handle invite patient
  const handleInvitePatient = async (
    data: NewPatientData,
  ): Promise<Patient | null> => {
    try {
      const { data: session } = await supabase.auth.getSession();
      if (!session.session) {
        throw new Error('Not authenticated');
      }

      const response = await axios.post(
        `/api/clinic/${clinicId}/patients/invite`,
        {
          firstName: data.firstName,
          lastName: data.lastName,
          email: data.email,
          phone: data.phone,
        },
        {
          headers: {
            Authorization: `Bearer ${session.session.access_token}`,
          },
        },
      );

      // Refresh patients list
      await fetchPatients({ clinicId });

      // Return the new patient
      return {
        id: response.data.patient.id,
        auth_user_id: null,
        email: data.email,
        first_name: data.firstName,
        last_name: data.lastName,
        phone: data.phone,
        date_of_birth: null,
        gender: null,
        address: null,
        city: null,
        is_active: false,
        onboarding_completed: false,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
    } catch (err) {
      console.error('Failed to invite patient:', err);
      if (axios.isAxiosError(err)) {
        throw new Error(
          err.response?.data?.error || 'Failed to invite patient',
        );
      }
      throw err;
    }
  };

  // Handle close modal
  const handleCloseModal = () => {
    setIsFormModalOpen(false);
    setSelectedAppointment(null);
    setSelectedDate(undefined);
    setFormError(null);
  };

  // Filter appointments for list view
  const filteredAppointments = appointments.filter((apt) => {
    if (searchQuery) {
      const search = searchQuery.toLowerCase();
      const patientName =
        `${apt.patient?.first_name} ${apt.patient?.last_name}`.toLowerCase();
      const practitionerName = apt.practitioner?.name?.toLowerCase() || '';
      const serviceName = apt.service?.name?.toLowerCase() || '';

      if (
        !patientName.includes(search) &&
        !practitionerName.includes(search) &&
        !serviceName.includes(search)
      ) {
        return false;
      }
    }
    return true;
  });

  // Format time for display
  const formatTime = (time: string) => {
    const [hours, minutes] = time.split(':');
    const hour = parseInt(hours, 10);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const hour12 = hour % 12 || 12;
    return `${hour12}:${minutes} ${ampm}`;
  };

  // Get status color
  const getStatusColor = (status: string) => {
    const statusConfig = APPOINTMENT_STATUSES.find((s) => s.value === status);
    return statusConfig?.color || 'bg-gray-100 text-gray-600';
  };

  if (isTrialExpired) {
    return (
      <div className='text-center py-12'>
        <Calendar className='w-12 h-12 text-clinic-navy/20 mx-auto mb-4' />
        <p className='text-clinic-text/60'>
          This feature is locked. Please upgrade your plan to access
          appointments.
        </p>
      </div>
    );
  }

  const isLoading =
    appointmentsLoading || practitionersLoading || servicesLoading;

  return (
    <div className='space-y-6'>
      {/* Header */}
      <div className='flex items-center justify-between'>
        <div>
          <h2 className='text-2xl font-display font-bold text-clinic-navy dark:text-white'>
            Appointments
          </h2>
          <p className='text-clinic-text/60 dark:text-white/60'>
            Manage your clinic appointments
          </p>
        </div>
        <Button
          onClick={() => {
            setSelectedAppointment(null);
            setSelectedDate(new Date());
            setIsFormModalOpen(true);
          }}
          className='bg-clinic-teal hover:bg-clinic-teal/90 text-white'
        >
          <Plus className='w-4 h-4 mr-2' />
          New Appointment
        </Button>
      </div>

      {/* Filters & View Toggle */}
      <div className='flex flex-wrap items-center gap-4'>
        {/* Search */}
        <div className='relative flex-1 min-w-[200px] max-w-md'>
          <Search className='absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-clinic-text/40' />
          <Input
            placeholder='Search appointments...'
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className='pl-10 border-clinic-navy/10'
          />
        </div>

        {/* Status Filter */}
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className='w-[150px]'>
            <Filter className='w-4 h-4 mr-2' />
            <SelectValue placeholder='Status' />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value='all'>All Statuses</SelectItem>
            {APPOINTMENT_STATUSES.map((status) => (
              <SelectItem key={status.value} value={status.value}>
                {status.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* Practitioner Filter */}
        <Select
          value={practitionerFilter}
          onValueChange={setPractitionerFilter}
        >
          <SelectTrigger className='w-[180px]'>
            <SelectValue placeholder='Practitioner' />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value='all'>All Practitioners</SelectItem>
            {practitioners.map((p) => (
              <SelectItem key={p.id} value={p.id}>
                {p.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* View Toggle */}
        <div className='flex border rounded-lg overflow-hidden'>
          <Button
            variant={viewMode === 'calendar' ? 'default' : 'ghost'}
            size='sm'
            onClick={() => setViewMode('calendar')}
            className={
              viewMode === 'calendar'
                ? 'bg-clinic-teal hover:bg-clinic-teal/90'
                : ''
            }
          >
            <LayoutGrid className='w-4 h-4' />
          </Button>
          <Button
            variant={viewMode === 'list' ? 'default' : 'ghost'}
            size='sm'
            onClick={() => setViewMode('list')}
            className={
              viewMode === 'list'
                ? 'bg-clinic-teal hover:bg-clinic-teal/90'
                : ''
            }
          >
            <List className='w-4 h-4' />
          </Button>
        </div>
      </div>

      {/* Content */}
      {isLoading ? (
        <div className='flex items-center justify-center py-12'>
          <Loader2 className='w-8 h-8 animate-spin text-clinic-teal' />
        </div>
      ) : viewMode === 'calendar' ? (
        <AppointmentCalendar
          appointments={filteredAppointments}
          currentMonth={currentMonth}
          onMonthChange={handleMonthChange}
          onDateClick={handleDateClick}
          onAppointmentClick={handleAppointmentClick}
          isLoading={appointmentsLoading}
        />
      ) : (
        /* List View */
        <div className='bg-white dark:bg-slate-800 rounded-2xl shadow-glass overflow-hidden'>
          <div className='overflow-x-auto'>
            <table className='w-full'>
              <thead className='bg-clinic-navy/5 dark:bg-white/5'>
                <tr>
                  <th className='px-6 py-4 text-left text-xs font-medium text-clinic-text/60 dark:text-white/60 uppercase tracking-wider'>
                    Date & Time
                  </th>
                  <th className='px-6 py-4 text-left text-xs font-medium text-clinic-text/60 dark:text-white/60 uppercase tracking-wider'>
                    Patient
                  </th>
                  <th className='px-6 py-4 text-left text-xs font-medium text-clinic-text/60 dark:text-white/60 uppercase tracking-wider'>
                    Practitioner
                  </th>
                  <th className='px-6 py-4 text-left text-xs font-medium text-clinic-text/60 dark:text-white/60 uppercase tracking-wider'>
                    Service
                  </th>
                  <th className='px-6 py-4 text-left text-xs font-medium text-clinic-text/60 dark:text-white/60 uppercase tracking-wider'>
                    Status
                  </th>
                  <th className='px-6 py-4 text-right text-xs font-medium text-clinic-text/60 dark:text-white/60 uppercase tracking-wider'>
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className='divide-y divide-clinic-navy/10 dark:divide-white/10'>
                {filteredAppointments.length === 0 ? (
                  <tr>
                    <td colSpan={6} className='px-6 py-12 text-center'>
                      <Calendar className='w-12 h-12 text-clinic-navy/20 mx-auto mb-4' />
                      <p className='text-clinic-text/60 dark:text-white/60'>
                        No appointments found
                      </p>
                    </td>
                  </tr>
                ) : (
                  filteredAppointments.map((apt) => (
                    <tr
                      key={apt.id}
                      className='hover:bg-clinic-navy/5 dark:hover:bg-white/5 transition-colors cursor-pointer'
                      onClick={() => handleAppointmentClick(apt)}
                    >
                      <td className='px-6 py-4 whitespace-nowrap'>
                        <div className='text-sm font-medium text-clinic-navy dark:text-white'>
                          {format(
                            new Date(apt.appointment_date),
                            'MMM d, yyyy',
                          )}
                        </div>
                        <div className='text-sm text-clinic-text/60 dark:text-white/60'>
                          {formatTime(apt.appointment_time)}
                        </div>
                      </td>
                      <td className='px-6 py-4 whitespace-nowrap'>
                        <div className='text-sm text-clinic-navy dark:text-white'>
                          {apt.patient?.first_name} {apt.patient?.last_name}
                        </div>
                        <div className='text-xs text-clinic-text/50 dark:text-white/50'>
                          {apt.patient?.email}
                        </div>
                      </td>
                      <td className='px-6 py-4 whitespace-nowrap'>
                        <div className='text-sm text-clinic-navy dark:text-white'>
                          {apt.practitioner?.name}
                        </div>
                        {apt.practitioner?.specialization && (
                          <div className='text-xs text-clinic-text/50 dark:text-white/50'>
                            {apt.practitioner.specialization}
                          </div>
                        )}
                      </td>
                      <td className='px-6 py-4 whitespace-nowrap'>
                        <div className='text-sm text-clinic-navy dark:text-white'>
                          {apt.service?.name}
                        </div>
                        <div className='text-xs text-clinic-text/50 dark:text-white/50'>
                          {apt.service?.duration_minutes} min
                        </div>
                      </td>
                      <td className='px-6 py-4 whitespace-nowrap'>
                        <span
                          className={`text-xs px-2 py-1 rounded-full ${getStatusColor(apt.status)}`}
                        >
                          {apt.status}
                        </span>
                      </td>
                      <td className='px-6 py-4 whitespace-nowrap text-right'>
                        <Button
                          variant='ghost'
                          size='sm'
                          onClick={(e) => {
                            e.stopPropagation();
                            handleAppointmentClick(apt);
                          }}
                        >
                          Edit
                        </Button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Appointment Form Modal */}
      <AppointmentFormModal
        isOpen={isFormModalOpen}
        onClose={handleCloseModal}
        onSubmit={handleFormSubmit}
        appointment={selectedAppointment}
        practitioners={practitioners}
        services={services}
        patients={patients}
        getAvailableTimeSlots={getAvailableTimeSlots}
        onInvitePatient={handleInvitePatient}
        initialDate={selectedDate}
        isLoading={createLoading || updateLoading}
        error={formError || createError || updateError}
      />
    </div>
  );
}
