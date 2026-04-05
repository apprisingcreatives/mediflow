import { format } from "date-fns";
import { CalendarIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";

interface DateSelectionProps {
  date: string;
  isDisabled: boolean;
  onChange: (date: string) => void;
}

function DateSelection({ date, isDisabled, onChange }: DateSelectionProps) {
  const selectedDate = date ? new Date(date) : undefined;

  return (
    <div className='space-y-2'>
      <Label className='text-sm font-medium text-clinic-navy dark:text-white'>
        Date
      </Label>
      {isDisabled ? (
        <div className='p-4 border rounded-lg text-center text-sm text-clinic-text/60'>
          Select practitioner and service to pick a date
        </div>
      ) : (
        <Popover>
          <PopoverTrigger asChild>
            <Button
              type='button'
              variant='outline'
              className={cn(
                "w-full justify-start text-left font-normal",
                !date && "text-muted-foreground",
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
              onSelect={(d) => {
                if (d) {
                  onChange(format(d, "yyyy-MM-dd"));
                }
              }}
              disabled={(d) =>
                d < new Date(new Date().setHours(0, 0, 0, 0))
              }
            />
          </PopoverContent>
        </Popover>
      )}
    </div>
  );
}

export default DateSelection;
