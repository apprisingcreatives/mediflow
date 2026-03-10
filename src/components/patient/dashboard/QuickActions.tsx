'use client';

import { Plus, MessageSquare, FileText, Video, LucideIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface QuickAction {
  icon: LucideIcon;
  label: string;
  color: string;
  onClick?: () => void;
  disabled?: boolean;
}

interface QuickActionsProps {
  onBookAppointment: () => void;
  canBookAppointment: boolean;
}

export function QuickActions({ onBookAppointment, canBookAppointment }: QuickActionsProps) {
  const actions: QuickAction[] = [
    {
      icon: Plus,
      label: 'Book Appointment',
      color: 'bg-clinic-teal',
      onClick: onBookAppointment,
      disabled: !canBookAppointment,
    },
    {
      icon: MessageSquare,
      label: 'Send Message',
      color: 'bg-clinic-ai',
    },
    {
      icon: FileText,
      label: 'View Records',
      color: 'bg-clinic-navy',
    },
    {
      icon: Video,
      label: 'Start Video Call',
      color: 'bg-emerald-500',
    },
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
      {actions.map((action) => (
        <Button
          key={action.label}
          variant="outline"
          className="h-auto py-4 flex flex-col items-center gap-2 bg-white dark:bg-slate-800 hover:shadow-glass transition-shadow"
          onClick={action.onClick}
          disabled={action.disabled}
        >
          <div
            className={cn(
              'w-10 h-10 rounded-xl flex items-center justify-center text-white',
              action.color
            )}
          >
            <action.icon className="w-5 h-5" />
          </div>
          <span className="text-sm font-medium text-clinic-navy dark:text-white">
            {action.label}
          </span>
        </Button>
      ))}
    </div>
  );
}

export default QuickActions;
