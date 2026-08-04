'use client';

import { useMemo, useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Button } from '@/components/ui/button';
import {
  Activity,
  Building2,
  Users,
  Calendar,
  HelpCircle,
  MessageSquareWarning,
  Settings,
  LogOut,
  FileText,
  Sparkles,
  CreditCard,
  Globe,
  Lock,
  LucideIcon,
  Stethoscope,
  BarChart3,
  UserCog,
  GitBranch,
  ChevronDown,
  Check,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useClinicContext } from '@/app/(clinic)/clinic/[clinicId]/clinic-context';
import type { PermissionKey } from '@/lib/permissions';

interface NavItem {
  path: string;
  label: string;
  icon: LucideIcon;
  requiresSubscription: boolean;
  requiredPermission?: PermissionKey;
}

interface ClinicSidebarProps {
  clinicId: string;
  isTrialExpired?: boolean;
  onLogout: () => void;
}

const NAV_CONFIG: NavItem[] = [
  { path: 'dashboard', label: 'Dashboard', icon: Building2, requiresSubscription: false },
  { path: 'appointments', label: 'Appointments', icon: Calendar, requiresSubscription: true, requiredPermission: 'appointments.view' },
  { path: 'patients', label: 'Patients', icon: Users, requiresSubscription: true, requiredPermission: 'patients.view' },
  { path: 'practitioners', label: 'Practitioners', icon: Stethoscope, requiresSubscription: true, requiredPermission: 'practitioners.view' },
  { path: 'services', label: 'Services', icon: FileText, requiresSubscription: true, requiredPermission: 'services.view' },
  { path: 'analytics', label: 'Analytics', icon: BarChart3, requiresSubscription: true, requiredPermission: 'analytics.view' },
  { path: 'staff', label: 'Staff', icon: UserCog, requiresSubscription: true, requiredPermission: 'staff.manage' },
  { path: 'branches', label: 'Branches', icon: GitBranch, requiresSubscription: true, requiredPermission: 'branches.manage' },
  { path: 'ai-features', label: 'AI Features', icon: Sparkles, requiresSubscription: true, requiredPermission: 'ai_features.manage' },
  { path: 'billing', label: 'Billing', icon: CreditCard, requiresSubscription: false, requiredPermission: 'billing.view' },
  { path: 'help', label: 'Help', icon: HelpCircle, requiresSubscription: false },
  { path: 'report', label: 'Report', icon: MessageSquareWarning, requiresSubscription: false },
  { path: 'settings', label: 'Settings', icon: Settings, requiresSubscription: false, requiredPermission: 'settings.manage' },
];

export function ClinicSidebar({
  clinicId,
  isTrialExpired = false,
  onLogout,
}: ClinicSidebarProps) {
  const pathname = usePathname();
  const { hasPermission, clinic, branches, activeBranchId, setActiveBranchId } = useClinicContext();
  const [branchDropdownOpen, setBranchDropdownOpen] = useState(false);
  const branchDropdownRef = useRef<HTMLDivElement>(null);

  const hasBranchAccess = clinic?.subscription_plan === 'enterprise' || clinic?.subscription_plan === 'professional';
  const showBranchSwitcher = hasBranchAccess && branches.length > 1;
  const activeBranch = branches.find((b) => b.id === activeBranchId);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (branchDropdownRef.current && !branchDropdownRef.current.contains(e.target as Node)) {
        setBranchDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const navItems = useMemo(() => {
    const baseUrl = `/clinic/${clinicId}`;
    return NAV_CONFIG
      .filter((item) => {
        if (item.requiredPermission && !hasPermission(item.requiredPermission)) {
          return false;
        }
        return true;
      })
      .map((item) => ({
        ...item,
        href: `${baseUrl}/${item.path}`,
      }));
  }, [clinicId, hasPermission]);

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

      {/* Branch Switcher */}
      {showBranchSwitcher && (
        <div className='px-4 pb-2' ref={branchDropdownRef}>
          <button
            onClick={() => setBranchDropdownOpen(!branchDropdownOpen)}
            className='w-full flex items-center justify-between gap-2 px-3 py-2 rounded-lg bg-clinic-navy/5 dark:bg-white/5 hover:bg-clinic-navy/10 dark:hover:bg-white/10 transition-colors text-sm'
          >
            <div className='flex items-center gap-2 min-w-0'>
              <GitBranch className='w-4 h-4 text-clinic-teal flex-shrink-0' />
              <span className='truncate text-clinic-navy dark:text-white font-medium'>
                {activeBranch?.name ?? 'All Branches'}
              </span>
            </div>
            <ChevronDown className={cn('w-4 h-4 text-clinic-text/50 transition-transform', branchDropdownOpen && 'rotate-180')} />
          </button>
          {branchDropdownOpen && (
            <div className='mt-1 py-1 bg-white dark:bg-slate-700 border border-clinic-navy/10 dark:border-white/10 rounded-lg shadow-lg'>
              <button
                onClick={() => { setActiveBranchId(null); setBranchDropdownOpen(false); }}
                className={cn(
                  'w-full flex items-center gap-2 px-3 py-2 text-sm hover:bg-clinic-navy/5 dark:hover:bg-white/5',
                  !activeBranchId && 'text-clinic-teal font-medium',
                )}
              >
                {!activeBranchId && <Check className='w-3.5 h-3.5' />}
                <span className={cn(!activeBranchId ? '' : 'ml-5.5')}>All Branches</span>
              </button>
              {branches.filter((b) => b.is_active).map((branch) => (
                <button
                  key={branch.id}
                  onClick={() => { setActiveBranchId(branch.id); setBranchDropdownOpen(false); }}
                  className={cn(
                    'w-full flex items-center gap-2 px-3 py-2 text-sm hover:bg-clinic-navy/5 dark:hover:bg-white/5',
                    activeBranchId === branch.id && 'text-clinic-teal font-medium',
                  )}
                >
                  {activeBranchId === branch.id && <Check className='w-3.5 h-3.5' />}
                  <span className={cn(activeBranchId === branch.id ? '' : 'ml-5.5')}>{branch.name}</span>
                </button>
              ))}
            </div>
          )}
        </div>
      )}

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
