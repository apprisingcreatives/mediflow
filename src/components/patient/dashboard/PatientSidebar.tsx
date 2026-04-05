'use client';

import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import {
  Calendar,
  FileText,
  HelpCircle,
  History,
  LayoutDashboard,
  LogOut,
  MessageSquare,
  ChevronLeft,
  Settings,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';

interface PatientSidebarProps {
  patientName: string;
}

const navItems = [
  { label: 'Dashboard', href: '/patient', icon: LayoutDashboard },
  { label: 'Appointments', href: '/patient/appointments', icon: Calendar },
  { label: 'Visit History', href: '/patient/history', icon: History },
  { label: 'Messages', href: '/patient/messages', icon: MessageSquare },
  { label: 'Medical Records', href: '/patient/records', icon: FileText },
  { label: 'Help', href: '/patient/help', icon: HelpCircle },
  { label: 'Settings', href: '/patient/settings', icon: Settings },
];

export function PatientSidebar({ patientName }: PatientSidebarProps) {
  const pathname = usePathname();
  const router = useRouter();

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    router.push('/login');
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const isActivePath = (href: string) => {
    if (href === '/patient') return pathname === '/patient';
    return pathname === href || pathname.startsWith(`${href}/`);
  };

  return (
    <aside className="hidden lg:flex w-64 bg-white dark:bg-slate-800 border-r border-clinic-navy/10 dark:border-white/10 flex-col h-screen sticky top-0">
      {/* Header */}
      <div className="p-4 border-b border-clinic-navy/10 dark:border-white/10">
        <Link
          href="/"
          className="flex items-center gap-2 text-clinic-text/60 dark:text-white/60 hover:text-clinic-navy dark:hover:text-white transition-colors mb-4"
        >
          <ChevronLeft className="w-4 h-4" />
          <span className="text-sm">Back to Home</span>
        </Link>
        <div className="flex items-center gap-3">
          <Avatar className="h-12 w-12 border-2 border-clinic-teal/20">
            <AvatarFallback className="bg-clinic-teal/10 text-clinic-teal font-semibold">
              {getInitials(patientName)}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <p className="font-semibold text-clinic-navy dark:text-white truncate">
              {patientName}
            </p>
            <p className="text-xs text-clinic-text/60 dark:text-white/60">
              Patient
            </p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4 space-y-1">
        {navItems.map((item) => {
          const isActive = isActivePath(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors',
                isActive
                  ? 'bg-clinic-teal text-white'
                  : 'text-clinic-text/70 dark:text-white/70 hover:bg-clinic-navy/5 dark:hover:bg-white/5 hover:text-clinic-navy dark:hover:text-white',
              )}
            >
              <item.icon className="w-5 h-5" />
              {item.label}
            </Link>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="p-4 border-t border-clinic-navy/10 dark:border-white/10">
        <Button
          variant="ghost"
          className="w-full justify-start text-clinic-text/70 dark:text-white/70 hover:text-red-600 dark:hover:text-red-400"
          onClick={handleSignOut}
        >
          <LogOut className="w-5 h-5 mr-3" />
          Sign Out
        </Button>
      </div>
    </aside>
  );
}

export default PatientSidebar;
