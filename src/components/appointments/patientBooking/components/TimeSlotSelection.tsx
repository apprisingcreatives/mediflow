import { formatTime } from "@/components/patient/dashboard";
import { Label } from "@/components/ui/label";
import { Loader2 } from "lucide-react";
import { AppointmentStepProps } from "../types";
import { cn } from "@/lib/utils";

interface TimeSlotSelectionProps {
  timeSlots: AppointmentStepProps["availableTimeSlots"];
  selectedTime: string;
  isLoading: boolean;
  hasRequiredSelections: boolean;
  hasDate: boolean;
  onSelect: (time: string) => void;
}

function TimeSlotSelection({
  timeSlots,
  selectedTime,
  isLoading,
  hasRequiredSelections,
  hasDate,
  onSelect,
}: TimeSlotSelectionProps) {
  if (!hasRequiredSelections) {
    return (
      <div className='space-y-2'>
        <Label>Select Time Slot *</Label>
        <p className='text-xs text-amber-600 dark:text-amber-400 mb-2'>
          Please select a service and practitioner first
        </p>
      </div>
    );
  }

  if (!hasDate) {
    return (
      <div className='space-y-2'>
        <Label>Select Time Slot *</Label>
        <p className='text-xs text-amber-600 dark:text-amber-400 mb-2'>
          Please select a date first
        </p>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className='space-y-2'>
        <Label>Select Time Slot *</Label>
        <div className='flex items-center gap-2 p-4'>
          <Loader2 className='w-4 h-4 animate-spin text-clinic-teal' />
          <span className='text-sm text-clinic-text/60 dark:text-white/60'>
            Loading available time slots...
          </span>
        </div>
      </div>
    );
  }

  if (timeSlots.length === 0) {
    return (
      <div className='space-y-2'>
        <Label>Select Time Slot *</Label>
        <div className='p-4 bg-amber-50 dark:bg-amber-900/20 rounded-xl border border-amber-200 dark:border-amber-800'>
          <p className='text-sm text-amber-700 dark:text-amber-400'>
            No available time slots for this date. Please select another date.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className='space-y-2'>
      <Label>Select Time Slot *</Label>
      <div className='grid grid-cols-4 sm:grid-cols-5 gap-2 mt-2'>
        {timeSlots.map((slot) => (
          <button
            key={slot.time_slot}
            type='button'
            disabled={!slot.is_available}
            onClick={() => onSelect(slot.time_slot)}
            className={cn(
              "py-2 px-3 text-sm rounded-lg border transition-colors",
              selectedTime === slot.time_slot
                ? "bg-clinic-teal text-white border-clinic-teal"
                : slot.is_available
                  ? "border-clinic-navy/10 dark:border-white/10 hover:border-clinic-teal"
                  : "opacity-50 cursor-not-allowed bg-gray-100 dark:bg-gray-800 text-gray-400",
            )}
          >
            {formatTime(slot.time_slot)}
          </button>
        ))}
      </div>
    </div>
  );
}

export default TimeSlotSelection;
