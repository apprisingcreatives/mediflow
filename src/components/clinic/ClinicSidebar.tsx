'use client';

import { useMemo } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Button } from '@/components/ui/button';
import {
  Activity,
  Building2,
  Users,
  Calendar,
  Settings,
  LogOut,
  FileText,
  Sparkles,
  CreditCard,
  Globe,
  Lock,
  LucideIcon,
  Stethoscope,
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface NavItem {
  path: string;
  label: string;
  icon: LucideIcon;
  requiresSubscription: boolean;
}

interface ClinicSidebarProps {
  clinicId: string;
  isTrialExpired?: boolean;
  onLogout: () => void;
}

// Navigation configuration - paths are relative to /clinic/[clinicId]
const NAV_CONFIG: NavItem[] = [
  { path: 'dashboard', label: 'Dashboard', icon: Building2, requiresSubscription: false },
  { path: 'appointments', label: 'Appointments', icon: Calendar, requiresSubscription: true },
  { path: 'patients', label: 'Patients', icon: Users, requiresSubscription: true },
  { path: 'practitioners', label: 'Practitioners', icon: Stethoscope, requiresSubscription: true },
  { path: 'services', label: 'Services', icon: FileText, requiresSubscription: true },
  { path: 'ai-features', label: 'AI Features', icon: Sparkles, requiresSubscription: true },
  { path: 'billing', label: 'Billing', icon: CreditCard, requiresSubscription: false },
  { path: 'settings', label: 'Settings', icon: Settings, requiresSubscription: false },
];

export function ClinicSidebar({
  clinicId,
  isTrialExpired = false,
  onLogout,
}: ClinicSidebarProps) {
  const pathname = usePathname();

  // Generate navigation items with full hrefs
  const navItems = useMemo(() => {
    const baseUrl = `/clinic/${clinicId}`;
    return NAV_CONFIG.map((item) => ({
      ...item,
      href: `${baseUrl}/${item.path}`,
    }));
  }, [clinicId]);

  // Check if current path matches the nav item
  const isActivePath = (href: string) => {
    return pathname === href || pathname.startsWith(`${href}/`);
  };

  return (
    <aside className='fixed left-0 top-0 bottom-0 w-64 bg-white dark:bg-slate-800 border-r border-clinic-navy/5 dark:border-white/5 hidden lg:flex flex-col z-40'>
      {/* Logo */}
      <div className='p-6'>
        <Link href='/' className='flex items-center gap-2'>
          <div className='w-10 h-10 flex items-center justify-center rounded-xl bg-gradient-to-br from-clinic-navy to-clinic-teal'>
            <Activity className='w-5 h-5 text-white' />
          </div>
          <span className='text-xl font-display font-bold text-clinic-navy dark:text-white'>
            MediFlow
          </span>
        </Link>
      </div>

      {/* Navigation */}
      <nav className='flex-1 px-4 space-y-1 overflow-y-auto'>
        {navItems.map(({ href, label, icon: Icon, requiresSubscription }) => {
          const isActive = isActivePath(href);
          const isLocked = requiresSubscription && isTrialExpired;

          return (
            <Link
              key={href}
              href={isLocked ? '#' : href}
              aria-disabled={isLocked}
              aria-current={isActive ? 'page' : undefined}
              className={cn(
                'flex items-center gap-3 px-4 py-3 rounded-xl transition-colors',
                isActive
                  ? 'bg-clinic-teal/10 text-clinic-teal font-medium'
                  : 'text-clinic-text/70 dark:text-white/70 hover:bg-clinic-navy/5 dark:hover:bg-white/5',
                isLocked && 'opacity-50 cursor-not-allowed pointer-events-none'
              )}
              onClick={(e) => isLocked && e.preventDefault()}
            >
              <Icon className='w-5 h-5 flex-shrink-0' />
              <span className='truncate'>{label}</span>
              {isLocked && <Lock className='w-3 h-3 ml-auto flex-shrink-0' />}
            </Link>
          );
        })}

        {/* Public Page - External Link */}
        <Link
          href={`/clinics/${clinicId}`}
          target='_blank'
          rel='noopener noreferrer'
          className='flex items-center gap-3 px-4 py-3 rounded-xl text-clinic-text/70 dark:text-white/70 hover:bg-clinic-navy/5 dark:hover:bg-white/5'
        >
          <Globe className='w-5 h-5 flex-shrink-0' />
          <span className='truncate'>Public Page</span>
        </Link>
      </nav>

      {/* Logout */}
      <div className='p-4 border-t border-clinic-navy/5 dark:border-white/5'>
        <Button
          variant='ghost'
          onClick={onLogout}
          className='w-full justify-start text-clinic-text/60 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20'
        >
          <LogOut className='w-4 h-4 mr-2' />
          Logout
        </Button>
      </div>
    </aside>
  );
}
