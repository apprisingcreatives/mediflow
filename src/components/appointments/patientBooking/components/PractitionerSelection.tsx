import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import { Check, Loader2, User } from "lucide-react";
import { AppointmentStepProps } from "../types";

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
        <Label>Select a Practitioner *</Label>
        <div className='flex items-center justify-center p-8'>
          <Loader2 className='w-6 h-6 animate-spin text-clinic-teal' />
        </div>
      </div>
    );
  }

  if (practitioners.length === 0) {
    return (
      <div className='space-y-2'>
        <Label>Select a Practitioner *</Label>
        <div className='p-4 bg-amber-50 dark:bg-amber-900/20 rounded-xl border border-amber-200 dark:border-amber-800'>
          <p className='text-sm text-amber-700 dark:text-amber-400'>
            No practitioners available for this clinic.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className='space-y-2'>
      <Label>Select a Practitioner *</Label>
      <div className='grid gap-3 mt-2'>
        {practitioners.map((doctor) => (
          <div
            key={doctor.id}
            onClick={() => onSelect(doctor.id)}
            className={cn(
              "flex items-center gap-4 p-4 border-2 rounded-xl cursor-pointer transition-all",
              selectedPractitionerId === doctor.id
                ? "border-clinic-teal bg-clinic-teal/5"
                : "border-transparent bg-clinic-bg dark:bg-slate-700/50 hover:border-clinic-navy/20",
            )}
          >
            {doctor.image_url ? (
              <img
                src={doctor.image_url}
                alt={doctor.name}
                className='w-14 h-14 rounded-xl object-cover'
              />
            ) : (
              <div className='w-14 h-14 rounded-xl bg-clinic-navy/10 dark:bg-white/10 flex items-center justify-center'>
                <User className='w-6 h-6 text-clinic-navy/50 dark:text-white/50' />
              </div>
            )}
            <div className='flex-1'>
              <h4 className='font-semibold text-clinic-navy dark:text-white'>
                {doctor.name}
              </h4>
              <p className='text-sm text-clinic-text/60 dark:text-white/60'>
                {doctor.specialization || "General Practice"}
              </p>
            </div>
            {selectedPractitionerId === doctor.id && (
              <div className='w-6 h-6 rounded-full bg-clinic-teal flex items-center justify-center'>
                <Check className='w-4 h-4 text-white' />
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

export default PractitionerSelection;
