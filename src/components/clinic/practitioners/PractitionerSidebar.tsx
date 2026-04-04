'use client';

import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import {
  Calendar,
  Clock,
  User,
  LayoutDashboard,
  LogOut,
  ChevronLeft,
  Settings,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';

interface PractitionerSidebarProps {
  practitionerId: string;
  clinicId: string;
  practitionerName: string;
  practitionerImage?: string | null;
  clinicName?: string;
  specialization?: string | null;
}

export function PractitionerSidebar({
  practitionerId,
  clinicId,
  practitionerName,
  practitionerImage,
  clinicName,
  specialization,
}: PractitionerSidebarProps) {
  const pathname = usePathname();
  const router = useRouter();

  const basePath = `/practitioner/${practitionerId}/clinic/${clinicId}`;

  const navItems = [
    {
      label: 'Dashboard',
      href: `${basePath}/dashboard`,
      icon: LayoutDashboard,
    },
    {
      label: 'Appointments',
      href: `${basePath}/appointments`,
      icon: Calendar,
    },
    {
      label: 'Availability',
      href: `${basePath}/availability`,
      icon: Clock,
    },
    {
      label: 'Profile',
      href: `${basePath}/profile`,
      icon: User,
    },
    {
      label: 'Settings',
      href: `${basePath}/settings`,
      icon: Settings,
    },
  ];

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

  return (
    <aside className="w-64 bg-white dark:bg-slate-800 border-r border-clinic-navy/10 dark:border-white/10 flex flex-col h-screen sticky top-0">
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
            <AvatarImage src={practitionerImage || undefined} alt={practitionerName} />
            <AvatarFallback className="bg-clinic-teal/10 text-clinic-teal font-semibold">
              {getInitials(practitionerName)}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <p className="font-semibold text-clinic-navy dark:text-white truncate">
              {practitionerName}
            </p>
            {specialization && (
              <p className="text-xs text-clinic-text/60 dark:text-white/60 truncate">
                {specialization}
              </p>
            )}
          </div>
        </div>
        {clinicName && (
          <div className="mt-3 px-3 py-2 bg-clinic-teal/10 rounded-lg">
            <p className="text-xs text-clinic-text/60 dark:text-white/60">
              Currently at
            </p>
            <p className="text-sm font-medium text-clinic-navy dark:text-white truncate">
              {clinicName}
            </p>
          </div>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4 space-y-1">
        {navItems.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors',
                isActive
                  ? 'bg-clinic-teal text-white'
                  : 'text-clinic-text/70 dark:text-white/70 hover:bg-clinic-navy/5 dark:hover:bg-white/5 hover:text-clinic-navy dark:hover:text-white'
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

export default PractitionerSidebar;
