'use client';

import Link from 'next/link';
import {
  Activity,
  Calendar,
  MessageSquare,
  FileText,
  Settings,
  LogOut,
  User,
  ChevronDown,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import NotificationBell from '@/components/notifications/NotificationBell';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';
import { PatientInfo } from './types';

interface NavItem {
  icon: typeof Activity;
  label: string;
  active?: boolean;
  href?: string;
}

const NAV_ITEMS: NavItem[] = [
  { icon: Activity, label: 'Dashboard', active: true },
  { icon: Calendar, label: 'Appointments' },
  { icon: MessageSquare, label: 'Messages' },
  { icon: FileText, label: 'Records' },
];

interface PatientHeaderProps {
  patient: PatientInfo | null;
  onSignOut: () => void;
}

export function PatientHeader({ patient, onSignOut }: PatientHeaderProps) {
  return (
    <header className="sticky top-0 z-50 bg-white/80 dark:bg-slate-800/80 backdrop-blur-lg border-b border-clinic-navy/5 dark:border-white/5">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2">
            <div className="w-10 h-10 flex items-center justify-center rounded-xl bg-gradient-to-br from-clinic-navy to-clinic-teal">
              <Activity className="w-5 h-5 text-white" />
            </div>
            <span className="text-xl font-display font-bold text-clinic-navy dark:text-white">
              MediFlow
            </span>
          </Link>

          {/* Nav */}
          <nav className="hidden md:flex items-center gap-1">
            {NAV_ITEMS.map((item) => (
              <button
                key={item.label}
                className={cn(
                  'flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors',
                  item.active
                    ? 'bg-clinic-navy/5 dark:bg-white/5 text-clinic-navy dark:text-white'
                    : 'text-clinic-text/60 dark:text-white/60 hover:bg-clinic-navy/5 dark:hover:bg-white/5'
                )}
              >
                <item.icon className="w-4 h-4" />
                {item.label}
              </button>
            ))}
          </nav>

          {/* Actions */}
          <div className="flex items-center gap-3">
            <NotificationBell />

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="flex items-center gap-2 px-2">
                  <Avatar className="w-9 h-9">
                    <AvatarFallback className="bg-clinic-navy text-white">
                      {patient?.first_name?.[0]}
                      {patient?.last_name?.[0]}
                    </AvatarFallback>
                  </Avatar>
                  <div className="hidden sm:block text-left">
                    <p className="text-sm font-medium text-clinic-navy dark:text-white">
                      {patient?.first_name} {patient?.last_name}
                    </p>
                  </div>
                  <ChevronDown className="w-4 h-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel>My Account</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                  <Link href="/patient">
                    <User className="w-4 h-4 mr-2" />
                    Dashboard
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link href="/patient/history">
                    <FileText className="w-4 h-4 mr-2" />
                    Visit History
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link href="/patient/settings">
                    <Settings className="w-4 h-4 mr-2" />
                    Settings
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={onSignOut} className="text-red-500">
                  <LogOut className="w-4 h-4 mr-2" />
                  Sign Out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </div>
    </header>
  );
}

export default PatientHeader;
