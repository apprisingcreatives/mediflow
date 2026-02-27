import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { format } from "date-fns";

interface DateSelectionProps {
  date: string;
  isDisabled: boolean;
  onChange: (date: string) => void;
}

function DateSelection({ date, isDisabled, onChange }: DateSelectionProps) {
  return (
    <div className='space-y-2'>
      <Label htmlFor='appointment-date'>Select Appointment Date *</Label>
      {isDisabled && (
        <p className='text-xs text-amber-600 dark:text-amber-400 mb-2'>
          Please select a practitioner first
        </p>
      )}
      <Input
        id='appointment-date'
        type='date'
        value={date}
        min={format(new Date(), "yyyy-MM-dd")}
        onChange={(e) => onChange(e.target.value)}
        className='w-full'
        disabled={isDisabled}
        required
      />
      {date && (
        <p className='text-xs text-clinic-teal mt-1'>
          Selected: {format(new Date(date), "EEEE, MMMM d, yyyy")}
        </p>
      )}
    </div>
  );
}

export default DateSelection;
