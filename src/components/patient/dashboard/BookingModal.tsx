'use client';

import { useState, useRef, useEffect } from 'react';
import { format } from 'date-fns';
import { CalendarIcon, Check, Clock, Loader2, Search, CreditCard, Banknote, MapPin } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { cn } from '@/lib/utils';
import { PatientClinicInfo } from './types';
import { formatTime } from './utils';
import {
  BookingBranch,
  BookingPractitioner,
  BookingService,
  TimeSlot,
} from '@/hooks/usePatientBooking';

interface BookingModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: () => Promise<void>;
  clinics: PatientClinicInfo[];

  // Selection state
  selectedClinicId: string;
  selectedBranchId: string;
  selectedPractitionerId: string;
  selectedServiceId: string;
  selectedDate: Date | undefined;
  selectedTime: string;
  notes: string;

  // Setters
  onClinicChange: (clinicId: string) => void;
  onBranchChange: (branchId: string) => void;
  onPractitionerChange: (practitionerId: string) => void;
  onServiceChange: (serviceId: string) => void;
  onDateChange: (date: Date | undefined) => void;
  onTimeChange: (time: string) => void;
  onNotesChange: (notes: string) => void;

  // Payment
  paymentMethod: 'online' | 'cash';
  onPaymentMethodChange: (method: 'online' | 'cash') => void;
  selectedServicePrice?: number;

  // Data
  branches: BookingBranch[];
  practitioners: BookingPractitioner[];
  services: BookingService[];
  timeSlots: TimeSlot[];

  // Loading states
  loadingBranches: boolean;
  loadingPractitioners: boolean;
  loadingServices: boolean;
  loadingTimeSlots: boolean;
  submitting: boolean;

  // Error
  error: string | null;

  // Validation
  isFormValid: boolean;
}

