'use client';

import { useState, useMemo } from 'react';
import {
  format,
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  addDays,
  isSameMonth,
  isSameDay,
  isToday,
  addMonths,
  subMonths,
  parseISO,
} from 'date-fns';
import {
  ChevronLeft,
  ChevronRight,
  List,
  LayoutGrid,
  Clock,
  User,
  Phone,
  Mail,
  FileText,
  Loader2,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { cn } from '@/lib/utils';
import { Appointment, APPOINTMENT_STATUSES, AppointmentStatus } from '@/hooks/useGetAppointments';

interface PractitionerAppointmentsProps {
  appointments: Appointment[];
  isLoading: boolean;
  onStatusChange: (appointmentId: string, status: AppointmentStatus) => Promise<boolean>;
  onNotesChange: (appointmentId: string, notes: string) => Promise<boolean>;
  currentMonth: Date;
  onMonthChange: (date: Date) => void;
}

const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

type ViewMode = 'calendar' | 'list';

export function PractitionerAppointments({
  appointments,
  isLoading,
  onStatusChange,
  onNotesChange,
  currentMonth,
  onMonthChange,
}: PractitionerAppointmentsProps) {
  const [viewMode, setViewMode] = useState<ViewMode>('calendar');
  const [selectedAppointment, setSelectedAppointment] = useState<Appointment | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [editingNotes, setEditingNotes] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  // Generate calendar days
  const calendarDays = useMemo(() => {
    const monthStart = startOfMonth(currentMonth);
    const monthEnd = endOfMonth(currentMonth);
    const startDate = startOfWeek(monthStart);
    const endDate = endOfWeek(monthEnd);

    const days: Date[] = [];
    let day = startDate;

    while (day <= endDate) {
      days.push(day);
      day = addDays(day, 1);
    }

    return days;
  }, [currentMonth]);

  // Group appointments by date
  const appointmentsByDate = useMemo(() => {
    const grouped: Record<string, Appointment[]> = {};

    appointments.forEach((apt) => {
      const dateKey = apt.appointment_date;
      if (!grouped[dateKey]) {
        grouped[dateKey] = [];
      }
      grouped[dateKey].push(apt);
    });

    Object.keys(grouped).forEach((dateKey) => {
      grouped[dateKey].sort((a, b) =>
        a.appointment_time.localeCompare(b.appointment_time)
      );
    });

    return grouped;
  }, [appointments]);

  // Filter appointments for list view
  const filteredAppointments = useMemo(() => {
    if (statusFilter === 'all') return appointments;
    return appointments.filter((apt) => apt.status === statusFilter);
  }, [appointments, statusFilter]);

  const formatTime = (time: string) => {
    const [hours, minutes] = time.split(':');
    const hour = parseInt(hours, 10);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const hour12 = hour % 12 || 12;
    return `${hour12}:${minutes} ${ampm}`;
  };

  const getStatusColor = (status: string) => {
    const statusConfig = APPOINTMENT_STATUSES.find((s) => s.value === status);
    return statusConfig?.color || 'bg-gray-100 text-gray-600';
  };

  const handleAppointmentClick = (apt: Appointment) => {
    setSelectedAppointment(apt);
    setEditingNotes(apt.notes || '');
    setIsDetailOpen(true);
  };

  const handleStatusUpdate = async (status: AppointmentStatus) => {
    if (!selectedAppointment) return;
    setIsSaving(true);
    const success = await onStatusChange(selectedAppointment.id, status);
    if (success) {
      setSelectedAppointment((prev) => (prev ? { ...prev, status } : null));
    }
    setIsSaving(false);
  };

  const handleNotesUpdate = async () => {
    if (!selectedAppointment) return;
    setIsSaving(true);
    const success = await onNotesChange(selectedAppointment.id, editingNotes);
    if (success) {
      setSelectedAppointment((prev) => (prev ? { ...prev, notes: editingNotes } : null));
    }
    setIsSaving(false);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-display font-bold text-clinic-navy dark:text-white">
            My Appointments
          </h2>
          <p className="text-clinic-text/60 dark:text-white/60">
            View and manage your scheduled appointments
          </p>
        </div>
        <div className="flex items-center gap-3">
          {/* Status Filter */}
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[150px]">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Statuses</SelectItem>
              {APPOINTMENT_STATUSES.map((status) => (
                <SelectItem key={status.value} value={status.value}>
                  {status.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* View Toggle */}
          <div className="flex border rounded-lg overflow-hidden">
            <Button
              variant={viewMode === 'calendar' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setViewMode('calendar')}
              className={viewMode === 'calendar' ? 'bg-clinic-teal hover:bg-clinic-teal/90' : ''}
            >
              <LayoutGrid className="w-4 h-4" />
            </Button>
            <Button
              variant={viewMode === 'list' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setViewMode('list')}
              className={viewMode === 'list' ? 'bg-clinic-teal hover:bg-clinic-teal/90' : ''}
            >
              <List className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* Content */}
      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-clinic-teal" />
        </div>
      ) : viewMode === 'calendar' ? (
        /* Calendar View */
        <Card className="bg-white dark:bg-slate-800 border-clinic-navy/10 dark:border-white/10">
          <CardHeader className="border-b border-clinic-navy/10 dark:border-white/10">
            <div className="flex items-center justify-between">
              <CardTitle className="text-xl font-display text-clinic-navy dark:text-white">
                {format(currentMonth, 'MMMM yyyy')}
              </CardTitle>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => onMonthChange(subMonths(currentMonth, 1))}
                  className="h-8 w-8"
                >
                  <ChevronLeft className="w-4 h-4" />
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onMonthChange(new Date())}
                  className="h-8"
                >
                  Today
                </Button>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => onMonthChange(addMonths(currentMonth, 1))}
                  className="h-8 w-8"
                >
                  <ChevronRight className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            {/* Weekday Headers */}
            <div className="grid grid-cols-7 border-b border-clinic-navy/10 dark:border-white/10">
              {WEEKDAYS.map((day) => (
                <div
                  key={day}
                  className="p-2 text-center text-xs font-medium text-clinic-text/60 dark:text-white/60 uppercase"
                >
                  {day}
                </div>
              ))}
            </div>

            {/* Calendar Grid */}
            <div className="grid grid-cols-7">
              {calendarDays.map((day, index) => {
                const dateKey = format(day, 'yyyy-MM-dd');
                const dayAppointments = appointmentsByDate[dateKey] || [];
                const filteredDayAppointments =
                  statusFilter === 'all'
                    ? dayAppointments
                    : dayAppointments.filter((apt) => apt.status === statusFilter);
                const isCurrentMonth = isSameMonth(day, currentMonth);
                const isTodayDate = isToday(day);

                return (
                  <div
                    key={index}
                    className={cn(
                      'min-h-[120px] border-b border-r border-clinic-navy/10 dark:border-white/10 p-1',
                      !isCurrentMonth && 'bg-clinic-navy/5 dark:bg-white/5'
                    )}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span
                        className={cn(
                          'inline-flex items-center justify-center w-7 h-7 text-sm rounded-full',
                          isTodayDate && 'bg-clinic-teal text-white font-semibold',
                          !isTodayDate && isCurrentMonth && 'text-clinic-navy dark:text-white',
                          !isCurrentMonth && 'text-clinic-text/40 dark:text-white/40'
                        )}
                      >
                        {format(day, 'd')}
                      </span>
                    </div>

                    <div className="space-y-1 overflow-hidden">
                      {filteredDayAppointments.slice(0, 3).map((apt) => (
                        <div
                          key={apt.id}
                          className={cn(
                            'px-1.5 py-0.5 rounded text-xs truncate cursor-pointer transition-opacity hover:opacity-80',
                            getStatusColor(apt.status)
                          )}
                          onClick={() => handleAppointmentClick(apt)}
                          title={`${formatTime(apt.appointment_time)} - ${apt.patient?.first_name} ${apt.patient?.last_name}`}
                        >
                          <span className="font-medium">{formatTime(apt.appointment_time)}</span>{' '}
                          {apt.patient?.first_name?.[0]}. {apt.patient?.last_name}
                        </div>
                      ))}
                      {filteredDayAppointments.length > 3 && (
                        <div className="text-xs text-clinic-text/60 dark:text-white/60 px-1.5">
                          +{filteredDayAppointments.length - 3} more
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      ) : (
        /* List View */
        <Card className="bg-white dark:bg-slate-800 border-clinic-navy/10 dark:border-white/10">
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-clinic-navy/5 dark:bg-white/5">
                  <tr>
                    <th className="px-6 py-4 text-left text-xs font-medium text-clinic-text/60 dark:text-white/60 uppercase tracking-wider">
                      Date & Time
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-medium text-clinic-text/60 dark:text-white/60 uppercase tracking-wider">
                      Patient
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-medium text-clinic-text/60 dark:text-white/60 uppercase tracking-wider">
                      Service
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-medium text-clinic-text/60 dark:text-white/60 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-4 text-right text-xs font-medium text-clinic-text/60 dark:text-white/60 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-clinic-navy/10 dark:divide-white/10">
                  {filteredAppointments.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="px-6 py-12 text-center">
                        <Clock className="w-12 h-12 text-clinic-navy/20 mx-auto mb-4" />
                        <p className="text-clinic-text/60 dark:text-white/60">
                          No appointments found
                        </p>
                      </td>
                    </tr>
                  ) : (
                    filteredAppointments.map((apt) => (
                      <tr
                        key={apt.id}
                        className="hover:bg-clinic-navy/5 dark:hover:bg-white/5 transition-colors cursor-pointer"
                        onClick={() => handleAppointmentClick(apt)}
                      >
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-clinic-navy dark:text-white">
                            {format(parseISO(apt.appointment_date), 'MMM d, yyyy')}
                          </div>
                          <div className="text-sm text-clinic-text/60 dark:text-white/60">
                            {formatTime(apt.appointment_time)}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-clinic-navy dark:text-white">
                            {apt.patient?.first_name} {apt.patient?.last_name}
                          </div>
                          <div className="text-xs text-clinic-text/50 dark:text-white/50">
                            {apt.patient?.email}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-clinic-navy dark:text-white">
                            {apt.service?.name || 'General Consultation'}
                          </div>
                          <div className="text-xs text-clinic-text/50 dark:text-white/50">
                            {apt.service?.duration_minutes || 30} min
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <Badge className={getStatusColor(apt.status)}>
                            {apt.status}
                          </Badge>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleAppointmentClick(apt);
                            }}
                          >
                            View
                          </Button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Appointment Detail Modal */}
      <Dialog open={isDetailOpen} onOpenChange={setIsDetailOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="text-clinic-navy dark:text-white">
              Appointment Details
            </DialogTitle>
          </DialogHeader>

          {selectedAppointment && (
            <div className="space-y-6">
              {/* Patient Info */}
              <div className="space-y-3">
                <h4 className="font-semibold text-clinic-navy dark:text-white flex items-center gap-2">
                  <User className="w-4 h-4" />
                  Patient Information
                </h4>
                <div className="bg-clinic-navy/5 dark:bg-white/5 rounded-lg p-4 space-y-2">
                  <p className="text-clinic-navy dark:text-white font-medium">
                    {selectedAppointment.patient?.first_name}{' '}
                    {selectedAppointment.patient?.last_name}
                  </p>
                  {selectedAppointment.patient?.email && (
                    <p className="text-sm text-clinic-text/60 dark:text-white/60 flex items-center gap-2">
                      <Mail className="w-4 h-4" />
                      {selectedAppointment.patient.email}
                    </p>
                  )}
                  {selectedAppointment.patient?.phone && (
                    <p className="text-sm text-clinic-text/60 dark:text-white/60 flex items-center gap-2">
                      <Phone className="w-4 h-4" />
                      {selectedAppointment.patient.phone}
                    </p>
                  )}
                </div>
              </div>

              {/* Appointment Info */}
              <div className="space-y-3">
                <h4 className="font-semibold text-clinic-navy dark:text-white flex items-center gap-2">
                  <Clock className="w-4 h-4" />
                  Appointment Details
                </h4>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-xs text-clinic-text/60 dark:text-white/60">Date</p>
                    <p className="text-clinic-navy dark:text-white">
                      {format(parseISO(selectedAppointment.appointment_date), 'MMMM d, yyyy')}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-clinic-text/60 dark:text-white/60">Time</p>
                    <p className="text-clinic-navy dark:text-white">
                      {formatTime(selectedAppointment.appointment_time)}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-clinic-text/60 dark:text-white/60">Service</p>
                    <p className="text-clinic-navy dark:text-white">
                      {selectedAppointment.service?.name || 'General Consultation'}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-clinic-text/60 dark:text-white/60">Duration</p>
                    <p className="text-clinic-navy dark:text-white">
                      {selectedAppointment.service?.duration_minutes || 30} minutes
                    </p>
                  </div>
                </div>
              </div>

              {/* Status Update */}
              <div className="space-y-3">
                <h4 className="font-semibold text-clinic-navy dark:text-white">
                  Update Status
                </h4>
                <Select
                  value={selectedAppointment.status}
                  onValueChange={(value) => handleStatusUpdate(value as AppointmentStatus)}
                  disabled={isSaving}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {APPOINTMENT_STATUSES.map((status) => (
                      <SelectItem key={status.value} value={status.value}>
                        <span className={cn('px-2 py-0.5 rounded text-xs', status.color)}>
                          {status.label}
                        </span>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Notes */}
              <div className="space-y-3">
                <h4 className="font-semibold text-clinic-navy dark:text-white flex items-center gap-2">
                  <FileText className="w-4 h-4" />
                  Notes
                </h4>
                <Textarea
                  value={editingNotes}
                  onChange={(e) => setEditingNotes(e.target.value)}
                  placeholder="Add notes about this appointment..."
                  rows={3}
                  className="resize-none"
                />
                <Button
                  size="sm"
                  onClick={handleNotesUpdate}
                  disabled={isSaving || editingNotes === (selectedAppointment.notes || '')}
                  className="bg-clinic-teal hover:bg-clinic-teal/90"
                >
                  {isSaving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                  Save Notes
                </Button>
              </div>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDetailOpen(false)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default PractitionerAppointments;
