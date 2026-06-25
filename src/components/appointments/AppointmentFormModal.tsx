"use client";

import { useState, useEffect, useMemo } from "react";
import { format } from "date-fns";
import { CalendarIcon, Clock, Loader2, UserPlus, Search, MapPin } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import {
  Appointment,
  AppointmentStatus,
  APPOINTMENT_STATUSES,
} from "@/hooks/useGetAppointments";
import { AppointmentActions } from "./AppointmentActions";
import { Practitioner } from "@/hooks/useGetPractitioners";
import { ClinicService } from "@/hooks/useGetServices";
import { Patient } from "@/hooks/useGetPatients";
import useGetTimeSlots from "@/hooks/useGetTimeSlots";
import type { Branch } from "@/types/database";

const MANILA_TZ = "Asia/Manila";

const getStatusColor = (status: string): string => {
  const statusConfig = APPOINTMENT_STATUSES.find((s) => s.value === status);
  return statusConfig?.color || "bg-gray-100 text-gray-600";
};

interface TimeSlot {
  time_slot: string;
  is_available: boolean;
}

interface AppointmentFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: AppointmentFormData) => Promise<void>;
  appointment?: Appointment | null; // For editing
  practitioners: Practitioner[];
  services: ClinicService[];
  patients: Patient[];
  branches?: Branch[];
  activeBranchId?: string | null;
  onBranchChange?: (branchId: string | null) => void;
  getAvailableTimeSlots: (
    practitionerId: string,
    date: string,
    durationMinutes: number,
    excludeAppointmentId?: string,
  ) => Promise<TimeSlot[]>;
  onInvitePatient: (data: NewPatientData) => Promise<Patient | null>;
  initialDate?: Date;
  isLoading?: boolean;
  error?: string | null;
}

export interface AppointmentFormData {
  patientId: string;
  practitionerId: string;
  serviceId: string;
  appointmentDate: string;
  appointmentTime: string;
  notes?: string;
  status?: AppointmentStatus;
}

export interface NewPatientData {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
}

type FormMode = "create" | "edit";
type PatientMode = "existing" | "new";

