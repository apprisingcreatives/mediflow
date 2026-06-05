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

        // Filter out past time slots when the selected date is today (Manila time)
        const nowManila = new Date(
          new Date().toLocaleString("en-US", { timeZone: "Asia/Manila" })
        );
        const todayManila = `${nowManila.getFullYear()}-${String(nowManila.getMonth() + 1).padStart(2, "0")}-${String(nowManila.getDate()).padStart(2, "0")}`;

        const filteredSlots =
          dateStr === todayManila
            ? slots.filter((slot) => {
                const [slotHour, slotMinute] = slot.time_slot
                  .split(":")
                  .map(Number);
                const slotTotalMinutes = slotHour * 60 + slotMinute;
                const nowTotalMinutes =
                  nowManila.getHours() * 60 + nowManila.getMinutes();
                return slotTotalMinutes > nowTotalMinutes;
              })
            : slots;

        setTimeSlots(filteredSlots);

        // Check if selected time is still available after filtering
        if (
          selectedTime &&
          !filteredSlots.find(
            (s) => s.time_slot === selectedTime && s.is_available
          )
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
