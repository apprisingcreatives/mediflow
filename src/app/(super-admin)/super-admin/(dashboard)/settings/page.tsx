'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { KeyRound, Save, Loader2 } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useSuperAdminContext } from '../layout';

export default function SuperAdminSettings() {
  const { admin } = useSuperAdminContext();
  const [name, setName] = useState(admin?.name || '');
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSaveName = async () => {
    if (!admin || !name.trim()) return;
    try {
      setSaving(true);
      setError(null);
      setSaved(false);
      const { error } = await supabase
        .from('super_admins')
        .update({ name: name.trim(), updated_at: new Date().toISOString() })
        .eq('id', admin.id);
      if (error) throw error;
      setSaved(true);
      // Update localStorage
      const stored = localStorage.getItem('superAdmin');
      if (stored) {
        const parsed = JSON.parse(stored);
        parsed.name = name.trim();
        localStorage.setItem('superAdmin', JSON.stringify(parsed));
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update name');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className='max-w-2xl'>
      <h2 className='font-display text-xl font-bold text-clinic-navy dark:text-white mb-6'>
        Settings
      </h2>

      {/* Profile Section */}
      <div className='bg-white dark:bg-slate-800 rounded-2xl shadow-glass p-6 mb-6'>
        <h3 className='font-display font-semibold text-clinic-navy dark:text-white mb-4'>
          Profile
        </h3>

        <div className='space-y-4'>
          <div>
            <label className='block text-sm font-medium text-clinic-text/70 dark:text-white/70 mb-1'>
              Name
            </label>
            <div className='flex gap-3'>
              <Input
                value={name}
                onChange={(e) => {
                  setName(e.target.value);
                  setSaved(false);
                }}
                className='border-clinic-navy/10 dark:border-white/10'
              />
              <Button
                onClick={handleSaveName}
                disabled={saving || name.trim() === admin?.name}
                className='bg-clinic-teal hover:bg-clinic-teal/90 text-white'
              >
                {saving ? (
                  <Loader2 className='w-4 h-4 animate-spin' />
                ) : (
                  <Save className='w-4 h-4' />
                )}
              </Button>
            </div>
            {saved && (
              <p className='text-sm text-green-600 mt-1'>Name updated successfully.</p>
            )}
            {error && (
              <p className='text-sm text-red-500 mt-1'>{error}</p>
            )}
          </div>

          <div>
            <label className='block text-sm font-medium text-clinic-text/70 dark:text-white/70 mb-1'>
              Email
            </label>
            <Input
              value={admin?.email || ''}
              disabled
              className='border-clinic-navy/10 dark:border-white/10 bg-clinic-navy/5 dark:bg-white/5'
            />
          </div>
        </div>
      </div>

      {/* Security Section */}
      <div className='bg-white dark:bg-slate-800 rounded-2xl shadow-glass p-6'>
        <h3 className='font-display font-semibold text-clinic-navy dark:text-white mb-4'>
          Security
        </h3>
        <Link href='/super-admin/change-password'>
          <Button variant='outline' className='border-clinic-navy/10 dark:border-white/10'>
            <KeyRound className='w-4 h-4 mr-2' />
            Change Password
          </Button>
        </Link>
      </div>
    </div>
  );
}
