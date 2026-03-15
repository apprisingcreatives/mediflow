'use client';

import { useState, useEffect } from 'react';
import { Clock, Plus, Trash2, Loader2, Save, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { PractitionerWorkingHours, DAY_NAMES } from '@/hooks/useGetPractitioners';

interface WorkingHoursEntry {
  id: string;
  day_of_week: number;
  start_time: string;
  end_time: string;
  is_available: boolean;
}

interface PractitionerAvailabilityProps {
  workingHours: PractitionerWorkingHours[];
  isLoading: boolean;
  onSave: (workingHours: Omit<PractitionerWorkingHours, 'id' | 'practitioner_id'>[]) => Promise<boolean>;
}

// Generate time options (30-minute intervals)
const TIME_OPTIONS: string[] = [];
for (let hour = 0; hour < 24; hour++) {
  for (let minute = 0; minute < 60; minute += 30) {
    const h = hour.toString().padStart(2, '0');
    const m = minute.toString().padStart(2, '0');
    TIME_OPTIONS.push(`${h}:${m}:00`);
  }
}

const formatTimeDisplay = (time: string) => {
  const [hours, minutes] = time.split(':');
  const hour = parseInt(hours, 10);
  const ampm = hour >= 12 ? 'PM' : 'AM';
  const hour12 = hour % 12 || 12;
  return `${hour12}:${minutes} ${ampm}`;
};

export function PractitionerAvailability({
  workingHours,
  isLoading,
  onSave,
}: PractitionerAvailabilityProps) {
  const [localHours, setLocalHours] = useState<WorkingHoursEntry[]>([]);
  const [isSaving, setIsSaving] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  // Initialize local state from props
  useEffect(() => {
    if (workingHours.length > 0) {
      setLocalHours(
        workingHours.map((wh) => ({
          id: wh.id,
          day_of_week: wh.day_of_week,
          start_time: wh.start_time,
          end_time: wh.end_time,
          is_available: wh.is_available,
        }))
      );
    } else {
      // Initialize with default hours (Mon-Fri, 9am-5pm)
      const defaultHours: WorkingHoursEntry[] = [];
      for (let day = 1; day <= 5; day++) {
        defaultHours.push({
          id: `new-${day}`,
          day_of_week: day,
          start_time: '09:00:00',
          end_time: '17:00:00',
          is_available: true,
        });
      }
      setLocalHours(defaultHours);
      setHasChanges(true);
    }
  }, [workingHours]);

  // Group hours by day
  const hoursByDay = DAY_NAMES.map((_, index) => {
    return localHours.filter((h) => h.day_of_week === index);
  });

  const addTimeSlot = (dayOfWeek: number) => {
    const newEntry: WorkingHoursEntry = {
      id: `new-${Date.now()}`,
      day_of_week: dayOfWeek,
      start_time: '09:00:00',
      end_time: '17:00:00',
      is_available: true,
    };
    setLocalHours((prev) => [...prev, newEntry]);
    setHasChanges(true);
    setSuccess(false);
  };

  const removeTimeSlot = (id: string) => {
    setLocalHours((prev) => prev.filter((h) => h.id !== id));
    setHasChanges(true);
    setSuccess(false);
  };

  const updateTimeSlot = (
    id: string,
    field: keyof WorkingHoursEntry,
    value: string | number | boolean
  ) => {
    setLocalHours((prev) =>
      prev.map((h) => (h.id === id ? { ...h, [field]: value } : h))
    );
    setHasChanges(true);
    setSuccess(false);
  };

  const toggleDayAvailability = (dayOfWeek: number, isAvailable: boolean) => {
    const dayHours = localHours.filter((h) => h.day_of_week === dayOfWeek);

    if (dayHours.length === 0 && isAvailable) {
      // Add default hours for the day
      addTimeSlot(dayOfWeek);
    } else {
      // Toggle all slots for the day
      setLocalHours((prev) =>
        prev.map((h) =>
          h.day_of_week === dayOfWeek ? { ...h, is_available: isAvailable } : h
        )
      );
      setHasChanges(true);
      setSuccess(false);
    }
  };

  const validateHours = (): string | null => {
    for (const entry of localHours) {
      if (entry.is_available) {
        const start = entry.start_time;
        const end = entry.end_time;
        if (start >= end) {
          return `Invalid time range for ${DAY_NAMES[entry.day_of_week]}: Start time must be before end time`;
        }
      }
    }
    return null;
  };

  const handleSave = async () => {
    setError(null);
    setSuccess(false);

    const validationError = validateHours();
    if (validationError) {
      setError(validationError);
      return;
    }

    setIsSaving(true);

    const hoursToSave = localHours.map((h) => ({
      day_of_week: h.day_of_week,
      start_time: h.start_time,
      end_time: h.end_time,
      is_available: h.is_available,
    }));

    const result = await onSave(hoursToSave);

    if (result) {
      setHasChanges(false);
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } else {
      setError('Failed to save working hours. Please try again.');
    }

    setIsSaving(false);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-clinic-teal" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-display font-bold text-clinic-navy dark:text-white">
            Availability
          </h2>
          <p className="text-clinic-text/60 dark:text-white/60">
            Set your working hours for each day of the week
          </p>
        </div>
        <Button
          onClick={handleSave}
          disabled={!hasChanges || isSaving}
          className="bg-clinic-teal hover:bg-clinic-teal/90"
        >
          {isSaving ? (
            <Loader2 className="w-4 h-4 animate-spin mr-2" />
          ) : (
            <Save className="w-4 h-4 mr-2" />
          )}
          Save Changes
        </Button>
      </div>

      {/* Alerts */}
      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {success && (
        <Alert className="bg-green-50 border-green-200 text-green-800">
          <AlertDescription>Working hours saved successfully!</AlertDescription>
        </Alert>
      )}

      {/* Days Grid */}
      <div className="grid gap-4">
        {DAY_NAMES.map((dayName, dayIndex) => {
          const daySlots = hoursByDay[dayIndex];
          const isDayAvailable = daySlots.some((s) => s.is_available);

          return (
            <Card
              key={dayIndex}
              className="bg-white dark:bg-slate-800 border-clinic-navy/10 dark:border-white/10"
            >
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <Switch
                      id={`day-${dayIndex}`}
                      checked={isDayAvailable}
                      onCheckedChange={(checked) =>
                        toggleDayAvailability(dayIndex, checked)
                      }
                    />
                    <Label
                      htmlFor={`day-${dayIndex}`}
                      className="text-lg font-semibold text-clinic-navy dark:text-white cursor-pointer"
                    >
                      {dayName}
                    </Label>
                  </div>
                  {isDayAvailable && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => addTimeSlot(dayIndex)}
                      className="text-clinic-teal border-clinic-teal/30 hover:bg-clinic-teal/10"
                    >
                      <Plus className="w-4 h-4 mr-1" />
                      Add Slot
                    </Button>
                  )}
                </div>
              </CardHeader>

              {isDayAvailable && daySlots.length > 0 && (
                <CardContent className="pt-0">
                  <div className="space-y-3">
                    {daySlots.map((slot) => (
                      <div
                        key={slot.id}
                        className="flex items-center gap-4 p-3 bg-clinic-navy/5 dark:bg-white/5 rounded-lg"
                      >
                        <Clock className="w-4 h-4 text-clinic-text/40" />

                        <div className="flex items-center gap-2 flex-1">
                          <Select
                            value={slot.start_time}
                            onValueChange={(value) =>
                              updateTimeSlot(slot.id, 'start_time', value)
                            }
                          >
                            <SelectTrigger className="w-[130px]">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {TIME_OPTIONS.map((time) => (
                                <SelectItem key={time} value={time}>
                                  {formatTimeDisplay(time)}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>

                          <span className="text-clinic-text/60 dark:text-white/60">to</span>

                          <Select
                            value={slot.end_time}
                            onValueChange={(value) =>
                              updateTimeSlot(slot.id, 'end_time', value)
                            }
                          >
                            <SelectTrigger className="w-[130px]">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {TIME_OPTIONS.map((time) => (
                                <SelectItem key={time} value={time}>
                                  {formatTimeDisplay(time)}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>

                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => removeTimeSlot(slot.id)}
                          className="text-red-500 hover:text-red-600 hover:bg-red-50"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                </CardContent>
              )}

              {!isDayAvailable && (
                <CardContent className="pt-0">
                  <p className="text-sm text-clinic-text/50 dark:text-white/50 italic">
                    Not available on {dayName}
                  </p>
                </CardContent>
              )}
            </Card>
          );
        })}
      </div>
    </div>
  );
}

export default PractitionerAvailability;
