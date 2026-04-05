import { Label } from "@/components/ui/label";
import { Loader2 } from "lucide-react";
import { AppointmentStepProps } from "../types";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface PractitionerSelectionProps {
  practitioners: AppointmentStepProps["practitioners"];
  selectedPractitionerId: string;
  isLoading: boolean;
  onSelect: (id: string) => void;
}

function PractitionerSelection({
  practitioners,
  selectedPractitionerId,
  isLoading,
  onSelect,
}: PractitionerSelectionProps) {
  if (isLoading) {
    return (
      <div className='space-y-2'>
        <Label className='text-sm font-medium text-clinic-navy dark:text-white'>
          Practitioner
        </Label>
        <div className='flex items-center justify-center p-4 border rounded-lg'>
          <Loader2 className='w-5 h-5 animate-spin text-clinic-teal mr-2' />
          <span className='text-sm text-clinic-text/60'>
            Loading practitioners...
          </span>
        </div>
      </div>
    );
  }

  if (practitioners.length === 0) {
    return (
      <div className='space-y-2'>
        <Label className='text-sm font-medium text-clinic-navy dark:text-white'>
          Practitioner
        </Label>
        <div className='p-4 border rounded-lg text-center text-sm text-clinic-text/60'>
          No practitioners available for this clinic.
        </div>
      </div>
    );
  }

  return (
    <div className='space-y-2'>
      <Label className='text-sm font-medium text-clinic-navy dark:text-white'>
        Practitioner
      </Label>
      <Select value={selectedPractitionerId} onValueChange={onSelect}>
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
  );
}

export default PractitionerSelection;