export function BookingModal({
  isOpen,
  onClose,
  onSubmit,
  clinics,
  selectedClinicId,
  selectedBranchId,
  selectedPractitionerId,
  selectedServiceId,
  selectedDate,
  selectedTime,
  notes,
  onClinicChange,
  onBranchChange,
  onPractitionerChange,
  onServiceChange,
  onDateChange,
  onTimeChange,
  onNotesChange,
  paymentMethod,
  onPaymentMethodChange,
  selectedServicePrice,
  branches,
  practitioners,
  services,
  timeSlots,
  loadingBranches,
  loadingPractitioners,
  loadingServices,
  loadingTimeSlots,
  submitting,
  error,
  isFormValid,
}: BookingModalProps) {
  const selectedClinic = clinics.find((c) => c.clinic_id === selectedClinicId);
  const clinicSupportsOnlinePayment = !!selectedClinic?.clinic.paymongo_merchant_id;

  useEffect(() => {
    if (!clinicSupportsOnlinePayment && paymentMethod === 'online') {
      onPaymentMethodChange('cash');
    }
  }, [clinicSupportsOnlinePayment, paymentMethod, onPaymentMethodChange]);

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[500px] bg-white dark:bg-slate-800 max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl font-display font-bold text-clinic-navy dark:text-white">
            Book an Appointment
          </DialogTitle>
          <DialogDescription className="text-clinic-text/60 dark:text-white/60">
            Select a clinic, practitioner, and time slot for your appointment.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-5 py-4">
          {error && (
            <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg text-sm text-red-600 dark:text-red-400">
              {error}
            </div>
          )}

          {/* Clinic Selection (searchable) */}
          <ClinicAutocomplete
            clinics={clinics}
            selectedClinicId={selectedClinicId}
            onClinicChange={onClinicChange}
          />

          {/* Branch Selection — only for multi-branch clinics */}
          {selectedClinicId && (loadingBranches || branches.length > 1) && (
            <div className="space-y-2">
              <Label className="text-sm font-medium">Location</Label>
              {loadingBranches ? (
                <div className="flex items-center gap-2 h-10 px-3 border rounded-md text-sm text-clinic-text/60">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Loading locations...
                </div>
              ) : (
                <Select
                  value={selectedBranchId}
                  onValueChange={onBranchChange}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select a location" />
                  </SelectTrigger>
                  <SelectContent>
                    {branches.map((branch) => (
                      <SelectItem key={branch.id} value={branch.id}>
                        <span className="flex items-center gap-2">
                          <MapPin className="w-3.5 h-3.5 text-clinic-text/40 flex-shrink-0" />
                          <span>
                            {branch.name}
                            {(branch.address || branch.city) && (
                              <span className="text-clinic-text/50 ml-1.5">
                                — {[branch.address, branch.city].filter(Boolean).join(', ')}
                              </span>
                            )}
                          </span>
                        </span>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            </div>
          )}

          {/* Practitioner Selection */}
          <div className="space-y-2">
            <Label className="text-sm font-medium">Practitioner</Label>
            <Select
              value={selectedPractitionerId}
              onValueChange={onPractitionerChange}
              disabled={!selectedClinicId || loadingPractitioners}
            >
              <SelectTrigger>
                <SelectValue
                  placeholder={loadingPractitioners ? 'Loading...' : 'Select a practitioner'}
                />
              </SelectTrigger>
              <SelectContent>
                {practitioners.map((p) => (
                  <SelectItem key={p.id} value={p.id}>
                    {p.name}
                    {p.specialization && (
                      <span className="text-clinic-text/50 ml-2">({p.specialization})</span>
                    )}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Service Selection */}
          <div className="space-y-2">
            <Label className="text-sm font-medium">Service</Label>
            <Select
              value={selectedServiceId}
              onValueChange={onServiceChange}
              disabled={!selectedClinicId || loadingServices}
            >
              <SelectTrigger>
                <SelectValue
                  placeholder={loadingServices ? 'Loading...' : 'Select a service'}
                />
              </SelectTrigger>
              <SelectContent>
                {services.map((s) => (
                  <SelectItem key={s.id} value={s.id}>
                    {s.name} - ₱{s.price.toLocaleString()} ({s.duration_minutes} min)
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Date Selection */}
          <div className="space-y-2">
            <Label className="text-sm font-medium">Date</Label>
            <Popover modal={true}>
              <PopoverTrigger asChild>
                <Button
                  type="button"
                  variant="outline"
                  className={cn(
                    'w-full justify-start text-left font-normal',
                    !selectedDate && 'text-muted-foreground'
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {selectedDate ? format(selectedDate, 'PPP') : 'Pick a date'}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0 z-[100]" align="start">
                <Calendar
                  mode="single"
                  selected={selectedDate}
                  onSelect={onDateChange}
                  disabled={(date) => date < new Date(new Date().setHours(0, 0, 0, 0))}
                />
              </PopoverContent>
            </Popover>
          </div>

          {/* Time Selection */}
          <div className="space-y-2">
            <Label className="text-sm font-medium">Time</Label>
            <TimeSlotPicker
              timeSlots={timeSlots}
              selectedTime={selectedTime}
              onTimeChange={onTimeChange}
              loading={loadingTimeSlots}
              showPlaceholder={
                !selectedPractitionerId || !selectedServiceId || !selectedDate
              }
            />
          </div>

          {/* Notes */}
          <div className="space-y-2">
            <Label className="text-sm font-medium">Notes (Optional)</Label>
            <Textarea
              value={notes}
              onChange={(e) => onNotesChange(e.target.value)}
              placeholder="Add any notes or symptoms you'd like to discuss..."
              rows={3}
            />
          </div>

          {/* Payment Method */}
          {selectedServicePrice != null && selectedServicePrice > 0 && clinicSupportsOnlinePayment && (
            <div className="space-y-2">
              <Label className="text-sm font-medium">Payment Method</Label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => onPaymentMethodChange('online')}
                  className={cn(
                    'flex flex-col items-center gap-2 p-3 rounded-lg border-2 transition-all text-sm',
                    paymentMethod === 'online'
                      ? 'border-clinic-teal bg-clinic-teal/5 text-clinic-teal'
                      : 'border-gray-200 dark:border-slate-600 hover:border-clinic-teal/30'
                  )}
                >
                  <CreditCard className="w-5 h-5" />
                  <span className="font-medium">Pay Online</span>
                  <span className="text-xs text-clinic-text/50 dark:text-white/50">
                    GCash, Maya, Card
                  </span>
                </button>
                <button
                  type="button"
                  onClick={() => onPaymentMethodChange('cash')}
                  className={cn(
                    'flex flex-col items-center gap-2 p-3 rounded-lg border-2 transition-all text-sm',
                    paymentMethod === 'cash'
                      ? 'border-clinic-teal bg-clinic-teal/5 text-clinic-teal'
                      : 'border-gray-200 dark:border-slate-600 hover:border-clinic-teal/30'
                  )}
                >
                  <Banknote className="w-5 h-5" />
                  <span className="font-medium">Pay at Clinic</span>
                  <span className="text-xs text-clinic-text/50 dark:text-white/50">
                    Cash on visit
                  </span>
                </button>
              </div>
              <p className="text-xs text-clinic-text/50 dark:text-white/50">
                Service fee: ₱{selectedServicePrice.toLocaleString()}
              </p>
            </div>
          )}
          {selectedServicePrice != null && selectedServicePrice > 0 && !clinicSupportsOnlinePayment && (
            <div className="p-3 bg-slate-50 dark:bg-slate-700/50 border border-slate-200 dark:border-slate-600 rounded-lg">
              <p className="text-sm text-clinic-text/70 dark:text-white/70">
                <Banknote className="w-4 h-4 inline mr-1.5 -mt-0.5" />
                Payment will be collected at the clinic.
              </p>
              <p className="text-xs text-clinic-text/50 dark:text-white/50 mt-1">
                Service fee: ₱{selectedServicePrice.toLocaleString()}
              </p>
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="flex justify-end gap-3 pt-4 border-t">
          <Button variant="outline" onClick={onClose} disabled={submitting}>
            Cancel
          </Button>
          <Button
            onClick={onSubmit}
            disabled={!isFormValid || submitting}
            className="bg-clinic-teal hover:bg-clinic-teal/90 text-white"
          >
            {submitting ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                {paymentMethod === 'online' ? 'Redirecting to payment...' : 'Booking...'}
              </>
            ) : paymentMethod === 'online' ? (
              'Book & Pay Online'
            ) : (
              'Book Appointment'
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

interface ClinicAutocompleteProps {
  clinics: PatientClinicInfo[];
  selectedClinicId: string;
  onClinicChange: (clinicId: string) => void;
}

function ClinicAutocomplete({ clinics, selectedClinicId, onClinicChange }: ClinicAutocompleteProps) {
  const [search, setSearch] = useState('');
  const [open, setOpen] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const selectedClinic = clinics.find((c) => c.clinic_id === selectedClinicId);

  const filtered = search
    ? clinics.filter((c) =>
        c.clinic.name.toLowerCase().includes(search.toLowerCase()) ||
        c.clinic.address?.toLowerCase().includes(search.toLowerCase())
      )
    : clinics;

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const displayValue = open ? search : (selectedClinic?.clinic.name ?? '');

  return (
    <div className="space-y-2">
      <Label className="text-sm font-medium">Clinic</Label>
      <div ref={wrapperRef} className="relative">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input
            type="text"
            value={displayValue}
            placeholder="Search for a clinic..."
            onChange={(e) => {
              setSearch(e.target.value);
              setOpen(true);
            }}
            onFocus={() => setOpen(true)}
            className="flex h-10 w-full rounded-md border border-input bg-background pl-9 pr-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
          />
        </div>
        {open && (
          <div className="absolute z-50 mt-1 w-full rounded-md border bg-popover shadow-md">
            <div className="max-h-[200px] overflow-y-auto p-1">
              {filtered.length === 0 ? (
                <p className="py-4 text-center text-sm text-muted-foreground">No clinic found.</p>
              ) : (
                filtered.map((pc) => (
                  <button
                    key={pc.clinic_id}
                    type="button"
                    onClick={() => {
                      onClinicChange(pc.clinic_id);
                      setSearch('');
                      setOpen(false);
                    }}
                    className={cn(
                      'flex w-full items-center rounded-sm px-2 py-1.5 text-sm hover:bg-accent hover:text-accent-foreground',
                      selectedClinicId === pc.clinic_id && 'bg-accent'
                    )}
                  >
                    <Check
                      className={cn(
                        'mr-2 h-4 w-4 shrink-0',
                        selectedClinicId === pc.clinic_id ? 'opacity-100' : 'opacity-0'
                      )}
                    />
                    <div className="text-left">
                      <span>{pc.clinic.name}</span>
                      {pc.clinic.address && (
                        <span className="block text-xs text-muted-foreground">{pc.clinic.address}</span>
                      )}
                    </div>
                  </button>
                ))
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

interface TimeSlotPickerProps {
  timeSlots: TimeSlot[];
  selectedTime: string;
  onTimeChange: (time: string) => void;
  loading: boolean;
  showPlaceholder: boolean;
}

function TimeSlotPicker({
  timeSlots,
  selectedTime,
  onTimeChange,
  loading,
  showPlaceholder,
}: TimeSlotPickerProps) {
  if (loading) {
    return (
      <div className="flex items-center justify-center p-4 border rounded-lg">
        <Loader2 className="w-5 h-5 animate-spin text-clinic-teal mr-2" />
        <span className="text-sm text-clinic-text/60">Loading available times...</span>
      </div>
    );
  }

  if (timeSlots.length > 0) {
    return (
      <div className="grid grid-cols-4 gap-2 max-h-[150px] overflow-y-auto p-1">
        {timeSlots.map((slot) => (
          <Button
            key={slot.time_slot}
            type="button"
            variant={selectedTime === slot.time_slot ? 'default' : 'outline'}
            size="sm"
            disabled={!slot.is_available}
            onClick={() => onTimeChange(slot.time_slot)}
            className={cn(
              'text-xs',
              selectedTime === slot.time_slot && 'bg-clinic-teal hover:bg-clinic-teal/90',
              !slot.is_available && 'opacity-50 cursor-not-allowed'
            )}
          >
            <Clock className="w-3 h-3 mr-1" />
            {formatTime(slot.time_slot)}
          </Button>
        ))}
      </div>
    );
  }

  return (
    <div className="p-4 border rounded-lg text-center text-sm text-clinic-text/60">
      {showPlaceholder
        ? 'Select practitioner, service, and date to see available times'
        : 'No available time slots for this date'}
    </div>
  );
}

export default BookingModal;
