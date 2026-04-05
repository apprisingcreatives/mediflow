import { format } from "date-fns";
import { AppointmentStepProps } from "../types";

function formatTimeSlot(time: string) {
  const [hours, minutes] = time.split(":");
  const hour = parseInt(hours, 10);
  const ampm = hour >= 12 ? "PM" : "AM";
  const hour12 = hour % 12 || 12;
  return `${hour12}:${minutes} ${ampm}`;
}

interface BookingSummaryProps {
  selectedService: AppointmentStepProps["selectedService"];
  selectedPractitioner: AppointmentStepProps["selectedPractitioner"];
  date: string;
  time: string;
}

function BookingSummary({
  selectedService,
  selectedPractitioner,
  date,
  time,
}: BookingSummaryProps) {
  return (
    <div className='p-4 bg-clinic-navy/5 dark:bg-white/5 rounded-xl'>
      <h4 className='text-sm font-medium text-clinic-navy dark:text-white mb-2'>
        Booking Summary
      </h4>
      <div className='space-y-1 text-sm'>
        {selectedService && (
          <p className='text-clinic-text/70 dark:text-white/70'>
            <span className='font-medium'>Service:</span> {selectedService.name}{" "}
            ({selectedService.duration_minutes} min)
          </p>
        )}
        {selectedPractitioner && (
          <p className='text-clinic-text/70 dark:text-white/70'>
            <span className='font-medium'>Practitioner:</span>{" "}
            {selectedPractitioner.name}
          </p>
        )}
        {date && (
          <p className='text-clinic-text/70 dark:text-white/70'>
            <span className='font-medium'>Date:</span>{" "}
            {format(new Date(date), "MMMM d, yyyy")}
          </p>
        )}
        {time && (
          <p className='text-clinic-text/70 dark:text-white/70'>
            <span className='font-medium'>Time:</span> {formatTimeSlot(time)}
          </p>
        )}
        {selectedService && (
          <p className='text-clinic-teal font-medium mt-2'>
            Total: {selectedService.currency} {selectedService.price.toFixed(2)}
          </p>
        )}
      </div>
    </div>
  );
}

export default BookingSummary;