export function AppointmentFormModal({
  isOpen,
  onClose,
  onSubmit,
  appointment,
  practitioners,
  services,
  patients,
  branches,
  activeBranchId,
  onBranchChange,
  getAvailableTimeSlots,
  onInvitePatient,
  initialDate,
  isLoading = false,
  error,
}: AppointmentFormModalProps) {
  const showBranchSelector = branches && branches.length > 1 && onBranchChange;
  const mode: FormMode = appointment ? "edit" : "create";
  const [patientMode, setPatientMode] = useState<PatientMode>("existing");
  const [patientSearch, setPatientSearch] = useState("");

  // Form state
  const [selectedPatientId, setSelectedPatientId] = useState("");
  const [selectedPractitionerId, setSelectedPractitionerId] = useState("");
  const [selectedServiceId, setSelectedServiceId] = useState("");
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(
    initialDate || new Date(),
  );
  const [selectedTime, setSelectedTime] = useState("");
  const [notes, setNotes] = useState("");

  // New patient form state
  const [newPatient, setNewPatient] = useState<NewPatientData>({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
  });

  // Get selected service duration
  const selectedService = useMemo(() => {
    return services.find((s) => s.id === selectedServiceId);
  }, [services, selectedServiceId]);

  // Time slots (via hook)
  const { timeSlots, loading: loadingTimeSlots } = useGetTimeSlots({
    practitionerId: selectedPractitionerId,
    date: selectedDate,
    service: selectedService,
    selectedTime,
    mode,
    appointmentId: appointment?.id,
    getAvailableTimeSlots,
    onSelectedTimeUnavailable: () => setSelectedTime(""),
  });

  // Inviting patient state
  const [invitingPatient, setInvitingPatient] = useState(false);

  // Clear dependent selections when branch changes
  useEffect(() => {
    if (!appointment) {
      setSelectedPractitionerId("");
      setSelectedServiceId("");
      setSelectedTime("");
    }
  }, [activeBranchId, appointment]);

  // Initialize form when editing
  useEffect(() => {
    if (appointment) {
      setSelectedPatientId(appointment.patient_id || "");
      setSelectedPractitionerId(appointment.practitioner_id || "");
      setSelectedServiceId(appointment.service_id || "");
      setSelectedDate(new Date(appointment.appointment_date));
      setSelectedTime(appointment.appointment_time);
      setNotes(appointment.notes || "");
      setPatientMode("existing");
    } else {
      // Reset form for new appointment
      setSelectedPatientId("");
      setSelectedPractitionerId("");
      setSelectedServiceId("");
      setSelectedDate(initialDate || new Date());
      setSelectedTime("");
      setNotes("");
      setPatientMode("existing");
      setNewPatient({ firstName: "", lastName: "", email: "", phone: "" });
    }
  }, [appointment, initialDate, isOpen]);

  // Filter patients based on search
  const filteredPatients = useMemo(() => {
    if (!patientSearch.trim()) return patients;

    const search = patientSearch.toLowerCase();
    return patients.filter(
      (p) =>
        p.first_name.toLowerCase().includes(search) ||
        p.last_name.toLowerCase().includes(search) ||
        p.email.toLowerCase().includes(search) ||
        p.phone?.includes(search),
    );
  }, [patients, patientSearch]);

  // (Hook handles fetching time slots and clearing selected time if unavailable)

  const handleInviteNewPatient = async () => {
    if (
      !newPatient.firstName ||
      !newPatient.lastName ||
      !newPatient.email ||
      !newPatient.phone
    ) {
      return;
    }

    setInvitingPatient(true);
    try {
      const patient = await onInvitePatient(newPatient);
      if (patient) {
        setSelectedPatientId(patient.id);
        setPatientMode("existing");
        setNewPatient({ firstName: "", lastName: "", email: "", phone: "" });
      }
    } catch (err) {
      console.error("Failed to invite patient:", err);
    } finally {
      setInvitingPatient(false);
    }
  };

  const handleSubmit = async () => {
    if (patientMode === "new") {
      // First invite the patient
      await handleInviteNewPatient();
      return;
    }

    if (
      !selectedPatientId ||
      !selectedPractitionerId ||
      !selectedServiceId ||
      !selectedDate ||
      !selectedTime
    ) {
      return;
    }

    await onSubmit({
      patientId: selectedPatientId,
      practitionerId: selectedPractitionerId,
      serviceId: selectedServiceId,
      appointmentDate: format(selectedDate, "yyyy-MM-dd"),
      appointmentTime: selectedTime,
      notes: notes || undefined,
    });
  };

  const formatTimeSlot = (time: string) => {
    const [hours, minutes] = time.split(":");
    const hour = parseInt(hours, 10);
    const ampm = hour >= 12 ? "PM" : "AM";
    const hour12 = hour % 12 || 12;
    return `${hour12}:${minutes} ${ampm}`;
  };

  const isFormValid = useMemo(() => {
    if (patientMode === "new") {
      return (
        newPatient.firstName &&
        newPatient.lastName &&
        newPatient.email &&
        newPatient.phone
      );
    }
    return (
      selectedPatientId &&
      selectedPractitionerId &&
      selectedServiceId &&
      selectedDate &&
      selectedTime
    );
  }, [
    patientMode,
    newPatient,
    selectedPatientId,
    selectedPractitionerId,
    selectedServiceId,
    selectedDate,
    selectedTime,
  ]);

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className='sm:max-w-[600px] bg-white dark:bg-slate-800 border-clinic-navy/10 dark:border-white/10 max-h-[90vh] overflow-y-auto'>
        <DialogHeader>
          <DialogTitle className='text-xl font-display font-bold text-clinic-navy dark:text-white'>
            {mode === "edit" ? "Edit Appointment" : "New Appointment"}
          </DialogTitle>
          <DialogDescription className='text-clinic-text/60 dark:text-white/60'>
            {mode === "edit"
              ? "Update the appointment details below."
              : "Fill in the details to schedule a new appointment."}
          </DialogDescription>
        </DialogHeader>

        <div className='space-y-6 py-4'>
          {error && (
            <div className='p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg text-sm text-red-600 dark:text-red-400'>
              {error}
            </div>
          )}

          {/* Branch Selection */}
          {showBranchSelector && (
            <div className='space-y-2'>
              <Label className='text-sm font-medium text-clinic-navy dark:text-white'>
                Branch / Location
              </Label>
              <Select
                value={activeBranchId ?? 'all'}
                onValueChange={(v) => onBranchChange(v === 'all' ? null : v)}
              >
                <SelectTrigger>
                  <SelectValue placeholder='Select a branch' />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value='all'>All Branches</SelectItem>
                  {branches.map((branch) => (
                    <SelectItem key={branch.id} value={branch.id}>
                      <span className='flex items-center gap-2'>
                        <MapPin className='w-3.5 h-3.5 text-clinic-text/40 flex-shrink-0' />
                        <span>{branch.name}</span>
                      </span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Patient Selection */}
          <div className='space-y-3'>
            <div className='flex items-center justify-between'>
              <Label className='text-sm font-medium text-clinic-navy dark:text-white'>
                Patient
              </Label>
              {mode === "create" && (
                <div className='flex gap-2'>
                  <Button
                    type='button'
                    variant={patientMode === "existing" ? "default" : "outline"}
                    size='sm'
                    onClick={() => setPatientMode("existing")}
                    className={
                      patientMode === "existing"
                        ? "bg-clinic-teal hover:bg-clinic-teal/90"
                        : ""
                    }
                  >
                    Existing
                  </Button>
                  <Button
                    type='button'
                    variant={patientMode === "new" ? "default" : "outline"}
                    size='sm'
                    onClick={() => setPatientMode("new")}
                    className={
                      patientMode === "new"
                        ? "bg-clinic-teal hover:bg-clinic-teal/90"
                        : ""
                    }
                  >
                    <UserPlus className='w-3 h-3 mr-1' />
                    New
                  </Button>
                </div>
              )}
            </div>

            {patientMode === "existing" ? (
              <div className='space-y-2'>
                <div className='relative'>
                  <Search className='absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-clinic-text/40' />
                  <Input
                    placeholder='Search patients...'
                    value={patientSearch}
                    onChange={(e) => setPatientSearch(e.target.value)}
                    className='pl-9'
                  />
                </div>
                <Select
                  value={selectedPatientId}
                  onValueChange={setSelectedPatientId}
                >
                  <SelectTrigger>
                    <SelectValue placeholder='Select a patient' />
                  </SelectTrigger>
                  <SelectContent>
                    {filteredPatients.map((patient) => (
                      <SelectItem key={patient.id} value={patient.id}>
                        {patient.first_name} {patient.last_name} -{" "}
                        {patient.email}
                      </SelectItem>
                    ))}
                    {filteredPatients.length === 0 && (
                      <div className='p-2 text-sm text-clinic-text/60 text-center'>
                        No patients found
                      </div>
                    )}
                  </SelectContent>
                </Select>
              </div>
            ) : (
              <div className='grid grid-cols-2 gap-3 p-4 bg-clinic-navy/5 dark:bg-white/5 rounded-lg'>
                <div>
                  <Label className='text-xs'>First Name *</Label>
                  <Input
                    value={newPatient.firstName}
                    onChange={(e) =>
                      setNewPatient({
                        ...newPatient,
                        firstName: e.target.value,
                      })
                    }
                    placeholder='John'
                  />
                </div>
                <div>
                  <Label className='text-xs'>Last Name *</Label>
                  <Input
                    value={newPatient.lastName}
                    onChange={(e) =>
                      setNewPatient({ ...newPatient, lastName: e.target.value })
                    }
                    placeholder='Doe'
                  />
                </div>
                <div>
                  <Label className='text-xs'>Email *</Label>
                  <Input
                    type='email'
                    value={newPatient.email}
                    onChange={(e) =>
                      setNewPatient({ ...newPatient, email: e.target.value })
                    }
                    placeholder='john@example.com'
                  />
                </div>
                <div>
                  <Label className='text-xs'>Phone *</Label>
                  <Input
                    value={newPatient.phone}
                    onChange={(e) =>
                      setNewPatient({ ...newPatient, phone: e.target.value })
                    }
                    placeholder='+63 912 345 6789'
                  />
                </div>
                <div className='col-span-2 text-xs text-clinic-text/60 dark:text-white/60'>
                  An invitation email will be sent to the patient to complete
                  their account setup.
                </div>
              </div>
            )}
          </div>

          {/* Practitioner Selection */}
          <div className='space-y-2'>
            <Label className='text-sm font-medium text-clinic-navy dark:text-white'>
              Practitioner
            </Label>
            <Select
              value={selectedPractitionerId}
              onValueChange={setSelectedPractitionerId}
            >
              <SelectTrigger>
                <SelectValue placeholder='Select a practitioner' />
              </SelectTrigger>
              <SelectContent>
                {practitioners.map((practitioner) => (
                  <SelectItem key={practitioner.id} value={practitioner.id}>
                    {practitioner.name}
                    {practitioner.specialization && (
                      <span className='text-clinic-text/50 ml-2'>
                        ({practitioner.specialization})
                      </span>
                    )}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Service Selection */}
          <div className='space-y-2'>
            <Label className='text-sm font-medium text-clinic-navy dark:text-white'>
              Service
            </Label>
            <Select
              value={selectedServiceId}
              onValueChange={setSelectedServiceId}
            >
              <SelectTrigger>
                <SelectValue placeholder='Select a service' />
              </SelectTrigger>
              <SelectContent>
                {services.map((service) => (
                  <SelectItem key={service.id} value={service.id}>
                    {service.name} - ₱{service.price.toLocaleString()} (
                    {service.duration_minutes} min)
                  </SelectItem>
                ))}
                {services.length === 0 && (
                  <div className='p-2 text-sm text-clinic-text/60 text-center'>
                    No services available
                  </div>
                )}
              </SelectContent>
            </Select>
          </div>

          {/* Date Selection */}
          <div className='space-y-2'>
            <Label className='text-sm font-medium text-clinic-navy dark:text-white'>
              Date
            </Label>
            <Popover modal={true}>
              <PopoverTrigger asChild>
                <Button
                  type='button'
                  variant='outline'
                  className={cn(
                    "w-full justify-start text-left font-normal",
                    !selectedDate && "text-muted-foreground",
                  )}
                >
                  <CalendarIcon className='mr-2 h-4 w-4' />
                  {selectedDate ? format(selectedDate, "PPP") : "Pick a date"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className='w-auto p-0 z-[100]' align='start'>
                <Calendar
                  mode='single'
                  selected={selectedDate}
                  onSelect={(date) => {
                    setSelectedDate(date);
                  }}
                  disabled={(date) =>
                    date < new Date(new Date().setHours(0, 0, 0, 0))
                  }
                />
              </PopoverContent>
            </Popover>
          </div>

          {/* Time Selection */}
          <div className='space-y-2'>
            <Label className='text-sm font-medium text-clinic-navy dark:text-white'>
              Time
            </Label>
            {loadingTimeSlots ? (
              <div className='flex items-center justify-center p-4 border rounded-lg'>
                <Loader2 className='w-5 h-5 animate-spin text-clinic-teal mr-2' />
                <span className='text-sm text-clinic-text/60'>
                  Loading available times...
                </span>
              </div>
            ) : timeSlots.length > 0 ? (
              <div className='grid grid-cols-4 gap-2 max-h-[200px] overflow-y-auto p-1'>
                {timeSlots.map((slot) => {
                  const isSelected = selectedTime === slot.time_slot;

                  return (
                    <Button
                      key={slot.time_slot}
                      type='button'
                      variant={isSelected ? "default" : "outline"}
                      size='sm'
                      disabled={!slot.is_available}
                      onClick={() => setSelectedTime(slot.time_slot)}
                      className={cn(
                        "text-xs",
                        isSelected && "bg-clinic-teal hover:bg-clinic-teal/90",
                        !slot.is_available && "opacity-50 cursor-not-allowed",
                      )}
                    >
                      <Clock className='w-3 h-3 mr-1' />
                      {formatTimeSlot(slot.time_slot)}
                    </Button>
                  );
                })}
              </div>
            ) : (
              <div className='p-4 border rounded-lg text-center text-sm text-clinic-text/60'>
                {!selectedPractitionerId || !selectedServiceId || !selectedDate
                  ? "Select practitioner, service, and date to see available times"
                  : "No available time slots for this date"}
              </div>
            )}
          </div>

          {/* Status Actions (Edit mode only) */}
          {mode === "edit" && appointment && (
            <div className='space-y-2'>
              <Label className='text-sm font-medium text-clinic-navy dark:text-white'>
                Status
              </Label>
              <div className='flex items-center gap-3'>
                <span
                  className={cn("px-2.5 py-1 rounded-full text-xs font-medium", getStatusColor(appointment.status))}
                >
                  {appointment.status}
                </span>
                <AppointmentActions
                  appointment={appointment}
                  viewerRole="clinic_admin"
                  layout="row"
                  onStatusChange={onClose}
                />
              </div>
            </div>
          )}

          {/* Notes */}
          <div className='space-y-2'>
            <Label className='text-sm font-medium text-clinic-navy dark:text-white'>
              Notes (Optional)
            </Label>
            <Textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder='Add any notes or special instructions...'
              rows={3}
            />
          </div>
        </div>

        {/* Actions */}
        <div className='flex justify-end gap-3 pt-4 border-t border-clinic-navy/10 dark:border-white/10'>
          <Button variant='outline' onClick={onClose} disabled={isLoading}>
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={!isFormValid || isLoading || invitingPatient}
            className='bg-clinic-teal hover:bg-clinic-teal/90 text-white'
          >
            {isLoading || invitingPatient ? (
              <>
                <Loader2 className='w-4 h-4 mr-2 animate-spin' />
                {patientMode === "new" ? "Inviting Patient..." : "Saving..."}
              </>
            ) : patientMode === "new" ? (
              "Invite & Continue"
            ) : mode === "edit" ? (
              "Update Appointment"
            ) : (
              "Create Appointment"
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export default AppointmentFormModal;
