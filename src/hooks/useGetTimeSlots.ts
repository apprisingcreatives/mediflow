import { useEffect, useState, useRef, useCallback } from "react";
import { format } from "date-fns";
import { ClinicService } from "./useGetServices";

export interface TimeSlot {
  time_slot: string;
  is_available: boolean;
}

type GetAvailableTimeSlotsFn = (
  practitionerId: string,
  date: string,
  durationMinutes: number,
  excludeAppointmentId?: string,
) => Promise<TimeSlot[]>;

interface UseGetTimeSlotsProps {
  practitionerId: string;
  date?: Date;
  service?: ClinicService | undefined | null;
  selectedTime?: string;
  mode?: "create" | "edit";
  appointmentId?: string | undefined;
  getAvailableTimeSlots: GetAvailableTimeSlotsFn;
  onSelectedTimeUnavailable?: () => void;
}

export default function useGetTimeSlots({
  practitionerId,
  date,
  service,
  selectedTime,
  mode,
  appointmentId,
  getAvailableTimeSlots,
  onSelectedTimeUnavailable,
}: UseGetTimeSlotsProps) {
  const [timeSlots, setTimeSlots] = useState<TimeSlot[]>([]);
  const [loading, setLoading] = useState(false);

  // Store function refs to avoid dependency issues
  const getAvailableTimeSlotsRef = useRef(getAvailableTimeSlots);
  const onSelectedTimeUnavailableRef = useRef(onSelectedTimeUnavailable);

  // Update refs when functions change
  useEffect(() => {
    getAvailableTimeSlotsRef.current = getAvailableTimeSlots;
  }, [getAvailableTimeSlots]);

  useEffect(() => {
    onSelectedTimeUnavailableRef.current = onSelectedTimeUnavailable;
  }, [onSelectedTimeUnavailable]);

  // Extract primitive values to use as stable dependencies
  const dateStr = date ? format(date, "yyyy-MM-dd") : null;
  const serviceDuration = service?.duration_minutes;
  const serviceId = service?.id;
  const excludeId = mode === "edit" ? appointmentId : undefined;

  useEffect(() => {
    let mounted = true;

    const fetchTimeSlots = async () => {
      // Check all required values
      if (!practitionerId || !dateStr || !serviceDuration) {
        if (mounted) setTimeSlots([]);
        return;
      }

      setLoading(true);
      try {
        const slots = await getAvailableTimeSlotsRef.current(
          practitionerId,
          dateStr,
          serviceDuration,
          excludeId,
        );

        if (!mounted) return;
        setTimeSlots(slots);

        // Check if selected time is still available
        if (
          selectedTime &&
          !slots.find((s) => s.time_slot === selectedTime && s.is_available)
        ) {
          onSelectedTimeUnavailableRef.current?.();
        }
      } catch (err) {
        console.error("Failed to fetch time slots:", err);
        if (mounted) setTimeSlots([]);
      } finally {
        if (mounted) setLoading(false);
      }
    };

    fetchTimeSlots();

    return () => {
      mounted = false;
    };
    // Only re-fetch when these primitive values change
  }, [practitionerId, dateStr, serviceDuration, serviceId, excludeId, selectedTime]);

  return { timeSlots, loading } as const;
}
