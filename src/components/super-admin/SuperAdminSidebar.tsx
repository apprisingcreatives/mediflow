'use client';

import { useMemo } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Button } from '@/components/ui/button';
import {
  Activity,
  Building2,
  Sparkles,
  ClipboardList,
  CreditCard,
  BookOpen,
  Flag,
  Settings,
  LogOut,
  LayoutDashboard,
  LucideIcon,
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface NavItem {
  path: string;
  label: string;
  icon: LucideIcon;
  group: string;
}

interface SuperAdminSidebarProps {
  onLogout: () => void;
}

const NAV_CONFIG: NavItem[] = [
  { path: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, group: '' },
  { path: 'clinics', label: 'Clinics', icon: Building2, group: 'Management' },
  { path: 'features', label: 'Features', icon: Sparkles, group: 'Management' },
  { path: 'onboarding', label: 'Onboarding', icon: ClipboardList, group: 'Management' },
  { path: 'subscription-plans', label: 'Subscription Plans', icon: CreditCard, group: 'Platform' },
  { path: 'help-guide', label: 'Help Guide', icon: BookOpen, group: 'Platform' },
  { path: 'reports', label: 'Reports', icon: Flag, group: 'Platform' },
  { path: 'settings', label: 'Settings', icon: Settings, group: 'Account' },
];

export function SuperAdminSidebar({ onLogout }: SuperAdminSidebarProps) {
  const pathname = usePathname();

  const navItems = useMemo(() => {
    return NAV_CONFIG.map((item) => ({
      ...item,
      href: `/super-admin/${item.path}`,
    }));
  }, []);

  const isActivePath = (href: string) => {
    return pathname === href || pathname.startsWith(`${href}/`);
  };

  // Group items for rendering with section labels
  const groups = useMemo(() => {
    const result: { label: string; items: typeof navItems }[] = [];
    let currentGroup = '';

    navItems.forEach((item) => {
      if (item.group !== currentGroup) {
        currentGroup = item.group;
        result.push({ label: currentGroup, items: [] });
      }
      result[result.length - 1].items.push(item);
    });

    return result;
  }, [navItems]);

  return (
    <aside className='fixed left-0 top-0 bottom-0 w-64 bg-white dark:bg-slate-800 border-r border-clinic-navy/5 dark:border-white/5 hidden lg:flex flex-col z-40'>
      {/* Logo */}
      <div className='p-6'>
        <Link href='/super-admin/dashboard' className='flex items-center gap-2'>
          <div className='w-10 h-10 flex items-center justify-center rounded-xl bg-gradient-to-br from-clinic-navy to-clinic-teal'>
            <Activity className='w-5 h-5 text-white' />
          </div>
          <div>
            <span className='text-xl font-display font-bold text-clinic-navy dark:text-white'>
              MediFlow
            </span>
            <span className='block text-xs text-clinic-text/50 dark:text-white/50'>
              Super Admin
            </span>
          </div>
        </Link>
      </div>

      {/* Navigation */}
      <nav className='flex-1 px-4 space-y-1 overflow-y-auto'>
        {groups.map((group) => (
          <div key={group.label || 'top'}>
            {group.label && (
              <div className='text-[10px] uppercase tracking-wider text-clinic-text/40 dark:text-white/40 px-4 pt-4 pb-1 font-medium'>
                {group.label}
              </div>
            )}
            {group.items.map(({ href, label, icon: Icon }) => {
              const isActive = isActivePath(href);
              return (
                <Link
                  key={href}
                  href={href}
                  aria-current={isActive ? 'page' : undefined}
                  className={cn(
                    'flex items-center gap-3 px-4 py-3 rounded-xl transition-colors',
                    isActive
                      ? 'bg-clinic-teal/10 text-clinic-teal font-medium'
                      : 'text-clinic-text/70 dark:text-white/70 hover:bg-clinic-navy/5 dark:hover:bg-white/5'
                  )}
                >
                  <Icon className='w-5 h-5 flex-shrink-0' />
                  <span className='truncate'>{label}</span>
                </Link>
              );
            })}
          </div>
        ))}
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
