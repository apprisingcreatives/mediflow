import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Clock, Loader2 } from "lucide-react";
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

function formatTimeSlot(time: string) {
  const [hours, minutes] = time.split(":");
  const hour = parseInt(hours, 10);
  const ampm = hour >= 12 ? "PM" : "AM";
  const hour12 = hour % 12 || 12;
  return `${hour12}:${minutes} ${ampm}`;
}

function TimeSlotSelection({
  timeSlots,
  selectedTime,
  isLoading,
  hasRequiredSelections,
  hasDate,
  onSelect,
}: TimeSlotSelectionProps) {
  return (
    <div className='space-y-2'>
      <Label className='text-sm font-medium text-clinic-navy dark:text-white'>
        Time
      </Label>
      {isLoading ? (
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
                onClick={() => onSelect(slot.time_slot)}
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
          {!hasRequiredSelections
            ? "Select practitioner and service to see available times"
            : !hasDate
              ? "Select a date to see available times"
              : "No available time slots for this date"}
        </div>
      )}
    </div>
  );
}

export default TimeSlotSelection;
